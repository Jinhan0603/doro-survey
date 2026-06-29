import '../styles/home.css';
import { Header } from '../components/home/Header';
import { HeroSection } from '../components/home/HeroSection';
import { FeatureCards } from '../components/home/FeatureCards';
import { OperationScreens } from '../components/home/OperationScreens';
import { ParticipantLinkCard } from '../components/home/ParticipantLinkCard';
import { BottomInfoCards } from '../components/home/BottomInfoCards';

export function HomePage() {
  return (
    <div className="dh-page">
      <Header />
      <main className="dh-main">
        <div className="dh-container">
          <HeroSection />
          <FeatureCards />
          <OperationScreens />
          <ParticipantLinkCard />
          <BottomInfoCards />
        </div>
      </main>
    </div>
  );
}
