"use client";
import Image from 'next/image';
import { useInView } from '@/lib/useInView';

const impactStories = [
  {
    src: '/images/kidney-petient.png',
    alt: 'Patient receiving life-saving kidney transplant',
    title: 'A Second Chance at Life',
    description: 'Sarah, a 45-year-old mother of two, battled chronic kidney disease for 8 years. Fatigue, swelling, and dialysis three times a week defined her daily struggle. After receiving a compatible kidney from an altruistic donor, she returned to work, watched her children grow, and rediscovered joy in simple moments.',
    symptoms: ['Severe fatigue', 'Swelling in legs and ankles', 'Frequent urination', 'High blood pressure'],
    impact: 'Freedom from dialysis, renewed energy, family time restored'
  },
  {
    src: '/images/hospital.png',
    alt: 'Medical team performing kidney transplant surgery',
    title: 'The Gift of Compatibility',
    description: 'Advanced matching algorithms consider blood type, tissue compatibility, and crossmatch results to ensure transplant success. HLA typing and PRA scores help predict rejection risk, while careful monitoring post-surgery maximizes graft survival rates.',
    symptoms: ['Protein in urine', 'Decreased urine output', 'Persistent nausea', 'Muscle cramps'],
    impact: '95% success rate for living donor transplants, 85% for deceased donors'
  },
  {
    src: '/images/kidney-petient-2.png',
    alt: 'Family celebrating successful transplant recovery',
    title: 'From Struggle to Celebration',
    description: 'Michael, diagnosed with polycystic kidney disease, faced a lifetime of dialysis. His sister\'s selfless donation not only saved his life but strengthened their family bond. Today, he volunteers at transplant awareness events, paying forward the hope he received.',
    symptoms: ['Back or side pain', 'Blood in urine', 'Frequent kidney infections', 'Family history of kidney disease'],
    impact: 'Long-term health restored, medication regimen, active lifestyle regained'
  }
];

export default function ImpactGallery() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section ref={ref} className="container-max py-16">
      <div className="mb-10 max-w-4xl">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Real Human Impact</h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Kidney disease affects millions worldwide, but transplantation offers hope. Learn about the symptoms, the transplant journey, and the life-changing impact of becoming a donor.
        </p>
      </div>
      <div className={`grid gap-8 lg:grid-cols-1 transition-opacity duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
        {impactStories.map((story, index) => (
          <div key={story.src} className="group relative overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="relative">
                <Image
                  src={story.src}
                  alt={story.alt}
                  width={600}
                  height={400}
                  className="w-full h-64 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{story.title}</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{story.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Common Symptoms of Kidney Disease:</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {story.symptoms.map((symptom, i) => (
                      <li key={i} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">Transplant Impact:</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{story.impact}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Important Facts About Kidney Transplants</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100,000+</div>
            <div className="text-slate-600 dark:text-slate-400">People on transplant waiting lists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">17</div>
            <div className="text-slate-600 dark:text-slate-400">Lives saved per living donor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">90%</div>
            <div className="text-slate-600 dark:text-slate-400">1-year graft survival rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
            <div className="text-slate-600 dark:text-slate-400">Monitoring post-transplant</div>
          </div>
        </div>
      </div>
    </section>
  );
}
