// TypeScript interfaces for MathSpeedup 2.0 Phase 2+

export interface WorkedExample {
  id?: string;
  standard_id: string;
  title: string;
  content_en: string;
  difficulty_level: number;
  fade_stage: 'full' | 'partial' | 'none';
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface FeedbackTemplate {
  id?: string;
  standard_id: string;
  template_name: string;
  template_en: string;
  feedback_type: 'task' | 'process' | 'self_regulation';
  created_at?: string;
}

export interface StudentGoal {
  id?: string;
  user_id: string;
  goal_text: string;
  target_date?: string;
  progress_pct: number;
  is_active: boolean;
  created_at?: string;
}

export interface LearningLog {
  id?: string;
  user_id?: string; // to be added
  session_date: string;
  session_summary?: string;
  wombatbot_evaluation?: string;
  logic_fingerprint?: string[];
  self_reported_grade?: 'N' | 'A' | 'M' | 'E';
  prediction_accuracy?: number;
  cognitive_load_rating?: number;
  learning_intention?: string;
  success_criteria?: string[];
  timss_domain?: 'Knowing' | 'Applying' | 'Reasoning';
  created_at?: string;
}

export interface Standard {
  id: string;
  code: string;
  title: string;
  description?: string;
  level?: string;
}

export interface MasteryDomain {
  domain: 'Knowing' | 'Applying' | 'Reasoning';
  score: number;
  trend: 'up' | 'down' | 'stable';
}