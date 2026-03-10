// AdaptivePathRecommender.tsx
// Phase 3: Adaptive Learning Paths – recommends next task based on learning history.
'use client';

import { LearningLog } from '@/types';
import { Brain, TrendingUp, Target } from 'lucide-react';

interface AdaptivePathRecommenderProps {
  /** Recent learning logs for analysis (optional). */
  logs?: LearningLog[];
  /** Current standard focus (optional). */
  currentStandard?: string;
}

export default function AdaptivePathRecommender({
  logs = [],
  currentStandard = 'AS91945',
}: AdaptivePathRecommenderProps) {
  // Simple rule‑based recommendation (placeholder for future ML/decision tree).
  const recommendNextTask = (): {
    domain: 'Knowing' | 'Applying' | 'Reasoning';
    difficulty: 'Achieved' | 'Merit' | 'Excellence';
    reason: string;
    confidence: number;
  } => {
    // If we have logs, analyse the weakest TIMSS domain.
    if (logs.length > 0) {
      const domainCounts = { Knowing: 0, Applying: 0, Reasoning: 0 };
      logs.forEach(log => {
        if (log.timss_domain && domainCounts.hasOwnProperty(log.timss_domain)) {
          domainCounts[log.timss_domain] += 1;
        }
      });
      // Find the least‑practiced domain.
      const weakestDomain = Object.entries(domainCounts).reduce(
        (a, b) => (a[1] < b[1] ? a : b)
      )[0] as 'Knowing' | 'Applying' | 'Reasoning';

      // Difficulty based on prediction accuracy (if available).
      const validAccuracies = logs.map(log => log.prediction_accuracy).filter((acc): acc is number => typeof acc === 'number' && !isNaN(acc));
      const avgAccuracy = validAccuracies.length > 0 ? validAccuracies.reduce((sum, acc) => sum + acc, 0) / validAccuracies.length : 0;
      let difficulty: 'Achieved' | 'Merit' | 'Excellence' = 'Achieved';
      if (avgAccuracy > 0.8) difficulty = 'Excellence';
      else if (avgAccuracy > 0.6) difficulty = 'Merit';

      return {
        domain: weakestDomain,
        difficulty,
        reason: `Your practice history shows less focus on ${weakestDomain}. Strengthening this area will improve overall balance.`,
        confidence: 75,
      };
    }

    // Fallback: recommend Applying domain at Achieved level for beginners.
    return {
      domain: 'Applying',
      difficulty: 'Achieved',
      reason: 'New learner detected. Start with Applying‑domain problems to connect concepts to real‑world scenarios.',
      confidence: 65,
    };
  };

  const recommendation = recommendNextTask();

  // Colour mapping for domains (matching MasteryChart).
  const domainColor: Record<'Knowing' | 'Applying' | 'Reasoning', string> = {
    Knowing: 'text-cyan-400',
    Applying: 'text-emerald-400',
    Reasoning: 'text-purple-400',
  };
  const difficultyColor: Record<'Achieved' | 'Merit' | 'Excellence', string> = {
    Achieved: 'text-green-400',
    Merit: 'text-yellow-400',
    Excellence: 'text-red-400',
  };

  return (
    <div className="border border-gold/30 bg-black/50 p-6 rounded-xl backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-gold" />
        <h3 className="text-xl font-mono uppercase tracking-widest text-white">
          Adaptive Learning Path
        </h3>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span>Real‑time recommendation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recommended Domain */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h4 className="font-semibold text-white">Target Domain</h4>
          </div>
          <p className={`text-2xl font-bold ${domainColor[recommendation.domain]}`}>
            {recommendation.domain}
          </p>
          <p className="text-sm text-gray-400 mt-1">TIMSS Cognitive Domain</p>
        </div>

        {/* Recommended Difficulty */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full border-2 border-yellow-500"></div>
            <h4 className="font-semibold text-white">Suggested Difficulty</h4>
          </div>
          <p className={`text-2xl font-bold ${difficultyColor[recommendation.difficulty]}`}>
            {recommendation.difficulty}
          </p>
          <p className="text-sm text-gray-400 mt-1">NCEA Level 1</p>
        </div>

        {/* Confidence & Reason */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <h4 className="font-semibold text-white">Confidence</h4>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">{recommendation.confidence}%</span>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: `${recommendation.confidence}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">{recommendation.reason}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          <strong>How it works:</strong> This recommendation is based on your recent practice logs (
          {logs.length} sessions). It uses a simple rule‑based engine to identify your weakest cognitive
          domain and suggests an appropriate difficulty level. Future versions will incorporate spaced
          repetition and Bayesian knowledge tracing.
        </p>
        <button className="mt-4 px-4 py-2 bg-gold/20 text-gold font-mono uppercase tracking-widest rounded-lg hover:bg-gold/30 transition">
          Start Recommended Task
        </button>
      </div>
    </div>
  );
}