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
          wombatbot_evaluation: 'Pending audit for NCEA 2026 alignment.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: TRANSMISSION COMPLETE'); setAnswer(''); fetchData(); }
      else { throw new Error('FAIL'); }
    } catch (err) { setSubmitStatus('ERROR: CONNECTION LOST'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">ESTABLISHING_LINK...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-end border-b border-white pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">MathSpeedup 1.2</h1>
          <p className="text-xs opacity-50 font-mono mt-1">Auckland Acceleration Lab | NCEA AS91945 V3</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-mono border border-white px-2 py-0.5">READY_FOR_METABOLISM</span>
          <span className="text-[9px] font-mono opacity-40">GEN 23.5 SVRN</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-20">
        {/* Unified Project: The Auckland Lab Setup */}
        <section className="border-4 border-white p-6 md:p-10 relative">
          <div className="absolute -top-4 left-6 bg-black px-4 font-black uppercase tracking-widest text-lg">Mission: Lab Infrastructure</div>
          
          <div className="mb-12 space-y-10">
            <div className="space-y-4">
              <h3 className="font-bold border-b border-white/20 pb-2">[PART 1: Resource Deployment - Achieved]</h3>
              <p className="text-base leading-relaxed">
                Sebastian is setting up two server modules. Module A requires <i>t</i> hours to synchronise. Module B requires 2 hours more than 3 times the sync time of Module A. 
                <br/><br/>
                <b>Task:</b> Write a simplified algebraic expression for the total synchronisation time for both modules combined.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b border-white/20 pb-2">[PART 2: Efficiency Maintenance - Merit]</h3>
              <p className="text-base leading-relaxed">
                Using the total time from Part 1, the lab efficiency (<i>E</i>) decays based on the number of consecutive operational days (<i>d</i>) according to the linear model: 
                <br/><br/>
                <b>E = 100 - 4d</b>
                <br/><br/>
                If the lab must maintain an efficiency of at least 60% to prevent logic collapse, calculate the maximum number of consecutive days the lab can run. Justify your answer using an equation.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b border-white/20 pb-2">[PART 3: Generalisation & Limitations - Excellence]</h3>
              <p className="text-base leading-relaxed">
                To prove the stability of the lab&apos;s cooling system, Sebastian notes that the temperature difference follows a specific pattern related to square numbers.
                <br/><br/>
                <b>Task:</b> Prove algebraically that the difference between the squares of any two consecutive positive odd numbers is always a multiple of 8.
                <br/><br/>
                <b>Reflection (Required for Excellence):</b> Stating the assumptions you made for your proof, discuss one limitation of using a discrete algebraic model like this to predict real-world cooling fluctuations.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t-2 border-white pt-10">
            <label className="block font-black uppercase mb-4 text-sm tracking-widest">Transmit Solutions (NCEA Evidence)</label>
            <textarea 
              className="w-full bg-black border-2 border-white/30 p-6 text-white text-lg font-mono min-h-[250px] outline-none focus:border-white transition-colors"
              placeholder="Start typing your proof and working here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center mt-6">
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Ref: Auckland_Lab_Baseline_01</span>
              <button type="submit" className="bg-white text-black px-12 py-3 font-black text-sm uppercase hover:invert transition-all active:scale-95 shadow-lg">
                {isSubmitting ? 'UPLOADING...' : 'TRANSMIT EVIDENCE'}
              </button>
            </div>
            {submitStatus && <div className="mt-6 bg-white text-black p-3 text-center text-sm font-black uppercase tracking-widest">{submitStatus}</div>}
          </form>
        </section>

        {/* Metabolic Audit Log */}
        <section>
          <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter italic border-l-8 border-white pl-4">Metabolic Logic Trace</h2>
          <div className="space-y-10">
            {logs.map(log => (
              <div key={log.id} className="border border-white/10 p-6 hover:border-white/40 transition-colors">
                <div className="flex justify-between text-[10px] font-mono opacity-40 mb-4 uppercase tracking-widest">
                  <span>Timestamp: {log.session_date}</span>
                  <span>Verified: High-Trust 2026</span>
                </div>
                <p className="text-sm italic mb-6 leading-relaxed opacity-90">&quot;{log.session_summary}&quot;</p>
                <div className="text-xs font-mono bg-white/5 p-4 border border-white/20 leading-loose">
                  <span className="text-white font-bold">[WOMBATBOT_AUDIT]:</span> {log.wombatbot_evaluation}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-32 text-[10px] font-mono opacity-20 text-center uppercase tracking-[1em] pb-16">
        Sovereign | Digital Coral | No Complexity Leakage
      </footer>
    </div>
  );
}
