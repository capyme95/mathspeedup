-- NCEA Level 1 Mathematics Sovereign Schema (Gen 21)

-- 1. Profiles: Tracking Mastery & Credits
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  ncea_credits_current INTEGER DEFAULT 0,
  excellence_mastery_pct NUMERIC(5,2) DEFAULT 0.00,
  learning_preference JSONB DEFAULT '{"language": "English", "friction": "adaptive"}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Standards: Decoupled Curriculum Layer (NZQA 2026)
CREATE TABLE IF NOT EXISTS public.standards (
  id TEXT PRIMARY KEY, -- e.g., 'AS91945'
  title TEXT NOT NULL,
  version TEXT DEFAULT '2026',
  excellence_criteria JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. Tasks: English-Only Content & Difficulty
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id TEXT REFERENCES public.standards(id),
  title TEXT NOT NULL,
  content_en TEXT NOT NULL, -- Mandatory English
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  metadata JSONB, -- e.g., '{"topics": ["algebra", "linear"]}'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Mastery Logs: Capturing Interaction Fingerprints
CREATE TABLE IF NOT EXISTS public.mastery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id),
  submission_content TEXT,
  thinking_time_ms INTEGER, -- Thinking time
  revision_count INTEGER DEFAULT 0, -- Integrity check
  grade_achieved TEXT CHECK (grade_achieved IN ('N', 'A', 'M', 'E')), -- Not Achieved, Achieved, Merit, Excellence
  ai_feedback_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row-Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.mastery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.mastery_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert logs" ON public.mastery_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Initial Standards Seeding
INSERT INTO public.standards (id, title, version) VALUES 
('AS91945', 'Mathematical Methods', '2026'),
('AS91947', 'Mathematical Reasoning', '2026')
ON CONFLICT (id) DO NOTHING;
