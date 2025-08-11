-- Create personal file management system
-- This allows users to store private files and share them to different chat rooms

-- Create personal_files table for user's private file storage
CREATE TABLE IF NOT EXISTS public.personal_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  original_name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file_shares table to track which files are shared to which chat rooms
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.personal_files(id) ON DELETE CASCADE NOT NULL,
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  UNIQUE(file_id, chat_room_id) -- Prevent duplicate shares to same room
);

-- Create file_ai_shares table to track files shared with AI
CREATE TABLE IF NOT EXISTS public.file_ai_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.personal_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_session_id TEXT, -- To track different AI conversations
  purpose TEXT, -- Why the file was shared with AI
  UNIQUE(file_id, user_id, ai_session_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.personal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_ai_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal_files
CREATE POLICY "Users can view their own files" ON public.personal_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" ON public.personal_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" ON public.personal_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON public.personal_files
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for file_shares
CREATE POLICY "Users can view file shares in their chat rooms" ON public.file_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = file_shares.chat_room_id AND crm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can share their own files" ON public.file_shares
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM public.personal_files pf
      WHERE pf.id = file_shares.file_id AND pf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own file shares" ON public.file_shares
  FOR DELETE USING (auth.uid() = shared_by);

-- RLS Policies for file_ai_shares
CREATE POLICY "Users can view their own AI file shares" ON public.file_ai_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can share their own files with AI" ON public.file_ai_shares
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.personal_files pf
      WHERE pf.id = file_ai_shares.file_id AND pf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own AI file shares" ON public.file_ai_shares
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER TABLE public.personal_files REPLICA IDENTITY FULL;
ALTER TABLE public.file_shares REPLICA IDENTITY FULL;
ALTER TABLE public.file_ai_shares REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_ai_shares;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_files_user_id ON public.personal_files(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_files_created_at ON public.personal_files(created_at);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_chat_room_id ON public.file_shares(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_file_ai_shares_file_id ON public.file_ai_shares(file_id);

-- Create function to get file share info
CREATE OR REPLACE FUNCTION get_file_share_info(file_uuid uuid, room_uuid uuid)
RETURNS TABLE (
  share_id UUID,
  shared_by UUID,
  shared_at TIMESTAMP WITH TIME ZONE,
  message_id UUID
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT fs.id, fs.shared_by, fs.shared_at, fs.message_id
  FROM public.file_shares fs
  WHERE fs.file_id = file_uuid AND fs.chat_room_id = room_uuid
  LIMIT 1;
$$;

-- Create function to get user's file statistics
CREATE OR REPLACE FUNCTION get_user_file_stats(user_uuid uuid)
RETURNS TABLE (
  total_files BIGINT,
  total_size BIGINT,
  file_types TEXT[],
  recent_uploads BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COUNT(*) as total_files,
    COALESCE(SUM(file_size), 0) as total_size,
    ARRAY_AGG(DISTINCT file_type) as file_types,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_uploads
  FROM public.personal_files
  WHERE user_id = user_uuid;
$$;
