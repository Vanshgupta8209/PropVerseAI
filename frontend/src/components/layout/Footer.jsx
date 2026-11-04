import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Camera,
  Play,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Logo from "./Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { label: "Buy Property", href: "/properties?type=sale" },
      { label: "Rent Property", href: "/properties?type=rent" },
      { label: "New Projects", href: "/projects" },
      { label: "AI Search", href: "/search" },
      { label: "EMI Calculator", href: "/calculator" },
      { label: "Compare", href: "/compare" },
    ],
    Company: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
    Resources: [
      { label: "Help Center", href: "/help" },
      { label: "API Docs", href: "/api-docs" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  };

  const socialLinks = [
    { icon: Globe, href: "#", label: "Website" },
    { icon: Briefcase, href: "#", label: "LinkedIn" },
    { icon: Camera, href: "#", label: "Instagram" },
    { icon: Play, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="relative bg-[var(--bg-surface)] border-t border-[var(--border-primary)]">
      {/* Newsletter CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -top-16">
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Stay ahead in real estate
                </h3>
                <p className="text-primary-100 text-sm max-w-md">
                  Get AI-powered market insights, new listings, and investment tips delivered weekly.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 md:w-72 h-12 px-5 rounded-xl bg-white/15 border border-white/25 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm text-sm"
                />
                <Button
                  variant="default"
                  size="lg"
                  className="bg-white text-primary-700 hover:bg-white/90 shrink-0"
                >
                  Subscribe
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Logo size="lg" className="mb-4" />
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm leading-relaxed">
              The intelligent future of real estate. AI-powered property search,
              recommendations, and investment insights for smarter decisions.
            </p>
            <div className="space-y-2.5">
              <a href="mailto:vanshgupta200431@gmail.com" className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] hover:text-primary-600 transition-colors">
                <Mail size={15} /> vanshgupta200431@gmail.com
              </a>
              <a href="tel:+918000101992" className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] hover:text-primary-600 transition-colors">
                <Phone size={15} /> +91 8000101992
              </a>
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <MapPin size={15} /> Jaipur, Rajasthan, India
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-4 uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border-secondary)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            © {currentYear} PropVerse AI. All rights reserved. Built with intelligence.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                <social.icon size={17} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
