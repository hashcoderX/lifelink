"use client";
import { useEffect, useMemo, useState } from 'react';
import { createDonor, DonorPayload } from '@/lib/backend';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import ClinicalDefinitionsCard from '@/components/ClinicalDefinitionsCard';

export default function DonorNewPage() {
  const [form, setForm] = useState<DonorPayload>({ full_name: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hla, setHla] = useState<string>('');
  const [infectious, setInfectious] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const { token } = useBackendToken();

  const update = (field: keyof DonorPayload, value: any) => {
    setForm(prev => ({ ...prev, [field]: value === '' ? null : value }));
  };

  const computedBmi = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return null;
    const m = h / 100;
    const bmi = w / (m * m);
    return Math.round(bmi * 10) / 10;
  }, [heightCm, weightKg]);

  const bmiCategory = useMemo(() => {
    if (computedBmi == null) return '';
    if (computedBmi < 18.5) return 'Underweight';
    if (computedBmi < 25) return 'Normal';
    if (computedBmi < 30) return 'Overweight';
    return 'Obesity';
  }, [computedBmi]);

  useEffect(() => {
    if (computedBmi != null && computedBmi >= 0 && computedBmi <= 100) {
      setForm(prev => ({ ...prev, bmi: computedBmi }));
    }
  }, [computedBmi]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      if (!token) {
        setError('Please sign in first to acquire backend token.');
        setLoading(false);
        return;
      }
      const payload: DonorPayload = {
        ...form,
        hla_typing: hla ? hla.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        infectious_test_results: infectious ? infectious.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
      };
      const created: any = await createDonor(token, payload);
      setMessage(`Donor created with id ${created.id}${created.donor_code ? ' • Code ' + created.donor_code : ''}`);
      setForm({ full_name: '' });
      setHla('');
      setInfectious('');
      setHeightCm('');
      setWeightKg('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Create Donor (Admin)</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Create a donor profile including immunology and medical background.</p>
      {!token && <p className="text-xs text-red-600 mb-6">Sign in to enable donor submission.</p>}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Full Name <span className="text-red-600">*</span></label>
                  <input value={form.full_name || ''} onChange={e=>update('full_name', e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="Donor full name" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Donor Code</label>
                  <input value={form.donor_code || ''} onChange={e=>update('donor_code', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-xs" placeholder="(optional)" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Age</label>
                  <input type="number" min={0} max={120} value={form.age ?? ''} onChange={e=>update('age', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">BMI</label>
                  <input type="number" step="0.1" min={0} max={100} value={form.bmi ?? ''} onChange={e=>update('bmi', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="e.g. 23.8" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Sex</label>
                  <select value={form.sex || ''} onChange={e=>update('sex', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Blood Group</label>
                  <select value={form.blood_group || ''} onChange={e=>update('blood_group', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rh Factor</label>
                  <select value={form.rh_factor || ''} onChange={e=>update('rh_factor', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Donor Email</label>
                  <input type="email" value={form.new_user_email ?? ''} onChange={e=>update('new_user_email', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="donor@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Password</label>
                  <input type="password" value={form.new_user_password ?? ''} onChange={e=>update('new_user_password', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="Min 8 characters" autoComplete="new-password" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-2 00 dark:bg-neutral-800" />

            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Immunology</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">HLA Typing (comma separated)</label>
                  <input value={hla} onChange={e=>setHla(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="A1, A2, B8, DR3" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Crossmatch</label>
                  <select value={form.crossmatch_result || ''} onChange={e=>update('crossmatch_result', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">DSA</label>
                  <select value={form.dsa || ''} onChange={e=>update('dsa', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">PRA Score</label>
                  <input type="number" min={0} max={100} value={form.pra_score ?? ''} onChange={e=>update('pra_score', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Labs</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Creatinine</label>
                  <input type="number" step="0.01" value={form.creatinine_level ?? ''} onChange={e=>update('creatinine_level', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">GFR</label>
                  <input type="number" step="0.01" value={form.gfr ?? ''} onChange={e=>update('gfr', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Urea</label>
                  <input type="number" step="0.01" value={form.urea_level ?? ''} onChange={e=>update('urea_level', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Location</label>
                  <input value={form.location || ''} onChange={e=>update('location', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Risk Factors</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-neutral-700" checked={!!form.diabetes} onChange={e=>update('diabetes', e.target.checked)} />
                  <span>Diabetes</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-neutral-700" checked={!!form.hypertension} onChange={e=>update('hypertension', e.target.checked)} />
                  <span>Hypertension</span>
                </label>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Previous transplant?</label>
                  <select value={typeof form.previous_transplant === 'boolean' ? (form.previous_transplant ? 'YES' : 'NO') : ''} onChange={e=>update('previous_transplant', e.target.value === 'YES')} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rejection history?</label>
                  <select value={typeof form.rejection_history === 'boolean' ? (form.rejection_history ? 'YES' : 'NO') : ''} onChange={e=>update('rejection_history', e.target.value === 'YES')} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                    <option value="">--</option>
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium mb-1">Medical History</label>
                <textarea value={form.medical_history || ''} onChange={e=>update('medical_history', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" rows={3} />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            {message && <p className="text-xs text-green-600">{message}</p>}
            <div className="flex items-center gap-3">
              <button disabled={loading || !form.full_name} className="btn disabled:opacity-50" type="submit">{loading ? 'Submitting…' : 'Submit Donor'}</button>
              <button type="button" onClick={()=>{ setForm({ full_name: '' }); setHla(''); setInfectious(''); setHeightCm(''); setWeightKg(''); setMessage(''); setError(''); }} className="rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 text-sm">Reset</button>
            </div>
          </div>

          <aside className="sticky top-4 space-y-4">
            <div className="card space-y-4">
              <div>
                <h3 className="text-sm font-semibold">BMI Calculator</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter height and weight to auto-fill BMI.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Height (cm)</label>
                  <input type="number" min={50} max={260} step="0.1" value={heightCm} onChange={e=>setHeightCm(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="170" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Weight (kg)</label>
                  <input type="number" min={2} max={400} step="0.1" value={weightKg} onChange={e=>setWeightKg(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="65" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-neutral-800 p-3 bg-slate-50 dark:bg-neutral-900">
                <p className="text-xs text-slate-500">Computed BMI</p>
                <p className="text-lg font-semibold">{computedBmi ?? '—'}</p>
                {computedBmi != null && (
                  <p className="text-xs mt-1">Category: <span className={computedBmi < 18.5 ? 'text-amber-600' : computedBmi < 25 ? 'text-green-600' : computedBmi < 30 ? 'text-orange-600' : 'text-red-600'}>{bmiCategory}</span></p>
                )}
                <p className="text-[11px] text-slate-500 mt-2">Auto-applied to BMI field.</p>
              </div>
              <button type="button" onClick={()=>{ if (computedBmi != null) update('bmi', computedBmi); }} className="btn btn-secondary disabled:opacity-50" disabled={computedBmi == null}>Apply BMI</button>
            </div>
            <ClinicalDefinitionsCard />
          </aside>
        </div>
      </form>
    </div>
  );
}
