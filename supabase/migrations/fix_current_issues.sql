-- Database Fix Script for MathSpeedup 2.0 Phase 1/2/3
-- Checks current state and applies missing constraints, columns, and RLS policies.
-- Safe to run multiple times (idempotent).

-- 1. Ensure learning_logs table exists with correct schema.
CREATE TABLE IF NOT EXISTS public.learning_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_summary TEXT,
  wombatbot_evaluation TEXT,
  logic_fingerprint TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. If table already existed, ensure user_id is NOT NULL.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='learning_logs' 
               AND column_name='user_id' AND is_nullable='YES') THEN
    ALTER TABLE public.learning_logs ALTER COLUMN user_id SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN 
    RAISE NOTICE 'Could not alter user_id column: %', SQLERRM;
END $$;

-- 3. Add evidence‑based columns if missing (same as upgrade).
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='self_reported_grade') THEN
    ALTER TABLE public.learning_logs ADD COLUMN self_reported_grade TEXT CHECK (self_reported_grade IN ('N','A','M','E'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='prediction_accuracy') THEN
    ALTER TABLE public.learning_logs ADD COLUMN prediction_accuracy NUMERIC(4,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='cognitive_load_rating') THEN
    ALTER TABLE public.learning_logs ADD COLUMN cognitive_load_rating INTEGER CHECK (cognitive_load_rating BETWEEN 1 AND 7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='learning_intention') THEN
    ALTER TABLE public.learning_logs ADD COLUMN learning_intention TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='success_criteria') THEN
    ALTER TABLE public.learning_logs ADD COLUMN success_criteria TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='timss_domain') THEN
    ALTER TABLE public.learning_logs ADD COLUMN timss_domain TEXT CHECK (timss_domain IN ('Knowing','Applying','Reasoning'));
  END IF;
END $$;

-- 4. Enable RLS and create policies if they don't exist.
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to create policy only if it doesn't exist (by name).
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  command TEXT,
  using_expression TEXT,
  with_check_expression TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = policy_name AND tablename = table_name) THEN
    IF with_check_expression IS NULL THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR %s USING (%s)', 
                     policy_name, table_name, command, using_expression);
    ELSE
      EXECUTE format('CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s)', 
                     policy_name, table_name, command, using_expression, with_check_expression);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for learning_logs.
SELECT create_policy_if_not_exists(
  'Users can view own learning logs',
  'learning_logs',
  'SELECT',
  'auth.uid() = user_id'
);
SELECT create_policy_if_not_exists(
  'Users can insert own learning logs',
  'learning_logs',
  'INSERT',
  'auth.uid() = user_id',
  'auth.uid() = user_id'
);
SELECT create_policy_if_not_exists(
  'Users can update own learning logs',
  'learning_logs',
  'UPDATE',
  'auth.uid() = user_id'
);
SELECT create_policy_if_not_exists(
  'Users can delete own learning logs',
  'learning_logs',
  'DELETE',
  'auth.uid() = user_id'
);

-- 5. Ensure other Phase 1 tables exist.
CREATE TABLE IF NOT EXISTS public.student_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  target_date DATE,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
  'Users can manage own goals',
  'student_goals',
  'ALL',
  'auth.uid() = user_id'
);

CREATE TABLE IF NOT EXISTS public.worked_examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id TEXT REFERENCES public.standards(id),
  title TEXT NOT NULL,
  content_en TEXT NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  fade_stage TEXT CHECK (fade_stage IN ('full','partial','none')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.worked_examples ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
  'Anyone can view worked examples',
  'worked_examples',
  'SELECT',
  'true'
);

CREATE TABLE IF NOT EXISTS public.feedback_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id TEXT REFERENCES public.standards(id),
  template_name TEXT NOT NULL,
  template_en TEXT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('task','process','self_regulation')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback_templates ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
  'Anyone can view feedback templates',
  'feedback_templates',
  'SELECT',
  'true'
);

-- 6. Insert sample data if not present (idempotent).
INSERT INTO public.worked_examples (standard_id, title, content_en, difficulty_level, fade_stage, metadata) VALUES
('AS91945', 'Combined Area Expression (Achieved)',
  'Step 1: Let s = area of Small Artisan Stall.
Step 2: Area of Large Food Truck = 2s + 5.
Step 3: Combined area = s + (2s + 5) = 3s + 5.
Step 4: Simplified expression: 3s + 5.', 
  2, 'full', '{"topics":["algebra","expression"],"prerequisites":["basic arithmetic"]}'),
('AS91945', 'Revenue Threshold Inequality (Merit)',
  'Step 1: Revenue model: R = 850 - 75w.
Step 2: Minimum revenue required: R_min = 400 * d.
Step 3: Set inequality: 850 - 75w ≥ 400d.
Step 4: Solve for w: w ≤ (850 - 400d)/75.
Step 5: Interpret: w must be an integer, round down.', 
  3, 'partial', '{"topics":["linear equations","inequalities"],"prerequisites":["substitution"]}'),
('AS91945', 'Odd Integer Square Difference (Excellence)',
  'Step 1: Let consecutive odd integers be 2n+1 and 2n+3.
Step 2: Square difference: (2n+3)² - (2n+1)².
Step 3: Expand: (4n²+12n+9) - (4n²+4n+1) = 8n+8.
Step 4: Factor: 8(n+1). Hence always multiple of 8.
Step 5: Assumptions: n is integer, odd integers are positive.', 
  4, 'none', '{"topics":["algebraic proof","quadratics"],"prerequisites":["expansion"]}')
ON CONFLICT DO NOTHING;

INSERT INTO public.feedback_templates (standard_id, template_name, template_en, feedback_type) VALUES
('AS91945', 'Task Feedback – Area Expression',
  'Your expression {expression} is {correctness}. Remember to combine like terms and include units if applicable.', 
  'task'),
('AS91945', 'Process Feedback – Solving Inequalities',
  'You set up the inequality correctly. Next time, explicitly state the rounding rule for discrete variables like weeks.', 
  'process'),
('AS91945', 'Self‑Regulation Feedback – Proof Structure',
  'You identified the key algebraic representation. Consider adding a sentence about the assumptions you made.', 
  'self_regulation')
ON CONFLICT DO NOTHING;

-- 6a. Add CHECK constraint for prediction_accuracy (ensure 0‑1 scale)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='prediction_accuracy') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='learning_logs' AND constraint_name='prediction_accuracy_range') THEN
      ALTER TABLE public.learning_logs ADD CONSTRAINT prediction_accuracy_range CHECK (prediction_accuracy BETWEEN 0 AND 1);
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add prediction_accuracy constraint: %', SQLERRM;
END $$;

-- 7. Clean up helper function.
DROP FUNCTION create_policy_if_not_exists;

-- Done.
COMMENT ON SCHEMA public IS 'MathSpeedup 2.0 fixed state';