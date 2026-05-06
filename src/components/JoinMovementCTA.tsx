import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const JoinMovementCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center bg-card shadow-card p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Join Our Movement!
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your support is crucial to achieving our vision for a better Kenya. Whether you 
            volunteer your time or contribute financially, every effort makes a difference.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 font-semibold uppercase tracking-wider">
              <Link to="/join">Join Our Movement</Link>
            </Button>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 font-semibold uppercase tracking-wider">
              <Link to="/donate">Contribute Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinMovementCTA;
