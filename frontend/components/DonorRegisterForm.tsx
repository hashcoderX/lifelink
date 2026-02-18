"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useBackendToken } from '@/lib/BackendTokenProvider';
import { BACKEND_URL } from '@/lib/backend';

export default function DonorRegisterForm({ presetType }: { presetType?: 'BLOOD' | 'KIDNEY' | 'EYE' }) {
  const { data: session } = useSession();
  const { token } = useBackendToken();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [rhFactor, setRhFactor] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [donorType, setDonorType] = useState<'BLOOD' | 'KIDNEY' | 'EYE'>(presetType || 'BLOOD');
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [frontDragActive, setFrontDragActive] = useState(false);
  const [backDragActive, setBackDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // Additional fields
  const [age, setAge] = useState('');
  const [bmi, setBmi] = useState('');
  const [hlaTyping, setHlaTyping] = useState('');
  const [crossmatchResult, setCrossmatchResult] = useState('');
  const [sex, setSex] = useState('');
  const [praScore, setPraScore] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [gfr, setGfr] = useState('');
  const [urea, setUrea] = useState('');
  const [dsa, setDsa] = useState('');
  const [hivStatus, setHivStatus] = useState('');
  const [hbvStatus, setHbvStatus] = useState('');
  const [hcvStatus, setHcvStatus] = useState('');
  const [diabetes, setDiabetes] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [rejectionHistory, setRejectionHistory] = useState(false);
  const [previousTransplant, setPreviousTransplant] = useState(false);

  const countries = [
    '',
    'Afghanistan',
    'Albania',
    'Algeria',
    'Argentina',
    'Australia',
    'Austria',
    'Bangladesh',
    'Belgium',
    'Brazil',
    'Canada',
    'Chile',
    'China',
    'Colombia',
    'Denmark',
    'Egypt',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Japan',
    'Jordan',
    'Kenya',
    'South Korea',
    'Kuwait',
    'Lebanon',
    'Malaysia',
    'Mexico',
    'Morocco',
    'Netherlands',
    'New Zealand',
    'Norway',
    'Pakistan',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Saudi Arabia',
    'Singapore',
    'South Africa',
    'Spain',
    'Sri Lanka',
    'Sweden',
    'Switzerland',
    'Thailand',
    'Turkey',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Vietnam',
    'Zimbabwe'
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!token) {
      setError('You must be logged in to register as a donor.');
      return;
    }
    
    if ((donorType === 'BLOOD' || donorType === 'EYE') && (!frontFile || !backFile)) { 
      setError('Please choose both front and back of NIC / License'); 
      return; 
    }
    
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('donor_type', donorType);
      form.append('phone', phone);
      if (whatsapp) form.append('whatsapp', whatsapp);
      if (location) form.append('location', location);
      if (country) form.append('country', country);
      if (bloodGroup) form.append('blood_group', bloodGroup);
      if (rhFactor) form.append('rh_factor', rhFactor);
      if (frontFile) form.append('front', frontFile);
      if (backFile) form.append('back', backFile);
      // Additional fields
      if (age) form.append('age', age);
      if (bmi) form.append('bmi', bmi);
      if (donorType === 'KIDNEY') {
        if (sex) form.append('sex', sex);
        if (hlaTyping) {
          // Accept comma or space separated, store as array
          const hlaArr = hlaTyping.split(/[,\s]+/).filter(Boolean);
          form.append('hla_typing', JSON.stringify(hlaArr));
        }
        if (crossmatchResult) form.append('crossmatch_result', crossmatchResult);
        if (praScore) form.append('pra_score', praScore);
        if (creatinine) form.append('creatinine_level', creatinine);
        if (gfr) form.append('gfr', gfr);
        if (urea) form.append('urea_level', urea);
        if (dsa) form.append('dsa', dsa);
        form.append('diabetes', diabetes ? '1' : '0');
        form.append('hypertension', hypertension ? '1' : '0');
        form.append('rejection_history', rejectionHistory ? '1' : '0');
        form.append('previous_transplant', previousTransplant ? '1' : '0');
        const infectious = {
          hiv: hivStatus || null,
          hbv: hbvStatus || null,
          hcv: hcvStatus || null,
        };
        form.append('infectious_test_results', JSON.stringify(infectious));
      }
      const res = await fetch(`${BACKEND_URL}/api/donors/register`, { 
        method: 'POST', 
        body: form,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  function updateFront(file: File | null) {
    if (!file) { setFrontFile(null); setFrontPreview(null); return; }
    setFrontFile(file);
    if (file.type.startsWith('image/')) {
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setFrontPreview(null);
    }
  }

  function updateBack(file: File | null) {
    if (!file) { setBackFile(null); setBackPreview(null); return; }
    setBackFile(file);
    if (file.type.startsWith('image/')) {
      setBackPreview(URL.createObjectURL(file));
    } else {
      setBackPreview(null);
    }
  }

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Become a {donorType === 'BLOOD' ? 'Blood' : donorType === 'KIDNEY' ? 'Kidney' : 'Eye'} Donor</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload your NIC or Driving License to verify your identity and complete your donor registration.</p>
      
      {!session ? (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">You must be logged in to register as a donor. Please sign in first.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-col gap-3">
            <fieldset className="rounded-md border border-slate-200 p-3 dark:border-white/10">
              <legend className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Donor Type</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="donor_type" value="BLOOD" checked={donorType==='BLOOD'} onChange={()=>setDonorType('BLOOD')} />
                  Blood
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="donor_type" value="KIDNEY" checked={donorType==='KIDNEY'} onChange={()=>setDonorType('KIDNEY')} />
                  Kidney
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="donor_type" value="EYE" checked={donorType==='EYE'} onChange={()=>setDonorType('EYE')} />
                  Eye
                </label>
              </div>
              {donorType==='KIDNEY' && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Kidney donors can still provide blood group for matching but it&apos;s optional.</p>
              )}
            </fieldset>
            
            <div className="rounded-md border border-slate-200 p-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
              {donorType === 'BLOOD' || donorType === 'EYE' ? (
                <ul className="list-disc pl-5">
                  <li>Best for quick donations to local blood banks.</li>
                  <li>Only ABO and Rh are useful; other clinical fields are not required.</li>
                  <li>Your profile appears in the public Blood Bank listing.</li>
                </ul>
              ) : donorType === 'KIDNEY' ? (
                <ul className="list-disc pl-5">
                  <li>Used for kidney transplant matching with patients in need.</li>
                  <li>ABO/Rh help; later you can add crossmatch and HLA typing via secure updates.</li>
                  <li>Your profile is included in the public kidney matching results with limited fields.</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5">
                  <li>Donate eyes to help restore sight for those in need.</li>
                  <li>Basic information required; eyes can be donated after death.</li>
                  <li>Your generosity can give the gift of sight to others.</li>
                </ul>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
                <input id="phone" type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="whatsapp">WhatsApp (optional)</label>
                <input id="whatsapp" type="tel" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="location">Location / City (optional)</label>
                <input id="location" type="text" value={location} onChange={e=>setLocation(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="country">Country (optional)</label>
                <select id="country" value={country} onChange={e=>setCountry(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                  {countries.map(c => <option key={c} value={c}>{c || 'Select Country'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="blood_group">Blood Group (optional)</label>
                <select id="blood_group" value={bloodGroup} onChange={e=>setBloodGroup(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                  <option value="">Select ABO</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="rh_factor">Rh Factor (optional)</label>
                <select id="rh_factor" value={rhFactor} onChange={e=>setRhFactor(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                  <option value="">Select Rh</option>
                  <option value="POSITIVE">Positive (+)</option>
                  <option value="NEGATIVE">Negative (-)</option>
                </select>
              </div>
              
              {donorType === 'BLOOD' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="idfront-input">Front Side (PDF or Image)</label>
                    <input
                      id="idfront-input"
                      className="sr-only"
                      type="file"
                      accept=".pdf,image/*"
                      required
                      onChange={e=>updateFront(e.target.files?.[0]||null)}
                    />
                    <label
                      htmlFor="idfront-input"
                      onDragOver={(e)=>{e.preventDefault(); setFrontDragActive(true);}}
                      onDragLeave={()=>setFrontDragActive(false)}
                      onDrop={(e)=>{e.preventDefault(); setFrontDragActive(false); const f=e.dataTransfer.files?.[0]; if (f) updateFront(f);}}
                      className={`group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 ${frontDragActive ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-dashed border-slate-300 dark:border-white/10'} bg-white p-4 text-center transition hover:border-red-400 dark:bg-slate-800`}
                    >
                      {!frontFile && (
                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 0-3 3m3-3 3 3"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 10.172 4H7A2 2 0 0 0 5 6v12a2 2 0 0 0 2 2Z"/></svg>
                          <span className="text-sm font-medium">Drag & drop or click to upload</span>
                          <span className="text-xs text-slate-400">PDF / JPG / PNG up to 5MB</span>
                        </div>
                      )}
                      {frontFile && (
                        <div className="w-full">
                          {frontPreview ? (
                            <img src={frontPreview} alt="Front preview" className="mx-auto max-h-40 rounded-md object-contain" />
                          ) : (
                            <div className="rounded-md bg-slate-50 p-3 text-xs dark:bg-slate-900/40">
                              <span className="block truncate font-medium">{frontFile.name}</span>
                              <span className="text-[10px] text-slate-500">{frontFile.type || 'File'}</span>
                            </div>
                          )}
                          <p className="mt-2 text-xs text-slate-500">Click or drop to replace</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="idback-input">Back Side (PDF or Image)</label>
                    <input
                      id="idback-input"
                      className="sr-only"
                      type="file"
                      accept=".pdf,image/*"
                      required
                      onChange={e=>updateBack(e.target.files?.[0]||null)}
                    />
                    <label
                      htmlFor="idback-input"
                      onDragOver={(e)=>{e.preventDefault(); setBackDragActive(true);}}
                      onDragLeave={()=>setBackDragActive(false)}
                      onDrop={(e)=>{e.preventDefault(); setBackDragActive(false); const f=e.dataTransfer.files?.[0]; if (f) updateBack(f);}}
                      className={`group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 ${backDragActive ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-dashed border-slate-300 dark:border-white/10'} bg-white p-4 text-center transition hover:border-red-400 dark:bg-slate-800`}
                    >
                      {!backFile && (
                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 0-3 3m3-3 3 3"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 10.172 4H7A2 2 0 0 0 5 6v12a2 2 0 0 0 2 2Z"/></svg>
                          <span className="text-sm font-medium">Drag & drop or click to upload</span>
                          <span className="text-xs text-slate-400">PDF / JPG / PNG up to 5MB</span>
                        </div>
                      )}
                      {backFile && (
                        <div className="w-full">
                          {backPreview ? (
                            <img src={backPreview} alt="Back preview" className="mx-auto max-h-40 rounded-md object-contain" />
                          ) : (
                            <div className="rounded-md bg-slate-50 p-3 text-xs dark:bg-slate-900/40">
                              <span className="block truncate font-medium">{backFile.name}</span>
                              <span className="text-[10px] text-slate-500">{backFile.type || 'File'}</span>
                            </div>
                          )}
                          <p className="mt-2 text-xs text-slate-500">Click or drop to replace</p>
                        </div>
                      )}
                    </label>
                  </div>
                </>
              )}
            </div>
            
            {donorType === 'BLOOD' || donorType === 'EYE' ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="bmi">BMI (optional)</label>
                  <input id="bmi" type="number" step="0.1" value={bmi} onChange={e=>setBmi(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
              </div>
            ) : null}
            
            {donorType === 'KIDNEY' && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="age">Age</label>
                  <input id="age" type="number" required value={age} onChange={e=>setAge(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="bmi">BMI</label>
                  <input id="bmi" type="number" step="0.1" required value={bmi} onChange={e=>setBmi(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="sex">Sex</label>
                  <select id="sex" required value={sex} onChange={e=>setSex(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="hla">HLA Typing (optional)</label>
                  <input id="hla" type="text" value={hlaTyping} onChange={e=>setHlaTyping(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="crossmatch">Crossmatch Result (optional)</label>
                  <select id="crossmatch" value={crossmatchResult} onChange={e=>setCrossmatchResult(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                    <option value="">Select</option>
                    <option value="POSITIVE">Positive</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="pra">PRA Score (optional)</label>
                  <input id="pra" type="number" step="0.1" value={praScore} onChange={e=>setPraScore(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="creatinine">Current Creatinine (optional)</label>
                  <input id="creatinine" type="number" step="0.1" value={creatinine} onChange={e=>setCreatinine(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="gfr">GFR (optional)</label>
                  <input id="gfr" type="number" value={gfr} onChange={e=>setGfr(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="urea">Urea (optional)</label>
                  <input id="urea" type="number" step="0.1" value={urea} onChange={e=>setUrea(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="dsa">DSA (optional)</label>
                  <select id="dsa" value={dsa} onChange={e=>setDsa(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                    <option value="">Select</option>
                    <option value="POSITIVE">Positive</option>
                    <option value="NEGATIVE">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="hiv">HIV Status (optional)</label>
                  <select id="hiv" value={hivStatus} onChange={e=>setHivStatus(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                    <option value="">Select</option>
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="hbv">HBV Status (optional)</label>
                  <select id="hbv" value={hbvStatus} onChange={e=>setHbvStatus(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                    <option value="">Select</option>
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="hcv">HCV Status (optional)</label>
                  <select id="hcv" value={hcvStatus} onChange={e=>setHcvStatus(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800">
                    <option value="">Select</option>
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <fieldset className="rounded-md border border-slate-200 p-3 dark:border-white/10">
                    <legend className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Medical History (optional)</legend>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={diabetes} onChange={e=>setDiabetes(e.target.checked)} />
                        Diabetes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={hypertension} onChange={e=>setHypertension(e.target.checked)} />
                        Hypertension
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={rejectionHistory} onChange={e=>setRejectionHistory(e.target.checked)} />
                        Rejection History
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={previousTransplant} onChange={e=>setPreviousTransplant(e.target.checked)} />
                        Previous Transplant
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            )}
            
            <div>
              <button disabled={submitting} type="submit" className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Register & Upload'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm dark:border-green-700 dark:bg-green-900/30">
          <p className="font-medium">Registration successful!</p>
          <p>User ID: {result.user_id} | Donor ID: {result.donor_id}</p>
          {result.nic_number && <p>Detected NIC: <span className="font-mono">{result.nic_number}</span></p>}
          {(result.ocr_text_front || result.ocr_text_back) && (
            <details className="mt-2">
              <summary className="cursor-pointer text-slate-700 dark:text-slate-300">Show extracted text</summary>
              {result.ocr_text_front && <>
                <p className="mt-2 font-medium">Front</p>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs">{result.ocr_text_front}</pre>
              </>}
              {result.ocr_text_back && <>
                <p className="mt-3 font-medium">Back</p>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs">{result.ocr_text_back}</pre>
              </>}
            </details>
          )}
        </div>
      )}
    </div>
  );
}
