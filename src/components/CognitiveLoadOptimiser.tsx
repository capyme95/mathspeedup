'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Eye, EyeOff, Zap, ZapOff } from 'lucide-react';

interface CognitiveLoadOptimiserProps {
  /** Current self‑reported cognitive load rating (1‑7) */
  currentLoad?: number;
  /** Callback when user changes load rating */
  onLoadChange?: (rating: number) => void;
  /** Callback when user toggles simplified view */
  onSimplifiedChange?: (simplified: boolean) => void;
  /** Whether to show the simplified‑view toggle */
  showToggle?: boolean;
}

const CognitiveLoadOptimiser: React.FC<CognitiveLoadOptimiserProps> = ({
  currentLoad = 4,
  onLoadChange,
  onSimplifiedChange,
  showToggle = true,
}) => {
  const [simplified, setSimplified] = useState(false);
  const [localLoad, setLocalLoad] = useState(currentLoad);

  useEffect(() => {
    setLocalLoad(currentLoad);
  }, [currentLoad]);

  const handleSimplifiedToggle = () => {
    const newSimplified = !simplified;
    setSimplified(newSimplified);
    if (onSimplifiedChange) {
      onSimplifiedChange(newSimplified);
    }
  };

  const handleLoadClick = (rating: number) => {
    setLocalLoad(rating);
    if (onLoadChange) {
      onLoadChange(rating);
    }
  };

  const loadLabels: Record<number, { label: string; color: string; desc: string; hex: string }> = {
    1: { label: 'Very Low', color: 'bg-emerald-500', hex: '#10B981', desc: 'Effortless – could handle more complexity.' },
    2: { label: 'Low', color: 'bg-emerald-400', hex: '#34D399', desc: 'Comfortable – smooth processing.' },
    3: { label: 'Moderately Low', color: 'bg-blue-400', hex: '#60A5FA', desc: 'Engaged – optimal learning zone.' },
    4: { label: 'Medium', color: 'bg-yellow-500', hex: '#EAB308', desc: 'Balanced – typical working load.' },
    5: { label: 'Moderately High', color: 'bg-orange-500', hex: '#F97316', desc: 'Strained – consider simplifying.' },
    6: { label: 'High', color: 'bg-red-500', hex: '#EF4444', desc: 'Heavy – reduce extraneous information.' },
    7: { label: 'Very High', color: 'bg-red-700', hex: '#B91C1C', desc: 'Overloaded – take a break.' },
  };

  const currentLoadInfo = loadLabels[localLoad] || loadLabels[4];

  return (
    <div className="border border-[#D4AF37]/30 bg-black/40 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Cognitive‑Load Optimiser
          </h3>
          <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest">
            Based on Cognitive Load Theory (Sweller, 1988). Adjust interface complexity to match your working memory.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-[#D4AF37]" />
          <span className="text-2xl font-black text-white">{localLoad}/7</span>
        </div>
      </div>

      {/* Load rating scale */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-black uppercase tracking-tight text-white">
            Self‑Reported Load Level
          </h4>
          <div className="text-sm text-zinc-400 font-mono uppercase tracking-widest">
            Click a dot to update
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
            <button
              key={rating}
              onClick={() => handleLoadClick(rating)}
              className="flex flex-col items-center gap-2 group"
              aria-label={`Set load level to ${rating}`}
            >
              <div
                style={rating === localLoad ? { backgroundColor: loadLabels[rating].hex } : undefined}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  rating === localLoad
                    ? 'ring-4 ring-white/30 scale-110'
                    : 'bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                <span className="text-white font-black text-lg">{rating}</span>
              </div>
              <div className="h-2 w-2 rounded-full bg-zinc-600"></div>
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-500 font-mono uppercase tracking-widest">
          <span>Very Low</span>
          <span>Very High</span>
        </div>
        <div className="mt-8 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div 
              className="w-4 h-4 rounded-full mt-1"
              style={{ backgroundColor: currentLoadInfo.hex }}
            />
            <div>
              <div className="text-white font-bold text-lg mb-1">{currentLoadInfo.label} Load</div>
              <p className="text-zinc-400 text-sm leading-relaxed">{currentLoadInfo.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified view toggle */}
      {showToggle && (
        <div className="border-t border-zinc-800 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h4 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                Interface Complexity
              </h4>
              <p className="text-zinc-400 text-sm">
                Reduce extraneous cognitive load by hiding decorative elements and advanced controls.
              </p>
            </div>
            <button
              onClick={handleSimplifiedToggle}
              className={`flex items-center gap-4 px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all ${
                simplified
                  ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300'
                  : 'bg-purple-900/40 border-purple-700 text-purple-300'
              } border`}
            >
              {simplified ? (
                <>
                  <EyeOff className="w-6 h-6" />
                  <span>Simplified View ON</span>
                </>
              ) : (
                <>
                  <Eye className="w-6 h-6" />
                  <span>Simplified View OFF</span>
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="border border-zinc-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
                <span className="text-white font-bold">Standard View</span>
              </div>
              <ul className="space-y-3 text-zinc-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Full design aesthetic (gradients, borders, animations)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>All advanced controls visible (charts, settings, logs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Recommended for low‑to‑medium cognitive load (1‑4)</span>
                </li>
              </ul>
            </div>
            <div className="border border-zinc-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <ZapOff className="w-6 h-6 text-rose-400" />
                <span className="text-white font-bold">Simplified View</span>
              </div>
              <ul className="space-y-3 text-zinc-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✓</span>
                  <span>Minimalist UI – only essential content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✓</span>
                  <span>Decorative elements hidden (reduces visual noise)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✓</span>
                  <span>Recommended for high cognitive load (5‑7)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Theory note */}
      <div className="mt-12 pt-8 border-t border-zinc-800">
        <h4 className="text-lg font-black uppercase tracking-tight text-white mb-4">
          Cognitive Load Theory in Practice
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-[#D4AF37] font-black text-lg">Intrinsic Load</div>
            <p className="text-zinc-400 text-sm">
              The mental effort required by the task itself. MathSpeedup breaks complex problems into step‑by‑step worked examples to manage intrinsic load.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-[#D4AF37] font-black text-lg">Extraneous Load</div>
            <p className="text-zinc-400 text-sm">
              Unnecessary mental effort caused by poor presentation. This optimiser reduces extraneous load by letting you hide decorative UI elements.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-[#D4AF37] font-black text-lg">Germane Load</div>
            <p className="text-zinc-400 text-sm">
              Mental effort devoted to building long‑term knowledge. Retrieval practice and spaced repetition increase germane load for better retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveLoadOptimiser;