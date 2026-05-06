import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

const CriticalIssuesSection = () => {
  const featuredStatement = {
    date: "12 December 2025",
    tag: "Official Statement",
    title:
      "Kenya Is Not on the Road to Singapore. Pretending Otherwise Is Dangerous",
    excerpt:
      "We are not poor because we lack money. We are poor because we have embraced an extractive system that is designed to serve those in power before it serves citizens.",
    link: "#",
  };

  return (
    <section className="py-20 md:py-28 bg-[#0ea44b]">
      <div className="container mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-14">

          <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm mb-6">
            Latest Communication
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Voice on Critical Issues
          </h2>

          <p className="text-white/90 max-w-2xl mx-auto text-lg">
            Stay informed with our latest positions on the issues that matter
            most to Kenya
          </p>

        </div>

        {/* CARD */}
        <div className="max-w-5xl mx-auto">

          <div className="bg-[#f3f4f6] rounded-2xl shadow-xl p-8 md:p-10">

            {/* TAG + DATE */}
            <div className="flex justify-between items-center mb-6">

              <span className="px-4 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                {featuredStatement.tag}
              </span>

              <span className="text-sm text-gray-500">
                {featuredStatement.date}
              </span>

            </div>

            {/* TITLE */}
            <h3 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 leading-snug">
              {featuredStatement.title}
            </h3>

            {/* TEXT */}
            <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-3xl">
              {featuredStatement.excerpt}
            </p>

            {/* BUTTON */}
            <Button
              asChild
              size="lg"
              className="bg-green-700 hover:bg-green-800 text-white px-6"
            >
              <Link to={featuredStatement.link} className="flex items-center gap-2">
                READ COMPLETE STATEMENT
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>

          </div>

        </div>

      </div>
    </section>
  );
};

export default CriticalIssuesSection;
