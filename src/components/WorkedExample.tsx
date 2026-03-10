'use client';

import React, { useState } from 'react';

interface WorkedExampleProps {
  title: string;
  content: string; // Step‑by‑step solution
  difficulty: number; // 1‑5
  fadeStage: 'full' | 'partial' | 'none';
  standardCode: string;
}

const WorkedExample: React.FC<WorkedExampleProps> = ({
  title,
  content,
  difficulty,
  fadeStage,
  standardCode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fadeLabels = {
    full: 'Full Guidance',
    partial: 'Partial Guidance',
    none: 'Independent',
  };

  const difficultyColors = [
    'bg-green-900/30 text-green-300',
    'bg-blue-900/30 text-blue-300',
    'bg-yellow-900/30 text-yellow-300',
    'bg-orange-900/30 text-orange-300',
    'bg-red-900/30 text-red-300',
  ];

  return (
    <div className="border border-zinc-800 bg-[#0a0a0a] p-6 mb-6 hover:border-[#D4AF37]/30 transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h4 className="text-xl font-black text-white uppercase tracking-tight">{title}</h4>
          <p className="text-xs font-mono text-[#D4AF37] mt-1 uppercase tracking-widest">
            {standardCode} • {fadeLabels[fadeStage]}
          </p>
        </div>
        <div className="flex gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${difficultyColors[difficulty - 1]}`}>
            Difficulty {difficulty}/5
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-1 bg-[#D4AF37] text-black text-sm font-black uppercase tracking-wider hover:bg-white transition-all"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-zinc-300 text-sm leading-relaxed p-4 bg-black/50 rounded-lg">
              {content}
            </pre>
          </div>
          <div className="mt-6 flex justify-between items-center text-xs font-mono uppercase tracking-widest text-zinc-500">
            <span>Based on Cognitive Load Theory – Worked Example Effect</span>
            <span>Click to copy steps</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkedExample;