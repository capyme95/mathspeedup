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
          session_summary: `[NCEA_EVIDENCE_SUBMISSION]: ${answer}`,
          wombatbot_evaluation: 'Awaiting high-thickness audit against NCEA 2026 Excellence criteria.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: EVIDENCE RECEIVED'); setAnswer(''); fetchData(); }
      else { throw new Error('TRANSMISSION_FAILED'); }
    } catch (err) { setSubmitStatus('ERROR: CONNECTION COLLAPSE'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">ESTABLISHING_HIGH_TRUST_LINK...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-white selection:text-black">
      <header className="max-w-5xl mx-auto mb-16 flex justify-between items-end border-b-4 border-white pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">MathSpeedup 1.2</h1>
          <p className="text-xs font-mono mt-2 tracking-widest opacity-60">Auckland Acceleration Lab // NCEA AS91945 V3 (2026)</p>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] font-mono border-2 border-white px-3 py-1 font-bold">METABOLIC_ACTIVE</span>
          <span className="text-[10px] font-mono mt-2 opacity-40 uppercase">Verified Sovereignty</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-24">
        {/* Project Context: The Auckland Sustainable Lab */}
        <section className="border-4 border-white p-8 md:p-12 relative bg-white/5">
          <div className="absolute -top-5 left-8 bg-black border-2 border-white px-6 py-1 font-black uppercase tracking-tighter text-xl">Mission: Lab Infrastructure Design</div>
          
          <div className="space-y-12 mb-16">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed opacity-80 italic border-l-4 border-white/30 pl-6 mb-12">
                &quot;Sebastian is tasked with designing the logic for a new sustainable AI learning lab in Auckland. He must apply multi-area mathematical methods (Algebra, Number, and Measurement) to ensure operational viability under NCEA 2026 standards.&quot;
              </p>

              <div className="space-y-8">
                <div className="bg-white/5 p-6 border-l-4 border-white">
                  <h3 className="text-xl font-black uppercase mb-4 tracking-tight">[Phase 1: Resource Capacity - Achieved]</h3>
                  <p className="text-slate-300">
                    The lab deploys two server modules. Module A requires <i>t</i> hours for a full data scrub. Module B is more intensive, requiring 2 hours more than 3 times the scrub time of Module A. 
                    <br/><br/>
                    <strong>Task:</strong> Write a simplified algebraic expression for the total scrub time of both modules combined.
                  </p>
                </div>

                <div className="bg-white/5 p-6 border-l-4 border-white">
                  <h3 className="text-xl font-black uppercase mb-4 tracking-tight">[Phase 2: Operational Continuity - Merit]</h3>
                  <p className="text-slate-300">
                    The lab efficiency, <i>E</i>, decays over <i>d</i> consecutive days of operation. Using the model:
                    <br/><br/>
                    <span className="text-2xl font-bold text-white tracking-widest block py-2">E = 100 - 4d</span>
                    <br/>
                    If the lab must maintain at least 60% efficiency to avoid data fragmentation, calculate the maximum number of days it can run continuously. Provide a formal equation as part of your justification.
                  </p>
                </div>

                <div className="bg-white/5 p-6 border-l-4 border-white">
                  <h3 className="text-xl font-black uppercase mb-4 tracking-tight">[Phase 3: Generalisation & System Limits - Excellence]</h3>
                  <p className="text-slate-300">
                    To optimize cooling cycles, Sebastian observes that temperature variances between two consecutive odd integer nodes follow a predictable multiple.
                    <br/><br/>
                    <strong>Task:</strong> Algebraically prove that the difference between the squares of any two consecutive positive odd numbers is always a multiple of 8.
                    <br/><br/>
                    <strong>Extended Abstract Thinking:</strong> Discuss one assumption you made in your proof and identify a real-world limitation of applying this discrete mathematical model to dynamic hardware cooling fluctuations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* High-Thickness Evidence Submission */}
          <form onSubmit={handleSubmit} className="border-t-4 border-white pt-12">
            <h4 className="font-black uppercase text-sm tracking-[0.3em] mb-6">Transmit Evidence for Audit</h4>
            <textarea 
              className="w-full bg-black border-4 border-white/20 p-8 text-white text-xl font-mono min-h-[350px] outline-none focus:border-white transition-all placeholder:opacity-20"
              placeholder="Input your proof, justifications, and limitations here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-6">
              <div className="font-mono text-[10px] opacity-40 uppercase tracking-widest">
                Identifier: NCEA_AS91945_AKL_LAB_V1
              </div>
              <button type="submit" className="w-full md:w-auto bg-white text-black px-16 py-4 font-black text-lg uppercase hover:bg-black hover:text-white border-4 border-white transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                {isSubmitting ? 'UPLOADING_EVIDENCE...' : 'TRANSMIT EVIDENCE'}
              </button>
            </div>
            {submitStatus && (
              <div className="mt-8 bg-white text-black p-4 text-center font-black uppercase tracking-widest text-lg animate-bounce">
                {submitStatus}
              </div>
            )}
          </form>
        </section>

        {/* Audit Trail */}
        <section className="space-y-12">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic underline decoration-8 underline-offset-8">Audit Logic Trail</h2>
          <div className="space-y-12">
            {logs.length === 0 ? (
              <div className="font-mono opacity-20 text-center py-20 border-4 border-dashed border-white/10 italic">[ WAITING_FOR_DATA_PUMP ]</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-4 border-white/10 p-8 hover:border-white transition-colors group">
                  <div className="flex justify-between font-mono text-[10px] opacity-40 mb-6 uppercase tracking-[0.2em]">
                    <span>Observation_Date: {log.session_date}</span>
                    <span className="group-hover:opacity-100 transition-opacity">Status: High-Trust Verified</span>
                  </div>
                  <p className="text-lg italic mb-8 leading-relaxed text-white/90">&quot;{log.session_summary}&quot;</p>
                  <div className="bg-white/5 p-6 border-2 border-white/20 leading-relaxed font-mono">
                    <span className="text-white font-black block mb-2 underline">[WOMBATBOT_LOGIC_AUDIT]:</span>
                    <div className="text-sm opacity-80 whitespace-pre-wrap">{log.wombatbot_evaluation}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-40 text-[10px] font-mono opacity-20 text-center uppercase tracking-[2em] pb-24">
        Sovereign Governance // Auckland Acceleration Lab
      </footer>
    </div>
  );
}
