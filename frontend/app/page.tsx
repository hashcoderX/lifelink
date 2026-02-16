import Hero from '@/components/Hero';
import About from '@/components/About';
import Research from '@/components/Research';
import Donate from '@/components/Donate';
import ImpactGallery from '@/components/ImpactGallery';
import WhySupport from '@/components/WhySupport';
import BloodDonationSection from '@/components/BloodDonationSection';
import FindKidneySection from '@/components/FindKidneySection';
import FindEyeSection from '@/components/FindEyeSection';
import Sponsors from '@/components/Sponsors';

export default function HomePage() {
  return (
    <main id="home">
      <Hero />
      <About />
      <BloodDonationSection />
      <FindKidneySection />
      <FindEyeSection />
      <Donate />
      <Sponsors />
      <ImpactGallery />
      <WhySupport />
      <Research />
    </main>
  );
}
