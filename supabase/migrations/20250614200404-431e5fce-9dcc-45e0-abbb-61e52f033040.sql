
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view room memberships" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room admins can manage members" ON public.chat_room_members;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_room_member(room_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_members 
    WHERE room_id = room_uuid AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_admin_or_moderator(room_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_members 
    WHERE room_id = room_uuid AND user_id = user_uuid AND role IN ('admin', 'moderator')
  );
$$;

-- Create new policies using the security definer functions
CREATE POLICY "Users can view their own memberships" ON public.chat_room_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert themselves as members" ON public.chat_room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Room admins can manage all members" ON public.chat_room_members
  FOR ALL USING (public.is_room_admin_or_moderator(room_id, auth.uid()));

-- Update chat_rooms policy to use the security definer function
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.chat_rooms;
CREATE POLICY "Users can view rooms they are members of" ON public.chat_rooms
  FOR SELECT USING (public.is_room_member(id, auth.uid()));

-- Update chat_messages policy to use the security definer function  
DROP POLICY IF EXISTS "Users can view messages from their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages from their rooms" ON public.chat_messages
  FOR SELECT USING (public.is_room_member(room_id, auth.uid()));

-- Allow users to insert messages in rooms they are members of
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can insert messages in their rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (public.is_room_member(room_id, auth.uid()));

-- Drop and recreate notification policies to ensure they use the correct format
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
