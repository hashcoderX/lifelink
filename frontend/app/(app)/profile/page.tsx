"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import { backendMe, backendUpdateMe, getMyContact, updateMyContact, ContactPayload, uploadProfilePhoto, uploadCoverPhoto, getMyMedicalReports, uploadMyMedicalReport, getMyDonor, updateDonor, DonorPayload, getMyDonorMedicalReports, uploadMyDonorMedicalReport } from '@/lib/backend';

const COUNTRY_OPTIONS = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South',
  'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
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

  const [donor, setDonor] = useState<any>(null);
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState<string | null>(null);
  const [donorDraft, setDonorDraft] = useState<DonorPayload>({ full_name: '' });
  const [donorHlaInput, setDonorHlaInput] = useState<string>('');
  const [donorSaving, setDonorSaving] = useState(false);

  const [contact, setContact] = useState<any>(null);
  const [contactDraft, setContactDraft] = useState<ContactPayload>({});
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const medicalReportTypes = [
    'Other Report',
    'Blood Group (ABO Typing)',
    'HLA Typing (Human Leukocyte Antigen)',
    'PRA Text Report',
    'Crossmatch Report',
    'Kidney Function Report',
    'Infaction Screening Report'
  ];
  const [donorReports, setDonorReports] = useState<any[]>([]);
  const [donorReportsLoading, setDonorReportsLoading] = useState(false);
  const [donorReportsError, setDonorReportsError] = useState<string | null>(null);
  const [donorReportTypeDraft, setDonorReportTypeDraft] = useState('');
  const [donorReportFile, setDonorReportFile] = useState<File | null>(null);
  const [donorReportSummary, setDonorReportSummary] = useState('');
  const [donorReportUploading, setDonorReportUploading] = useState(false);
  const [donorReportUploadSuccess, setDonorReportUploadSuccess] = useState<string | null>(null);
  const [donorReportUploadError, setDonorReportUploadError] = useState<string | null>(null);

  const appUser = session?.user as any;
  const roleEffective = (backendUser?.role || appUser?.role || 'GUEST') as string;
  const isDonorRole = ['DONOR', 'DONER'].includes((roleEffective || '').toUpperCase());
  const isDonerRole = (roleEffective || '').toUpperCase() === 'DONER';
  const isDoctorRole = (roleEffective || '').toUpperCase() === 'DOCTOR';

  useEffect(() => {
    let cancelled = false;
    if (token) {
      backendMe(token)
        .then(r => { if (!cancelled) setBackendUser(r.user); })
        .catch(e => { if (!cancelled) setError(e.message); });
    }
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (backendUser) {
      setNameDraft(backendUser.name || '');
      setRoleDraft(backendUser.role || (session?.user as any)?.role || 'GUEST');
    }
  }, [backendUser, session]);

  useEffect(() => {
    let cancelled = false;
    if (token && backendUser) {
      setContactLoading(true);
      getMyContact(token)
        .then(r => { if (!cancelled) { setContact(r.contact); if (r.contact) setContactDraft(r.contact as any); } })
        .catch(e => { if (!cancelled) setContactError(e.message); })
        .finally(() => { if (!cancelled) setContactLoading(false); });
    }
    return () => { cancelled = true; };
  }, [token, backendUser]);

  useEffect(() => {
    let cancelled = false;
    if (token && isDonorRole) {
      setDonorLoading(true);
      getMyDonor(token)
        .then(r => { if (!cancelled) { setDonor(r.donor); setDonorDraft(r.donor || { full_name: backendUser?.name || '' }); setDonorHlaInput(r.donor?.hla_typing?.join(', ') || ''); }})
        .catch(e => { if (!cancelled) setDonorError(e.message); })
        .finally(() => { if (!cancelled) setDonorLoading(false); });
    }
    return () => { cancelled = true; };
  }, [token, isDonorRole, backendUser]);

  useEffect(() => {
    let cancelled = false;
    if (token && backendUser?.donor && isDonorRole) {
      setDonorReportsLoading(true);
      getMyDonorMedicalReports(token)
        .then(r => { if (!cancelled) setDonorReports(r.reports); })
        .catch(e => { if (!cancelled) setDonorReportsError(e.message); })
        .finally(() => { if (!cancelled) setDonorReportsLoading(false); });
    }
    return () => { cancelled = true; };
  }, [token, backendUser, isDonorRole]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload: { name?: string; role?: string } = {};
      if (nameDraft.trim() !== (backendUser?.name || '')) payload.name = nameDraft.trim();
      if (roleDraft && roleDraft !== (backendUser?.role || '')) payload.role = roleDraft;
      if (Object.keys(payload).length === 0) { setSaving(false); return; }
      const res = await backendUpdateMe(token, payload);
      setBackendUser(res.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function updateDonorDraft(field: keyof DonorPayload, value: any) {
    setDonorDraft(prev => ({ ...prev, [field]: value === '' ? null : value }));
  }

  async function handleDonorSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setDonorSaving(true);
    setDonorError(null);
    try {
      const payload: Partial<DonorPayload> = { ...donorDraft };
      payload.hla_typing = donorHlaInput ? donorHlaInput.split(',').map(s=>s.trim()).filter(Boolean) : [];
      if (!donor) {
        const created = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/donors`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
        });
        if (!created.ok) throw new Error(await created.text());
        const data = await created.json();
        setDonor(data);
      } else {
        const updated: any = await updateDonor(token, donor.id, payload);
        setDonor(updated as any);
      }
    } catch (err: any) {
      setDonorError(err.message);
    } finally {
      setDonorSaving(false);
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
    e.preventDefault(); if (!token || !profileFile) return;
    const res = await uploadProfilePhoto(token, profileFile);
    setBackendUser(res.user); setProfileFile(null);
  }

  async function handleCoverPhotoUpload(e: React.FormEvent) {
    e.preventDefault(); if (!token || !coverFile) return;
    const res = await uploadCoverPhoto(token, coverFile);
    setBackendUser(res.user); setCoverFile(null);
  }

  async function handleDonorMedicalReportUpload(e: React.FormEvent) {
    e.preventDefault(); if (!token || !donorReportTypeDraft || !donorReportFile) return;
    const res = await uploadMyDonorMedicalReport(token, donorReportTypeDraft, donorReportFile, donorReportSummary || undefined);
    setDonorReports(prev => [res.report, ...prev]); setDonorReportFile(null); setDonorReportSummary('');
  }

  return (
    <div className="container-max py-16">
      <h1 className="text-3xl font-semibold">Profile</h1>
      {!session && <p className="text-sm">You are not signed in.</p>}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="space-y-6 lg:col-span-2">
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Application Account</h2>
              <ul className="text-sm space-y-1">
                <li><span className="font-semibold">Name:</span> {(session.user as any)?.name || '—'}</li>
                <li><span className="font-semibold">Email:</span> {(session.user as any)?.email}</li>
                <li><span className="font-semibold">Role:</span> {roleEffective}</li>
              </ul>
              {isDonerRole && (
                <div className="mt-4">
                  <Link href="/donate-blood" className="btn">Donate My Ogans</Link>
                </div>
              )}
              {isDoctorRole && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/patients" className="btn">Register Patient</Link>
                  <Link href="/kidney-matching" className="btn">Access Maching System</Link>
                </div>
              )}
            </section>


          </div>

          <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start space-y-6">
            <section className="card">
              <h2 className="text-lg font-medium mb-4">Contact Details</h2>
              {contactError && <p className="text-xs text-red-600 mb-2">{contactError}</p>}
              {contactSuccess && <p role="alert" className="text-xs text-green-600 mb-2">{contactSuccess}</p>}
              {contactLoading && <p className="text-sm">Loading contact…</p>}
              {!contactLoading && (
                <form onSubmit={handleContactSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Phone</label>
                    <input value={contactDraft.phone || ''} onChange={e=>updateContactDraft('phone', e.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Country</label>
                    <select value={contactDraft.country || ''} onChange={e=>updateContactDraft('country', e.target.value || null)} className="w-full rounded border px-3 py-2 text-sm">
                      <option value="">-- Select Country --</option>
                      {COUNTRY_OPTIONS.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  {isDonorRole && (
                    <div>
                      <label className="block text-xs font-medium mb-1">Location</label>
                      <input
                        value={contactDraft.location || ''}
                        onChange={e=>updateContactDraft('location', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        placeholder="City / Area"
                      />
                    </div>
                  )}
                  <button className="btn" type="submit">Save Contact</button>
                </form>
              )}
            </section>

            {roleEffective === 'PATIENT' && (
              <section className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Patient Profile</h2>
                  <Link href="/update-patient" className="btn">Update Patient Profile</Link>
                </div>
              </section>
            )}

            {isDonorRole && (
              <section className="card">
                <h2 className="text-lg font-medium mb-4">Donor Medical Reports</h2>
                <form onSubmit={handleDonorMedicalReportUpload} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Report Type</label>
                      <select value={donorReportTypeDraft} onChange={e=>setDonorReportTypeDraft(e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                        <option value="">-- Select Report --</option>
                        {medicalReportTypes.map(t => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Choose File</label>
                      <input type="file" accept=".pdf,image/*" onChange={e=>setDonorReportFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Summary (optional)</label>
                    <textarea value={donorReportSummary} onChange={e=>setDonorReportSummary(e.target.value)} rows={3} className="w-full rounded border px-3 py-2 text-sm" />
                  </div>
                  <button className="btn" type="submit">Upload Report</button>
                </form>
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Uploaded Reports</h3>
                  {donorReports.length === 0 ? (
                    <p className="text-sm">No reports uploaded yet.</p>
                  ) : (
                    <ul className="text-sm divide-y">
                      {donorReports.map((r:any) => (
                        <li key={`${r.report_type}-${r.id}`} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{r.report_type}</div>
                            {r.summary && <div className="text-xs">{r.summary}</div>}
                          </div>
                          <a href={r.file_url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">View</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
