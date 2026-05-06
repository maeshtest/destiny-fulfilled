import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const pressStatements = [
  {
    date: "December 12, 2025",
    title: "Kenya Is Not on the Road to Singapore. Pretending Otherwise Is Dangerous",
    excerpt: "We are not poor because we lack money. We are poor because we have embraced an extractive system that is designed to serve those in power...",
    slug: "#"
  },
  {
    date: "November 22, 2025",
    title: "THE COURAGE TO REBUILD KENYA",
    excerpt: "Our youth are not \"hustlers\" at home or for hire in the global labour bazaar. They are wealth creators. They are custodians, guardians and...",
    slug: "#"
  },
  {
    date: "November 11, 2025",
    title: "Ruto's Economic Recklessness Must End",
    excerpt: "The way out is not more reckless loans. It is finding efficiency in government — cutting duplication, waste, and vanity projects — and...",
    slug: "#"
  }
];

const LatestPressSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium mb-4">
            Official Communications
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Latest Press Statements
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay informed with our latest official statements and policy positions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {pressStatements.map((statement, index) => (
            <article key={index} className="bg-card border border-border p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium">Press Release</span>
                <span className="text-sm text-muted-foreground">{statement.date}</span>
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-3 line-clamp-2 min-h-[3.5rem]">{statement.title}</h3>
              <p className="text-muted-foreground text-sm mb-5 line-clamp-3">{statement.excerpt}</p>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link to="/press" className="flex items-center gap-2">
                  READ MORE <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="default" size="lg" className="px-8">
            <Link to="/press" className="flex items-center gap-2">
              VIEW ALL PRESS STATEMENTS <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LatestPressSection;
