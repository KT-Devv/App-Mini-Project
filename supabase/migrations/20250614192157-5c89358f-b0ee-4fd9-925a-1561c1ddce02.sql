
-- Create friends table for managing friend relationships
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create chat room members table to track who can access which rooms
CREATE TABLE public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create chat room invitations table
CREATE TABLE public.chat_room_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_code TEXT UNIQUE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_invited_user_or_email CHECK (
    (invited_user IS NOT NULL AND email IS NULL) OR 
    (invited_user IS NULL AND email IS NOT NULL)
  )
);

-- Enable RLS on all new tables
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends
CREATE POLICY "Users can view their own friendships" ON public.friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friend requests" ON public.friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for chat_room_members
CREATE POLICY "Users can view room memberships" ON public.chat_room_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm 
      WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()
    )
  );

CREATE POLICY "Room admins can manage members" ON public.chat_room_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm 
      WHERE crm.room_id = chat_room_members.room_id 
      AND crm.user_id = auth.uid() 
      AND crm.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for chat_room_invitations
CREATE POLICY "Users can view relevant invitations" ON public.chat_room_invitations
  FOR SELECT USING (
    auth.uid() = invited_by OR 
    auth.uid() = invited_user OR
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm 
      WHERE crm.room_id = chat_room_invitations.room_id 
      AND crm.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can create invitations" ON public.chat_room_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm 
      WHERE crm.room_id = room_id AND crm.user_id = auth.uid()
    )
  );

-- Update chat_rooms RLS to only show rooms user is member of
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view rooms they are members of" ON public.chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm 
      WHERE crm.room_id = id AND crm.user_id = auth.uid()
    )
  );

-- Update chat_messages RLS to only show messages from accessible rooms
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
CREATE POLICY "Users can view messages from their rooms" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm 
      WHERE crm.room_id = room_id AND crm.user_id = auth.uid()
    )
  );

-- Create function to automatically add room creator as admin
CREATE OR REPLACE FUNCTION add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-adding room creator
CREATE TRIGGER on_chat_room_created
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  WHEN (NEW.created_by IS NOT NULL)
  EXECUTE FUNCTION add_room_creator_as_admin();

-- Add existing default rooms to all users (for backward compatibility)
INSERT INTO public.chat_room_members (room_id, user_id, role)
SELECT cr.id, u.id, 'member'
FROM public.chat_rooms cr
CROSS JOIN auth.users u
WHERE cr.created_by IS NULL
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Enable realtime for new tables
ALTER TABLE public.friends REPLICA IDENTITY FULL;
ALTER TABLE public.chat_room_members REPLICA IDENTITY FULL;
ALTER TABLE public.chat_room_invitations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_invitations;
