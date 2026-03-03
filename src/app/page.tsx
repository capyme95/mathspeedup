'use client';

import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [standards, setStandards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    try {
      const [stdRes, logRes] = await Promise.all([
        fetch(`${url}/rest/v1/standards?select=*`, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        }),
        fetch(`${url}/rest/v1/learning_logs?select=*&order=session_date.desc&limit=5`, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        })
      ]);
      
      const stdData = await stdRes.json();
      const logData = await logRes.json();
      
      setStandards(stdData);
      setLogs(logData);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono uppercase tracking-widest">Initialising Metabolic Pump...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">MathSpeedup <span className="text-blue-500">Dashboard</span></h1>
          <p className="text-slate-400">Sebastian's NCEA Level 1 Acceleration | High-Trust 2026</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">LIVE_SYNC_ACTIVE</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-12">
        <section className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none uppercase">AS 91945</div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="bg-blue-500 w-2 h-6 rounded-full"></span>
              Current Mission: 基线挑战 01
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-blue-400 mb-2 block uppercase">Q1: Achieved</span>
                <p className="text-sm text-slate-300 leading-relaxed">资源分配: $A$包学习$x$小时，$B$包比$A$包的3倍还多2小时。写出总时长的简化代数表达式。</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-emerald-400 mb-2 block uppercase">Q2: Merit</span>
                <p className="text-sm text-slate-300 leading-relaxed">负熵补偿: 效率方程 $E = 100 - 4d$。如果老板要求效率 $\ge 60\%$，Sebastian 最多能连学几天？请证明。</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-amber-400 mb-2 block uppercase">Q3: Excellence</span>
                <p className="text-sm text-slate-300 leading-relaxed">逻辑证明: 用代数证明“任意两个连续正奇数的平方差一定是 8 的倍数”。（提示：设较小奇数为 $2n-1$）</p>
              </div>
            </div>
            <div className="mt-6 text-xs text-slate-500 font-mono">
              Identifier: ncea_l1_as91945_baseline_20250303_sebastian
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {standards.map((std: any) => (
            <div key={std.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl hover:border-blue-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{std.code}</span>
                <span className="text-xs text-slate-500">Credits: {std.credits}</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-blue-400 transition-colors">{std.title}</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-1/3 shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                </div>
                <span className="text-sm font-medium text-slate-400">Mastery Trace</span>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
            Metabolic Log & Logic Audit
          </h2>
          <div className="space-y-8">
            {logs.map((log: any) => (
              <div key={log.id} className="relative pl-6 border-l border-slate-800 pb-2">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <p className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">{log.session_date}</p>
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                   <p className="text-slate-200 leading-relaxed italic mb-4">"{log.session_summary}"</p>
                   <div className="text-sm text-blue-400 font-mono bg-blue-500/5 p-3 rounded border border-blue-500/10">
                     {log.wombatbot_evaluation}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-20 text-center text-slate-600 text-sm border-t border-slate-900 pt-8">
        <p>Built with Sovereign Identity & Metabolic Negentropy | Gen 23.5</p>
      </footer>
    </div>
  );
}
