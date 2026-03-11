-- Fix anonymous access for MathSpeedup 2.0 demo
-- This script adjusts RLS policies and column constraints to allow unauthenticated users
-- to read and insert learning logs without requiring a user_id.

-- 1. Make learning_logs.user_id nullable (remove NOT NULL constraint)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='learning_logs' 
               AND column_name='user_id' AND is_nullable='NO') THEN
    ALTER TABLE public.learning_logs ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE 'Made learning_logs.user_id nullable.';
  ELSE
    RAISE NOTICE 'learning_logs.user_id is already nullable.';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not alter user_id column: %', SQLERRM;
END $$;

-- 2. Ensure standards table has RLS enabled and a policy for anonymous SELECT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='standards' AND schemaname='public') THEN
    RAISE NOTICE 'standards table does not exist, skipping RLS setup.';
  ELSE
    -- Enable RLS if not already enabled
    ALTER TABLE public.standards ENABLE ROW LEVEL SECURITY;
    -- Drop existing SELECT policy if it exists (by name) to avoid duplicates
    DROP POLICY IF EXISTS "Anyone can view standards" ON public.standards;
    -- Create a new policy allowing anonymous SELECT
    CREATE POLICY "Anyone can view standards" ON public.standards
      FOR SELECT USING (true);
    RAISE NOTICE 'Enabled RLS and added SELECT policy for standards.';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not configure standards RLS: %', SQLERRM;
END $$;

-- 3. Update learning_logs RLS policies to allow anonymous SELECT and INSERT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='learning_logs' AND schemaname='public') THEN
    RAISE NOTICE 'learning_logs table does not exist, skipping RLS updates.';
  ELSE
    -- Enable RLS if not already enabled
    ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies (by name) to avoid conflicts
    DROP POLICY IF EXISTS "Users can view own learning logs" ON public.learning_logs;
    DROP POLICY IF EXISTS "Users can insert own learning logs" ON public.learning_logs;
    DROP POLICY IF EXISTS "Users can update own learning logs" ON public.learning_logs;
    DROP POLICY IF EXISTS "Users can delete own learning logs" ON public.learning_logs;
    
    -- Create new policies that allow anonymous access
    -- Anonymous users can view all learning logs (demo purpose)
    CREATE POLICY "Anyone can view learning logs" ON public.learning_logs
      FOR SELECT USING (true);
    -- Anonymous users can insert logs without user_id
    CREATE POLICY "Anyone can insert learning logs" ON public.learning_logs
      FOR INSERT WITH CHECK (true);
    -- Anonymous users cannot update or delete logs (keep default deny)
    RAISE NOTICE 'Updated learning_logs RLS policies for anonymous access.';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not update learning_logs RLS: %', SQLERRM;
END $$;

-- 4. Ensure worked_examples and feedback_templates have anonymous SELECT policies (they should already)
-- worked_examples already has policy "Anyone can view worked examples" (from previous migration)
-- feedback_templates already has policy "Anyone can view feedback templates"
-- No changes needed.

-- 5. Optional: Insert a default standard if none exists (for demo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.standards LIMIT 1) THEN
    INSERT INTO public.standards (id, code, title, credits) VALUES
      ('AS91945', '91945', 'Apply algebraic methods in solving problems', 4),
      ('AS91946', '91946', 'Apply trigonometric methods in solving problems', 4),
      ('AS91947', '91947', 'Apply calculus methods in solving problems', 4)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Inserted demo standards.';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not insert demo standards: %', SQLERRM;
END $$;

-- 6. Insert sample worked examples if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.worked_examples LIMIT 1) THEN
    INSERT INTO public.worked_examples (standard_id, title, content_en, difficulty_level, fade_stage, metadata) VALUES
      ('AS91945', 'Odd Integer Square Difference (Excellence)',
       'Step 1: Let consecutive odd integers be 2n+1 and 2n+3.\nStep 2: Square difference: (2n+3)² - (2n+1)².\nStep 3: Expand: (4n²+12n+9) - (4n²+4n+1) = 8n+8.\nStep 4: Factor: 8(n+1). Hence always multiple of 8.\nStep 5: Assumptions: n is integer, odd integers are positive.',
       4, 'none', '{"topics": ["algebraic proof", "quadratics"], "prerequisites": ["expansion"]}'),
      ('AS91946', 'Trigonometric Identity (Merit)',
       'Step 1: Start with sin²θ + cos²θ = 1.\nStep 2: Divide both sides by cos²θ.\nStep 3: Simplify to tan²θ + 1 = sec²θ.\nStep 4: Domain restrictions: θ ≠ (2k+1)π/2.',
       3, 'partial', '{"topics": ["trig identities"], "prerequisites": ["Pythagorean theorem"]}')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Inserted demo worked examples.';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not insert demo worked examples: %', SQLERRM;
END $$;

-- 7. Insert sample feedback templates if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.feedback_templates LIMIT 1) THEN
    INSERT INTO public.feedback_templates (standard_id, template_name, template_en, feedback_type) VALUES
      ('AS91945', 'Task Feedback – Area Expression',
       'Your expression 3s + 5 is correct. Remember to combine like terms and include units if applicable.', 'task'),
      ('AS91945', 'Process Feedback – Solving Inequalities',
       'You set up the inequality correctly. Next time, explicitly state the rounding rule for discrete variables like weeks.', 'process'),
      ('AS91945', 'Self‑Regulation Feedback – Proof Structure',
       'You identified the key algebraic representation. Consider adding a sentence about the assumptions you made.', 'self_regulation')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Inserted demo feedback templates.';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not insert demo feedback templates: %', SQLERRM;
END $$;

-- 8. Add a comment to remind that this is a demo configuration
COMMENT ON TABLE public.learning_logs IS 'Demo configuration: anonymous read/write enabled for testing. Secure with user authentication before production.';

RAISE NOTICE 'Fix for anonymous access completed. Please run this script in Supabase SQL editor.';