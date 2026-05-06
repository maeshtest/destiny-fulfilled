import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import maragaHero from "@/assets/maraga-hero.png";

interface HeroSectionProps {
  maragaImage?: string;
}

const HeroSection = ({ maragaImage }: HeroSectionProps) => {
  return (
    <section className="bg-[#0c6b3f] py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT CONTENT */}
          <div className="text-white">

            {/* Badge */}
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-sm mb-8">
              Presidential Campaign 2027
            </div>

            {/* Headlines */}
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-2">
              Reset.
            </h1>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-2">
              Restore.
            </h1>

            {/* Rebuild Text with Glow */}
            <h1 className="text-5xl md:text-6xl font-bold text-[#c6d64a] leading-tight mb-6 animate-glow">
              Rebuild.
            </h1>

            {/* Description */}
            <p className="text-lg text-white/90 mb-10 max-w-xl">
              Join David Maraga's vision for a better Kenya. Together, we can
              restore integrity, rebuild our institutions, and reset our
              nation's course toward prosperity and justice.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">

              <Button
                asChild
                size="lg"
                className="bg-white text-[#0c6b3f] hover:bg-white/90 px-8 font-semibold uppercase"
              >
                <Link to="/join">Join Our Movement</Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 font-semibold uppercase"
              >
                <Link to="/donate">Contribute Now</Link>
              </Button>

            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative flex justify-center md:justify-end">

            <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-md">

              <img
                src={maragaImage || maragaHero}
                alt="David Maraga"
                className="w-full h-[420px] object-cover"
              />

              {/* Floating Info Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-xl p-5 shadow-lg">

                <h3 className="text-lg font-semibold text-green-700">
                  David Maraga
                </h3>

                <p className="text-gray-600 text-sm">
                  Former Chief Justice of Kenya
                </p>

                <p className="text-gray-500 text-sm">
                  Presidential Candidate 2027
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
