"use client";
import { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPatient, updatePatient, getMyPatient, PatientPayload } from '@/lib/backend';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import ClinicalDefinitionsCard from '@/components/ClinicalDefinitionsCard';

export default function UpdatePatientPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState<PatientPayload>({ full_name: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hla, setHla] = useState<string>('');
  const { token } = useBackendToken();
  // BMI calculator state
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');

  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const update = (field: keyof PatientPayload, value: any) => {
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

  // Auto-load Full Name from authenticated session
  useEffect(() => {
    const name = (session?.user as any)?.name || '';
    if (name) {
      setForm(prev => ({ ...prev, full_name: prev.full_name || name }));
    }
  }, [session]);

  // Check if backend is reachable
  useEffect(() => {
    setBackendReachable(true);
  }, []);

  // Load existing patient data
  useEffect(() => {
    if (!token) {
      setLoadingPatient(false);
      return;
    }
    setLoadingPatient(true);
    getMyPatient(token)
      .then((res) => {
        if (res.patient) {
          setExistingPatient(res.patient);
          // Pre-populate form with existing data
          setForm({
            full_name: res.patient.full_name || '',
            patient_code: res.patient.patient_code || '',
            age: res.patient.age || null,
            sex: res.patient.sex || null,
            blood_group: res.patient.blood_group || null,
            rh_factor: res.patient.rh_factor || null,
            hla_typing: res.patient.hla_typing || [],
            crossmatch_result: res.patient.crossmatch_result || null,
            dsa: res.patient.dsa || null,
            pra_score: res.patient.pra_score || null,
            current_creatinine: res.patient.current_creatinine || null,
            gfr: res.patient.gfr || null,
            urea_level: res.patient.urea_level || null,
            diagnosis: res.patient.diagnosis || '',
            urgent_level: res.patient.urgent_level || null,
            location: res.patient.location || '',
            bmi: res.patient.bmi || null,
            diabetes: res.patient.diabetes || null,
            hypertension: res.patient.hypertension || null,
            hiv_status: res.patient.hiv_status || null,
            hbv_status: res.patient.hbv_status || null,
            hcv_status: res.patient.hcv_status || null,
            previous_transplant: res.patient.previous_transplant || null,
            rejection_history: res.patient.rejection_history || null,
          });
          // Set HLA input
          setHla(res.patient.hla_typing?.join(', ') || '');
          // Set BMI calculator values if BMI exists
          if (res.patient.bmi) {
            setWeightKg(''); // We don't store weight/height separately
            setHeightCm('');
          }
        }
      })
      .catch((err) => {
        setError('Failed to load patient data: ' + err.message);
      })
      .finally(() => {
        setLoadingPatient(false);
      });
  }, [token]);

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
      if (!existingPatient) {
        setError('No patient profile found to update.');
        setLoading(false);
        return;
      }
      const payload: Partial<PatientPayload> = {
        ...form,
        hla_typing: hla ? hla.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
      };
      const updated: any = await updatePatient(token, existingPatient.id, payload);
      setExistingPatient(updated);
      setMessage('Patient profile updated successfully.');
      // Keep form values; no reset to preserve UX
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Update Patient Profile</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Update an existing patient&apos;s profile in the system.</p>      {backendReachable === false && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          Backend API is not reachable. Please ensure the Laravel server is running on {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}.
        </div>
      )}      {!token && (
        <p className="mb-6 text-xs text-red-600 dark:text-red-400">Sign in to enable patient submission.</p>
      )}
      {token && loadingPatient && (
        <p className="mb-6 text-sm">Loading patient data...</p>
      )}
      {token && !loadingPatient && !existingPatient && (
        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
          No patient profile found. Please create a patient profile first.
        </div>
      )}

      {token && !loadingPatient && existingPatient && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: main form */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input value={form.full_name || ''} onChange={e => update('full_name', e.target.value)} required className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
              </div>
              {/* Email and password fields removed per request; name is auto-loaded from authentication */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input type="number" value={form.age ?? ''} onChange={e => update('age', e.target.value ? Number(e.target.value) : null)} min={0} max={120} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">BMI</label>
            <input type="number" step="0.1" value={form.bmi ?? ''} onChange={e => update('bmi', e.target.value ? Number(e.target.value) : null)} min={0} max={100} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" placeholder="e.g. 24.5" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HLA Typing (comma separated)</label>
          <input value={hla} onChange={e=>setHla(e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" placeholder="A1, A2, B8, DR3" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Crossmatch Result</label>
          <select value={form.crossmatch_result || ''} onChange={e=>update('crossmatch_result', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
            <option value="">--</option>
            <option value="NEGATIVE">Negative</option>
            <option value="POSITIVE">Positive</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sex</label>
            <select value={form.sex || ''} onChange={e => update('sex', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blood Group</label>
            <select value={form.blood_group || ''} onChange={e => update('blood_group', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rh Factor</label>
            <select value={form.rh_factor || ''} onChange={e => update('rh_factor', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NEGATIVE">Negative</option>
              <option value="POSITIVE">Positive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PRA Score</label>
            <input type="number" value={form.pra_score ?? ''} onChange={e => update('pra_score', e.target.value ? Number(e.target.value) : null)} min={0} max={100} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Creatinine</label>
            <input type="number" step="0.01" value={form.current_creatinine ?? ''} onChange={e => update('current_creatinine', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GFR</label>
            <input type="number" step="0.01" value={form.gfr ?? ''} onChange={e => update('gfr', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Urea</label>
            <input type="number" step="0.01" value={form.urea_level ?? ''} onChange={e => update('urea_level', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Diagnosis</label>
          <textarea value={form.diagnosis || ''} onChange={e => update('diagnosis', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" rows={3} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Urgent Level</label>
            <select value={form.urgent_level || ''} onChange={e => update('urgent_level', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              {['LOW','MEDIUM','HIGH','CRITICAL'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">DSA</label>
            <select value={form.dsa || ''} onChange={e => update('dsa', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NEGATIVE">Negative</option>
              <option value="POSITIVE">Positive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HIV Status</label>
            <select value={form.hiv_status || ''} onChange={e => update('hiv_status', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NEGATIVE">Negative</option>
              <option value="POSITIVE">Positive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HBV Status</label>
            <select value={form.hbv_status || ''} onChange={e => update('hbv_status', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NEGATIVE">Negative</option>
              <option value="POSITIVE">Positive</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">HCV Status</label>
            <select value={form.hcv_status || ''} onChange={e => update('hcv_status', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NEGATIVE">Negative</option>
              <option value="POSITIVE">Positive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Diabetes</label>
            <select value={typeof form.diabetes === 'boolean' ? (form.diabetes ? 'YES' : 'NO') : ''} onChange={e => update('diabetes', e.target.value === 'YES')} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hypertension</label>
            <select value={typeof form.hypertension === 'boolean' ? (form.hypertension ? 'YES' : 'NO') : ''} onChange={e => update('hypertension', e.target.value === 'YES')} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rejection History</label>
            <select value={typeof form.rejection_history === 'boolean' ? (form.rejection_history ? 'YES' : 'NO') : ''} onChange={e => update('rejection_history', e.target.value === 'YES')} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Previous Transplant</label>
            <select value={typeof form.previous_transplant === 'boolean' ? (form.previous_transplant ? 'YES' : 'NO') : ''} onChange={e => update('previous_transplant', e.target.value === 'YES')} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800">
              <option value="">--</option>
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
        </div>

        <button disabled={loading} className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Saving...' : 'Update Patient'}
        </button>
          </div>
          {/* Right Sidebar: BMI + Definitions */}
          <aside className="sticky top-4 space-y-4">
            <div className="card space-y-4">
              <div>
                <h3 className="text-sm font-semibold">BMI Calculator</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Enter height and weight to auto-fill BMI.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Height (cm)</label>
                  <input type="number" min={50} max={260} step="0.1" value={heightCm} onChange={e=>setHeightCm(e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" placeholder="170" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Weight (kg)</label>
                  <input type="number" min={2} max={400} step="0.1" value={weightKg} onChange={e=>setWeightKg(e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800" placeholder="65" />
                </div>
              </div>
              <div className="rounded border p-3 bg-gray-50 dark:bg-neutral-900">
                <p className="text-xs text-gray-600">Computed BMI</p>
                <p className="text-lg font-semibold">{computedBmi ?? '—'}</p>
                {computedBmi != null && (
                  <p className="text-xs mt-1">
                    Category: <span className={computedBmi < 18.5 ? 'text-amber-600' : computedBmi < 25 ? 'text-green-600' : computedBmi < 30 ? 'text-orange-600' : 'text-red-600'}>{bmiCategory}</span>
                  </p>
                )}
                <p className="text-[11px] text-gray-600 mt-2">This value is automatically applied to the BMI field.</p>
              </div>
              <button type="button" onClick={()=>{ if (computedBmi != null) update('bmi', computedBmi); }} className="bg-slate-800 text-white px-3 py-2 rounded text-sm disabled:opacity-50" disabled={computedBmi == null}>Apply to BMI field</button>
            </div>
            <ClinicalDefinitionsCard />
          </aside>
        </div>
      </form>
      )}

      {message && <p className="mt-4 text-green-600 text-sm">{message}</p>}
      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
