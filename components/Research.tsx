"use client";
import type React from 'react';
import { useInView } from '../lib/useInView';

const items = [
  {
    title: 'AI Models',
    text:
      'Proprietary models trained on de-identified datasets to predict the best donor-patient matches.',
  },
  {
    title: 'Matching Process',
    text: 'Multi-factor scoring using compatibility, urgency, and longitudinal outcomes.',
  },
  {
    title: 'Ethical Data',
    text: 'Privacy-first design with rigorous governance and responsible AI practices.',
  },
];

export default function Research() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="research" className="bg-white py-20 dark:bg-slate-950">
      <div ref={ref} className="container-max">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Research</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((it, idx) => (
            <div
              key={it.title}
              className={`card transition-opacity duration-700 ${
                inView ? 'animate-fadeInUp opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 80}ms` } as React.CSSProperties}
            >
              <h3 className="text-lg font-semibold text-slate-900">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
