'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Standard { id: string; code: string; title: string; credits: number; }
interface LearningLog { id: string; session_date: string; session_summary: string; wombatbot_evaluation: string; }

export default function Dashboard() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [answer, setAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const headers: HeadersInit = { 'apikey': key, 'Authorization': `Bearer ${key}` };
    try {
      const [stdRes, logRes] = await Promise.all([
        fetch(`${url}/rest/v1/standards?select=*`, { headers }),
        fetch(`${url}/rest/v1/learning_logs?select=*&order=session_date.desc&limit=5`, { headers })
      ]);
      const stdData = await stdRes.json();
      const logData = await logRes.json();
      setStandards(Array.isArray(stdData) ? stdData : []);
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
        headers: { 'apikey': key!, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_date: new Date().toISOString().split('T')[0],
          session_summary: `[SUBMITTED_ANSWER]: ${answer}`,
          wombatbot_evaluation: 'Awaiting review.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: DATA RECORDED'); setAnswer(''); fetchData(); }
      else { throw new Error('FAIL'); }
    } catch (err) { setSubmitStatus('ERROR'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">LOADING_METABOLISM...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-end border-b border-white/20 pb-4">
        <h1 className="text-3xl font-bold tracking-tighter uppercase">MathSpeedup Dashboard</h1>
        <span className="text-[10px] font-mono border border-white/50 px-2 py-1">LIVE_SYNC</span>
      </header>

      <main className="max-w-5xl mx-auto space-y-16">
        <section className="border-2 border-white p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6 uppercase tracking-widest underline">Current Mission: Baseline 01</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <span className="text-xs font-bold block mb-2">[Q1: ACHIEVED]</span>
              <p className="text-sm leading-relaxed">Sebastian uses two packs. Pack A takes $x$ hours. Pack B takes 2 hours more than 3 times Pack A. Write a simplified expression for the total time.</p>
            </div>
            <div>
              <span className="text-xs font-bold block mb-2">[Q2: MERIT]</span>
              <p className="text-sm leading-relaxed">Efficiency follows $E = 100 - 4d$. If min efficiency is $60\%$, what is max $d$? Prove your answer.</p>
            </div>
            <div>
              <span className="text-xs font-bold block mb-2">[Q3: EXCELLENCE]</span>
              <p className="text-sm leading-relaxed">Prove that the difference between the squares of any two consecutive positive odd numbers is always a multiple of 8.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/20 pt-8">
            <textarea 
              className="w-full bg-black border border-white/50 p-4 text-white text-sm font-mono min-h-[120px] outline-none focus:border-white"
              placeholder="ENTER LOGIC SOLUTIONS HERE..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] font-mono opacity-50 uppercase">ID: AS91945_B01</span>
              <button type="submit" className="bg-white text-black px-8 py-2 font-black text-xs uppercase hover:bg-white/90">
                {isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT ANSWER'}
              </button>
            </div>
            {submitStatus && <div className="mt-4 bg-white text-black p-2 text-center text-xs font-bold">{submitStatus}</div>}
          </form>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {standards.map(std => (
            <div key={std.id} className="border border-white/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold">{std.code}</span>
                <span className="text-[10px] opacity-50">CREDITS: {std.credits}</span>
              </div>
              <h3 className="text-lg font-medium">{std.title}</h3>
            </div>
          ))}
        </div>

        <section className="border-t border-white/20 pt-8">
          <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">Logic Audit Logs</h2>
          <div className="space-y-6">
            {logs.map(log => (
              <div key={log.id} className="border-l-2 border-white pl-4">
                <p className="text-[10px] opacity-50 mb-1">{log.session_date}</p>
                <p className="text-sm italic mb-2">"{log.session_summary}"</p>
                <div className="text-xs font-mono opacity-80 bg-white/5 p-2">{log.wombatbot_evaluation}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-24 text-[9px] font-mono opacity-30 text-center uppercase tracking-[0.5em] pb-12">
        Sovereign Governance | Gen 23.5 | 100% Monochrome
      </footer>
    </div>
  );
}
