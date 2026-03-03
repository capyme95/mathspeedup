import React from 'react';

export const dynamic = 'force-dynamic';

async function getSupabaseData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const res = await fetch(`${url}/rest/v1/standards?select=*`, {
    headers: {
      'apikey': key!,
      'Authorization': `Bearer ${key}`
    },
    next: { revalidate: 0 }
  });
  return res.json();
}

export default async function Dashboard() {
  const standards = await getSupabaseData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">MathSpeedup <span className="text-blue-500">Dashboard</span></h1>
        <p className="text-slate-400">Sebastian's NCEA Level 1 Acceleration Tracker | Powered by WombatBot</p>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {standards.map((std: any) => (
            <div key={std.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl hover:border-blue-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{std.code}</span>
                <span className="text-xs text-slate-500">Credits: {std.credits}</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">{std.title}</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <span className="text-sm font-medium text-slate-300">Phase 1</span>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-slate-900 border border-slate-800 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-6">WombatBot <span className="text-emerald-500">Evaluation</span></h2>
          <div className="space-y-4">
            <div className="border-l-2 border-emerald-500 pl-4 py-2">
              <p className="text-sm text-slate-500 mb-1">2026-03-02</p>
              <p className="text-slate-200">Logic Mapping: Initial exposure. Ready for "Abstract Thinking" shift. Linear Reasoning: Understanding the "Growth Rate" vs "Base Value".</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-20 text-center text-slate-600 text-sm">
        <p>© 2026 Digital Coral Ecosystem | High-Trust 2026 Verified</p>
      </footer>
    </div>
  );
}
