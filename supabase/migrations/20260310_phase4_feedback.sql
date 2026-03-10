-- Phase 4: User feedback table for collecting in‑app ratings and comments
-- This script is idempotent – safe to run multiple times.

-- 1. Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add updated_at trigger (same pattern as other tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Row‑Level Security (RLS)
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own feedback
CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can insert their own feedback (WITH CHECK only)
CREATE POLICY "Users can insert own feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON user_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON user_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Index for faster user‑based queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);

-- 5. (Optional) Insert a sample feedback entry for testing – commented out
-- INSERT INTO user_feedback (user_id, rating, comment)
-- SELECT id, 5, 'Great dashboard!'
-- FROM auth.users
-- WHERE email = 'sebastian@example.com'
-- ON CONFLICT DO NOTHING;