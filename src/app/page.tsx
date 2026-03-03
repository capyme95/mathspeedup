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
          session_summary: `[SUBMISSION]: ${answer}`,
          wombatbot_evaluation: 'Awaiting expert audit against NCEA 2026 criteria.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: EVIDENCE RECEIVED'); setAnswer(''); fetchData(); }
      else { throw new Error('FAIL'); }
    } catch (err) { setSubmitStatus('ERROR: CONNECTION LOST'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">ESTABLISHING_DATA_FEED...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans selection:bg-white selection:text-black">
      <header className="max-w-5xl mx-auto mb-20 flex justify-between items-start border-b border-white pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">MathSpeedup // 1.2</h1>
          <p className="text-xs font-mono mt-2 tracking-widest opacity-40 uppercase">NCEA Level 1 / Avondale Sunday Market / 2026</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-3 h-3 bg-white animate-pulse rounded-full"></div>
          <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Metabolic_Sync_Live</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-32">
        <section className="border-4 border-white p-8 md:p-16 relative">
          <div className="absolute -top-4 left-8 bg-black border border-white px-4 py-1 font-black uppercase text-sm tracking-widest">Internal Assessment 91945 V3</div>
          
          <div className="space-y-16 mb-20">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Mission: Avondale Sunday Market Optimisation</h2>
              <p className="text-lg leading-relaxed text-zinc-400 italic">
                &quot;Sebastian is assisting organizers at the Avondale Sunday Market to model stall layouts and financial growth. He must apply mathematical methods to ensure the community project is sustainable under 2026 NCEA standards.&quot;
              </p>
            </div>

            <div className="grid grid-cols-1 gap-16">
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase border-b border-white/20 pb-2">[ Phase 1: Spatial Allocation - Achieved ]</h3>
                <p className="text-zinc-300 leading-relaxed">
                  The market has two types of stall configurations. Type A requires <i>s</i> square metres. Type B requires 5 square metres more than twice the space of Type A.
                  <br/><br/>
                  <strong>Task:</strong> Provide a simplified algebraic expression for the combined spatial requirement of one Type A and one Type B stall.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase border-b border-white/20 pb-2">[ Phase 2: Revenue Prediction - Merit ]</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Weekly revenue (<i>R</i>) in dollars decays based on consecutive rainy weekends (<i>w</i>) according to the model:
                  <br/><br/>
                  <span className="text-3xl font-bold text-white block py-4">R = 850 - 75w</span>
                  <br/>
                  If the market needs at least $400 to cover costs, determine the maximum number of rainy weekends it can sustain. Show your equation and justify your conclusion.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase border-b border-white/20 pb-2">[ Phase 3: Generalisation & Reflection - Excellence ]</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Sebastian notes that vendor growth between consecutive odd integers follows a predictable pattern.
                  <br/><br/>
                  <strong>Task:</strong> Algebraically prove that the difference between the squares of any two consecutive positive odd integers is always a multiple of 8.
                  <br/><br/>
                  <strong>Reflection:</strong> State your assumptions. Discuss how this discrete model simplifies real-world market dynamics and suggest one modification to improve its predictive accuracy.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white pt-16">
            <h4 className="font-black uppercase text-xs tracking-[0.4em] mb-6 opacity-60 text-center">Submit Evidence for Expert Audit</h4>
            <textarea 
              className="w-full bg-black border-2 border-white/20 p-8 text-white text-xl font-mono min-h-[400px] outline-none focus:border-white transition-all"
              placeholder="Detail your proofs and reflections here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mt-10 gap-8">
              <span className="text-[10px] font-mono opacity-30 uppercase tracking-[0.2em]">Reference: AVONDALE_MKT_2026</span>
              <button type="submit" className="w-full md:w-auto bg-white text-black px-20 py-4 font-black text-lg uppercase hover:invert transition-all">
                {isSubmitting ? 'UPLOADING...' : 'TRANSMIT EVIDENCE'}
              </button>
            </div>
            {submitStatus && <div className="mt-8 bg-white text-black p-4 text-center font-bold uppercase text-sm tracking-widest">{submitStatus}</div>}
          </form>
        </section>

        <section className="space-y-16">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic border-l-8 border-white pl-6">Logic Audit Trail</h2>
          <div className="space-y-12">
            {logs.map(log => (
              <div key={log.id} className="border border-white/10 p-10 group">
                <p className="text-lg italic mb-6 text-zinc-300 border-l-2 border-white/20 pl-6">&quot;{log.session_summary}&quot;</p>
                <div className="bg-zinc-900/30 p-6 border border-white/10 text-sm text-zinc-400 font-mono">
                   [WombatBot_Audit]: {log.wombatbot_evaluation}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-48 text-[9px] font-mono opacity-20 text-center uppercase tracking-[2.5em] pb-32">
        Sovereignty // Digital Coral // 2026
      </footer>
    </div>
  );
}
