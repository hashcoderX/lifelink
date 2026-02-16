"use client";
import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/lib/backend";
import Link from "next/link";

type DonorRow = {
  id: number;
  full_name: string;
  location: string | null;
  blood_group: string | null;
  rh_factor: "POSITIVE" | "NEGATIVE" | null;
  phone: string | null;
  donor_type?: 'BLOOD' | 'KIDNEY' | 'EYE' | string | null;
};

type PageResult<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

export default function BloodBankPage() {
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PageResult<DonorRow> | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      // Hint the API to return only BLOOD donors if supported
      params.set("donor_type", "BLOOD");
      if (location) params.set("location", location);
      const res = await fetch(`${BACKEND_URL}/api/public/donors?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as PageResult<DonorRow>;
      setResult(json);
    } catch (e: any) {
      setError(e.message || "Failed to load donors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const rowsRaw = result?.data || [];
  const rows = useMemo(() => {
    const seen = new Set<string | number>();
    return rowsRaw.filter((d) => {
      const isBlood = d.donor_type ? d.donor_type === 'BLOOD' : (d.blood_group != null);
      if (!isBlood) return false;
      const key = d.id ?? `${d.full_name}-${d.phone ?? ''}-${d.location ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rowsRaw]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blood Bank</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Find available donors and reach out directly.</p>
        </div>
        <Link href="/" className="text-sm text-red-600 hover:underline">← Back to home</Link>
      </div>

      <form onSubmit={onSearchSubmit} className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="loc" className="mb-1 block text-sm font-medium">Filter by location</label>
          <input id="loc" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="City or area"
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800"/>
        </div>
        <div>
          <label htmlFor="per" className="mb-1 block text-sm font-medium">Per page</label>
          <select id="per" value={perPage} onChange={(e)=>{setPerPage(parseInt(e.target.value)||10); setPage(1);}}
            className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button type="submit" className="btn h-9 self-end bg-red-600 px-4 text-white hover:bg-red-700">Search</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Blood Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">Loading...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No donors found</td></tr>
              )}
              {!loading && rows.map((d, idx) => {
                const rh = d.rh_factor === 'NEGATIVE' ? '-' : (d.rh_factor === 'POSITIVE' ? '+' : '');
                const bg = d.blood_group ?? (rh ? `?${rh}` : '?');
                const rowKey = d.id != null ? `donor-${d.id}-${idx}` : `row-${idx}`;
                return (
                  <tr key={rowKey}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">{d.full_name}</td>
                    <td className="px-4 py-3 text-sm">{d.location || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-900/40">
                        {bg}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{d.phone || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Page {result?.current_page || 1} of {result?.last_page || 1} · {result?.total || 0} donors
          </div>
          <div className="flex items-center gap-2">
            <button disabled={loading || (result?.current_page||1) <= 1}
              onClick={()=> setPage(p => Math.max(1, p-1))}
              className="btn h-8 bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Prev</button>
            <button disabled={loading || (result?.current_page||1) >= (result?.last_page||1)}
              onClick={()=> setPage(p => p+1)}
              className="btn h-8 bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
}
