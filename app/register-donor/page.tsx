export const metadata = {
  title: 'Register Donor – LifeLink',
  description: 'Unified donor registration for blood or kidney donors.'
};

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DonorRegisterForm = dynamic(() => import('@/components/DonorRegisterForm'), { ssr: false });

function RegistrationInner() {
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const preset = (search?.get('type') === 'KIDNEY' ? 'KIDNEY' : (search?.get('type') === 'BLOOD' ? 'BLOOD' : undefined));
  return <DonorRegisterForm presetType={preset} />;
}

export default function RegisterDonorPage() {
  return (
    <main className="relative">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="container-max relative pb-12 pt-20">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-slate-100">Register as a Donor</h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">Choose donor type (Blood or Kidney) and provide identity details. Kidney donors can add advanced compatibility info later. Blood donors appear in the public blood bank listing when available.</p>
              <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-medium">Blood donors:</span> Quick eligibility with ABO/Rh; ideal for immediate transfusion needs.</p>
                <p><span className="font-medium">Kidney donors:</span> Start with basics, later enrich with HLA typing and crossmatch for better matches.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/register-donor?type=BLOOD" className="btn">Blood Donor Form</a>
                <a href="/register-donor?type=KIDNEY" className="btn bg-emerald-600 text-white hover:bg-emerald-700">Kidney Donor Form</a>
              </div>
            </div>
            <div className="relative">
              <Suspense fallback={<div className='rounded-xl border border-slate-200 p-6 dark:border-white/10'>Loading form…</div>}>
                <RegistrationInner />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
