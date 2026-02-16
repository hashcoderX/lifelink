"use client";
import type React from 'react';
import { useInView } from '../lib/useInView';

const tiers = [
  { name: 'Supporter', amount: '$25', blurb: 'Help keep our research moving.' },
  { name: 'Advocate', amount: '$100', blurb: 'Accelerate model evaluation.' },
  { name: 'Champion', amount: '$250', blurb: 'Fund patient-donor outreach.' }
];

export default function Donate() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="donate" className="bg-white py-20 dark:bg-slate-950">
      <div ref={ref} className="container-max">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Support LifeLink</h2>
        <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
          Your contribution fuels ethical AI research and expands access to life-saving kidney matches.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier, idx) => (
            <div
              key={tier.name}
              className={`card flex flex-col transition-opacity duration-700 ${
                inView ? 'animate-fadeInUp opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 90}ms` } as React.CSSProperties}
            >
              <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{tier.blurb}</p>
              <div className="mt-6 text-3xl font-bold text-primary">{tier.amount}</div>
              <div className="mt-auto pt-6">
                <a
                  href="#contact"
                  className="btn-secondary w-full"
                  aria-label={`Contribute at ${tier.name} level`}
                >
                  Contribute Now
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
