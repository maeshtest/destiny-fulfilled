import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const ThankYouVolunteer = () => {
  return (
    <section className="py-20 md:py-32 gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-block px-6 py-2 bg-primary-foreground/20 rounded-full mb-6">
          <span className="text-sm font-medium text-primary-foreground">Thank You!</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground mb-6">
          Asante Dancan
        </h1>
        
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-4">
          Your commitment to our movement is invaluable. We'll be in touch soon with 
          more information on how you can make a difference.
        </p>
        
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
          Please consider supporting our cause by making a donation.
        </p>
        
        <Button 
          asChild
          variant="outline" 
          size="lg"
          className="bg-white text-primary hover:bg-white/90 border-0 rounded-lg px-8 py-6 text-lg font-semibold"
        >
          <Link to="/donate">Donate Now</Link>
        </Button>
      </div>
    </section>
  );
};

export default ThankYouVolunteer;
