import Link from 'next/link';

export default function BloodDonationSection() {
  return (
    <section id="blood-donation" className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Donate Blood, Save Lives</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Blood donation is a simple act with a profound impact. A single donation can help multiple patients,
              support emergency care, and improve community health. Healthy adults can donate regularly and make a
              lasting difference.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/donate-blood" className="btn bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                Become a Blood Donor
              </Link>
              <Link href="/blood-bank" className="btn">
                View Blood Bank
              </Link>
            </div>
          </div>
          <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200 dark:bg-red-900/10 dark:ring-red-900/40">
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-800 dark:text-red-200">
              <li>Helps save lives in emergencies and surgeries</li>
              <li>Supports patients with chronic conditions</li>
              <li>Quick health check with each donation</li>
              <li>Promotes community solidarity</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
