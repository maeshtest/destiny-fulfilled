import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import MaragaLogo from "./MaragaLogo";

const Footer = () => {
  const quickLinks = [
    { label: "Pillars", href: "/pillars" },
    { label: "About Us", href: "/about" },
    { label: "Donate", href: "/donate" },
    { label: "Join the Movement", href: "/join" },
  ];

  const socialLinks = [
    { label: "Twitter", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "Moments", href: "#" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Campaign Headquarters */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Campaign Headquarters</h3>
            <div className="space-y-2 text-primary-foreground/80">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                82 Westlands Rd, Nairobi, Kenya
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                +254 746 900 027
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <p className="text-center text-primary-foreground/70 text-sm">
            © 2025 David Maraga Presidential Campaign. All rights reserved. 🇰🇪
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
