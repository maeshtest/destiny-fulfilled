import { Youtube, ExternalLink, Calendar, Play, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const YouTubeSection = () => {
  const videos = [
    {
      id: 1,
      title: "Thank you Mombasa County! The Ukatiba Caravan moves to Kwale County.",
      description: "",
      date: "March 1, 2026",
      youtubeId: "ZCCvKoanKIg",
      thumbnail: "https://img.youtube.com/vi/ZCCvKoanKIg/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=ZCCvKoanKIg"
    },
    {
      id: 2,
      title: "The Ukatiba Caravan is here! Tupatane Mombasa kesho tujisajilishe kura.",
      description: "",
      date: "March 1, 2026",
      youtubeId: "D-nmIF1JcL4",
      thumbnail: "https://img.youtube.com/vi/D-nmIF1JcL4/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=D-nmIF1JcL4"
    },
    {
      id: 3,
      title: "UGM Party young aspirants convention in Kisumu County",
      description: "Young aspirants in Kisumu for a training on green ideology and constitutionalism.",
      date: "March 1, 2026",
      youtubeId: "JS6rAgjfezA",
      thumbnail: "https://img.youtube.com/vi/JS6rAgjfezA/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=JS6rAgjfezA"
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[hsl(215,50%,15%)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium mb-4">
            Latest Updates
          </div>
          
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            From Our YouTube Channel
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Stay connected with our latest speeches, policy discussions, and campaign 
            updates directly from the field
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {videos.map((video) => (
            <a 
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[hsl(215,45%,20%)] overflow-hidden shadow-lg group cursor-pointer hover:bg-[hsl(215,45%,25%)] transition-colors duration-300 block"
            >
              {/* Thumbnail with Play Button */}
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Red Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
                {/* Click to Play badge */}
                <div className="absolute top-3 right-3 bg-[hsl(215,40%,25%)]/90 text-white text-xs px-2.5 py-1 backdrop-blur-sm font-medium">
                  Click to Play
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h4 className="font-semibold text-white mb-2 line-clamp-2 text-sm leading-snug">
                  {video.title}
                </h4>
                {video.description && (
                  <p className="text-sm text-white/50 line-clamp-2 mb-3">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    <span>{video.date}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-white/60 font-medium group-hover:text-white transition-colors">
                    Watch on YouTube
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Subscribe CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 group uppercase tracking-wider font-semibold"
          >
            <a 
              href="https://youtube.com/@UGMParty" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Youtube className="w-5 h-5" />
              Subscribe to our channel
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default YouTubeSection;
