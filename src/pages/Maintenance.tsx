import { Construction, Clock } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-[hsl(215,50%,12%)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary/20 flex items-center justify-center mx-auto">
            <Construction className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Site Currently Unavailable
          </h1>

          <p className="text-white/60 text-lg leading-relaxed">
            We're currently performing scheduled maintenance to improve your experience.
            Please check back shortly.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
          <Clock className="w-4 h-4" />
          <span>We'll be back soon</span>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
