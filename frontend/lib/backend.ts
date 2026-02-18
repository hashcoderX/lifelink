const RAW_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '');

export type Sex = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodGroup = 'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-';
export type CrossmatchResult = 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';
export type UrgentLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DonorPayload = {
  donor_code?: string | null;
  full_name: string;
  age?: number | null;
  // Optional account creation for donor
  new_user_email?: string | null;
  new_user_password?: string | null;
  sex?: Sex | null;
  blood_group?: BloodGroup | null;
  rh_factor?: 'POSITIVE' | 'NEGATIVE' | null;
  hla_typing?: string[] | null;
  crossmatch_result?: CrossmatchResult | null;
  dsa?: 'POSITIVE' | 'NEGATIVE' | null;
  pra_score?: number | null;
  creatinine_level?: number | null;
  gfr?: number | null;
  urea_level?: number | null;
  infectious_test_results?: string[] | null;
  medical_history?: string | null;
  location?: string | null;
  availability?: boolean;
  // New clinical fields
  bmi?: number | null;
  diabetes?: boolean | null;
  hypertension?: boolean | null;
  rejection_history?: boolean | null;
  previous_transplant?: boolean | null;
};

export type PatientPayload = {
  patient_code?: string | null;
  full_name: string;
  // New account creation (optional for registry staff to create login for patient)
  new_user_email?: string | null;
  new_user_password?: string | null;
  age?: number | null;
  sex?: Sex | null;
  blood_group?: BloodGroup | null;
  rh_factor?: 'POSITIVE' | 'NEGATIVE' | null;
  hla_typing?: string[] | null;
  crossmatch_result?: CrossmatchResult | null;
  dsa?: 'POSITIVE' | 'NEGATIVE' | null;
  pra_score?: number | null;
  current_creatinine?: number | null;
  gfr?: number | null;
  urea_level?: number | null;
  bmi?: number | null;
  diagnosis?: string | null;
  urgent_level?: UrgentLevel | null;
  location?: string | null;
  diabetes?: boolean | null;
  hypertension?: boolean | null;
  hiv_status?: 'POSITIVE' | 'NEGATIVE' | null;
  hbv_status?: 'POSITIVE' | 'NEGATIVE' | null;
  hcv_status?: 'POSITIVE' | 'NEGATIVE' | null;
  previous_transplant?: boolean | null;
  rejection_history?: boolean | null;
};

export type ContactPayload = {
  phone?: string | null;
  alt_phone?: string | null;
  whatsapp?: string | null;
  secondary_email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  location?: string | null;
  organization_name?: string | null;
  specialty?: string | null;
  website?: string | null;
  preferred_contact_method?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function backendLogin(email: string, password: string) {
  return apiFetch<{ user: any; token: string }>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function backendRegister(name: string, email: string, password: string, role?: string) {
  return apiFetch<{ user: any; token: string }>(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function createDonor(token: string, payload: DonorPayload) {
  return apiFetch(`/api/donors`, { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function createPatient(token: string, payload: PatientPayload) {
  return apiFetch(`/api/patients`, { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function getMyPatient(token: string) {
  return apiFetch<{ patient: any }>(`/api/patient/me`, { method: 'GET' }, token);
}

export async function updatePatient(token: string, id: number, updates: Partial<PatientPayload>) {
  return apiFetch(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(updates) }, token);
}

export async function getMyDonor(token: string) {
  return apiFetch<{ donor: any }>(`/api/donor/me`, { method: 'GET' }, token);
}

export async function updateDonor(token: string, id: number, updates: Partial<DonorPayload>) {
  return apiFetch(`/api/donors/${id}`, { method: 'PUT', body: JSON.stringify(updates) }, token);
}

export async function getMyContact(token: string) {
  return apiFetch<{ contact: any }>(`/api/contact/me`, { method: 'GET' }, token);
}

export async function updateMyContact(token: string, updates: ContactPayload) {
  return apiFetch<{ contact: any }>(`/api/contact/me`, { method: 'PUT', body: JSON.stringify(updates) }, token);
}

export async function backendMe(token: string) {
  return apiFetch<{ user: any }>(`/api/auth/me`, { method: 'GET' }, token);
}

export async function backendUpdateMe(token: string, updates: { name?: string | null; role?: string | null }) {
  return apiFetch<{ user: any }>(`/api/auth/me`, { method: 'PUT', body: JSON.stringify(updates) }, token);
}

export async function uploadProfilePhoto(token: string, file: File) {
  const form = new FormData();
  form.append('photo', file);
  const res = await fetch(`${BACKEND_URL}/api/auth/me/photo`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ user: any }>;
}

export async function uploadCoverPhoto(token: string, file: File) {
  const form = new FormData();
  form.append('cover', file);
  const res = await fetch(`${BACKEND_URL}/api/auth/me/cover`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ user: any }>;
}

export async function getMyMedicalReports(token: string) {
  return apiFetch<{ reports: any[] }>(`/api/medical-reports/me`, { method: 'GET' }, token);
}

export async function uploadMyMedicalReport(token: string, report_type: string, file: File, summary?: string) {
  const form = new FormData();
  form.append('report_type', report_type);
  form.append('file', file);
  if (summary) form.append('summary', summary);
  const res = await fetch(`${BACKEND_URL}/api/medical-reports/me/upload`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ report: any }>;
}

export async function getMyDonorMedicalReports(token: string) {
  return apiFetch<{ reports: any[] }>(`/api/medical-reports/me-donor`, { method: 'GET' }, token);
}

export async function uploadMyDonorMedicalReport(token: string, report_type: string, file: File, summary?: string) {
  const form = new FormData();
  form.append('report_type', report_type);
  form.append('file', file);
  if (summary) form.append('summary', summary);
  const res = await fetch(`${BACKEND_URL}/api/medical-reports/me-donor/upload`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ report: any }>;
}

export type AnalyzeReportResult = {
  status: string;
  ocr_text: string;
  ai_analysis: string;
  report_id: number;
};

export async function analyzeReport(token: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BACKEND_URL}/api/analyze-report`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<AnalyzeReportResult>;
}
