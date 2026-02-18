"use client";
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export default function Hero() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || '').toUpperCase();
  const canAccessClinicalActions = role === 'DOCTOR' || role === 'HOSPITAL';

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-white to-teal-50 pb-24 pt-28 dark:from-slate-950 dark:to-teal-900/10"
      aria-labelledby="hero-heading"
    >
  <div className="pointer-events-none absolute inset-0">
        <svg
          className="absolute -top-16 left-1/2 w-[140%] -translate-x-1/2"
          viewBox="0 0 1200 400"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0,96L48,106.7C96,117,192,139,288,149.3C384,160,480,160,576,149.3C672,139,768,117,864,112C960,107,1056,117,1152,128C1248,139,1344,149,1392,154.7L1440,160V400H0Z"
            fill="#ef009d"
            fillOpacity="0.08"
          />
        </svg>
      </div>
      <div className="container-max relative">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1
              id="hero-heading"
              className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-slate-100"
            >
              Building a Healthier Tomorrow
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              LifeLink connects kidney donors and patients through intelligent, ethical, and secure matching.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={"#"}
                onClick={(e) => {
                  e.preventDefault();
                  const headerOffset = 64;
                  const el = document.getElementById('donate');
                  if (!el) return;
                  const rectTop = el.getBoundingClientRect().top + window.pageYOffset;
                  const top = Math.max(0, rectTop - headerOffset - 8);
                  window.scrollTo({ top, behavior: 'smooth' });
                }}
                className="btn"
              >
                Join Our Mission
              </a>

              <a href="/analyze" className="btn btn-secondary">
                Check Health Report (Free)
              </a>

              <a
                href="/donate-blood"
                className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                aria-label="Donate my blood"
              >
                Donate my blood
              </a>

              {canAccessClinicalActions && (
                <>
                  <a href="/patients" className="btn">Patient Register</a>
                  <a href="/kidney-matching" className="btn">Access Maching System</a>
                </>
              )}
            </div>
          </div>
          {/* <div className="relative">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" aria-hidden />
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white p-4 shadow-soft ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
              <Image
                src="/images/kidney.png"
                alt="Kidney illustration representing transplant matching"
                width={440}
                height={440}
                className="h-auto w-full animate-floatSlow select-none"
                priority
              />
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
