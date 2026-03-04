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
    const headers: HeadersInit = { 'apikey': key, 'Authorization': \`Bearer \${key}\` };
    try {
      const [stdRes, logRes] = await Promise.all([
        fetch(\`\${url}/rest/v1/standards?select=*\`, { headers }),
        fetch(\`\${url}/rest/v1/learning_logs?select=*&order=session_date.desc&limit=5\`, { headers })
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
    try {
      const res = await fetch(\`\${url}/rest/v1/learning_logs\`, {
        method: 'POST',
        headers: { 'apikey': key!, 'Authorization': \`Bearer \${key}\`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          session_date: new Date().toISOString().split('T')[0],
          session_summary: \`[LOGIC_SEALED]\`,
          logic_fingerprint: fingerprint,
          wombatbot_evaluation: 'Awaiting gold-standard audit.'
        })
      });
      if (res.ok) { setSubmitStatus('SUCCESS: ASSET SEALED'); setAnswer(''); fetchData(); }
      else { throw new Error('FAIL'); }
    } catch (err) { setSubmitStatus('ERROR: LINK DROPPED'); } finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus(null), 5000); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }, [fetchData]);

  if (loading) return <div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] flex items-center justify-center font-mono uppercase tracking-widest">Initialising_Obsidian_Core...</div>;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-zinc-300 p-4 md:p-12 font-sans selection:bg-[#D4AF37] selection:text-black">
      <header className="max-w-5xl mx-auto mb-20 flex justify-between items-start border-b border-[#D4AF37]/30 pb-10">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">MathSpeedup <span className="text-[#D4AF37]">1.2</span></h1>
          <p className="text-xs font-mono mt-2 tracking-[0.3em] opacity-40 uppercase">Auckland // NCEA // Obsidian Laboratory</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-3 h-3 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] rounded-full"></div>
          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest">Sovereign_Active</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-32">
        <section className="border border-[#D4AF37]/50 p-8 md:p-16 relative bg-[#151515] shadow-2xl">
          <div className="absolute -top-4 left-8 bg-[#0D0D0D] border border-[#D4AF37] px-6 py-1 font-black uppercase text-xs tracking-[0.2em] text-[#D4AF37]">Active Mission: Market Logic</div>
          
          <div className="space-y-16 mb-20">
            <p className="text-xl leading-relaxed text-zinc-400 italic font-light border-l-2 border-[#D4AF37]/40 pl-8">
              &quot;Architect Sebastian: Model the Avondale Sunday Market infrastructure. Deploy high-thickness reasoning for NCEA 2026 validation.&quot;
            </p>

            <div className="grid grid-cols-1 gap-12">
              <div className="bg-[#0D0D0D]/50 p-8 border-l border-[#D4AF37]/30">
                <h3 className="text-[#D4AF37] font-black uppercase mb-4 tracking-tighter">[ Phase 1: Spatial Geometry ]</h3>
                <p className="text-zinc-300">Simplified expression for combined Module A (<i>s</i> sqm) and Module B (2<i>s</i> + 5 sqm).</p>
              </div>
              <div className="bg-[#0D0D0D]/50 p-8 border-l border-[#D4AF37]/30">
                <h3 className="text-[#D4AF37] font-black uppercase mb-4 tracking-tighter">[ Phase 2: Revenue Threshold ]</h3>
                <p className="text-zinc-300 text-lg italic"><b>R = 850 - 75w</b></p>
                <p className="mt-4">Calculate maximum <i>w</i> to maintain R &gt; $400.</p>
              </div>
              <div className="bg-[#0D0D0D]/50 p-8 border-l border-[#D4AF37]/30 text-white">
                <h3 className="text-[#D4AF37] font-black uppercase mb-4 tracking-tighter">[ Phase 3: Excellence Proof ]</h3>
                <p>Prove algebraically that the difference of squares of consecutive odd integers is a multiple of 8.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#D4AF37]/20 pt-16">
            <textarea 
              className="w-full bg-[#0D0D0D] border border-zinc-800 p-8 text-white text-xl font-mono min-h-[300px] outline-none focus:border-[#D4AF37] transition-all"
              placeholder="Detail your atomic steps..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button type="submit" className="mt-8 bg-[#D4AF37] text-black px-24 py-5 font-black text-xl uppercase hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              {isSubmitting ? 'PROCESSING...' : 'SEAL EVIDENCE'}
            </button>
            {submitStatus && <div className="mt-8 bg-zinc-800 text-[#D4AF37] p-4 text-center font-bold border border-[#D4AF37] uppercase">{submitStatus}</div>}
          </form>
        </section>

        <section className="space-y-16 pb-32">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            Logic Audit Trail
            <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF37] to-transparent opacity-30"></span>
          </h2>
          <div className="space-y-16">
            {logs.map((log) => (
              <div key={log.id} className="border border-zinc-900 p-10 bg-[#111111] hover:border-[#D4AF37]/20 transition-all">
                <div className="flex justify-between font-mono text-[9px] text-[#D4AF37] opacity-60 mb-10 uppercase tracking-[0.4em]">
                  <span>Timestamp: {log.session_date}</span>
                  <span>Trust_Verified</span>
                </div>
                
                <div className="space-y-6 mb-12">
                  {(log.logic_fingerprint || [log.session_summary]).map((step, idx) => (
                    <div key={idx} className="flex gap-8 items-start">
                      <span className="text-[10px] font-mono text-[#D4AF37] opacity-20 mt-1">L{String(idx+1).padStart(2, '0')}</span>
                      <p className="text-2xl text-zinc-100 leading-tight font-light">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0D0D0D] p-8 border-l-2 border-[#D4AF37] text-sm text-zinc-500 font-mono italic">
                   [WombatBot_Audit]: {log.wombatbot_evaluation}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-48 text-[9px] font-mono opacity-20 text-center uppercase tracking-[2.5em] pb-32">
        Sovereignty // Digital Coral // High-Trust
      </footer>
    </div>
  );
}
