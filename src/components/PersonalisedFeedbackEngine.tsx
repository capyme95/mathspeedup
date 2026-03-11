'use client';

import React, { useMemo } from 'react';
import { WorkedExample } from '@/types';

interface FeedbackTemplate {
  id: string;
  standard_id: string;
  template_name: string;
  template_en: string;
  feedback_type: 'task' | 'process' | 'self_regulation';
}

interface LearningLog {
  id: string;
  session_date: string;
  session_summary: string;
  wombatbot_evaluation: string;
  logic_fingerprint: string[];
  self_reported_grade?: string;
  prediction_accuracy?: number;
  cognitive_load_rating?: number;
  learning_intention?: string;
  success_criteria?: string[];
  timss_domain?: string;
}

interface PersonalisedFeedbackEngineProps {
  logs: LearningLog[];
  workedExamples: WorkedExample[];
  feedbackTemplates: FeedbackTemplate[];
  currentStandard?: string; // e.g., 'AS91945'
}

/**
 * Phase 3 Personalised Feedback Engine
 * 
 * Uses real data (learning logs, worked examples, feedback templates) to generate
 * adaptive feedback that responds to the student's current performance patterns.
 * 
 * Evidence base:
 * - John Hattie: Feedback effect size d = 0.70–0.79 (Visible Learning)
 * - Cognitive Load Theory: Feedback should reduce extraneous load
 * - TIMSS: Feedback should target specific cognitive domains (Knowing, Applying, Reasoning)
 */
const PersonalisedFeedbackEngine: React.FC<PersonalisedFeedbackEngineProps> = ({
  logs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workedExamples,
  feedbackTemplates,
  currentStandard = 'AS91945'
}) => {
  // 1. Analyse recent performance
  const recentLogs = useMemo(() => 
    logs.slice(0, 3).sort((a, b) => 
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    ), [logs]
  );

  const latestLog = recentLogs[0];

  // 2. Identify weak domain based on TIMSS domain distribution
  const domainCounts = useMemo(() => {
    const counts = { Knowing: 0, Applying: 0, Reasoning: 0 };
    logs.forEach(log => {
      if (log.timss_domain && counts.hasOwnProperty(log.timss_domain)) {
        counts[log.timss_domain as keyof typeof counts]++;
      }
    });
    return counts;
  }, [logs]);

  const weakDomain = useMemo(() => {
    const entries = Object.entries(domainCounts);
    if (entries.length === 0) return 'Applying';
    return entries.reduce((min, curr) => curr[1] < min[1] ? curr : min, entries[0])[0];
  }, [domainCounts]);

  // 3. Filter feedback templates for current standard and weak domain
  const relevantTemplates = useMemo(() => {
    return feedbackTemplates.filter(t => 
      t.standard_id === currentStandard && 
      (t.template_name.toLowerCase().includes(weakDomain.toLowerCase()) || 
       t.feedback_type === 'task')
    );
  }, [feedbackTemplates, currentStandard, weakDomain]);

  // 4. Personalise feedback based on recent performance patterns
  const personalisedMessages = useMemo(() => {
    if (!latestLog) return [];

    const messages = [];

    // Task feedback based on self‑reported grade
    if (latestLog.self_reported_grade) {
      const grade = latestLog.self_reported_grade;
      const gradeMap: Record<string, string> = {
        'E': 'excellent insight',
        'M': 'solid understanding',
        'A': 'basic grasp',
        'N': 'need for revision'
      };
      messages.push({
        type: 'task' as const,
        text: `Your self‑reported grade (${grade}) indicates ${gradeMap[grade] || 'progress'}. Focus on ${weakDomain} tasks to strengthen this domain.`
      });
    }

    // Process feedback based on prediction accuracy
    if (latestLog.prediction_accuracy !== undefined) {
      const acc = latestLog.prediction_accuracy;
      let advice = '';
      if (acc < 0.5) advice = 'Try to reflect more before submitting – calibration improves with practice.';
      else if (acc < 0.8) advice = 'Your confidence is aligning with performance. Keep practicing!';
      else advice = 'Great calibration – you know what you know.';
      messages.push({
        type: 'process' as const,
        text: `Prediction accuracy: ${(acc * 100).toFixed(0)}%. ${advice}`
      });
    }

    // Self‑regulation feedback based on cognitive load
    if (latestLog.cognitive_load_rating !== undefined) {
      const load = latestLog.cognitive_load_rating;
      let tip = '';
      if (load >= 5) tip = 'Consider taking a short break or switching to an easier task.';
      else if (load <= 2) tip = 'You have cognitive capacity to tackle a more challenging problem.';
      else tip = 'Load is manageable – maintain this pace.';
      messages.push({
        type: 'self_regulation' as const,
        text: `Cognitive load rating: ${load}/7. ${tip}`
      });
    }

    // Add a relevant template‑based feedback if available
    if (relevantTemplates.length > 0) {
      const template = relevantTemplates[0]; // Use first template instead of random
      messages.push({
        type: template.feedback_type,
        text: template.template_en.replace(/{.*?}/g, (match) => {
          if (match.includes('domain')) return weakDomain;
          if (match.includes('accuracy') && latestLog.prediction_accuracy !== undefined) 
            return `${(latestLog.prediction_accuracy * 100).toFixed(0)}%`;
          return match;
        })
      });
    }

    return messages.slice(0, 3); // Limit to 3 messages
  }, [latestLog, relevantTemplates, weakDomain]);

  // If no data yet, show placeholder
  if (logs.length === 0 && feedbackTemplates.length === 0) {
    return (
      <div className="border border-[#D4AF37]/30 p-8 bg-[#0a0a0a]">
        <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">
          Personalised Feedback Engine
        </h3>
        <p className="text-gray-600 mb-6 text-sm font-mono uppercase tracking-widest">
          Waiting for learning data. Complete a task to receive adaptive feedback.
        </p>
        <div className="space-y-4 text-zinc-500">
          <p>This engine will analyse your performance patterns (self‑reported grades, prediction accuracy, cognitive load) and generate feedback tailored to your current needs.</p>
          <p className="text-xs font-mono opacity-60">Evidence: Hattie’s feedback (d = 0.79), TIMSS domain targeting, cognitive‑load‑aware advice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#D4AF37]/30 p-8 bg-[#0a0a0a]">
      <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">
        Personalised Feedback Engine
      </h3>
      <p className="text-gray-600 mb-6 text-sm font-mono uppercase tracking-widest">
        Adaptive feedback based on your recent performance in {weakDomain}.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {personalisedMessages.map((msg, idx) => (
          <div key={idx} className={`border ${msg.type === 'task' ? 'border-emerald-500/40' : msg.type === 'process' ? 'border-blue-500/40' : 'border-purple-500/40'} p-6 bg-white rounded-xl shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-mono uppercase tracking-widest px-3 py-1 ${msg.type === 'task' ? 'bg-emerald-900/60 text-emerald-300' : msg.type === 'process' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}`}>
                {msg.type.replace('_', ' ')}
              </span>
              <span className="text-xs opacity-50 font-mono">
                {idx === 0 ? 'Highest priority' : 'Additional insight'}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Performance Snapshot</h4>
          <ul className="space-y-2 text-gray-600">
            <li className="flex justify-between">
              <span>Recent logs</span>
              <span className="text-gray-900">{logs.length}</span>
            </li>
            <li className="flex justify-between">
              <span>Weakest TIMSS domain</span>
              <span className="text-gray-900">{weakDomain}</span>
            </li>
            <li className="flex justify-between">
              <span>Available templates</span>
              <span className="text-gray-900">{feedbackTemplates.length}</span>
            </li>
            {latestLog?.self_reported_grade && (
              <li className="flex justify-between">
                <span>Latest self‑grade</span>
                <span className="text-gray-900">{latestLog.self_reported_grade}</span>
              </li>
            )}
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Feedback Logic</h4>
          <p className="text-gray-600 text-sm">
            This engine combines <strong>self‑reported data</strong> (grades, confidence, load) with <strong>template‑based advice</strong> to deliver feedback that adapts to your current learning state. It prioritises the domain where you have the least practice ({weakDomain}).
          </p>
          <p className="text-xs font-mono opacity-60 mt-4">
            Evidence‑based principles: Hattie’s feedback, cognitive load theory, TIMSS domain targeting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalisedFeedbackEngine;