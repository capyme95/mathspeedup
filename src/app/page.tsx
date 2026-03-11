'use client';

import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import LearningIntention from '@/components/LearningIntention';
import WorkedExample from '@/components/WorkedExample';
import SelfReportedGrade from '@/components/SelfReportedGrade';
import StructuredFeedback from '@/components/StructuredFeedback';
import MasteryChart from '@/components/MasteryChart';
import { WorkedExample as WorkedExampleType } from '@/types';

// Lazy‑load heavier components to reduce initial bundle size
const AdaptivePathRecommender = React.lazy(() => import('@/components/AdaptivePathRecommender'));
const RetrievalPractice = React.lazy(() => import('@/components/RetrievalPractice'));
const MasteryDashboard2 = React.lazy(() => import('@/components/MasteryDashboard2'));
const CognitiveLoadOptimiser = React.lazy(() => import('@/components/CognitiveLoadOptimiser'));
const PersonalisedFeedbackEngine = React.lazy(() => import('@/components/PersonalisedFeedbackEngine'));
import FeedbackForm from '@/components/FeedbackForm';

interface Standard { id: string; code: string; title: string; credits: number; }
interface LearningLog { 
  id: string; 
  session_date: string; 
  session_summary: string; 
  wombatbot_evaluation: string;
  logic_fingerprint: string[];
}

export default function Dashboard() {
  const [standards, setStandards] = useState<Standard[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [workedExamples, setWorkedExamples] = useState<WorkedExampleType[]>([]);
  const [feedbackTemplates, setFeedbackTemplates] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [answer, setAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Environment variable validation (runtime check)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
      const missing = required.filter(key => !process.env[key]);
      if (missing.length > 0) {
        console.warn(`Missing environment variables: ${missing.join(', ')}. Please ensure they are set in Vercel or .env.local.`);
      } else {
        console.log('All required environment variables are present.');
      }
    }
  }, []);

  // --- Dynamic Environment Factors ---
  const envFactors = useMemo(() => {
    // These remain stable for the component lifecycle until refresh
    return {
      rainProb: Math.floor(Math.random() * 101), // 0-100%
      discountRate: (Math.random() * (1.2 - 0.8) + 0.8).toFixed(2), // 0.80 - 1.20
      fuelIndex: (Math.random() * (1.5 - 0.9) + 0.9).toFixed(2),
    };
  }, []);

  // --- Phase 1: Evidence‑Based Learning Data ---
  const learningIntention = {
    intention: 'Formulate and simplify algebraic expressions, solve linear inequalities, and prove properties of consecutive odd integers.',
    successCriteria: [
      'Write a simplified expression for combined stall area.',
      'Solve inequality for maximum rainy weekends given discount factor.',
      'Prove difference of squares of consecutive odd integers is multiple of 8.',
      'State assumptions and discuss real‑world limitations.',
    ],
    timssDomain: 'Applying' as const,
  };

  const staticWorkedExamples: WorkedExampleType[] = [
    {
      standard_id: 'AS91945',
      title: 'Combined Area Expression (Achieved)',
      content_en: `Step 1: Let s = area of Small Artisan Stall.
Step 2: Area of Large Food Truck = 2s + 5.
Step 3: Combined area = s + (2s + 5) = 3s + 5.
Step 4: Simplified expression: 3s + 5.`,
      difficulty_level: 2,
      fade_stage: 'full',
      metadata: { topics: ['algebra', 'expression'], prerequisites: ['basic arithmetic'] },
    },
    {
      standard_id: 'AS91945',
      title: 'Revenue Threshold Inequality (Merit)',
      content_en: `Step 1: Revenue model: R = 850 - 75w.
Step 2: Minimum revenue required: R_min = 400 * d.
Step 3: Set inequality: 850 - 75w ≥ 400d.
Step 4: Solve for w: w ≤ (850 - 400d)/75.
Step 5: Interpret: w must be an integer, round down.`,
      difficulty_level: 3,
      fade_stage: 'partial',
      metadata: { topics: ['linear equations', 'inequalities'], prerequisites: ['substitution'] },
    },
    {
      standard_id: 'AS91945',
      title: 'Odd Integer Square Difference (Excellence)',
      content_en: `Step 1: Let consecutive odd integers be 2n+1 and 2n+3.
Step 2: Square difference: (2n+3)² - (2n+1)².
Step 3: Expand: (4n²+12n+9) - (4n²+4n+1) = 8n+8.
Step 4: Factor: 8(n+1). Hence always multiple of 8.
Step 5: Assumptions: n is integer, odd integers are positive.`,
      difficulty_level: 4,
      fade_stage: 'none',
      metadata: { topics: ['algebraic proof', 'quadratics'], prerequisites: ['expansion'] },
    },
  ];

  const handleGradeSubmit = async (grade: string, confidence: number) => {
    console.log('Self‑reported grade:', grade, 'confidence:', confidence);
    // POST to learning_logs with new evidence‑based columns
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      alert('Configuration missing: cannot save prediction.');
      return;
    }
    try {
      const res = await fetch(`${url}/rest/v1/learning_logs`, {
        method: 'POST',
        headers: { 
          'apikey': key, 
          'Authorization': `Bearer ${key}`, 
          'Content-Type': 'application/json', 
          'Prefer': 'return=minimal' 
        },
        body: JSON.stringify({
          session_date: new Date().toISOString().split('T')[0],
          session_summary: `Self‑reported grade: ${grade}, confidence: ${confidence}%`,
          logic_fingerprint: [],
          wombatbot_evaluation: 'Awaiting audit.',
          self_reported_grade: grade,
          prediction_accuracy: confidence / 100, // convert percentage to 0‑1
          cognitive_load_rating: null, // to be filled by CognitiveLoadOptimiser
          learning_intention: learningIntention.intention,
          success_criteria: learningIntention.successCriteria,
          timss_domain: learningIntention.timssDomain
        })
      });
      if (res.ok) {
        alert(`Prediction recorded: ${grade} at ${confidence}% confidence. Data saved to learning log.`);
        fetchData(); // refresh logs
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to save prediction:', err);
      alert('Failed to save prediction. Check console.');
    }
  };

  // --- Phase 2: Structured Feedback & Mastery Data ---
  const feedbackItems = [
    {
      type: 'task' as const,
      text: 'Your expression 3s + 5 is correct. Remember to combine like terms and include units if applicable.',
      templateName: 'Task Feedback – Area Expression',
    },
    {
      type: 'process' as const,
      text: 'You set up the inequality correctly. Next time, explicitly state the rounding rule for discrete variables like weeks.',
      templateName: 'Process Feedback – Solving Inequalities',
    },
    {
      type: 'self_regulation' as const,
      text: 'You identified the key algebraic representation. Consider adding a sentence about the assumptions you made.',
      templateName: 'Self‑Regulation Feedback – Proof Structure',
    },
  ];

  const masteryData = [
    { domain: 'Knowing' as const, score: 65, trend: 'up' as const },
    { domain: 'Applying' as const, score: 82, trend: 'stable' as const },
    { domain: 'Reasoning' as const, score: 45, trend: 'down' as const },
  ];

  const fetchData = useCallback(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const headers: HeadersInit = { 'apikey': key, 'Authorization': `Bearer ${key}` };
    try {
      const [stdRes, logRes, examplesRes, feedbackRes] = await Promise.all([
        fetch(`${url}/rest/v1/standards?select=*`, { headers }),
        fetch(`${url}/rest/v1/learning_logs?select=*&order=session_date.desc&limit=5`, { headers }),
        fetch(`${url}/rest/v1/worked_examples?select=*`, { headers }),
        fetch(`${url}/rest/v1/feedback_templates?select=*`, { headers })
      ]);
      if (!stdRes.ok) throw new Error(`Standards fetch failed: ${stdRes.status}`);
      if (!logRes.ok) throw new Error(`Learning logs fetch failed: ${logRes.status}`);
      if (!examplesRes.ok) throw new Error(`Worked examples fetch failed: ${examplesRes.status}`);
      if (!feedbackRes.ok) throw new Error(`Feedback templates fetch failed: ${feedbackRes.status}`);
      const stdData = await stdRes.json();
      const logData = await logRes.json();
      const examplesData = await examplesRes.json();
      const feedbackData = await feedbackRes.json();
      setStandards(Array.isArray(stdData) ? stdData : []);
      setLogs(Array.isArray(logData) ? logData : []);
      setWorkedExamples(Array.isArray(examplesData) ? examplesData : []);
      setFeedbackTemplates(Array.isArray(feedbackData) ? feedbackData : []);
    } catch (err) {
      console.error('Fetch error:', err);
      // Optionally set error state for UI
    } finally {
      setLoading(false);
    }
  }, []);

  const atomizeLogic = (text: string): string[] => {
    return text.split(/\n|(?=\d\.)|(?=Therefore)|(?=Assume)|(?=Step)/g)
      .map(s => s.trim()).filter(s => s.length > 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setIsSubmitting(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const fingerprint = atomizeLogic(answer);
    
    // Inject environmental metadata into summary for auditor context
    const summaryWithEnv = `[LOGIC_FINGERPRINT_SUBMISSION] | Env: Rain=${envFactors.rainProb}%, Disc=${envFactors.discountRate}`;

    try {
      const res = await fetch(`${url}/rest/v1/learning_logs`, {
        method: 'POST',
        headers: { 'apikey': key!, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          session_date: new Date().toISOString().split('T')[0],
          session_summary: summaryWithEnv,
          logic_fingerprint: fingerprint,
          wombatbot_evaluation: 'Awaiting dynamic narrative and logic audit.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: LOGIC SEALED'); setAnswer(''); fetchData(); }
      else { throw new Error('FAIL'); }
    } catch (_err) { setSubmitStatus('ERROR: CONNECTION COLLAPSE'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-blue-600 flex items-center justify-center font-sans">Loading MathSpeedup 2.0...</div>;

  const examplesToShow = workedExamples.length > 0 ? workedExamples : staticWorkedExamples;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-800 p-4 md:p-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="max-w-6xl mx-auto mb-24 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            MathSpeedup <span className="text-blue-600">2.0</span>
          </h1>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl">
            Evidence‑based learning platform for NCEA Mathematics • Avondale Sunday Market Project • Auckland 2026
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-4">
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-2xl">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">Live • Connected to Learning Dashboard</span>
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
            Generation 26 • Updated today
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-32">
        {/* Dynamic Environment Factors */}
        <section className="max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Real‑World Context Factors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="text-sm text-blue-700 font-medium mb-2">Rain Probability</div>
                <div className="text-3xl font-bold text-gray-900">{envFactors.rainProb}%</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="text-sm text-purple-700 font-medium mb-2">Market Discount Rate (d)</div>
                <div className="text-3xl font-bold text-gray-900">{envFactors.discountRate}×</div>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl">
                <div className="text-sm text-amber-700 font-medium mb-2">Fuel Price Index</div>
                <div className="text-3xl font-bold text-gray-900">{envFactors.fuelIndex}</div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-xl">
                <div className="text-sm text-emerald-700 font-medium mb-2">System Status</div>
                <div className="text-3xl font-bold text-emerald-600">Active</div>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 1: Evidence‑Based Learning Components */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Evidence‑Based Learning <span className="text-blue-600">Framework</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Integrating Visible Learning, Cognitive Load Theory, and Self‑Reported Grades for optimal learning outcomes.
              </p>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <LearningIntention
                  intention={learningIntention.intention}
                  successCriteria={learningIntention.successCriteria}
                  timssDomain={learningIntention.timssDomain}
                />
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">📚</span>
                  </div>
                  Worked Examples Library
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Cognitive Load Theory – Faded guidance to reduce extraneous load.
                </p>
                <div className="space-y-6">
                  {examplesToShow.map((example, idx) => (
                    <WorkedExample
                      key={idx}
                      title={example.title}
                      content={example.content_en}
                      difficulty={example.difficulty_level}
                      fadeStage={example.fade_stage}
                      standardCode={example.standard_id}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-10">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <SelfReportedGrade
                  onGradeSubmit={handleGradeSubmit}
                />
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
                <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  Why This Works
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Visible Learning</strong> (Hattie): Learning intentions & success criteria increase effect size d=0.56.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Self‑Reported Grades</strong> (Hattie d=1.33): Predictions boost metacognition and accuracy.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Cognitive Load Theory</strong>: Worked examples reduce working‑memory overload.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                    <span className="text-gray-700"><strong className="text-gray-900">TIMSS Cognitive Domains</strong>: Knowing, Applying, Reasoning for balanced assessment.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Phase 2: Structured Feedback & Mastery */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Feedback & <span className="text-purple-600">Mastery Tracking</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Structured feedback templates and mastery tracking across TIMSS cognitive domains.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                <StructuredFeedback
                  feedbackItems={feedbackItems}
                  standardCode="AS91945"
                />
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
                <MasteryChart
                  domains={masteryData}
                  studentName="Sebastian"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-amber-600 font-bold">📈</span>
                </div>
                Integration Notes
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Structured Feedback</strong> uses Hattie’s three feedback types (task, process, self‑regulation) to increase effect size d=0.70–0.79.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Mastery Charts</strong> track progress across TIMSS cognitive domains, enabling targeted intervention.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Next Step</strong>: Connect to Supabase tables (<code className="bg-amber-100 px-1 rounded">feedback_templates</code>, <code className="bg-amber-100 px-1 rounded">learning_logs</code>) for dynamic data.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3: Adaptive Learning Paths */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Adaptive <span className="text-teal-600">Learning Paths</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Real‑time task sequencing based on cognitive load, performance history, and spaced repetition.
              </p>
            </div>

            <div className="mb-16">
              <Suspense fallback={
                <div className="border border-teal-200 bg-teal-50 p-12 text-center text-teal-600 rounded-2xl animate-pulse">
                  Loading adaptive paths…
                </div>
              }>
                <AdaptivePathRecommender
                  logs={logs}
                  currentStandard="AS91945"
                />
              </Suspense>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-teal-600 font-bold">⚙️</span>
                </div>
                How Adaptive Paths Work
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Rule‑Based Engine</strong>: Analyses your recent learning logs to identify the weakest TIMSS cognitive domain and recommends targeted practice.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Difficulty Calibration</strong>: Adjusts task difficulty (Achieved/Merit/Excellence) based on your prediction‑accuracy history.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Future Upgrades</strong>: Will incorporate Bayesian knowledge tracing, spaced‑repetition scheduling, and personalised feedback generation.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3: Retrieval Practice */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Retrieval <span className="text-indigo-600">Practice</span> (Testing Effect)
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Active recall quizzes to strengthen long‑term retention and calibrate confidence.
              </p>
            </div>

            <div className="mb-16">
              <Suspense fallback={
                <div className="border border-indigo-200 bg-indigo-50 p-12 text-center text-indigo-600 rounded-2xl animate-pulse">
                  Loading retrieval practice…
                </div>
              }>
                <RetrievalPractice />
              </Suspense>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">🧠</span>
                </div>
                How Retrieval Practice Works
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Testing Effect</strong>: Actively retrieving information from memory strengthens neural pathways more than passive review (Roediger & Karpicke, 2006).</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Confidence Calibration</strong>: Rating your certainty before feedback helps align self‑assessment with actual knowledge (metacognitive accuracy).</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">✓</span>
                  <span className="text-gray-700"><strong className="text-gray-900">Spaced Repetition</strong>: This module will later schedule reviews based on a forgetting curve (Ebbinghaus, 1885) to maximise retention.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3 - Mastery Dashboard 2.0 */}
        <section className="border border-[#D4AF37]/30 p-8 md:p-16 relative bg-black/40">
          <div className="absolute -top-5 left-10 bg-[#0D0D0D] border-2 border-[#D4AF37] px-8 py-1.5 font-black uppercase text-sm tracking-[0.3em] text-[#D4AF37]">
            Phase 3 – Mastery Dashboard 2.0
          </div>
          <h2 className="text-4xl font-black text-white uppercase mb-8 tracking-tight mt-12">
            Mastery Forecasting & Progress Analytics
          </h2>
          <p className="text-zinc-400 text-lg mb-10 font-mono uppercase tracking-widest">
            Interactive line charts with trend prediction and confidence intervals.
          </p>

          <div className="mb-16">
            <Suspense fallback={
              <div className="border border-[#D4AF37]/20 p-8 text-center text-zinc-400 animate-pulse">
                Loading mastery dashboard…
              </div>
            }>
              <MasteryDashboard2 />
            </Suspense>
          </div>

          <div className="p-6 border border-zinc-800 bg-black/40">
            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">
              How Forecasting Works
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Linear Regression</strong>: Fits a trend line to your historical mastery scores per TIMSS domain to predict future performance.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Confidence Intervals</strong>: The shaded area around the forecast line represents uncertainty—wider when data is sparse or variable.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Comparative Benchmarking</strong>: Later versions will show how your progress rate compares to similar students (percentile ranking).</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Phase 3 - Cognitive Load Optimiser */}
        <section className="border border-[#D4AF37]/30 p-8 md:p-16 relative bg-black/40 mt-16">
          <div className="absolute -top-5 left-10 bg-[#0D0D0D] border-2 border-[#D4AF37] px-8 py-1.5 font-black uppercase text-sm tracking-[0.3em] text-[#D4AF37]">
            Phase 3 – Cognitive‑Load Optimiser
          </div>
          <h2 className="text-4xl font-black text-white uppercase mb-8 tracking-tight mt-12">
            Adaptive Interface for Working Memory
          </h2>
          <p className="text-zinc-400 text-lg mb-10 font-mono uppercase tracking-widest">
            Self‑report your cognitive load and toggle a simplified view to reduce extraneous mental effort.
          </p>

          <div className="mb-16">
            <Suspense fallback={
              <div className="border border-[#D4AF37]/20 p-8 text-center text-zinc-400 animate-pulse">
                Loading cognitive load optimiser…
              </div>
            }>
              <CognitiveLoadOptimiser />
            </Suspense>
          </div>

          <div className="p-6 border border-zinc-800 bg-black/40">
            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">
              Why Cognitive Load Matters
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Sweller&apos;s Theory (1988)</strong>: Working memory is limited; effective learning requires optimising intrinsic load, minimising extraneous load, and increasing germane load.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Expertise Reversal Effect</strong>: What helps novices (detailed guidance) can hinder experts. Simplified view removes unnecessary scaffolding as you progress.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Metacognitive Awareness</strong>: Rating your own cognitive load builds self‑monitoring skills, a key component of self‑regulated learning.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Phase 3: Personalised Feedback Engine */}
        <section className="border border-[#D4AF37]/30 p-8 md:p-16 relative bg-black/40 mt-16">
          <div className="absolute -top-5 left-10 bg-[#0D0D0D] border-2 border-[#D4AF37] px-8 py-1.5 font-black uppercase text-sm tracking-[0.3em] text-[#D4AF37]">
            Phase 3 – Personalised Feedback Engine
          </div>
          <h2 className="text-4xl font-black text-white uppercase mb-8 tracking-tight mt-12">
            Adaptive Feedback Generation
          </h2>
          <p className="text-zinc-400 text-lg mb-10 font-mono uppercase tracking-widest">
            Real‑time feedback that adapts to your performance patterns, cognitive load, and self‑reported confidence.
          </p>

          <div className="mb-16">
            <Suspense fallback={
              <div className="border border-[#D4AF37]/20 p-8 text-center text-zinc-400 animate-pulse">
                Loading personalised feedback engine…
              </div>
            }>
              <PersonalisedFeedbackEngine
                logs={logs}
                workedExamples={workedExamples}
                feedbackTemplates={feedbackTemplates}
                currentStandard="AS91945"
              />
            </Suspense>
          </div>

          <div className="p-6 border border-zinc-800 bg-black/40">
            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">
              How Personalised Feedback Works
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Hattie’s Feedback (d = 0.79)</strong>: This engine combines task, process, and self‑regulation feedback tailored to your current learning state.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>TIMSS Domain Targeting</strong>: Identifies your weakest cognitive domain (Knowing, Applying, Reasoning) and prioritises feedback for that area.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Data‑Driven Insights</strong>: Uses your self‑reported grades, prediction accuracy, and cognitive load ratings to adjust feedback tone and content.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Template‑Based + Rule‑Based</strong>: Merges pre‑written feedback templates from the database with real‑time performance analysis.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="border border-[#D4AF37]/50 p-8 md:p-20 relative bg-[#111111] shadow-[30px_30px_60px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-5 left-10 bg-[#0D0D0D] border-2 border-[#D4AF37] px-8 py-1.5 font-black uppercase text-sm tracking-[0.3em] text-[#D4AF37]">Internal Assessment Project</div>
          
          <div className="space-y-20 mb-24">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-4xl font-black text-white uppercase mb-8 tracking-tight">Project: Sunday Market Expansion</h2>
              <p className="text-xl leading-relaxed text-zinc-400 italic font-light border-l-4 border-[#D4AF37]/40 pl-10 mb-16">
                &quot;Sebastian has been appointed as a Logic Consultant for the Avondale Sunday Market organisers. To accommodate a growing number of vendors, he must design a scalable spatial model and predict the financial impact of weather-related attendance fluctuations.&quot;
              </p>

              <div className="space-y-16">
                <div className="bg-black/40 p-10 border-l-2 border-[#D4AF37]">
                  <h3 className="text-2xl font-black text-[#D4AF37] uppercase mb-6 tracking-wide">[ Phase 1: Spatial Geometry - Achieved ]</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    The layout consists of two primary unit types. A <b>Small Artisan Stall</b> requires <i>s</i> square metres of ground space. A <b>Large Food Truck Module</b> is more demanding, requiring 5 square metres more than twice the space of the Artisan Stall. 
                    <br/><br/>
                    <strong>Task:</strong> Formulate and simplify an algebraic expression for the total combined area required for one of each stall type. This simplified model will be used by organizers to calculate site-wide permit fees.
                  </p>
                </div>

                <div className="bg-black/40 p-10 border-l-2 border-[#D4AF37]">
                  <h3 className="text-2xl font-black text-[#D4AF37] uppercase mb-6 tracking-wide">[ Phase 2: Revenue Thresholds - Merit ]</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    Based on the footprint established in Phase 1, the market&apos;s total weekly revenue (<i>R</i>), measured in dollars, is expected to decrease as the number of consecutive rainy weekends (<i>w</i>) increases. The organisers provide the following dynamic linear model:
                    <br/><br/>
                    <span className="text-4xl font-bold text-white block py-6 underline decoration-[#D4AF37]/40 tracking-widest text-center italic font-mono">R = 850 - (75 * w)</span>
                    <br/>
                    <strong>Dynamic Constraint:</strong> Due to current conditions, a market discount factor <i>d</i> of <b>{envFactors.discountRate}</b> applies to the required minimum revenue. 
                    <br/><br/>
                    If the organisers require a minimum revenue of <b>${(400 * parseFloat(envFactors.discountRate)).toFixed(0)}</b> (calculated as $400 * <i>d</i>) to cover costs, calculate the maximum number of rainy weekends the market can sustain. Justify your answer using an equation.
                  </p>
                </div>

                <div className="bg-black/40 p-10 border-l-2 border-[#D4AF37]">
                  <h3 className="text-2xl font-black text-[#D4AF37] uppercase mb-6 tracking-wide">[ Phase 3: Patterns & Generalisation - Excellence ]</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    To optimize the concentric layout of stalls around the central hub, Sebastian notices that vendor growth follows a pattern of consecutive odd integers. He needs to verify a core scaling rule for the expansion rings.
                    <br/><br/>
                    <strong>Task:</strong> Algebraically prove that the difference between the squares of any two consecutive positive odd integers is always a multiple of 8.
                    <br/><br/>
                    <strong>Reflection:</strong> Explicitly state the assumptions you made for this algebraic model. Given the current <b>{envFactors.rainProb}% Rain Probability</b>, discuss one real-world limitation of using this discrete model to predict physical vendor growth in the dynamic Avondale Market environment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#D4AF37]/30 pt-20">
            <h4 className="font-black uppercase text-xs tracking-[0.5em] mb-8 text-[#D4AF37]/60 text-center italic">Transmit Logic Fingerprints for Expert Audit</h4>
            <textarea 
              className="w-full bg-[#0D0D0D] border-2 border-zinc-800 p-10 text-white text-2xl font-mono min-h-[450px] outline-none focus:border-[#D4AF37] transition-all placeholder:opacity-10"
              placeholder="Structure your proof and working here (e.g., Step 1, Step 2...)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-10">
              <span className="text-[10px] font-mono opacity-30 uppercase tracking-[0.3em]">ID: AVONDALE_DYNAMIC_V3</span>
              <button type="submit" className="w-full md:w-auto bg-[#D4AF37] text-black px-24 py-6 font-black text-xl uppercase hover:bg-white hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all active:scale-95 border-none">
                {isSubmitting ? 'SEALING_LOGIC...' : 'TRANSMIT LOGIC'}
              </button>
            </div>
            {submitStatus && <div className="mt-10 bg-white text-black p-5 text-center font-black uppercase tracking-widest text-lg border-4 border-[#D4AF37]">{submitStatus}</div>}
          </form>
        </section>

        <section className="space-y-16 pb-48">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white flex items-center gap-6">
            Atomic Logic Trail
            <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF37] to-transparent opacity-20"></span>
          </h2>
          <div className="space-y-24">
            {logs.map((log) => (
              <div key={log.id} className="border border-white/5 p-12 bg-[#0a0a0a] hover:border-[#D4AF37]/20 transition-all group">
                <div className="flex justify-between font-mono text-[10px] text-[#D4AF37] opacity-40 mb-12 uppercase tracking-[0.4em]">
                  <span>Observed: {log.session_date}</span>
                  <span className="group-hover:opacity-100 transition-opacity underline underline-offset-4 tracking-tighter">Provenance_Secured</span>
                </div>
                
                <div className="space-y-8 mb-16">
                  {(log.logic_fingerprint || [log.session_summary]).map((step, idx) => (
                    <div key={idx} className="flex gap-10 items-start group/step">
                      <span className="text-[10px] font-mono text-[#D4AF37] opacity-20 group-hover/step:opacity-100 transition-opacity mt-2">UNIT_{String(idx+1).padStart(2, '0')}</span>
                      <p className="text-3xl text-zinc-100 leading-tight font-light tracking-tight">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-black p-10 border-l-4 border-[#D4AF37] text-base text-zinc-500 font-mono italic leading-relaxed">
                   <span className="text-[#D4AF37] font-black block mb-4 uppercase text-[10px] tracking-[0.2em] underline">[WOMBATBOT_ATOMIC_AUDIT]</span>
                   {log.wombatbot_evaluation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase 4: User Feedback Collection */}
        <section className="border border-[#D4AF37]/20 p-8 md:p-16 bg-black/30 mt-32">
          <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-2">
            Phase 4 – User Feedback & Monitoring
          </h2>
          <p className="text-zinc-400 text-lg mb-10 font-mono uppercase tracking-widest">
            Help us improve the learning experience. Your ratings and comments are stored securely and reviewed regularly.
          </p>
          <div className="max-w-2xl mx-auto">
            <FeedbackForm />
          </div>
          <div className="mt-12 p-6 border border-zinc-800 bg-black/40">
            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">
              Why Your Feedback Matters
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Continuous Improvement</strong>: Every rating and comment is analysed to prioritise feature development and bug fixes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Personalisation</strong>: Feedback helps us calibrate the difficulty, tone, and pacing of the adaptive learning paths.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-black">✓</span>
                <span><strong>Research Validation</strong>: Your experience contributes to the evidence base for integrating Visible Learning, Cognitive Load Theory, and Self‑Reported Grades in real‑world settings.</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-48 text-[9px] font-mono opacity-20 text-center uppercase tracking-[2.5em] pb-32">
        Sovereign // Digital Coral // 2026
      </footer>
    </div>
  );
}
