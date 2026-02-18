"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/backend";
import { useSession } from 'next-auth/react';

export default function KidneyMatchingPage() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || '').toUpperCase();
  const isDoctorOrHospital = role === 'DOCTOR' || role === 'HOSPITAL';
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  // For doctor/hospital: patient/donor select
  const [patients, setPatients] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedDonor, setSelectedDonor] = useState<string>("");
  const [pairResult, setPairResult] = useState<any | null>(null);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : null;
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

  // Doctor/hospital: fetch all patients and donors for select
  useEffect(() => {
    if (!isDoctorOrHospital) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : null;
    if (!token) return;
    fetch(`${BACKEND_URL}/api/patients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setPatients(j.data || []));
    fetch(`${BACKEND_URL}/api/donors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setDonors((j.data || []).filter((d:any) => (d.donor_type || '').toUpperCase() === 'KIDNEY')));
  }, [isDoctorOrHospital]);

  // Doctor/hospital: fetch real match for selected patient/donor
  async function fetchPairMatch() {
    setPairLoading(true);
    setPairError(null);
    setPairResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : null;
      if (!token || !selectedPatient || !selectedDonor) throw new Error('Select both patient and donor');
      const res = await fetch(`${BACKEND_URL}/api/public/matching/donors?patient_id=${selectedPatient}&donor_id=${selectedDonor}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPairResult(data.data && data.data.length > 0 ? data.data[0] : null);
    } catch (e: any) {
      setPairError(e.message || 'Failed to fetch match');
    } finally {
      setPairLoading(false);
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
          <p className="text-sm text-slate-600 dark:text-slate-400">LifeLink staged matching with hard rejection rules, risk classification, and explainable medical output.</p>
        </div>
        <Link href="/" className="text-sm text-emerald-700 hover:underline">← Back to home</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        {isDoctorOrHospital && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/40">
            <div className="mb-2 font-semibold text-emerald-900 dark:text-emerald-200">Doctor/Hospital: Match Real Patient & Donor</div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium mb-1">Patient</label>
                <select className="rounded border px-2 py-1 text-sm" value={selectedPatient} onChange={e=>setSelectedPatient(e.target.value)}>
                  <option value="">Select patient</option>
                  {patients.map((p:any) => <option key={p.id} value={p.id}>{p.full_name} ({p.blood_group || '?'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Donor</label>
                <select className="rounded border px-2 py-1 text-sm" value={selectedDonor} onChange={e=>setSelectedDonor(e.target.value)}>
                  <option value="">Select donor</option>
                  {donors.map((d:any) => <option key={d.id} value={d.id}>{d.full_name} ({d.blood_group || '?'})</option>)}
                </select>
              </div>
              <button className="btn bg-emerald-600 text-white px-3 py-1" onClick={fetchPairMatch} disabled={pairLoading || !selectedPatient || !selectedDonor}>Match</button>
            </div>
            {pairLoading && <div className="text-xs text-emerald-700 mt-2">Matching...</div>}
            {pairError && <div className="text-xs text-red-600 mt-2">{pairError}</div>}
            {pairResult && (
              <div className="mt-3 p-3 rounded bg-white border border-emerald-200 dark:bg-slate-900 dark:border-emerald-900/40">
                <div className="font-semibold text-emerald-800 dark:text-emerald-200">Result for selected patient & donor:</div>
                <div className="text-sm mt-1">Score: <span className="font-bold">{(pairResult.final_match_score * 100).toFixed(1)}%</span> | Risk: <span className="font-bold">{pairResult.risk_level}</span> | Action: <span className="font-bold">{pairResult.action}</span></div>
                <div className="text-xs mt-1">Reasons: {(pairResult.reasons || []).join('; ')}</div>
                <div className="text-xs mt-1 text-amber-700">{(pairResult.warnings || []).join('; ')}</div>
              </div>
            )}
          </div>
        )}
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
          Tip: System never auto-approves a transplant. Doctor confirmation is mandatory.
        </p>
      </div>

      {result?.ethics && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          {result.ethics.message} Doctor confirmation required for all recommendations.
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Blood Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Final Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Reasons</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading && (<tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">Loading...</td></tr>)}
              {!loading && !result && (<tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">No results yet</td></tr>)}
              {!loading && result && result.data.length === 0 && (<tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">No matches found</td></tr>)}
              {!loading && result && (() => {
                // Only unique kidney donors
                const seen = new Set();
                return result.data.filter((d: any) => {
                  // Only kidney donors
                  if ((d.donor_type || '').toUpperCase() !== 'KIDNEY') return false;
                  if (seen.has(d.id)) return false;
                  seen.add(d.id);
                  return true;
                }).map((d: any) => {
                  const rh = d.rh_factor === 'NEGATIVE' ? '-' : (d.rh_factor === 'POSITIVE' ? '+' : '');
                  const bg = d.blood_group ?? (rh ? `?${rh}` : '?');
                  const score = typeof d.final_match_score === 'number' ? d.final_match_score : ((d.match_score || 0) / 100);
                  return (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">{d.full_name}</td>
                      <td className="px-4 py-3 text-sm">{d.location || '-'}</td>
                      <td className="px-4 py-3 text-sm"><span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900/40">{bg}</span></td>
                      <td className="px-4 py-3 text-sm font-semibold">{(score * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm">{d.risk_level || '-'}</td>
                      <td className="px-4 py-3 text-sm">{d.action || '-'}</td>
                      <td className="px-4 py-3 text-xs max-w-xs">
                        <div className="space-y-1">
                          {(d.reasons || []).slice(0, 3).map((reason: string, idx: number) => (
                            <div key={idx}>• {reason}</div>
                          ))}
                          {(d.warnings || []).slice(0, 2).map((warning: string, idx: number) => (
                            <div key={`w-${idx}`} className="text-amber-700 dark:text-amber-300">⚠ {warning}</div>
                          ))}
                          {d.doctor_confirmation_required && (
                            <div className="text-[11px] text-slate-500">Doctor confirmation required</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{d.phone || '-'}</td>
                    </tr>
                  );
                });
              })()}
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
