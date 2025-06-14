
-- Fix the circular dependency in chat_participants RLS policies
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chats;

-- Create a simpler policy for chat_participants that doesn't create circular references
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants
  FOR SELECT USING (user_id = auth.uid());

-- Create a simpler policy for chats that uses a direct subquery
CREATE POLICY "Users can view chats they participate in" ON public.chats
  FOR SELECT USING (
    id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );
