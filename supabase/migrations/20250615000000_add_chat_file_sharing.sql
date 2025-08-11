-- Add file sharing capabilities to chat messages
-- This allows users to share files directly in chat groups

-- Add new columns to chat_messages table for file sharing
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Create chat_files table for better file management
CREATE TABLE IF NOT EXISTS public.chat_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_files
ALTER TABLE public.chat_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_files
CREATE POLICY "Users can view files from their chat rooms" ON public.chat_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_room_members crm ON cm.room_id = crm.room_id
      WHERE cm.id = chat_files.message_id AND crm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their chat rooms" ON public.chat_files
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_room_members crm ON cm.room_id = crm.room_id
      WHERE cm.id = chat_files.message_id AND crm.user_id = auth.uid()
    )
  );

-- Enable realtime for chat_files
ALTER TABLE public.chat_files REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_files;

-- Create function to get file info from message
CREATE OR REPLACE FUNCTION get_message_file_info(message_uuid uuid)
RETURNS TABLE (
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT cf.file_url, cf.file_name, cf.file_type, cf.file_size
  FROM public.chat_files cf
  WHERE cf.message_id = message_uuid
  LIMIT 1;
$$;

-- Create function to format file size
CREATE OR REPLACE FUNCTION format_file_size(bytes BIGINT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN bytes < 1024 THEN bytes::TEXT || ' B'
    WHEN bytes < 1048576 THEN (bytes / 1024.0)::NUMERIC(10,1)::TEXT || ' KB'
    WHEN bytes < 1073741824 THEN (bytes / 1048576.0)::NUMERIC(10,1)::TEXT || ' MB'
    ELSE (bytes / 1073741824.0)::NUMERIC(10,1)::TEXT || ' GB'
  END;
$$;
