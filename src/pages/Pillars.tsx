import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Pillars = () => {
  const pillars = [
    { id: "1", title: "Education, Youth, Innovation & Technology", content: "Investing in quality education, empowering the youth, and fostering innovation and technology to drive Kenya's future growth and global competitiveness." },
    { id: "2", title: "Economy & Sustainable Development", content: "Building a resilient, diversified economy that creates jobs, reduces inequality, and ensures sustainable development for all Kenyans." },
    { id: "3", title: "Healthcare, Equity and Social Justice", content: "Ensuring universal access to quality healthcare and promoting social justice and equity across all segments of Kenyan society." },
    { id: "4", title: "Pan-Africanism and International Relations", content: "Strengthening Kenya's role in Africa and the world through constructive diplomacy, regional integration, and mutually beneficial partnerships." },
    { id: "5", title: "Accountability, Rule of Law and Constitutionalism", content: "Upholding the constitution, strengthening institutions, ensuring accountability, and fighting corruption at all levels of government." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 bg-background border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the core principles and detailed plans that will guide our mission to build a better future.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {pillars.map((pillar) => (
                <AccordionItem key={pillar.id} value={pillar.id} className="bg-card border border-border px-6 shadow-card">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-6">
                    {pillar.id}. {pillar.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">{pillar.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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

export default Pillars;
