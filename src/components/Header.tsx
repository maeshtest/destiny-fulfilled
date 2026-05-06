import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import maragaLogo from "@/assets/maraga-logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);

  const dropdownItems = [
    { label: "Leadership Profile", href: "/about" },
    { label: "Campaign Pillars", href: "/pillars" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex-shrink-0">
            <img src={maragaLogo} alt="Maraga '27" className="h-10 lg:h-12 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm">Home</Link>
            
            <div className="relative" onMouseEnter={() => setAboutDropdownOpen(true)} onMouseLeave={() => setAboutDropdownOpen(false)}>
              <button className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium text-sm">
                About Maraga
                <ChevronDown className={`w-4 h-4 transition-transform ${aboutDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {aboutDropdownOpen && (
                <div className="absolute top-full left-0 pt-2 min-w-[200px]">
                  <div className="bg-card shadow-elevated border border-border py-2">
                    {dropdownItems.map((item) => (
                      <Link key={item.label} to={item.href} className="block px-4 py-2.5 text-foreground/80 hover:text-foreground hover:bg-muted transition-colors text-sm">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/press" className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm">Press</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button asChild variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-2 text-sm font-semibold uppercase tracking-wider">
              <Link to="/join">Join Our Movement</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2 text-sm font-semibold uppercase tracking-wider">
              <Link to="/donate">Donate</Link>
            </Button>
          </div>

          <button className="lg:hidden p-2 flex flex-col gap-1.5" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <span className={`block w-6 h-0.5 bg-foreground transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-foreground transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-foreground transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-6 animate-fade-in">
            <nav className="flex flex-col gap-1">
              <Link to="/" className="text-foreground font-medium py-3 text-base" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              
              <div>
                <button className="flex items-center justify-between w-full text-foreground font-medium py-3 text-base" onClick={() => setMobileAboutOpen(!mobileAboutOpen)}>
                  About Maraga
                  {mobileAboutOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {mobileAboutOpen && (
                  <div className="ml-4 flex flex-col gap-1 pb-2">
                    {dropdownItems.map((item) => (
                      <Link key={item.label} to={item.href} className="text-foreground/70 hover:text-foreground py-2 text-base" onClick={() => setMobileMenuOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/press" className="text-foreground font-medium py-3 text-base" onClick={() => setMobileMenuOpen(false)}>Press</Link>
              
              <div className="flex flex-col gap-3 pt-6">
                <Button asChild variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground py-3 text-base font-semibold uppercase tracking-wider w-full">
                  <Link to="/join" onClick={() => setMobileMenuOpen(false)}>Join Our Movement</Link>
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base font-semibold uppercase tracking-wider w-full">
                  <Link to="/donate" onClick={() => setMobileMenuOpen(false)}>Contribute Now</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
