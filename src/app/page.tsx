'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Standard {
  id: string;
  code: string;
  title: string;
  credits: number;
}

interface LearningLog {
  id: string;
  session_date: string;
  session_summary: string;
  wombatbot_evaluation: string;
}

export default function Dashboard() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setError('System configuration error: Missing API keys.');
      setLoading(false);
      return;
    }

    const headers: HeadersInit = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const [stdRes, logRes] = await Promise.all([
        fetch(`${url}/rest/v1/standards?select=*`, { headers }),
        fetch(`${url}/rest/v1/learning_logs?select=*&order=session_date.desc&limit=5`, { headers })
      ]);
      
      if (!stdRes.ok || !logRes.ok) throw new Error('Upstream API link failure');

      const stdData = await stdRes.json();
      const logData = await logRes.json();
      
      setStandards(Array.isArray(stdData) ? (stdData as Standard[]) : []);
      setLogs(Array.isArray(logData) ? (logData as LearningLog[]) : []);
      setError(null);
    } catch (err: any) {
      setError(`Metabolic Link Failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      const res = await fetch(`${url}/rest/v1/learning_logs`, {
        method: 'POST',
        headers: {
          'apikey': key!,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          session_date: new Date().toISOString().split('T')[0],
          session_summary: `[SUBMITTED_ANSWER]: ${answer}`,
          wombatbot_evaluation: 'Awaiting offline review by Boss and WombatBot.'
        })
      });

      if (res.ok) {
        setSubmitStatus('Success! Answer recorded in the metabolic pump.');
        setAnswer('');
        fetchData();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err: any) {
      setSubmitStatus(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-slate-950 text-blue-500 flex items-center justify-center font-mono animate-pulse uppercase tracking-[0.3em]">Loading_Metabolism...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <header className="max-w-5xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">MathSpeedup <span className="text-blue-500">Dashboard</span></h1>
          <p className="text-slate-400 font-medium">Sebastian&apos;s NCEA Acceleration | High-Trust 2026</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] uppercase tracking-widest">Live_Metabolism_Active</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-12">
        {/* Mission Details */}
        <section className="bg-blue-600/5 border border-blue-500/20 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl select-none uppercase pointer-events-none group-hover:opacity-10 transition-opacity">AS 91945</div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-400">
              <span className="bg-blue-500 w-2 h-6 rounded-full"></span>
              Current Mission: Baseline Challenge 01
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { title: 'Q1: Achieved', color: 'text-blue-400', content: 'Resource Allocation: Sebastian uses two packs. Pack A takes $x$ hours. Pack B takes 2 hours more than 3 times Pack A. Write a simplified expression for the total time.' },
                { title: 'Q2: Merit', color: 'text-emerald-400', content: 'Efficiency Decay: Efficiency follows $E = 100 - 4d$, where $d$ is consecutive days. If the minimum required efficiency is $60\\%$, what is the maximum value for $d$? Prove your answer.' },
                { title: 'Q3: Excellence', color: 'text-amber-400', content: 'Logical Proof: Using algebraic methods, prove that the difference between the squares of any two consecutive positive odd numbers is always a multiple of 8.' }
              ].map((q, idx) => (
                <div key={idx} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
                  <span className={`text-xs font-mono ${q.color} mb-2 block uppercase tracking-wider font-semibold`}>{q.title}</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{q.content}</p>
                </div>
              ))}
            </div>

            {/* Answer Input Area */}
            <div className="border-t border-slate-800 pt-8 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-widest">Submit Your Solutions</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all min-h-[150px] font-mono"
                  placeholder="Paste your working and final answers here... (Markdown supported)"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-600 font-mono uppercase">Identifier: as91945_baseline_01</span>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !answer.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  >
                    {isSubmitting ? 'PROCESSING...' : 'TRANSMIT ANSWER'}
                  </button>
                </div>
                {submitStatus && (
                  <p className={`text-xs font-mono ${submitStatus.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'} animate-pulse`}>
                    {submitStatus}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Audit Logs */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
            Metabolic Log & Logic Audit
          </h2>
          <div className="space-y-8">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic text-sm font-mono">[ WAITING_FOR_DATA_METABOLISM ]</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l border-slate-800 pb-2">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">{log.session_date}</p>
                  <div className="bg-slate-950/30 p-4 rounded-lg border border-slate-800/50">
                    <p className="text-slate-200 leading-relaxed italic mb-4 text-sm whitespace-pre-wrap">&quot;{log.session_summary}&quot;</p>
                    <div className="text-xs text-blue-400 font-mono bg-blue-500/5 p-3 rounded border border-blue-500/10 whitespace-pre-wrap leading-relaxed">
                      {log.wombatbot_evaluation}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-20 text-center text-slate-600 text-[10px] font-mono border-t border-slate-900 pt-8 pb-8 uppercase tracking-[0.2em]">
        Built with Sovereign Identity & Metabolic Negentropy | Gen 23.5
      </footer>
    </div>
  );
}
