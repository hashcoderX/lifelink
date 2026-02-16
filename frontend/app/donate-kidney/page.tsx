export const metadata = {
  title: 'Donate a Kidney – LifeLink',
  description: 'Register as a kidney donor and help match patients in need with compatible donors.'
};

import dynamic from 'next/dynamic';
const DonorRegisterForm = dynamic(() => import('@/components/DonorRegisterForm'), { ssr: false });

export default function DonateKidneyPage() {
  return (
    <main className="relative">
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-950">
        <div className="container-max relative pb-16 pt-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-slate-100">Become a Kidney Donor</h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                Your decision can change a life. Register as a kidney donor and provide basic compatibility information to help patients searching for a match.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#register" className="btn bg-emerald-600 text-white hover:bg-emerald-700">Register Now</a>
                <a href="/kidney-matching" className="btn">View Matching</a>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
                <svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-auto w-64">
                  <defs>
                    <linearGradient id="kidneyGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#kidneyGradient)" d="M55 15c-15 10-25 30-25 55s10 45 30 50c15 5 30-5 30-20 0-10-5-20-10-25-10-10-15-25-15-40 0-10 5-20 5-25 0-10-10-10-15-5Zm80 0c15 10 25 30 25 55s-10 45-30 50c-15 5-30-5-30-20 0-10 5-20 10-25 10-10 15-25 15-40 0-10-5-20-5-25 0-10 10-10 15-5Z" />
                </svg>
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">One donor can transform a patient’s future.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="register" className="container-max py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Register as a Kidney Donor</h2>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Provide your identity and optional blood group for preliminary compatibility assessment. More advanced data (HLA typing, crossmatch) can be added later via secure medical updates.</p>
        <div className="mt-6"><DonorRegisterForm presetType="KIDNEY" /></div>
      </section>
    </main>
  );
}
