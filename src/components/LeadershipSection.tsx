import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import maragaHero from "@/assets/DAVID.webp";

const pillars = [
  {
    number: 1,
    title: "Justice & Rule of Law",
    description:
      "Committed to upholding the constitution and ensuring justice for all Kenyans",
  },
  {
    number: 2,
    title: "Transparency & Accountability",
    description:
      "Promoting open government and holding leaders accountable to the people",
  },
  {
    number: 3,
    title: "Inclusive Development",
    description:
      "Building a Kenya where every citizen has equal opportunities to succeed",
  },
];

const LeadershipSection = () => {
  return (
    <section className="py-20 md:py-28 bg-[#e4d2a8]">
      <div className="container mx-auto px-6">

        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* IMAGE */}
          <div className="relative">

            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={maragaHero}
                alt="David Maraga"
                className="w-full h-[520px] object-cover"
              />
            </div>

            {/* FLOATING 2027 CARD */}
            <div className="absolute bottom-6 right-6 bg-green-600 text-white px-8 py-5 rounded-xl shadow-lg text-center">
              <p className="text-2xl font-bold">2027</p>
              <p className="text-sm">Presidential Candidate</p>
            </div>

          </div>

          {/* CONTENT */}
          <div>

            {/* Badge */}
            <span className="inline-block px-4 py-1.5 rounded-full bg-green-600 text-white text-sm mb-5">
              Leadership
            </span>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              David Maraga 2027
            </h2>

            <p className="text-lg text-gray-600 mb-10">
              Reset. Restore. Rebuild.
            </p>

            {/* PILLARS */}
            <div className="space-y-4 mb-10">

              {pillars.map((pillar) => (
                <div
                  key={pillar.number}
                  className="bg-gray-100 rounded-xl p-5 flex items-start gap-4 shadow-sm"
                >

                  {/* Number Circle */}
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-600 text-white font-bold text-sm">
                    {pillar.number}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {pillar.title}
                    </h4>

                    <p className="text-gray-600 text-sm">
                      {pillar.description}
                    </p>
                  </div>

                </div>
              ))}

            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-4">

              <Button
                asChild
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <Link to="/about" className="flex items-center gap-2">
                  LEARN MORE ABOUT MARAGA
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-gray-100 hover:bg-gray-200 text-green-700 px-8"
              >
                <Link to="/pillars" className="flex items-center gap-2">
                  CAMPAIGN PILLARS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default LeadershipSection;
