import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingHero } from '@/features/landing/components/landing-hero';
import { LandingFeatures } from '@/features/landing/components/landing-features';
import { PublicSimulatorSection } from '@/features/landing/components/public-simulator-section';
import { LandingFooter } from '@/features/landing/components/landing-footer';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <PublicSimulatorSection />
      </main>
      <LandingFooter />
    </div>
  );
}
