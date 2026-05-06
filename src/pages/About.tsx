import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import maragaHero from "@/assets/maraga-hero.png";

const About = () => {
  const testimonial = {
    quote: "Maraga is the only leader who has ever stood for truth … We trust him because he has no blood on his hands.",
    author: "Linda Atieno",
    details: "22 year-old student at Rongo University, 2025"
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section 
        className="relative py-20 md:py-32 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `linear-gradient(to right, rgba(26, 135, 84, 0.9), rgba(26, 135, 84, 0.7)), url(${maragaHero})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground mb-6">David Maraga</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4">"A man of integrity for a time that demands character."</p>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto italic">
            "The greatness of any nation lies in its fidelity to the constitution and 
            adherence to the rule of law and above all respect to God." – Chief Justice 
            Maraga, Supreme Court ruling, 2017
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <p className="text-foreground leading-relaxed mb-6">
              David Kenani Maraga was born 12 January 1951 in Nyamira County, Kenya. He was the 14th Chief 
              Justice and President of the Supreme Court of Kenya from October 2016 until his retirement in 
              January 2021.
            </p>
            <p className="text-foreground leading-relaxed mb-6">
              He achieved his Bachelor of Laws degree from the University of Nairobi; holds a post-graduate 
              diploma awarded by the Kenya School of Law; and obtained a Master of Laws from the University 
              of Nairobi.
            </p>
            <p className="text-foreground leading-relaxed mb-6">
              David Maraga is celebrated for a trailblazing judicial career marked by landmark achievements in 
              integrity, reform, and constitutionalism. He is famously known for annulling the 2017 presidential 
              election – the first such ruling in Africa – demonstrating unmatched judicial courage and 
              independence.
            </p>
            <p className="text-foreground leading-relaxed mb-6">
              Under his leadership, the judiciary introduced major reforms, including digital case e-filing, the 
              Judiciary Committee on Elections, and clearing significant case backlogs. He personally authored 
              over 1,250 Court of Appeal judgments.
            </p>
            <p className="text-foreground leading-relaxed">
              Post-retirement, Maraga has remained active in civic life, mentoring youth, promoting ethical 
              leadership, and speaking on democracy and governance.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mt-16">
            <div className="bg-muted p-8 text-center">
              <h4 className="font-semibold text-foreground mb-4">A leader embraced by all Kenyan generations</h4>
              <blockquote className="text-muted-foreground italic mb-4">
                "{testimonial.quote}" – {testimonial.author}, {testimonial.details}
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-card shadow-card p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Join Our Movement!</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your support is crucial to achieving our vision for a better Kenya.
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

      <Footer />
    </div>
  );
};

export default About;
