"use client";
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/lib/backend';

export default function AdminMaintenancePage() {
  const [token, setToken] = useState<string | null>(null);
  const [dryOutput, setDryOutput] = useState<string>("");
  const [runOutput, setRunOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [location, setLocation] = useState("");
  const [explain, setExplain] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  async function callBackfill(dry: boolean) {
    setError(null); setRunning(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/backfill-donor-type?dry_run=${dry ? '1' : '0'}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Request failed');
      (dry ? setDryOutput : setRunOutput)(json.output || JSON.stringify(json));
    } catch (e: any) {
      setError(e.message || 'Failed to run command');
    } finally { setRunning(false); }
  }

  async function fetchExplain() {
    setError(null);
    try {
      const url = new URL(`${BACKEND_URL}/api/admin/benchmarks/donor-queries`);
      if (location) url.searchParams.set('location', location);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Request failed');
      setExplain(json);
    } catch (e: any) { setError(e.message || 'Failed to fetch EXPLAIN'); }
  }

  return (
    <main className="container-max py-10">
      <h1 className="text-2xl font-semibold">Admin Maintenance</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Admin-only ops: backfill donor types and view query EXPLAIN plans.</p>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <h2 className="font-medium">Backfill Donor Types</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Adjust donor_type for donors identified as blood-only by heuristic.</p>
          <div className="mt-3 flex gap-3">
            <button disabled={running} onClick={()=>callBackfill(true)} className="btn">Dry Run</button>
            <button disabled={running} onClick={()=>{
              if (confirm('Run backfill now?')) callBackfill(false);
            }} className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Run Backfill</button>
          </div>
          {dryOutput && <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs dark:bg-slate-900/40">{dryOutput}</pre>}
          {runOutput && <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs dark:bg-slate-900/40">{runOutput}</pre>}
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <h2 className="font-medium">Benchmarks: EXPLAIN Donor Queries</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review query plans used by public donors and matching endpoints.</p>
          <div className="mt-3 flex items-center gap-2">
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location filter (optional)" className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
            <button onClick={fetchExplain} className="btn">Run EXPLAIN</button>
          </div>
          {explain && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">Blood Bank</h3>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-2 text-xs dark:bg-slate-900/40">{JSON.stringify(explain.blood_bank_explain, null, 2)}</pre>
              </div>
              <div>
                <h3 className="text-sm font-medium">Kidney Matching</h3>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-2 text-xs dark:bg-slate-900/40">{JSON.stringify(explain.kidney_matching_explain, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </section>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
