"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/lib/backend";

export default function KidneyMatchingPage() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(perPage));
      if (location) params.set('location', location);
      if (bloodGroup) params.set('blood_group', bloodGroup);
      const res = await fetch(`${BACKEND_URL}/api/public/matching/donors?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kidney Matching</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Explore basic compatibility inputs. Advanced scoring requires login.</p>
        </div>
        <Link href="/" className="text-sm text-emerald-700 hover:underline">← Back to home</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="bg" className="mb-1 block text-sm font-medium">Patient Blood Group</label>
            <select id="bg" value={bloodGroup} onChange={(e)=>setBloodGroup(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
              <option value="">Select</option>
              <option value="O-">O-</option>
              <option value="O+">O+</option>
              <option value="A-">A-</option>
              <option value="A+">A+</option>
              <option value="B-">B-</option>
              <option value="B+">B+</option>
              <option value="AB-">AB-</option>
              <option value="AB+">AB+</option>
            </select>
          </div>
          <div>
            <label htmlFor="loc" className="mb-1 block text-sm font-medium">Preferred Location</label>
            <input id="loc" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="City or area"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"/>
          </div>
          <div>
            <label htmlFor="per" className="mb-1 block text-sm font-medium">Per page</label>
            <select id="per" value={perPage} onChange={(e)=>{setPerPage(parseInt(e.target.value)||10); setPage(1);}}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={()=>{setPage(1); load();}} className="btn w-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Find Matches</button>
            <Link href={`/blood-bank?location=${encodeURIComponent(location)}`} className="btn w-full bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Open Blood Bank</Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Tip: For best matches, log in and add HLA typing, crossmatch, and clinical markers.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Blood Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">Loading...</td></tr>)}
              {!loading && !result && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No results yet</td></tr>)}
              {!loading && result && result.data.length === 0 && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No matches found</td></tr>)}
              {!loading && result && result.data.map((d: any) => {
                const rh = d.rh_factor === 'NEGATIVE' ? '-' : (d.rh_factor === 'POSITIVE' ? '+' : '');
                const bg = d.blood_group ?? (rh ? `?${rh}` : '?');
                return (
                  <tr key={d.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">{d.full_name}</td>
                    <td className="px-4 py-3 text-sm">{d.location || '-'}</td>
                    <td className="px-4 py-3 text-sm"><span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900/40">{bg}</span></td>
                    <td className="px-4 py-3 text-sm font-semibold">{d.match_score}</td>
                    <td className="px-4 py-3 text-sm">{d.phone || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">Page {result?.current_page || 1} of {result?.last_page || 1} · {result?.total || 0} donors</div>
          <div className="flex items-center gap-2">
            <button disabled={loading || (result?.current_page||1) <= 1} onClick={()=> setPage(p => Math.max(1, p-1))} className="btn h-8 bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Prev</button>
            <button disabled={loading || (result?.current_page||1) >= (result?.last_page||1)} onClick={()=> setPage(p => p+1)} className="btn h-8 bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
}
