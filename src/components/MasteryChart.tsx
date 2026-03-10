'use client';

import React from 'react';

interface DomainData {
  domain: 'Knowing' | 'Applying' | 'Reasoning';
  score: number; // 0‑100
  trend: 'up' | 'down' | 'stable';
}

interface MasteryChartProps {
  domains: DomainData[];
  studentName?: string;
}

const MasteryChart: React.FC<MasteryChartProps> = ({
  domains,
  studentName = 'Sebastian',
}) => {
  const domainColors = {
    Knowing: '#3B82F6', // blue
    Applying: '#10B981', // emerald
    Reasoning: '#8B5CF6', // violet
  };

  const maxScore = 100;

  return (
    <div className="border border-[#D4AF37]/30 bg-black/40 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Mastery Dashboard
          </h3>
          <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest">
            TIMSS Cognitive Domains – Progress over last 30 days
          </p>
        </div>
        <div className="px-4 py-2 bg-[#D4AF37] text-black text-sm font-black uppercase tracking-wider">
          {studentName}
        </div>
      </div>

      <div className="space-y-10">
        {domains.map((domain) => {
          const widthPercent = domain.score;
          return (
            <div key={domain.domain} className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: domainColors[domain.domain] }}
                  />
                  <span className="text-xl font-black text-white uppercase tracking-tight">
                    {domain.domain}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white">{domain.score}%</span>
                  <span className="text-xs font-mono text-zinc-500 ml-4 uppercase tracking-widest">
                    {domain.trend === 'up' && '↗ TRENDING UP'}
                    {domain.trend === 'down' && '↘ TRENDING DOWN'}
                    {domain.trend === 'stable' && '→ STABLE'}
                  </span>
                </div>
              </div>
              <div className="h-6 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: domainColors[domain.domain],
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase tracking-widest">
                <span>Baseline: 0%</span>
                <span>Target: 80%</span>
                <span>Mastery: 100%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-800">
        <h4 className="text-lg font-black uppercase tracking-tight text-white mb-4">
          Interpretation
        </h4>
        <ul className="space-y-3 text-zinc-400 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-black">✓</span>
            <span>
              <strong>Knowing</strong> (recall facts, procedures) – Foundational for all problem‑solving.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-black">✓</span>
            <span>
              <strong>Applying</strong> (use concepts in routine situations) – Core of NCEA Achieved/Merit tasks.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-black">✓</span>
            <span>
              <strong>Reasoning</strong> (non‑routine problems, justification) – Required for Excellence‑level proofs.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MasteryChart;