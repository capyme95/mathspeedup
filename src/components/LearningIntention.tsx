'use client';

import React from 'react';

interface LearningIntentionProps {
  intention: string;
  successCriteria: string[];
  timssDomain: 'Knowing' | 'Applying' | 'Reasoning';
}

const LearningIntention: React.FC<LearningIntentionProps> = ({
  intention,
  successCriteria,
  timssDomain,
}) => {
  const domainColors = {
    Knowing: 'bg-blue-900/30 border-blue-700',
    Applying: 'bg-emerald-900/30 border-emerald-700',
    Reasoning: 'bg-purple-900/30 border-purple-700',
  };

  return (
    <div className="border border-[#D4AF37]/30 bg-black/40 p-8 mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-2xl font-black uppercase tracking-tight text-white">
          Learning Intention
        </h3>
        <div className={`px-4 py-2 rounded-full border ${domainColors[timssDomain]} font-mono text-xs uppercase tracking-widest`}>
          TIMSS: {timssDomain}
        </div>
      </div>
      <p className="text-xl text-zinc-300 mb-8 leading-relaxed">{intention}</p>
      <div>
        <h4 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] mb-4">
          Success Criteria
        </h4>
        <ul className="space-y-3">
          {successCriteria.map((criterion, idx) => (
            <li key={idx} className="flex items-start gap-4">
              <span className="text-[#D4AF37] text-2xl font-black mt-1">✓</span>
              <span className="text-zinc-400 text-lg">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LearningIntention;