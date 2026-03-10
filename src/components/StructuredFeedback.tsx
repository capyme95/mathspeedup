'use client';

import React from 'react';

interface FeedbackItem {
  type: 'task' | 'process' | 'self_regulation';
  text: string;
  templateName?: string;
}

interface StructuredFeedbackProps {
  feedbackItems: FeedbackItem[];
  standardCode: string;
}

const StructuredFeedback: React.FC<StructuredFeedbackProps> = ({
  feedbackItems,
  standardCode,
}) => {
  const typeLabels = {
    task: 'Task Feedback',
    process: 'Process Feedback',
    self_regulation: 'Self‑Regulation Feedback',
  };

  const typeColors = {
    task: 'bg-blue-900/30 border-blue-700',
    process: 'bg-emerald-900/30 border-emerald-700',
    self_regulation: 'bg-purple-900/30 border-purple-700',
  };

  return (
    <div className="border border-[#D4AF37]/30 bg-black/40 p-8">
      <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
        Structured Feedback
      </h3>
      <p className="text-zinc-400 mb-8 text-sm font-mono uppercase tracking-widest">
        Based on Visible Learning research (Hattie d=0.70–0.79). Delivered in three categories.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {feedbackItems.map((item, idx) => (
          <div key={idx} className={`border ${typeColors[item.type]} p-6`}>
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${typeColors[item.type]}`}>
                  {typeLabels[item.type]}
                </span>
              </div>
              <p className="text-zinc-300 text-lg leading-relaxed flex-grow">{item.text}</p>
              {item.templateName && (
                <div className="mt-6 pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Template: {item.templateName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-between items-center text-xs font-mono uppercase tracking-widest text-zinc-500">
        <span>Standard: {standardCode}</span>
        <span>Visible Learning (Hattie, 2009)</span>
      </div>
    </div>
  );
};

export default StructuredFeedback;