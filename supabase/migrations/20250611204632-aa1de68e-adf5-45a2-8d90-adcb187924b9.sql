
-- Enable real-time for study sessions and participants
ALTER TABLE study_sessions REPLICA IDENTITY FULL;
ALTER TABLE session_participants REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;

-- Enable RLS for all tables (if not already enabled)
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can create their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Session creators can update their sessions" ON study_sessions;
DROP POLICY IF EXISTS "Anyone can view session participants" ON session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON session_participants;
DROP POLICY IF EXISTS "Users can leave sessions they joined" ON session_participants;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON chat_rooms;

-- Create new policies for study_sessions
CREATE POLICY "Anyone can view active study sessions"
ON study_sessions FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can create their own study sessions"
ON study_sessions FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creators can update their sessions"
ON study_sessions FOR UPDATE
USING (auth.uid() = created_by);

-- Create policies for session_participants
CREATE POLICY "Anyone can view session participants"
ON session_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join sessions"
ON session_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions they joined"
ON session_participants FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for messages
CREATE POLICY "Anyone can view messages"
ON messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policies for chat_rooms
CREATE POLICY "Anyone can view chat rooms"
ON chat_rooms FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create chat rooms"
ON chat_rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Add new columns if they don't exist
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS session_url TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';

-- Add constraint for status if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'study_sessions_status_check' 
        AND table_name = 'study_sessions'
    ) THEN
        ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_status_check 
        CHECK (status IN ('scheduled', 'live', 'ended'));
    END IF;
END $$;
