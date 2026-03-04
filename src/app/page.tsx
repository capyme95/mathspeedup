'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';

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

  // --- Dynamic Environment Factors ---
  const envFactors = useMemo(() => {
    // These remain stable for the component lifecycle until refresh
    return {
      rainProb: Math.floor(Math.random() * 101), // 0-100%
      discountRate: (Math.random() * (1.2 - 0.8) + 0.8).toFixed(2), // 0.80 - 1.20
      fuelIndex: (Math.random() * (1.5 - 0.9) + 0.9).toFixed(2),
    };
  }, []);

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
    return text.split(/\n|(?=\d\.)|(?=Therefore)|(?=Assume)|(?=Step)/g)
      .map(s => s.trim()).filter(s => s.length > 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setIsSubmitting(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const fingerprint = atomizeLogic(answer);
    
    // Inject environmental metadata into summary for auditor context
    const summaryWithEnv = `[LOGIC_FINGERPRINT_SUBMISSION] | Env: Rain=${envFactors.rainProb}%, Disc=${envFactors.discountRate}`;

    try {
      const res = await fetch(`${url}/rest/v1/learning_logs`, {
        method: 'POST',
        headers: { 'apikey': key!, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          session_date: new Date().toISOString().split('T')[0],
          session_summary: summaryWithEnv,
          logic_fingerprint: fingerprint,
          wombatbot_evaluation: 'Awaiting dynamic narrative and logic audit.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: LOGIC SEALED'); setAnswer(''); fetchData(); }
      else { throw new Error('FAIL'); }
    } catch (err) { setSubmitStatus('ERROR: CONNECTION COLLAPSE'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] flex items-center justify-center font-mono uppercase tracking-[0.2em]">Synchronizing_Narrative_Core...</div>;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-zinc-300 p-4 md:p-12 font-sans selection:bg-[#D4AF37] selection:text-black">
      <header className="max-w-5xl mx-auto mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#D4AF37]/30 pb-12">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic text-white leading-none">MathSpeedup <span className="text-[#D4AF37]">1.3</span></h1>
          <p className="text-xs font-mono mt-4 tracking-[0.3em] opacity-40 uppercase">Avondale Sunday Market // NCEA AS91945 // Auckland 2026</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-mono text-[#D4AF37] opacity-60 uppercase tracking-widest">Logic_Link: Verified</span>
             <div className="w-3 h-3 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] rounded-full animate-pulse"></div>
          </div>
          <span className="text-[10px] font-mono text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1 uppercase tracking-tighter">Gen 26 Shadow Infrastructure</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-32">
        {/* Dynamic Environment Sidebar/Widget */}
        <section className="bg-zinc-900/50 border border-[#D4AF37]/20 p-6 font-mono text-xs uppercase tracking-widest flex flex-wrap gap-10 justify-around">
           <div className="flex flex-col gap-1">
              <span className="opacity-40">Rain_Probability</span>
              <span className="text-white text-lg font-black">{envFactors.rainProb}%</span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="opacity-40">Market_Discount_Rate (d)</span>
              <span className="text-[#D4AF37] text-lg font-black">{envFactors.discountRate}x</span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="opacity-40">Fuel_Price_Index</span>
              <span className="text-white text-lg font-black">{envFactors.fuelIndex}</span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="opacity-40">Observation_Status</span>
              <span className="text-emerald-500 text-lg font-black">ACTIVE</span>
           </div>
        </section>

        <section className="border border-[#D4AF37]/50 p-8 md:p-20 relative bg-[#111111] shadow-[30px_30px_60px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-5 left-10 bg-[#0D0D0D] border-2 border-[#D4AF37] px-8 py-1.5 font-black uppercase text-sm tracking-[0.3em] text-[#D4AF37]">Internal Assessment Project</div>
          
          <div className="space-y-20 mb-24">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-4xl font-black text-white uppercase mb-8 tracking-tight">Project: Sunday Market Expansion</h2>
              <p className="text-xl leading-relaxed text-zinc-400 italic font-light border-l-4 border-[#D4AF37]/40 pl-10 mb-16">
                &quot;Sebastian has been appointed as a Logic Consultant for the Avondale Sunday Market organisers. To accommodate a growing number of vendors, he must design a scalable spatial model and predict the financial impact of weather-related attendance fluctuations.&quot;
              </p>

              <div className="space-y-16">
                <div className="bg-black/40 p-10 border-l-2 border-[#D4AF37]">
                  <h3 className="text-2xl font-black text-[#D4AF37] uppercase mb-6 tracking-wide">[ Phase 1: Spatial Geometry - Achieved ]</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    The layout consists of two primary unit types. A <b>Small Artisan Stall</b> requires <i>s</i> square metres of ground space. A <b>Large Food Truck Module</b> is more demanding, requiring 5 square metres more than twice the space of the Artisan Stall. 
                    <br/><br/>
                    <strong>Task:</strong> Formulate and simplify an algebraic expression for the total combined area required for one of each stall type. This simplified model will be used by organizers to calculate site-wide permit fees.
                  </p>
                </div>

                <div className="bg-black/40 p-10 border-l-2 border-[#D4AF37]">
                  <h3 className="text-2xl font-black text-[#D4AF37] uppercase mb-6 tracking-wide">[ Phase 2: Revenue Thresholds - Merit ]</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    Based on the footprint established in Phase 1, the market&apos;s total weekly revenue (<i>R</i>), measured in dollars, is expected to decrease as the number of consecutive rainy weekends (<i>w</i>) increases. The organisers provide the following dynamic linear model:
                    <br/><br/>
                    <span className="text-4xl font-bold text-white block py-6 underline decoration-[#D4AF37]/40 tracking-widest text-center italic font-mono">R = 850 - (75 * w)</span>
                    <br/>
                    <strong>Dynamic Constraint:</strong> Due to current conditions, a market discount factor <i>d</i> of <b>{envFactors.discountRate}</b> applies to the required minimum revenue. 
                    <br/><br/>
                    If the organisers require a minimum revenue of <b>${(400 * parseFloat(envFactors.discountRate)).toFixed(0)}</b> (calculated as $400 * <i>d</i>) to cover costs, calculate the maximum number of rainy weekends the market can sustain. Justify your answer using an equation.
                  </p>
                </div>

                <div className="bg-black/40 p-10 border-l-2 border-[#D4AF37]">
                  <h3 className="text-2xl font-black text-[#D4AF37] uppercase mb-6 tracking-wide">[ Phase 3: Patterns & Generalisation - Excellence ]</h3>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    To optimize the concentric layout of stalls around the central hub, Sebastian notices that vendor growth follows a pattern of consecutive odd integers. He needs to verify a core scaling rule for the expansion rings.
                    <br/><br/>
                    <strong>Task:</strong> Algebraically prove that the difference between the squares of any two consecutive positive odd integers is always a multiple of 8.
                    <br/><br/>
                    <strong>Reflection:</strong> Explicitly state the assumptions you made for this algebraic model. Given the current <b>{envFactors.rainProb}% Rain Probability</b>, discuss one real-world limitation of using this discrete model to predict physical vendor growth in the dynamic Avondale Market environment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#D4AF37]/30 pt-20">
            <h4 className="font-black uppercase text-xs tracking-[0.5em] mb-8 text-[#D4AF37]/60 text-center italic">Transmit Logic Fingerprints for Expert Audit</h4>
            <textarea 
              className="w-full bg-[#0D0D0D] border-2 border-zinc-800 p-10 text-white text-2xl font-mono min-h-[450px] outline-none focus:border-[#D4AF37] transition-all placeholder:opacity-10"
              placeholder="Structure your proof and working here (e.g., Step 1, Step 2...)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-10">
              <span className="text-[10px] font-mono opacity-30 uppercase tracking-[0.3em]">ID: AVONDALE_DYNAMIC_V3</span>
              <button type="submit" className="w-full md:w-auto bg-[#D4AF37] text-black px-24 py-6 font-black text-xl uppercase hover:bg-white hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all active:scale-95 border-none">
                {isSubmitting ? 'SEALING_LOGIC...' : 'TRANSMIT LOGIC'}
              </button>
            </div>
            {submitStatus && <div className="mt-10 bg-white text-black p-5 text-center font-black uppercase tracking-widest text-lg border-4 border-[#D4AF37]">{submitStatus}</div>}
          </form>
        </section>

        <section className="space-y-16 pb-48">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white flex items-center gap-6">
            Atomic Logic Trail
            <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF37] to-transparent opacity-20"></span>
          </h2>
          <div className="space-y-24">
            {logs.map((log) => (
              <div key={log.id} className="border border-white/5 p-12 bg-[#0a0a0a] hover:border-[#D4AF37]/20 transition-all group">
                <div className="flex justify-between font-mono text-[10px] text-[#D4AF37] opacity-40 mb-12 uppercase tracking-[0.4em]">
                  <span>Observed: {log.session_date}</span>
                  <span className="group-hover:opacity-100 transition-opacity underline underline-offset-4 tracking-tighter">Provenance_Secured</span>
                </div>
                
                <div className="space-y-8 mb-16">
                  {(log.logic_fingerprint || [log.session_summary]).map((step, idx) => (
                    <div key={idx} className="flex gap-10 items-start group/step">
                      <span className="text-[10px] font-mono text-[#D4AF37] opacity-20 group-hover/step:opacity-100 transition-opacity mt-2">UNIT_{String(idx+1).padStart(2, '0')}</span>
                      <p className="text-3xl text-zinc-100 leading-tight font-light tracking-tight">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-black p-10 border-l-4 border-[#D4AF37] text-base text-zinc-500 font-mono italic leading-relaxed">
                   <span className="text-[#D4AF37] font-black block mb-4 uppercase text-[10px] tracking-[0.2em] underline">[WOMBATBOT_ATOMIC_AUDIT]</span>
                   {log.wombatbot_evaluation}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-48 text-[9px] font-mono opacity-20 text-center uppercase tracking-[2.5em] pb-32">
        Sovereign // Digital Coral // 2026
      </footer>
    </div>
  );
}
