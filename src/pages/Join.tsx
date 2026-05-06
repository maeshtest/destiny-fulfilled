import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VoterDriveSection from "@/components/VoterDriveSection";

const Join = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <VoterDriveSection />
      </main>
      <Footer />
    </div>
  );
};

export default Join;
