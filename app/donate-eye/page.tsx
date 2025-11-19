export const metadata = {
  title: 'Donate Eyes – LifeLink',
  description: 'Register as an eye donor and help restore sight to those in need.'
};

import dynamic from 'next/dynamic';
const DonorRegisterForm = dynamic(() => import('@/components/DonorRegisterForm'), { ssr: false });

export default function DonateEyePage() {
  return (
    <main className="relative">
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950">
        <div className="container-max relative pb-16 pt-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-slate-100">Become an Eye Donor</h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                Your gift of sight can change lives. Register as an eye donor and provide basic information to help patients awaiting corneal transplants.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#register" className="btn bg-blue-600 text-white hover:bg-blue-700">Register Now</a>
                <a href="/eye-matching" className="btn">View Matching</a>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
                <svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-auto w-64">
                  <defs>
                    <linearGradient id="eyeGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <circle cx="110" cy="70" r="40" fill="url(#eyeGradient)" />
                  <circle cx="110" cy="70" r="20" fill="white" />
                  <circle cx="110" cy="70" r="10" fill="url(#eyeGradient)" />
                </svg>
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">One pair of eyes can help up to 2 people see again.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="register" className="container-max py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Register as an Eye Donor</h2>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Provide your identity and optional blood group for preliminary compatibility. Medical details for corneal suitability can be added later via secure updates.</p>
        <div className="mt-6"><DonorRegisterForm presetType="EYE" /></div>
      </section>
    </main>
  );
}