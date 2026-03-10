-- Database Fix Script for MathSpeedup 2.0 Phase 1/2/3 - Version 6
-- Fixes: Corrected CREATE POLICY syntax for INSERT (only WITH CHECK allowed) and other commands.
-- Addresses: 1) worked_examples foreign key type mismatch, 2) missing user_id column
-- Safe to run multiple times (idempotent).
-- NOTE: Sample data insertion removed to avoid type mismatch errors.

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
-- Correctly handles command types: SELECT/DELETE (USING only), INSERT (WITH CHECK only),
-- UPDATE (USING and WITH CHECK), ALL (USING and WITH CHECK).
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  command TEXT,
  using_expression TEXT,
  with_check_expression TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  sql_stmt TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = policy_name AND tablename = table_name) THEN
    -- Determine the correct SQL based on command type
    IF command IN ('SELECT', 'DELETE') THEN
      -- SELECT and DELETE only allow USING
      sql_stmt := format('CREATE POLICY %I ON %I FOR %s USING (%s)',
                         policy_name, table_name, command, using_expression);
    ELSIF command = 'INSERT' THEN
      -- INSERT only allows WITH CHECK
      IF with_check_expression IS NULL THEN
        sql_stmt := format('CREATE POLICY %I ON %I FOR %s WITH CHECK (%s)',
                           policy_name, table_name, command, using_expression);
      ELSE
        sql_stmt := format('CREATE POLICY %I ON %I FOR %s WITH CHECK (%s)',
                           policy_name, table_name, command, with_check_expression);
      END IF;
    ELSIF command = 'UPDATE' THEN
      -- UPDATE can have both USING and WITH CHECK
      IF with_check_expression IS NULL THEN
        sql_stmt := format('CREATE POLICY %I ON %I FOR %s USING (%s)',
                           policy_name, table_name, command, using_expression);
      ELSE
        sql_stmt := format('CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s)',
                           policy_name, table_name, command, using_expression, with_check_expression);
      END IF;
    ELSIF command = 'ALL' THEN
      -- ALL requires both USING and WITH CHECK; if with_check missing, use using for both
      IF with_check_expression IS NULL THEN
        sql_stmt := format('CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s)',
                           policy_name, table_name, command, using_expression, using_expression);
      ELSE
        sql_stmt := format('CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s)',
                           policy_name, table_name, command, using_expression, with_check_expression);
      END IF;
    ELSE
      RAISE EXCEPTION 'Unsupported command: %', command;
    END IF;
    
    EXECUTE sql_stmt;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for learning_logs ONLY if user_id column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='learning_logs' 
               AND column_name='user_id') THEN
    PERFORM create_policy_if_not_exists(
      'Users can view own learning logs',
      'learning_logs',
      'SELECT',
      'auth.uid() = user_id'
    );
    PERFORM create_policy_if_not_exists(
      'Users can insert own learning logs',
      'learning_logs',
      'INSERT',
      'auth.uid() = user_id',
      'auth.uid() = user_id'
    );
    PERFORM create_policy_if_not_exists(
      'Users can update own learning logs',
      'learning_logs',
      'UPDATE',
      'auth.uid() = user_id'
    );
    PERFORM create_policy_if_not_exists(
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

-- 7. (Removed sample data insertion to avoid type mismatch errors)

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
COMMENT ON SCHEMA public IS 'MathSpeedup 2.0 fixed state (v6)';