"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import { backendMe, backendUpdateMe, getMyPatient, updatePatient, PatientPayload, getMyContact, updateMyContact, ContactPayload, uploadProfilePhoto, uploadCoverPhoto, getMyMedicalReports, uploadMyMedicalReport } from '@/lib/backend';

// Full country list (ISO common names). Adjust or trim as needed.
const COUNTRY_OPTIONS = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Congo-Brazzaville)','Costa Rica','Croatia','Cuba','Cyprus','Czechia',
  'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France',
  'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Holy See','Honduras','Hungary',
  'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan',
  'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway',
  'Oman',
  'Pakistan','Palau','Palestine State','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar',
  'Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States of America','Uruguay','Uzbekistan',
  'Vanuatu','Venezuela','Vietnam',
  'Yemen',
  'Zambia','Zimbabwe'
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const { token } = useBackendToken();
  const [backendUser, setBackendUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState<string>('');
  const [roleDraft, setRoleDraft] = useState<string>('');
  const allowedRoles = ['DOCTOR','HOSPITAL','PATIENT','DONOR','FUND_RAISER'];
  const [patient, setPatient] = useState<any>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientDraft, setPatientDraft] = useState<PatientPayload>({ full_name: '' });
  const [hlaInput, setHlaInput] = useState<string>('');
  const [patientSaving, setPatientSaving] = useState(false);
  const [contact, setContact] = useState<any>(null);
  const [contactDraft, setContactDraft] = useState<ContactPayload>({});
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  // Success message states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [patientSuccess, setPatientSuccess] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  // Photo upload states
  const [photoUploading, setPhotoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [coverSuccess, setCoverSuccess] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // Medical report upload states
  const medicalReportTypes = [
    'Blood Group (ABO Typing)',
    'Rh Factor (Positive/Negative)',
    'HLA Typing (Human Leukocyte Antigen)',
    'Crossmatch Test',
    'PRA (Panel Reactive Antibody)',
    'Serum Creatinine',
    'GFR (Glomerular Filtration Rate)',
    'Urea Level',
    'Urinalysis Report',
    'Electrolyte Panel (Na, K, Cl)',
    'HIV Test',
    'Hepatitis B (HBsAg, Anti-HBc)',
    'Hepatitis C (Anti-HCV)',
    'CMV (Cytomegalovirus)',
    'VDRL (Syphilis Test)',
    'Ultrasound of Kidneys',
    'CT Angiogram (Renal Vessels)'
  ];
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportTypeDraft, setReportTypeDraft] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportSummary, setReportSummary] = useState('');
  const [reportUploading, setReportUploading] = useState(false);
  const [reportUploadSuccess, setReportUploadSuccess] = useState<string | null>(null);
  const [reportUploadError, setReportUploadError] = useState<string | null>(null);
  const appUser = session?.user as any;
  const roleEffective = (backendUser?.role || appUser?.role || 'GUEST') as string;

  useEffect(() => {
    let cancelled = false;
    if (token) {
      backendMe(token)
        .then(r => { if (!cancelled) setBackendUser(r.user); })
        .catch(e => { if (!cancelled) setError(e.message); });
    }
    return () => { cancelled = true; };
  }, [token]);

  // Load patient profile if role (from backend or app) is PATIENT
  useEffect(() => {
    let cancelled = false;
    if (token && roleEffective === 'PATIENT') {
      setPatientLoading(true);
      getMyPatient(token)
        .then(r => {
          if (cancelled) return;
          setPatient(r.patient);
          if (r.patient) {
            setPatientDraft({
              patient_code: r.patient.patient_code,
              full_name: r.patient.full_name,
              age: r.patient.age,
              sex: r.patient.sex,
              blood_group: r.patient.blood_group,
              rh_factor: r.patient.rh_factor,
              hla_typing: r.patient.hla_typing,
              crossmatch_result: r.patient.crossmatch_result,
              dsa: r.patient.dsa,
              pra_score: r.patient.pra_score,
              current_creatinine: r.patient.current_creatinine,
              gfr: r.patient.gfr,
              urea_level: r.patient.urea_level,
              diagnosis: r.patient.diagnosis,
              urgent_level: r.patient.urgent_level,
              location: r.patient.location,
              diabetes: r.patient.diabetes,
              hypertension: r.patient.hypertension,
              hiv_status: r.patient.hiv_status,
              hbv_status: r.patient.hbv_status,
              hcv_status: r.patient.hcv_status,
              previous_transplant: r.patient.previous_transplant,
              rejection_history: r.patient.rejection_history,
            });
            setHlaInput(r.patient.hla_typing ? r.patient.hla_typing.join(', ') : '');
          } else {
            // initialize draft with backend user's name
            setPatientDraft({ full_name: backendUser?.name || '' });
          }
        })
        .catch(e => { if (!cancelled) setPatientError(e.message); })
        .finally(() => { if (!cancelled) setPatientLoading(false); });
    }
    return () => { cancelled = true; };
  }, [token, roleEffective, backendUser]);

  useEffect(() => {
    if (backendUser) {
      setNameDraft(backendUser.name || '');
      setRoleDraft(backendUser.role || (session?.user as any)?.role || 'GUEST');
    }
  }, [backendUser, session]);

  // Load contact details for any authenticated user
  useEffect(() => {
    let cancelled = false;
    if (token && backendUser) {
      setContactLoading(true);
      getMyContact(token)
        .then(r => {
          if (cancelled) return;
          setContact(r.contact);
          if (r.contact) {
            setContactDraft({
              phone: r.contact.phone,
              alt_phone: r.contact.alt_phone,
              whatsapp: r.contact.whatsapp,
              secondary_email: r.contact.secondary_email,
              address_line1: r.contact.address_line1,
              address_line2: r.contact.address_line2,
              city: r.contact.city,
              state: r.contact.state,
              postal_code: r.contact.postal_code,
              country: r.contact.country,
              organization_name: r.contact.organization_name,
              specialty: r.contact.specialty,
              website: r.contact.website,
              preferred_contact_method: r.contact.preferred_contact_method,
              emergency_contact_name: r.contact.emergency_contact_name,
              emergency_contact_phone: r.contact.emergency_contact_phone,
            });
          }
        })
        .catch(e => { if (!cancelled) setContactError(e.message); })
        .finally(() => { if (!cancelled) setContactLoading(false); });
    }
    return () => { cancelled = true; };
  }, [token, backendUser]);

  // Load medical reports for authenticated patient's profile
  useEffect(() => {
    let cancelled = false;
    if (token && backendUser?.patient && roleEffective === 'PATIENT') {
      setReportsLoading(true);
      getMyMedicalReports(token)
        .then(r => { if (!cancelled) setReports(r.reports); })
        .catch(e => { if (!cancelled) setReportsError(e.message); })
        .finally(() => { if (!cancelled) setReportsLoading(false); });
    }
    return () => { cancelled = true; };
  }, [token, backendUser, roleEffective]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setProfileSuccess(null);
    try {
      const payload: { name?: string; role?: string } = {};
      if (nameDraft.trim() !== (backendUser?.name || '')) payload.name = nameDraft.trim();
      if (roleDraft && roleDraft !== (backendUser?.role || '')) payload.role = roleDraft;
      if (Object.keys(payload).length === 0) {
        setSaving(false);
        return;
      }
      const res = await backendUpdateMe(token, payload);
      setBackendUser(res.user);
      setProfileSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function updatePatientDraft(field: keyof PatientPayload, value: any) {
    setPatientDraft(prev => ({ ...prev, [field]: value === '' ? null : value }));
  }

  async function handlePatientSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPatientSaving(true);
    setPatientError(null);
    setPatientSuccess(null);
    try {
      const payload: Partial<PatientPayload> = { ...patientDraft };
      payload.hla_typing = hlaInput ? hlaInput.split(',').map(s=>s.trim()).filter(Boolean) : [];
      // Determine if creating or updating
      if (!patient) {
        const created = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!created.ok) throw new Error(await created.text());
        const data = await created.json();
        setPatient(data);
        setPatientDraft({
          patient_code: data.patient_code,
          full_name: data.full_name,
          age: data.age,
          sex: data.sex,
          blood_group: data.blood_group,
          hla_typing: data.hla_typing,
          crossmatch_result: data.crossmatch_result,
          pra_score: data.pra_score,
          current_creatinine: data.current_creatinine,
          gfr: data.gfr,
          diagnosis: data.diagnosis,
          urgent_level: data.urgent_level,
          location: data.location,
        });
        setPatientSuccess('Patient profile created successfully.');
      } else {
        const updated: any = await updatePatient(token, patient.id, payload);
        setPatient(updated as any);
        setPatientDraft({
          patient_code: (updated as any).patient_code,
          full_name: (updated as any).full_name,
            age: (updated as any).age,
            sex: (updated as any).sex,
            blood_group: (updated as any).blood_group,
            rh_factor: (updated as any).rh_factor,
            hla_typing: (updated as any).hla_typing,
            crossmatch_result: (updated as any).crossmatch_result,
            dsa: (updated as any).dsa,
            pra_score: (updated as any).pra_score,
            current_creatinine: (updated as any).current_creatinine,
            gfr: (updated as any).gfr,
            urea_level: (updated as any).urea_level,
            diagnosis: (updated as any).diagnosis,
            urgent_level: (updated as any).urgent_level,
            location: (updated as any).location,
            diabetes: (updated as any).diabetes,
            hypertension: (updated as any).hypertension,
            hiv_status: (updated as any).hiv_status,
            hbv_status: (updated as any).hbv_status,
            hcv_status: (updated as any).hcv_status,
            previous_transplant: (updated as any).previous_transplant,
            rejection_history: (updated as any).rejection_history,
        });
        setPatientSuccess('Patient profile updated successfully.');
      }
    } catch (err: any) {
      setPatientError(err.message);
    } finally {
      setPatientSaving(false);
    }
  }

  function updateContactDraft(field: keyof ContactPayload, value: any) {
    setContactDraft(prev => ({ ...prev, [field]: value === '' ? null : value }));
  }

  async function handleContactSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setContactSaving(true);
    setContactError(null);
    setContactSuccess(null);
    try {
      const payload: ContactPayload = { ...contactDraft };
      const res = await updateMyContact(token, payload);
      setContact(res.contact);
      setContactSuccess('Contact details saved successfully.');
    } catch (err: any) {
      setContactError(err.message);
    } finally {
      setContactSaving(false);
    }
  }

  async function handleProfilePhotoUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !profileFile) return;
    setPhotoUploading(true);
    setPhotoError(null);
    setPhotoSuccess(null);
    try {
      const res = await uploadProfilePhoto(token, profileFile);
      setBackendUser(res.user);
      setPhotoSuccess('Profile photo updated successfully.');
      setProfileFile(null);
    } catch (err: any) {
      setPhotoError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleCoverPhotoUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !coverFile) return;
    setCoverUploading(true);
    setCoverError(null);
    setCoverSuccess(null);
    try {
      const res = await uploadCoverPhoto(token, coverFile);
      setBackendUser(res.user);
      setCoverSuccess('Cover photo updated successfully.');
      setCoverFile(null);
    } catch (err: any) {
      setCoverError(err.message);
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleMedicalReportUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !reportTypeDraft || !reportFile) return;
    setReportUploading(true);
    setReportUploadError(null);
    setReportUploadSuccess(null);
    try {
      const res = await uploadMyMedicalReport(token, reportTypeDraft, reportFile, reportSummary || undefined);
      // Replace or append report in list
      setReports(prev => {
        const idx = prev.findIndex(r => r.report_type === res.report.report_type);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = res.report;
          return copy;
        }
        return [res.report, ...prev];
      });
      setReportUploadSuccess('Medical report uploaded successfully.');
      setReportFile(null);
      setReportSummary('');
    } catch (err:any) {
      setReportUploadError(err.message);
    } finally {
      setReportUploading(false);
    }
  }

  

  return (
    <div className="container-max py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-6">Profile</h1>
      {!session && (
        <p className="text-sm text-slate-600 dark:text-slate-300">You are not signed in.</p>
      )}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="space-y-6 lg:col-span-2">
            <section className="card">
            <h2 className="text-lg font-medium mb-4">Application Account</h2>
            <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
              <li><span className="font-semibold">Name:</span> {appUser?.name || '—'}</li>
              <li><span className="font-semibold">Email:</span> {appUser?.email}</li>
              <li><span className="font-semibold">Role:</span> {appUser?.role || 'GUEST'}</li>
              <li><span className="font-semibold">User ID:</span> {appUser?.id}</li>
            </ul>
            </section>
            
           
            { ((backendUser?.role === 'DONOR' || backendUser?.role === 'PATIENT') || (appUser?.role === 'DONOR' || appUser?.role === 'PATIENT')) && (
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                {(backendUser?.role === 'DONOR' || appUser?.role === 'DONOR') && (
                  <a href="/register-donor" className="rounded-xl border border-primary/30 px-3 py-2 hover:bg-primary/10 transition">Register Donor Profile</a>
                )}
                {(backendUser?.role === 'PATIENT' || appUser?.role === 'PATIENT') && (
                  <a href="/register-patient" className="rounded-xl border border-primary/30 px-3 py-2 hover:bg-primary/10 transition">Register Patient Profile</a>
                )}
              </div>
            </section>
          )}
            
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Contact Details</h2>
              {contactError && <p className="text-xs text-red-600 mb-2">{contactError}</p>}
              {contactSuccess && <p role="alert" className="text-xs text-green-600 mb-2">{contactSuccess}</p>}
              {contactLoading && <p className="text-sm">Loading contact…</p>}
              {!contactLoading && (
                <form onSubmit={handleContactSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Phone <span className="text-red-600">*</span></label>
                      <input value={contactDraft.phone || ''} onChange={e=>updateContactDraft('phone', e.target.value)} required aria-required="true" className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Alt. Phone</label>
                      <input value={contactDraft.alt_phone || ''} onChange={e=>updateContactDraft('alt_phone', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">WhatsApp</label>
                      <input value={contactDraft.whatsapp || ''} onChange={e=>updateContactDraft('whatsapp', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Secondary Email</label>
                      <input type="email" value={contactDraft.secondary_email || ''} onChange={e=>updateContactDraft('secondary_email', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Address Line 1</label>
                    <input value={contactDraft.address_line1 || ''} onChange={e=>updateContactDraft('address_line1', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Address Line 2</label>
                    <input value={contactDraft.address_line2 || ''} onChange={e=>updateContactDraft('address_line2', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">City</label>
                      <input value={contactDraft.city || ''} onChange={e=>updateContactDraft('city', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">State</label>
                      <input value={contactDraft.state || ''} onChange={e=>updateContactDraft('state', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Postal Code</label>
                      <input value={contactDraft.postal_code || ''} onChange={e=>updateContactDraft('postal_code', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Country <span className="text-red-600">*</span></label>
                      <select
                        value={contactDraft.country || ''}
                        onChange={e=>updateContactDraft('country', e.target.value || null)}
                        required aria-required="true" className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm"
                      >
                        <option value="">-- Select Country --</option>
                        {COUNTRY_OPTIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Preferred Contact Method</label>
                      <input value={contactDraft.preferred_contact_method || ''} onChange={e=>updateContactDraft('preferred_contact_method', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="PHONE / EMAIL / WHATSAPP" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Organization / Hospital</label>
                      <input value={contactDraft.organization_name || ''} onChange={e=>updateContactDraft('organization_name', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Specialty</label>
                      <input value={contactDraft.specialty || ''} onChange={e=>updateContactDraft('specialty', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Website</label>
                    <input value={contactDraft.website || ''} onChange={e=>updateContactDraft('website', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="https://" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Emergency Contact Name</label>
                      <input value={contactDraft.emergency_contact_name || ''} onChange={e=>updateContactDraft('emergency_contact_name', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Emergency Contact Phone</label>
                      <input value={contactDraft.emergency_contact_phone || ''} onChange={e=>updateContactDraft('emergency_contact_phone', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                  </div>
                  <button disabled={contactSaving} className="btn disabled:opacity-50" type="submit">{contactSaving ? 'Saving…' : 'Save Contact'}</button>
                </form>
              )}
            </section>
          </div>
          <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start space-y-6">
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Profile & Cover Photos</h2>
              {!backendUser && <p className="text-sm">Loading user…</p>}
              {backendUser && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Current Photos</h3>
                    <div className="flex items-center gap-6">
                      <div className="space-y-2">
                        <div className="text-xs text-slate-600 dark:text-slate-300">Profile</div>
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200">
                          {backendUser.profile_photo_url ? (
                            <img src={backendUser.profile_photo_url} alt="Profile photo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">No photo</div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-slate-600 dark:text-slate-300">Cover</div>
                        <div className="w-48 h-16 rounded overflow-hidden bg-slate-200">
                          {backendUser.cover_photo_url ? (
                            <img src={backendUser.cover_photo_url} alt="Cover photo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">No cover</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleProfilePhotoUpload} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Upload Profile Photo</label>
                        <input type="file" accept="image/*" onChange={e=>setProfileFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
                      </div>
                      {photoError && <p className="text-xs text-red-600">{photoError}</p>}
                      {photoSuccess && <p className="text-xs text-green-600">{photoSuccess}</p>}
                      <button disabled={photoUploading || !profileFile} className="btn disabled:opacity-50" type="submit">{photoUploading ? 'Uploading…' : 'Save Profile Photo'}</button>
                    </form>
                    <form onSubmit={handleCoverPhotoUpload} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Upload Cover Photo</label>
                        <input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
                      </div>
                      {coverError && <p className="text-xs text-red-600">{coverError}</p>}
                      {coverSuccess && <p className="text-xs text-green-600">{coverSuccess}</p>}
                      <button disabled={coverUploading || !coverFile} className="btn disabled:opacity-50" type="submit">{coverUploading ? 'Uploading…' : 'Save Cover Photo'}</button>
                    </form>
                  </div>
                </div>
              )}
            </section>
            { roleEffective === 'PATIENT' && (
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Patient Medical Reports</h2>
              {reportsError && <p className="text-xs text-red-600 mb-2">{reportsError}</p>}
              {reportsLoading && <p className="text-sm">Loading reports…</p>}
              {!reportsLoading && (
                <div className="space-y-4">
                  <form onSubmit={handleMedicalReportUpload} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Report Type <span className="text-red-600">*</span></label>
                      <select value={reportTypeDraft} onChange={e=>setReportTypeDraft(e.target.value)} required className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                        <option value="">-- Select Report Type --</option>
                        {medicalReportTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">File <span className="text-red-600">*</span></label>
                      <input type="file" accept=".pdf,image/*" onChange={e=>setReportFile(e.target.files?.[0] || null)} required className="block w-full text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Summary (optional)</label>
                      <textarea value={reportSummary} onChange={e=>setReportSummary(e.target.value)} rows={2} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    {reportUploadError && <p className="text-xs text-red-600">{reportUploadError}</p>}
                    {reportUploadSuccess && <p className="text-xs text-green-600">{reportUploadSuccess}</p>}
                    <button disabled={reportUploading || !reportTypeDraft || !reportFile} className="btn disabled:opacity-50" type="submit">{reportUploading ? 'Uploading…' : 'Upload Report'}</button>
                  </form>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Uploaded Reports</h3>
                    {reports.length === 0 && <p className="text-xs text-slate-500">No reports uploaded yet.</p>}
                    <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                      {reports.map(r => (
                        <li key={r.id} className="text-xs flex justify-between items-center gap-2 border rounded px-2 py-1 bg-white/50 dark:bg-neutral-800/40">
                          <div className="flex-1">
                            <p className="font-medium truncate" title={r.report_type}>{r.report_type}</p>
                            {r.summary && <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate" title={r.summary}>{r.summary}</p>}
                            {r.data?.file_url && <a href={r.data.file_url} target="_blank" rel="noopener" className="text-primary text-[11px] underline">View File</a>}
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
            )}
            { roleEffective === 'PATIENT' && (
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Patient Clinical Profile</h2>
                {!token && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">Backend token missing. Please sign out and sign in again to acquire a backend token to create/update your patient profile.</p>
                )}
                {patientLoading && <p className="text-sm">Loading patient profile…</p>}
                {patientError && <p className="text-xs text-red-600 mb-2">{patientError}</p>}
                {(!patientLoading && patient && patient.is_complete) && (
                  <div className="space-y-3 text-sm">
                    <p className="text-green-700 dark:text-green-400 font-semibold">Profile Complete</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><span className="font-semibold">Patient Code:</span> {patient.patient_code || '—'}</div>
                      <div><span className="font-semibold">Full Name:</span> {patient.full_name}</div>
                      <div><span className="font-semibold">Age:</span> {patient.age ?? '—'}</div>
                      <div><span className="font-semibold">Sex:</span> {patient.sex ?? '—'}</div>
                      <div><span className="font-semibold">Blood Group:</span> {patient.blood_group ?? '—'}</div>
                      <div><span className="font-semibold">Rh Factor:</span> {patient.rh_factor ?? '—'}</div>
                      <div><span className="font-semibold">HLA Typing:</span> {patient.hla_typing?.join(', ') || '—'}</div>
                      <div><span className="font-semibold">Crossmatch:</span> {patient.crossmatch_result}</div>
                      <div><span className="font-semibold">DSA:</span> {patient.dsa ?? '—'}</div>
                      <div><span className="font-semibold">PRA Score:</span> {patient.pra_score ?? '—'}</div>
                      <div><span className="font-semibold">Creatinine:</span> {patient.current_creatinine ?? '—'}</div>
                      <div><span className="font-semibold">GFR:</span> {patient.gfr ?? '—'}</div>
                      <div><span className="font-semibold">Urea:</span> {patient.urea_level ?? '—'}</div>
                      <div><span className="font-semibold">Risk Factors:</span> {[patient.diabetes ? 'Diabetes' : null, patient.hypertension ? 'Hypertension' : null].filter(Boolean).join(', ') || '—'}</div>
                      <div><span className="font-semibold">Infections:</span> {[`HIV: ${patient.hiv_status || '—'}`, `HBV: ${patient.hbv_status || '—'}`, `HCV: ${patient.hcv_status || '—'}`].join(' | ')}</div>
                      <div><span className="font-semibold">History:</span> {[`Previous transplant: ${patient.previous_transplant ? 'Yes' : 'No'}`, `Rejection history: ${patient.rejection_history ? 'Yes' : 'No'}`].join(' | ')}</div>
                      <div className="md:col-span-2"><span className="font-semibold">Diagnosis:</span> {patient.diagnosis ?? '—'}</div>
                      <div><span className="font-semibold">Urgent Level:</span> {patient.urgent_level}</div>
                      <div><span className="font-semibold">Location:</span> {patient.location ?? '—'}</div>
                    </div>
                    <button onClick={()=>setPatient((prev: any)=> ({...prev, is_complete:false}))} className="btn">Edit Profile</button>
                  </div>
                )}
                {(!patientLoading && (!patient || !patient.is_complete)) && (
                  <form onSubmit={handlePatientSave} className="space-y-4">
                    {!patient && <p className="text-xs text-slate-600">Complete and save to create your patient profile.</p>}
                    {patientSuccess && <p role="alert" className="text-xs text-green-600">{patientSuccess}</p>}
                    <div>
                      <label className="block text-xs font-medium mb-1">Full Name <span className="text-red-600">*</span></label>
                      <input value={patientDraft.full_name || ''} onChange={e=>updatePatientDraft('full_name', e.target.value)} required aria-required="true" className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Age</label>
                        <input type="number" min={0} max={120} value={patientDraft.age ?? ''} onChange={e=>updatePatientDraft('age', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Sex</label>
                        <select value={patientDraft.sex || ''} onChange={e=>updatePatientDraft('sex', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                          <option value="">--</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Blood Group</label>
                        <select value={patientDraft.blood_group || ''} onChange={e=>updatePatientDraft('blood_group', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                          <option value="">--</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Urgent Level</label>
                        <select value={patientDraft.urgent_level || ''} onChange={e=>updatePatientDraft('urgent_level', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                          <option value="">--</option>
                          {['LOW','MEDIUM','HIGH','CRITICAL'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Rh Factor</label>
                        <select value={patientDraft.rh_factor || ''} onChange={e=>updatePatientDraft('rh_factor', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                          <option value="">--</option>
                          <option value="NEGATIVE">Negative</option>
                          <option value="POSITIVE">Positive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">DSA</label>
                        <select value={patientDraft.dsa || ''} onChange={e=>updatePatientDraft('dsa', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                          <option value="">--</option>
                          <option value="NEGATIVE">Negative</option>
                          <option value="POSITIVE">Positive</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">HLA Typing (comma separated)</label>
                      <input value={hlaInput} onChange={e=>setHlaInput(e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" placeholder="A1, A2, B8, DR3" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Crossmatch Result</label>
                        <select value={patientDraft.crossmatch_result || ''} onChange={e=>updatePatientDraft('crossmatch_result', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                          <option value="">--</option>
                          <option value="NEGATIVE">Negative</option>
                          <option value="POSITIVE">Positive</option>
                          <option value="UNKNOWN">Unknown</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">PRA Score</label>
                        <input type="number" min={0} max={100} value={patientDraft.pra_score ?? ''} onChange={e=>updatePatientDraft('pra_score', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Location</label>
                        <input value={patientDraft.location || ''} onChange={e=>updatePatientDraft('location', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Current Creatinine</label>
                        <input type="number" step="0.01" value={patientDraft.current_creatinine ?? ''} onChange={e=>updatePatientDraft('current_creatinine', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">GFR</label>
                        <input type="number" step="0.01" value={patientDraft.gfr ?? ''} onChange={e=>updatePatientDraft('gfr', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Urea</label>
                      <input type="number" step="0.01" value={patientDraft.urea_level ?? ''} onChange={e=>updatePatientDraft('urea_level', e.target.value ? Number(e.target.value) : null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Risk Factors</h3>
                      <div className="flex items-center gap-6 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={!!patientDraft.diabetes} onChange={e=>updatePatientDraft('diabetes', e.target.checked)} />
                          <span>Diabetes</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={!!patientDraft.hypertension} onChange={e=>updatePatientDraft('hypertension', e.target.checked)} />
                          <span>Hypertension</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Infection Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">HIV</label>
                          <select value={patientDraft.hiv_status || ''} onChange={e=>updatePatientDraft('hiv_status', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                            <option value="">--</option>
                            <option value="NEGATIVE">Negative</option>
                            <option value="POSITIVE">Positive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">HBV</label>
                          <select value={patientDraft.hbv_status || ''} onChange={e=>updatePatientDraft('hbv_status', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                            <option value="">--</option>
                            <option value="NEGATIVE">Negative</option>
                            <option value="POSITIVE">Positive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">HCV</label>
                          <select value={patientDraft.hcv_status || ''} onChange={e=>updatePatientDraft('hcv_status', e.target.value || null)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                            <option value="">--</option>
                            <option value="NEGATIVE">Negative</option>
                            <option value="POSITIVE">Positive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">History</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Previous transplant?</label>
                          <select value={typeof patientDraft.previous_transplant === 'boolean' ? (patientDraft.previous_transplant ? 'YES' : 'NO') : ''} onChange={e=>updatePatientDraft('previous_transplant', e.target.value === 'YES')} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                            <option value="">--</option>
                            <option value="NO">No</option>
                            <option value="YES">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Rejection history?</label>
                          <select value={typeof patientDraft.rejection_history === 'boolean' ? (patientDraft.rejection_history ? 'YES' : 'NO') : ''} onChange={e=>updatePatientDraft('rejection_history', e.target.value === 'YES')} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm">
                            <option value="">--</option>
                            <option value="NO">No</option>
                            <option value="YES">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Diagnosis</label>
                      <textarea value={patientDraft.diagnosis || ''} onChange={e=>updatePatientDraft('diagnosis', e.target.value)} className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-800 text-sm" rows={3} />
                    </div>
                    <button disabled={patientSaving} className="btn disabled:opacity-50" type="submit">{patientSaving ? (patient ? 'Updating…' : 'Creating…') : (patient ? 'Save Changes' : 'Create Profile')}</button>
                  </form>
                )}
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
