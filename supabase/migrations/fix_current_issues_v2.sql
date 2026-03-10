-- Database Fix Script for MathSpeedup 2.0 Phase 1/2/3 - Version 2
-- Addresses: 1) worked_examples foreign key type mismatch, 2) missing user_id column
-- Safe to run multiple times (idempotent).

-- 0. First, check the current state of standards.id column type
DO $$ 
DECLARE 
  standards_id_type TEXT;
BEGIN
  SELECT data_type INTO standards_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'standards' 
    AND column_name = 'id';
  
  IF standards_id_type = 'uuid' THEN
    RAISE NOTICE 'standards.id is UUID type, adjusting worked_examples.standard_id to UUID';
    -- If worked_examples.standard_id exists and is TEXT, we need to convert it
    -- But first, drop the foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'worked_examples' 
                 AND constraint_name = 'worked_examples_standard_id_fkey') THEN
      ALTER TABLE public.worked_examples DROP CONSTRAINT worked_examples_standard_id_fkey;
    END IF;
    
    -- Change standard_id column type to UUID if it exists and is TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
                 AND table_name = 'worked_examples' 
                 AND column_name = 'standard_id'
                 AND data_type = 'text') THEN
      -- We need to handle data conversion - but since this is a new table, we can drop and recreate
      -- For safety, we'll check if there's any data first
      IF EXISTS (SELECT 1 FROM public.worked_examples LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot automatically convert worked_examples.standard_id from TEXT to UUID with existing data. Please migrate manually.';
      ELSE
        ALTER TABLE public.worked_examples DROP COLUMN standard_id;
        ALTER TABLE public.worked_examples ADD COLUMN standard_id UUID REFERENCES public.standards(id);
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'standards.id is % type, keeping worked_examples.standard_id as TEXT', standards_id_type;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not check standards.id type: %', SQLERRM;
END $$;

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

-- 2. Ensure user_id column exists in learning_logs (add if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='learning_logs' 
                   AND column_name='user_id') THEN
    ALTER TABLE public.learning_logs ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Make user_id NOT NULL if it's nullable
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='learning_logs' 
               AND column_name='user_id' AND is_nullable='YES') THEN
    -- Check if there are any rows without user_id
    IF EXISTS (SELECT 1 FROM public.learning_logs WHERE user_id IS NULL) THEN
      -- Set a default user_id for existing rows (use system user or delete)
      -- For safety, we'll delete rows without user_id since this should be a new table
      DELETE FROM public.learning_logs WHERE user_id IS NULL;
    END IF;
    ALTER TABLE public.learning_logs ALTER COLUMN user_id SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN 
    RAISE NOTICE 'Could not alter user_id column: %', SQLERRM;
END $$;

-- 4. Add evidence‑based columns if missing (same as upgrade).
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

-- 5. Enable RLS and create policies if they don't exist.
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

-- Create policies for learning_logs ONLY if user_id column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='learning_logs' 
               AND column_name='user_id') THEN
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
  ELSE
    RAISE NOTICE 'user_id column does not exist in learning_logs, skipping RLS policies';
  END IF;
END $$;

-- 6. Ensure other Phase 1 tables exist with proper column types.
-- First check standards table structure
DO $$
DECLARE 
  standards_id_type TEXT;
BEGIN
  SELECT data_type INTO standards_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'standards' 
    AND column_name = 'id';
  
  -- Create worked_examples with appropriate foreign key type
  IF standards_id_type = 'uuid' THEN
    CREATE TABLE IF NOT EXISTS public.worked_examples (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      standard_id UUID REFERENCES public.standards(id),
      title TEXT NOT NULL,
      content_en TEXT NOT NULL,
      difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
      fade_stage TEXT CHECK (fade_stage IN ('full','partial','none')),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
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
  END IF;
EXCEPTION
  WHEN others THEN
    -- If we can't determine type, create with TEXT (compatible with initial schema)
    CREATE TABLE IF NOT EXISTS public.worked_examples (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      standard_id TEXT,
      title TEXT NOT NULL,
      content_en TEXT NOT NULL,
      difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
      fade_stage TEXT CHECK (fade_stage IN ('full','partial','none')),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created worked_examples with TEXT standard_id (fallback)';
END $$;

-- Add foreign key constraint if it doesn't exist and columns are compatible
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'worked_examples' 
                   AND constraint_name = 'worked_examples_standard_id_fkey') THEN
    -- Check if standards table exists and has an id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='standards') THEN
      -- Try to add foreign key constraint
      BEGIN
        ALTER TABLE public.worked_examples ADD CONSTRAINT worked_examples_standard_id_fkey 
          FOREIGN KEY (standard_id) REFERENCES public.standards(id);
      EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'Could not add foreign key constraint: %. Standard_id column may be incompatible with standards.id.', SQLERRM;
      END;
    END IF;
  END IF;
END $$;

ALTER TABLE public.worked_examples ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
  'Anyone can view worked examples',
  'worked_examples',
  'SELECT',
  'true'
);

-- Create student_goals
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

-- Create feedback_templates with appropriate standard_id type
DO $$
DECLARE 
  standards_id_type TEXT;
BEGIN
  SELECT data_type INTO standards_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'standards' 
    AND column_name = 'id';
  
  IF standards_id_type = 'uuid' THEN
    CREATE TABLE IF NOT EXISTS public.feedback_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      standard_id UUID REFERENCES public.standards(id),
      template_name TEXT NOT NULL,
      template_en TEXT NOT NULL,
      feedback_type TEXT CHECK (feedback_type IN ('task','process','self_regulation')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    CREATE TABLE IF NOT EXISTS public.feedback_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      standard_id TEXT REFERENCES public.standards(id),
      template_name TEXT NOT NULL,
      template_en TEXT NOT NULL,
      feedback_type TEXT CHECK (feedback_type IN ('task','process','self_regulation')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
EXCEPTION
  WHEN others THEN
    CREATE TABLE IF NOT EXISTS public.feedback_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      standard_id TEXT,
      template_name TEXT NOT NULL,
      template_en TEXT NOT NULL,
      feedback_type TEXT CHECK (feedback_type IN ('task','process','self_regulation')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created feedback_templates with TEXT standard_id (fallback)';
END $$;

ALTER TABLE public.feedback_templates ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
  'Anyone can view feedback templates',
  'feedback_templates',
  'SELECT',
  'true'
);

-- 7. Insert sample data if not present (idempotent).
-- Worked examples - handle both TEXT and UUID standard_id
DO $$
DECLARE
  example_standard_id TEXT := 'AS91945';
  example_standard_uuid UUID;
BEGIN
  -- Try to find UUID if standards.id is UUID type
  BEGIN
    SELECT id INTO example_standard_uuid FROM public.standards WHERE id::text = example_standard_id LIMIT 1;
  EXCEPTION
    WHEN others THEN
      example_standard_uuid := NULL;
  END;
  
  -- Insert worked examples with appropriate ID type
  IF example_standard_uuid IS NOT NULL THEN
    INSERT INTO public.worked_examples (standard_id, title, content_en, difficulty_level, fade_stage, metadata) VALUES
    (example_standard_uuid, 'Combined Area Expression (Achieved)',
      'Step 1: Let s = area of Small Artisan Stall.
Step 2: Area of Large Food Truck = 2s + 5.
Step 3: Combined area = s + (2s + 5) = 3s + 5.
Step 4: Simplified expression: 3s + 5.', 
      2, 'full', '{"topics":["algebra","expression"],"prerequisites":["basic arithmetic"]}'),
    (example_standard_uuid, 'Revenue Threshold Inequality (Merit)',
      'Step 1: Revenue model: R = 850 - 75w.
Step 2: Minimum revenue required: R_min = 400 * d.
Step 3: Set inequality: 850 - 75w ≥ 400d.
Step 4: Solve for w: w ≤ (850 - 400d)/75.
Step 5: Interpret: w must be an integer, round down.', 
      3, 'partial', '{"topics":["linear equations","inequalities"],"prerequisites":["substitution"]}'),
    (example_standard_uuid, 'Odd Integer Square Difference (Excellence)',
      'Step 1: Let consecutive odd integers be 2n+1 and 2n+3.
Step 2: Square difference: (2n+3)² - (2n+1)².
Step 3: Expand: (4n²+12n+9) - (4n²+4n+1) = 8n+8.
Step 4: Factor: 8(n+1). Hence always multiple of 8.
Step 5: Assumptions: n is integer, odd integers are positive.', 
      4, 'none', '{"topics":["algebraic proof","quadratics"],"prerequisites":["expansion"]}')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.worked_examples (standard_id, title, content_en, difficulty_level, fade_stage, metadata) VALUES
    (example_standard_id, 'Combined Area Expression (Achieved)',
      'Step 1: Let s = area of Small Artisan Stall.
Step 2: Area of Large Food Truck = 2s + 5.
Step 3: Combined area = s + (2s + 5) = 3s + 5.
Step 4: Simplified expression: 3s + 5.', 
      2, 'full', '{"topics":["algebra","expression"],"prerequisites":["basic arithmetic"]}'),
    (example_standard_id, 'Revenue Threshold Inequality (Merit)',
      'Step 1: Revenue model: R = 850 - 75w.
Step 2: Minimum revenue required: R_min = 400 * d.
Step 3: Set inequality: 850 - 75w ≥ 400d.
Step 4: Solve for w: w ≤ (850 - 400d)/75.
Step 5: Interpret: w must be an integer, round down.', 
      3, 'partial', '{"topics":["linear equations","inequalities"],"prerequisites":["substitution"]}'),
    (example_standard_id, 'Odd Integer Square Difference (Excellence)',
      'Step 1: Let consecutive odd integers be 2n+1 and 2n+3.
Step 2: Square difference: (2n+3)² - (2n+1)².
Step 3: Expand: (4n²+12n+9) - (4n²+4n+1) = 8n+8.
Step 4: Factor: 8(n+1). Hence always multiple of 8.
Step 5: Assumptions: n is integer, odd integers are positive.', 
      4, 'none', '{"topics":["algebraic proof","quadratics"],"prerequisites":["expansion"]}')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Feedback templates
DO $$
DECLARE
  example_standard_id TEXT := 'AS91945';
  example_standard_uuid UUID;
BEGIN
  BEGIN
    SELECT id INTO example_standard_uuid FROM public.standards WHERE id::text = example_standard_id LIMIT 1;
  EXCEPTION
    WHEN others THEN
      example_standard_uuid := NULL;
  END;
  
  IF example_standard_uuid IS NOT NULL THEN
    INSERT INTO public.feedback_templates (standard_id, template_name, template_en, feedback_type) VALUES
    (example_standard_uuid, 'Task Feedback – Area Expression',
      'Your expression {expression} is {correctness}. Remember to combine like terms and include units if applicable.', 
      'task'),
    (example_standard_uuid, 'Process Feedback – Solving Inequalities',
      'You set up the inequality correctly. Next time, explicitly state the rounding rule for discrete variables like weeks.', 
      'process'),
    (example_standard_uuid, 'Self‑Regulation Feedback – Proof Structure',
      'You identified the key algebraic representation. Consider adding a sentence about the assumptions you made.', 
      'self_regulation')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.feedback_templates (standard_id, template_name, template_en, feedback_type) VALUES
    (example_standard_id, 'Task Feedback – Area Expression',
      'Your expression {expression} is {correctness}. Remember to combine like terms and include units if applicable.', 
      'task'),
    (example_standard_id, 'Process Feedback – Solving Inequalities',
      'You set up the inequality correctly. Next time, explicitly state the rounding rule for discrete variables like weeks.', 
      'process'),
    (example_standard_id, 'Self‑Regulation Feedback – Proof Structure',
      'You identified the key algebraic representation. Consider adding a sentence about the assumptions you made.', 
      'self_regulation')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 8. Add CHECK constraint for prediction_accuracy (ensure 0‑1 scale)
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

-- 9. Clean up helper function.
DROP FUNCTION create_policy_if_not_exists;

-- Done.
COMMENT ON SCHEMA public IS 'MathSpeedup 2.0 fixed state (v2)';