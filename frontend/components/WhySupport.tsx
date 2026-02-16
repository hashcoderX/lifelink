"use client";
import { useInView } from '@/lib/useInView';

export default function WhySupport() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section ref={ref} id="why-support" className="container-max py-20">
      <div className={`mx-auto max-w-4xl space-y-8 transition-opacity duration-700 ${inView ? 'animate-fadeInUp opacity-100' : 'opacity-0'}`}>        
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Why Support LifeLink?</h2>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
          <p><strong>Every year, thousands of patients in Sri Lanka suffer from kidney failure</strong> — and many of them never find a matching donor in time. Finding the right kidney donor is a race against time, and the current system is slow, manual, and often full of delays.</p>
          <p><strong>More than 60% of patients face long waiting periods</strong> because of the lack of a proper, data-driven matching system. Each year, hundreds of lives are lost — not because donors don’t exist, but because matches aren’t found quickly enough.</p>
          <p><em>We’re working to change that.</em></p>
          <p><span className="font-semibold text-primary">LifeLink</span> is developing Sri Lanka’s first AI-powered kidney transplant matching platform, connecting patients and donors through smart, secure technology. Our goal is simple — save lives through intelligence and compassion.</p>
          <div className="rounded-xl bg-primary/10 p-4 ring-1 ring-primary/20 dark:bg-primary/15 dark:ring-primary/30">
            <p className="m-0"><strong>By supporting LifeLink, you’re not just funding technology — you’re giving someone a second chance at life.</strong></p>
          </div>
          <p>Join us on our mission to connect lives, save lives, and build a healthier tomorrow.</p>
          <p className="text-lg font-medium text-primary">Together, we can be the link between hope and healing. <span aria-label="green heart" role="img">💚</span></p>
        </div>
      </div>
    </section>
  );
}
