import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LatestPressSection from "@/components/LatestPressSection";
import LeadershipSection from "@/components/LeadershipSection";
import CriticalIssuesSection from "@/components/CriticalIssuesSection";
import YouTubeSection from "@/components/YouTubeSection";
import VoterDriveSection from "@/components/VoterDriveSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CriticalIssuesSection />
        <YouTubeSection />
        <LatestPressSection />
        <LeadershipSection />
        <VoterDriveSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
