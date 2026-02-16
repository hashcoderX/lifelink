"use client";
import Link from 'next/link';

export default function FindEyeSection() {
  return (
    <section id="find-eye" className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Eye Donation</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Eye donation is a noble act that can restore sight to those suffering from corneal blindness.
              Register as an eye donor to help give the gift of vision to someone in need.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/donate-eye" className="btn bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Become an Eye Donor
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your eyes can be donated after death to help others see.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200 dark:bg-blue-900/10 dark:ring-blue-900/40">
            <ul className="list-disc space-y-1 pl-5 text-sm text-blue-800 dark:text-blue-200">
              <li>One pair of eyes can help up to 2 people</li>
              <li>Corneas are used for transplant surgeries</li>
              <li>Helps treat conditions like keratoconus and corneal scars</li>
              <li>Simple registration process with lasting impact</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}