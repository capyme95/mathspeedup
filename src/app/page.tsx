'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Standard { id: string; code: string; title: string; credits: number; }
interface LearningLog { 
  id: string; 
  session_date: string; 
  session_summary: string; 
  wombatbot_evaluation: string;
  logic_fingerprint: string[];
}

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

  const atomizeLogic = (text: string): string[] => {
    // Splits by newlines, step markers (1., 2.), or logical keywords
    return text
      .split(/\n|(?=\d\.)|(?=Therefore)|(?=Assume)|(?=Step)/g)
      .map(s => s.trim())
      .filter(s => s.length > 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setIsSubmitting(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const fingerprint = atomizeLogic(answer);

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
          session_summary: `[LOGIC_FINGERPRINT_SUBMISSION]`,
          logic_fingerprint: fingerprint,
          wombatbot_evaluation: 'Awaiting expert audit against NCEA 2026 Excellence criteria.'
        })
      });
      if (res.ok) { 
        setSubmitStatus('SUCCESS: LOGIC SEALED'); 
        setAnswer(''); 
        fetchData(); 
      } else { 
        throw new Error('FAIL'); 
      }
    } catch (err) { 
      setSubmitStatus('ERROR: CONNECTION COLLAPSE'); 
    } finally { 
      setIsSubmitting(false); 
      setTimeout(() => setSubmitStatus(null), 5000); 
    }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">ESTABLISHING_HIGH_TRUST_LINK...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans selection:bg-white selection:text-black">
      <header className="max-w-5xl mx-auto mb-20 flex justify-between items-start border-b-4 border-white pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">MathSpeedup // 1.2</h1>
          <p className="text-xs font-mono mt-2 tracking-widest opacity-40 uppercase">Avondale Market // Logic Fingerprinting // 2026</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-3 h-3 bg-white animate-pulse rounded-full"></div>
          <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Metabolic_Sync_Live</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-32">
        <section className="border-4 border-white p-8 md:p-16 relative bg-white/5 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
          <div className="absolute -top-5 left-8 bg-black border-2 border-white px-6 py-1 font-black uppercase tracking-tighter text-xl text-white">Current Mission: Market Optimisation</div>
          
          <div className="space-y-12 mb-16">
            <p className="text-lg leading-relaxed opacity-80 italic border-l-4 border-white/30 pl-6 mb-12">
              &quot;Sebastian is modelling spatial and revenue growth for the Avondale Sunday Market. Evidence must meet NCEA Level 1 standards for Algebra, Number, and Measurement.&quot;
            </p>

            <div className="space-y-12">
              <div className="border-l-4 border-white pl-6">
                <h3 className="text-xl font-black uppercase mb-4">[ Phase 1: Spatial Allocation - Achieved ]</h3>
                <p className="text-zinc-300">
                  Type A stall: <i>s</i> square metres. Type B: 5 square metres more than twice Type A. 
                  <br/><br/>
                  <strong>Task:</strong> Simplified algebraic expression for the combined space of one Type A and one Type B stall.
                </p>
              </div>

              <div className="border-l-4 border-white pl-6">
                <h3 className="text-xl font-black uppercase mb-4">[ Phase 2: Revenue Prediction - Merit ]</h3>
                <p className="text-zinc-300">
                  Weekly revenue (<i>R</i>) decays based on rainy weekends (<i>w</i>):
                  <br/><br/>
                  <span className="text-3xl font-bold text-white block py-4 underline">R = 850 - 75w</span>
                  Determine the maximum rainy weekends sustainable if $400 is required to cover costs. Justify with an equation.
                </p>
              </div>

              <div className="border-l-4 border-white pl-6">
                <h3 className="text-xl font-black uppercase mb-4">[ Phase 3: Generalisation - Excellence ]</h3>
                <p className="text-zinc-300">
                  <strong>Task:</strong> Algebraically prove that the difference between the squares of any two consecutive positive odd integers is always a multiple of 8.
                  <br/><br/>
                  <strong>Reflection:</strong> Discuss one limitation of this discrete model in predicting real-world market dynamics.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t-4 border-white pt-12">
            <h4 className="font-black uppercase text-xs tracking-[0.4em] mb-6 opacity-60">Input Atomic Steps for Logic Fingerprinting</h4>
            <textarea 
              className="w-full bg-black border-4 border-white/20 p-8 text-white text-xl font-mono min-h-[400px] outline-none focus:border-white transition-all"
              placeholder="Step 1: ... Step 2: ... Therefore: ..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mt-10 gap-8">
              <span className="text-[10px] font-mono opacity-30 uppercase">Ref: AVONDALE_FINGERPRINT_01</span>
              <button type="submit" className="w-full md:w-auto bg-white text-black px-20 py-4 font-black text-lg uppercase hover:invert transition-all border-4 border-white active:scale-95 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
                {isSubmitting ? 'SEALING_LOGIC...' : 'TRANSMIT LOGIC'}
              </button>
            </div>
            {submitStatus && <div className="mt-8 bg-white text-black p-4 text-center font-black uppercase tracking-widest">{submitStatus}</div>}
          </form>
        </section>

        <section className="space-y-16">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic underline decoration-8 underline-offset-8">Atomic Logic Trail</h2>
          <div className="space-y-20">
            {logs.map((log) => (
              <div key={log.id} className="border-4 border-white/10 p-10 group relative">
                <div className="flex justify-between font-mono text-[10px] opacity-40 mb-10 uppercase tracking-[0.3em]">
                  <span>Observation_Date: {log.session_date}</span>
                  <span>ID: {log.id.slice(0,8)}</span>
                </div>
                
                <div className="space-y-6 mb-12">
                  {(log.logic_fingerprint || [log.session_summary]).map((step, idx) => (
                    <div key={idx} className="flex gap-6 items-start group/step">
                      <span className="text-[10px] font-mono opacity-20 group-hover/step:opacity-100 transition-opacity mt-1">[{String(idx+1).padStart(2, '0')}]</span>
                      <p className="text-xl text-zinc-200 leading-relaxed font-light">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 p-8 border-t-2 border-white/20 font-mono">
                   <span className="text-white font-black block mb-4 uppercase text-xs tracking-widest underline">[WombatBot_Logic_Audit]</span>
                   <div className="text-sm opacity-60 leading-relaxed">{log.wombatbot_evaluation}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-48 text-[9px] font-mono opacity-20 text-center uppercase tracking-[2.5em] pb-32">
        Sovereign // Digital Coral // Gen 26
      </footer>
    </div>
  );
}
