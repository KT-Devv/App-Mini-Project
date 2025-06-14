
-- Add the missing max_participants column to study_sessions table
ALTER TABLE public.study_sessions 
ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 10;

-- Also ensure we have proper RLS policies for study_sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_sessions if they don't exist
DROP POLICY IF EXISTS "Users can view all study sessions" ON public.study_sessions;
CREATE POLICY "Users can view all study sessions" ON public.study_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create study sessions" ON public.study_sessions;
CREATE POLICY "Users can create study sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;
CREATE POLICY "Users can update their own study sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own study sessions" ON public.study_sessions;
CREATE POLICY "Users can delete their own study sessions" ON public.study_sessions
  FOR DELETE USING (auth.uid() = created_by);

-- Ensure RLS policies for session_participants
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view session participants" ON public.session_participants;
CREATE POLICY "Users can view session participants" ON public.session_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
CREATE POLICY "Users can join sessions" ON public.session_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave sessions" ON public.session_participants;
CREATE POLICY "Users can leave sessions" ON public.session_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure proper RLS for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in chats they participate in" ON public.messages;
CREATE POLICY "Users can view messages in chats they participate in" ON public.messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to chats they participate in" ON public.messages;
CREATE POLICY "Users can send messages to chats they participate in" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    chat_id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );
