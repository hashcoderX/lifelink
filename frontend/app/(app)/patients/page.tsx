"use client";
import { useEffect, useMemo, useState } from 'react';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import { BACKEND_URL, createPatient, PatientPayload } from '@/lib/backend';
import ClinicalDefinitionsCard from '@/components/ClinicalDefinitionsCard';

interface Patient {
  id: number;
  full_name: string;
  blood_group?: string;
  urgent_level?: string;
  location?: string;
}

export default function PatientsListPage() {
  const { token } = useBackendToken();
  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Registration form state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [hlaInput, setHlaInput] = useState('');
  const [form, setForm] = useState<PatientPayload>({ full_name: '' });
  // BMI calculator local state
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');

  const updateForm = (field: keyof PatientPayload, value: any) => {
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

  // Auto-apply computed BMI to form when valid
  useEffect(() => {
    if (computedBmi != null && computedBmi >= 0 && computedBmi <= 100) {
      setForm(prev => ({ ...prev, bmi: computedBmi }));
    }
  }, [computedBmi]);

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load patients: ${res.status} ${res.statusText} ${text}`);
        }
        const json = await res.json();
        setData(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  async function reloadList() {
    if (!token) return;
    const res = await fetch(`${BACKEND_URL}/api/patients`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const text = await res.text();
      setError(`Failed to refresh patients: ${res.status} ${res.statusText} ${text}`);
      return;
    }
    const json = await res.json();
    setData(json.data || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const payload: PatientPayload = { ...form };
      payload.hla_typing = hlaInput ? hlaInput.split(',').map(s=>s.trim()).filter(Boolean) : [];
      await createPatient(token, payload);
      await reloadList();
      setCreateSuccess('Patient registered successfully.');
      setForm({ full_name: '', sex: form.sex ?? null, blood_group: form.blood_group ?? null, urgent_level: form.urgent_level ?? null });
      setHlaInput('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to register patient');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Patients</h1>
      {!token && <p className="text-sm text-red-600">Login to backend to view and register patients.</p>}
      {token && (
        <section className="card mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Register Patient</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Capture core demographics, immunology, labs, infections, risk factors and history.</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left: Main form */}
              <div className="lg:col-span-2 space-y-6">
            {/* Demographics */}
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Full Name <span className="text-red-600">*</span></label>
                  <input value={form.full_name || ''} onChange={e=>updateForm('full_name', e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 placeholder:text-slate-400" placeholder="Patient full name" />
                </div>
                {/* New account fields */}
                <div>
                  <label className="block text-xs font-medium mb-1">Patient Email</label>
                  <input type="email" value={form.new_user_email ?? ''} onChange={e=>updateForm('new_user_email', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" placeholder="patient@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Generated Code</label>
                  <input value={form.patient_code || ''} readOnly className="w-full rounded-lg border border-dashed border-slate-300 dark:border-neutral-700 px-3 py-2 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-500" placeholder="Will appear after creation" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium mb-1">Password</label>
                  <input type="password" value={form.new_user_password ?? ''} onChange={e=>updateForm('new_user_password', e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" placeholder="Min 8 characters" autoComplete="new-password" />
                  <p className="text-[11px] text-slate-500 mt-1">If email and password are provided, a patient login will be created.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Age</label>
                  <input type="number" min={0} max={120} value={form.age ?? ''} onChange={e=>updateForm('age', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">BMI</label>
                  <input type="number" step="0.1" min={0} max={100} value={form.bmi ?? ''} onChange={e=>updateForm('bmi', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" placeholder="e.g. 24.5" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Sex</label>
                  <select value={form.sex || ''} onChange={e=>updateForm('sex', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Blood Group</label>
                  <select value={form.blood_group || ''} onChange={e=>updateForm('blood_group', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rh Factor</label>
                  <select value={form.rh_factor || ''} onChange={e=>updateForm('rh_factor', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            {/* Immunology */}
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Immunology</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">HLA Typing (comma separated)</label>
                  <input value={hlaInput} onChange={e=>setHlaInput(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" placeholder="A1, A2, B8, DR3" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Crossmatch</label>
                  <select value={form.crossmatch_result || ''} onChange={e=>updateForm('crossmatch_result', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">DSA</label>
                  <select value={form.dsa || ''} onChange={e=>updateForm('dsa', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">PRA Score</label>
                  <input type="number" min={0} max={100} value={form.pra_score ?? ''} onChange={e=>updateForm('pra_score', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Urgent Level</label>
                  <select value={form.urgent_level || ''} onChange={e=>updateForm('urgent_level', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    {['LOW','MEDIUM','HIGH','CRITICAL'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            {/* Labs */}
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Labs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Creatinine</label>
                  <input type="number" step="0.01" value={form.current_creatinine ?? ''} onChange={e=>updateForm('current_creatinine', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">GFR</label>
                  <input type="number" step="0.01" value={form.gfr ?? ''} onChange={e=>updateForm('gfr', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Urea</label>
                  <input type="number" step="0.01" value={form.urea_level ?? ''} onChange={e=>updateForm('urea_level', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            {/* Infection Status */}
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Infection Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">HIV</label>
                  <select value={form.hiv_status || ''} onChange={e=>updateForm('hiv_status', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">HBV</label>
                  <select value={form.hbv_status || ''} onChange={e=>updateForm('hbv_status', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">HCV</label>
                  <select value={form.hcv_status || ''} onChange={e=>updateForm('hcv_status', e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            {/* Risk Factors */}
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Risk Factors</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-neutral-700 text-primary focus:ring-primary/40" checked={!!form.diabetes} onChange={e=>updateForm('diabetes', e.target.checked)} />
                  <span>Diabetes</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-neutral-700 text-primary focus:ring-primary/40" checked={!!form.hypertension} onChange={e=>updateForm('hypertension', e.target.checked)} />
                  <span>Hypertension</span>
                </label>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-neutral-800" />

            {/* History */}
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Previous transplant?</label>
                  <select value={typeof form.previous_transplant === 'boolean' ? (form.previous_transplant ? 'YES' : 'NO') : ''} onChange={e=>updateForm('previous_transplant', e.target.value === 'YES')} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rejection history?</label>
                  <select value={typeof form.rejection_history === 'boolean' ? (form.rejection_history ? 'YES' : 'NO') : ''} onChange={e=>updateForm('rejection_history', e.target.value === 'YES')} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60">
                    <option value="">--</option>
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            {createError && <p className="text-xs text-red-600">{createError}</p>}
            {createSuccess && <p className="text-xs text-green-600">{createSuccess}</p>}
            <div className="flex items-center gap-3">
              <button disabled={creating || !form.full_name} className="btn disabled:opacity-50" type="submit">{creating ? 'Registering…' : 'Register Patient'}</button>
              <button type="button" onClick={()=>{ setForm({ full_name: '' }); setHlaInput(''); setCreateError(null); setCreateSuccess(null); setHeightCm(''); setWeightKg(''); }} className="rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-neutral-800">Reset</button>
            </div>
              </div>

              {/* Right: Sidebar cards (BMI + Definitions) */}
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
                      <p className="text-xs mt-1">
                        Category: <span className={computedBmi < 18.5 ? 'text-amber-600' : computedBmi < 25 ? 'text-green-600' : computedBmi < 30 ? 'text-orange-600' : 'text-red-600'}>{bmiCategory}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-2">This value is automatically applied to the BMI field.</p>
                  </div>
                  <button type="button" onClick={()=>{ if (computedBmi != null) updateForm('bmi', computedBmi); }} className="btn btn-secondary disabled:opacity-50" disabled={computedBmi == null}>Apply to BMI field</button>
                </div>

                <ClinicalDefinitionsCard />
              </aside>
            </div>
          </form>
        </section>
      )}
      {loading && <p className="text-sm">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-700 mt-4">
        {data.map(p => (
          <li key={p.id} className="py-3">
            <p className="font-medium">{p.full_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.blood_group || '—'} | Urgency: {p.urgent_level || '—'} | {p.location || 'Unknown'}</p>
          </li>
        ))}
        {data.length === 0 && token && !loading && <li className="py-3 text-sm text-slate-500">No patients found.</li>}
      </ul>
    </div>
  );
}
