import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const ThankYouDonation = () => {
  return (
    <section className="py-20 md:py-32 gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-block px-6 py-2 bg-primary-foreground/20 rounded-full mb-6">
          <span className="text-sm font-medium text-primary-foreground">Thank You!</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground mb-6">
          Asante Sana
        </h1>
        
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-4">
          Your generous donation means the world to us. Together, we're building a 
          brighter future for Kenya.
        </p>
        
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
          Want to make an even bigger impact? Join our volunteer movement!
        </p>
        
        <Button 
          asChild
          variant="outline" 
          size="lg"
          className="bg-white text-primary hover:bg-white/90 border-0 rounded-lg px-8 py-6 text-lg font-semibold"
        >
          <Link to="/join">Join the Movement</Link>
        </Button>
      </div>
    </section>
  );
};

export default ThankYouDonation;
