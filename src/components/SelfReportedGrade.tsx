'use client';

import React, { useState } from 'react';

interface SelfReportedGradeProps {
  onGradeSubmit: (grade: string, confidence: number) => void;
  initialGrade?: string;
  initialConfidence?: number;
}

const SelfReportedGrade: React.FC<SelfReportedGradeProps> = ({
  onGradeSubmit,
  initialGrade = '',
  initialConfidence = 70,
}) => {
  const [grade, setGrade] = useState(initialGrade);
  const [confidence, setConfidence] = useState(initialConfidence);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGradeSubmit(grade, confidence);
    setSubmitted(true);
  };

  const grades = ['N', 'A', 'M', 'E']; // Not Achieved, Achieved, Merit, Excellence

  return (
    <div className="border border-[#D4AF37]/50 bg-black/60 p-8">
      <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
        Self‑Reported Grade
      </h3>
      <p className="text-zinc-400 mb-6 text-sm font-mono uppercase tracking-widest">
        Hattie Effect Size d=1.33 – Predict your performance before receiving feedback.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-mono uppercase tracking-widest text-[#D4AF37] mb-3">
            Select your predicted grade
          </label>
          <div className="flex flex-wrap gap-4">
            {grades.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`px-6 py-3 text-lg font-black uppercase tracking-wider border-2 ${
                  grade === g
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-[#D4AF37]'
                }`}
              >
                {g === 'N' && 'Not Achieved'}
                {g === 'A' && 'Achieved'}
                {g === 'M' && 'Merit'}
                {g === 'E' && 'Excellence'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-mono uppercase tracking-widest text-[#D4AF37] mb-3">
            Confidence: {confidence}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={confidence}
            onChange={(e) => setConfidence(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4AF37]"
          />
          <div className="flex justify-between text-xs font-mono text-zinc-500 mt-2">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            {submitted ? (
              <span className="text-emerald-400">Prediction recorded for calibration.</span>
            ) : (
              <span>Submit to track prediction accuracy over time.</span>
            )}
          </div>
          <button
            type="submit"
            disabled={!grade}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-wider hover:bg-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Lock Prediction
          </button>
        </div>
      </form>
    </div>
  );
};

export default SelfReportedGrade;