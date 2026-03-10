-- Phase 4: Monitoring & observability table for front‑end errors and performance metrics
-- This script is idempotent – safe to run multiple times.

-- 1. Create monitoring_logs table
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('error', 'performance', 'analytics', 'feedback')),
  event_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_event_type ON monitoring_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_created_at ON monitoring_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_user_id ON monitoring_logs(user_id);

-- 3. Row‑Level Security (RLS)
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert logs (needed for error reporting before authentication)
CREATE POLICY "Allow insert for all"
  ON monitoring_logs FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own logs (if user_id is set)
CREATE POLICY "Users can view own logs"
  ON monitoring_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service role (admin) can view all logs (optional, requires service key)
-- Uncomment if you have a service role key for admin dashboards
-- CREATE POLICY "Service role can view all"
--   ON monitoring_logs FOR SELECT
--   USING (auth.role() = 'service_role');

-- 4. (Optional) Insert a sample log for testing – commented out
-- INSERT INTO monitoring_logs (event_type, event_name, payload)
-- VALUES ('analytics', 'table_created', '{"table": "monitoring_logs", "timestamp": "2026-03-10T23:55:00Z"}'::jsonb);