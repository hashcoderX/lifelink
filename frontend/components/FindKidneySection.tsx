"use client";
import Link from 'next/link';

export default function FindKidneySection() {
  return (
    <section id="find-kidney" className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Find a Kidney Match</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Our kidney matching tool leverages clinical markers to help identify compatible donors for patients in need.
              You can explore basic matching info openly. To perform full secure matching, log in as a patient or doctor.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/kidney-matching" className="btn bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
                Go to Matching
              </Link>
              <Link href="/donate-kidney" className="btn">
                Become a Kidney Donor
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advanced compatibility scoring requires patient / doctor login.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:ring-emerald-900/40">
            <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-800 dark:text-emerald-200">
              <li>Matches based on blood group & crossmatch data</li>
              <li>Considers HLA typing and sensitization markers</li>
              <li>Helps prioritize urgent patient needs</li>
              <li>Secure access for medical accuracy & privacy</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
