export const metadata = {
  title: 'Donate Blood – LifeLink',
  description: 'Give the gift of life. Learn about eligibility, preparation and how to donate blood safely.',
};

export default function DonateBloodPage() {
  return (
    <main className="relative">
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-white to-white dark:from-rose-950/40 dark:via-slate-950 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <svg className="absolute -top-10 left-1/2 w-[140%] -translate-x-1/2" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,96L48,106.7C96,117,192,139,288,149.3C384,160,480,160,576,149.3C672,139,768,117,864,112C960,107,1056,117,1152,128C1248,139,1344,149,1392,154.7L1440,160V400H0Z" fill="#dc2626" fillOpacity="0.08" />
          </svg>
        </div>
        <div className="container-max relative pb-20 pt-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-slate-100">
                Donate Blood. Save Lives.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                Every donation can help up to three patients. Learn how to prepare, check eligibility, and where to donate.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#eligibility" className="btn">
                  Check Eligibility
                </a>
                <a href="#how-to-donate" className="btn bg-red-600 text-white hover:bg-red-700">
                  How to Donate
                </a>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-red-500/10 blur-2xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-red-400/10 blur-2xl" aria-hidden />
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-auto w-56">
                  <defs>
                    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#g)" d="M100 20c0 0 40 50 40 80s-18 50-40 50-40-20-40-50 40-80 40-80z" />
                </svg>
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">A drop for you, a lifeline for someone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="eligibility" className="container-max py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Who can donate?</h2>
        <ul className="mt-4 grid gap-3 text-slate-600 dark:text-slate-300 md:grid-cols-2">
          <li className="rounded-lg border border-slate-200 p-4 dark:border-white/10">Age 18–60, generally healthy</li>
          <li className="rounded-lg border border-slate-200 p-4 dark:border-white/10">Weight typically ≥ 50 kg</li>
          <li className="rounded-lg border border-slate-200 p-4 dark:border-white/10">No active infections or recent major surgery</li>
          <li className="rounded-lg border border-slate-200 p-4 dark:border-white/10">Meet local blood service criteria</li>
        </ul>
      </section>

      <section id="how-to-donate" className="bg-rose-50/50 py-16 dark:bg-rose-950/20">
        <div className="container-max">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">How to prepare</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-rose-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Before</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Sleep well, hydrate, and eat a healthy meal.</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">During</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Bring ID, relax, and follow staff guidance.</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">After</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Have a snack, stay hydrated, and avoid heavy lifting for 24h.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#" className="btn bg-red-600 text-white hover:bg-red-700">Find a nearby donation center</a>
            <span className="text-sm text-slate-500 dark:text-slate-400">Feature coming soon</span>
          </div>
        </div>
      </section>

      <section className="container-max py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Register as a donor</h2>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Create an account and upload your NIC or Driving License. We will extract text with OCR to speed up verification.</p>
  <DonorRegisterFormWrapper />
      </section>
    </main>
  );
}

// Split to avoid making this whole page a client component
import dynamic from 'next/dynamic';
const DonorRegisterForm = dynamic(() => import('@/components/DonorRegisterForm'), { ssr: false });
function DonorRegisterFormWrapper() {
  return <div className="mt-6"><DonorRegisterForm /></div>;
}
