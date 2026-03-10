-- MathSpeedup 2.0 Phase 1 Upgrade: Evidence‑Based Learning Components
-- Adds tables and columns for Visible Learning, Cognitive Load Theory, and Self‑Reported Grades.

-- 1. Ensure learning_logs table exists (compatible with current front‑end).
CREATE TABLE IF NOT EXISTS public.learning_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_summary TEXT,
  wombatbot_evaluation TEXT,
  logic_fingerprint TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add evidence‑based columns to learning_logs (if not already present).
DO $$ 
BEGIN
  -- Self‑reported grade (Hattie d=1.33)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='self_reported_grade') THEN
    ALTER TABLE public.learning_logs ADD COLUMN self_reported_grade TEXT CHECK (self_reported_grade IN ('N','A','M','E'));
  END IF;
  -- Prediction accuracy (self‑assessment calibration)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='prediction_accuracy') THEN
    ALTER TABLE public.learning_logs ADD COLUMN prediction_accuracy NUMERIC(4,2);
  END IF;
  -- Cognitive load rating (CLT optimisation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='cognitive_load_rating') THEN
    ALTER TABLE public.learning_logs ADD COLUMN cognitive_load_rating INTEGER CHECK (cognitive_load_rating BETWEEN 1 AND 7);
  END IF;
  -- Learning intention (Visible Learning)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='learning_intention') THEN
    ALTER TABLE public.learning_logs ADD COLUMN learning_intention TEXT;
  END IF;
  -- Success criteria (Visible Learning)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='success_criteria') THEN
    ALTER TABLE public.learning_logs ADD COLUMN success_criteria TEXT[];
  END IF;
  -- TIMSS cognitive domain (Knowing, Applying, Reasoning)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_logs' AND column_name='timss_domain') THEN
    ALTER TABLE public.learning_logs ADD COLUMN timss_domain TEXT CHECK (timss_domain IN ('Knowing','Applying','Reasoning'));
  END IF;
END $$;

-- 3. Create student_goals table (goal‑setting & progress tracking)
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
CREATE POLICY "Users can manage own goals" ON public.student_goals
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create worked_examples table (Cognitive Load Theory – worked‑example effect)
CREATE TABLE IF NOT EXISTS public.worked_examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id TEXT REFERENCES public.standards(id),
  title TEXT NOT NULL,
  content_en TEXT NOT NULL, -- Step‑by‑step solution in English
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  fade_stage TEXT CHECK (fade_stage IN ('full','partial','none')), -- Faded guidance stages
  metadata JSONB, -- e.g., '{"topics":["algebra"],"prerequisites":[]}'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.worked_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view worked examples" ON public.worked_examples FOR SELECT USING (true);

-- 5. Create feedback_templates table (structured feedback for Visible Learning)
CREATE TABLE IF NOT EXISTS public.feedback_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id TEXT REFERENCES public.standards(id),
  template_name TEXT NOT NULL,
  template_en TEXT NOT NULL, -- Structured feedback text with placeholders
  feedback_type TEXT CHECK (feedback_type IN ('task','process','self_regulation')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feedback templates" ON public.feedback_templates FOR SELECT USING (true);

-- 6. Insert sample worked examples (for AS91945)
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

-- 7. Insert feedback templates
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

-- 7a. Add CHECK constraint for prediction_accuracy (ensure 0‑1 scale)
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

-- 8. Ensure RLS is enabled for learning_logs (if not already)
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own learning logs" ON public.learning_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning logs" ON public.learning_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning logs" ON public.learning_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning logs" ON public.learning_logs
  FOR DELETE USING (auth.uid() = user_id);