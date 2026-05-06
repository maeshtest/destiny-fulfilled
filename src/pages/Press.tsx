import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ExternalLink } from "lucide-react";

const Press = () => {
  const pressStatements = [
    { date: "December 13, 2024", tag: "Official Statement", title: "Kenya Is Not on the Road to Singapore. Pretending Otherwise Is Dangerous", excerpt: "We are not poor because we lack money. We are poor because we have embraced an extractive system designed to serve those in power." },
    { date: "September 16, 2024", tag: "Official Statement", title: "THE COURAGE TO REBUILD KENYA", excerpt: "There will be a new way of doing politics and a new way to think about future. No more trickery, no shenanigans, a genuine quest of the common good." },
    { date: "March 5, 2024", tag: "Policy", title: "Kenya's Economic Recklessness Must End", excerpt: "Every year, we sink into unsustainable debt. The living standards are crashing. So we need responsible leadership to fix the situation." },
    { date: "November 3, 2025", tag: "Statement", title: "THE ABDUCTION OF RONGO MZALENDI AND NICHOLAS OYOO AND THE CRISIS OF HUMAN RIGHTS IN EAST AFRICA", excerpt: "We condemn in the strongest terms possible the abduction of the two citizens, and call for their immediate release." },
    { date: "October 28, 2025", tag: "Policy", title: "The Signing into Law Several Bills that Undermine Kenya's Constitution and our Sovereignty", excerpt: "President's assent to multiple bills significantly erode our hard-won constitutional gains." },
    { date: "October 16, 2025", tag: "Statement", title: "STATEMENT ON PRIVATIZATION BILL, 2025", excerpt: "UGJA is a party that puts people before big money. This proposal has no social benefit of people." },
    { date: "September 30, 2025", tag: "Announcement", title: "EXECUTIVE APPOINTMENT", excerpt: "Leadership changes to enhance our fight for Kenya. Please see official statement." },
    { date: "August 14, 2025", tag: "Statement", title: "THE TRAGEDY IN KAHAWA CANNOT BE IGNORED", excerpt: "Justice is not selective. When we see injustice, we condemn it in the strongest terms possible." },
    { date: "July 1, 2025", tag: "Statement", title: "STATEMENT ON THE PRESENCE OF BURMA AND FORCES IN KENYA", excerpt: "Foreign forces should never operate illegally on Kenyan soil without proper documentation." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 bg-background border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Press Statements</h1>
          <p className="text-muted-foreground">Official statements and communications from the David Maraga 2027 Campaign</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {pressStatements.map((statement, index) => (
              <article key={index} className="bg-card border border-border p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium">{statement.tag}</span>
                  <span className="text-sm text-muted-foreground">{statement.date}</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-primary mb-2 hover:underline cursor-pointer">{statement.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{statement.excerpt}</p>
                <a href="#" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                  Read full statement <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
