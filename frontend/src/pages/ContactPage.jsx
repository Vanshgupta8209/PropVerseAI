import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Headphones,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "buying",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = [
    {
      id: "email",
      icon: Mail,
      title: "Email Support",
      subtitle: "For general inquiries & partnerships",
      value: "vanshgupta200431@gmail.com",
      actionText: "Send Email",
      href: "mailto:vanshgupta200431@gmail.com",
      color: "from-blue-500/20 to-indigo-500/20 text-blue-500",
    },
    {
      id: "phone",
      icon: Phone,
      title: "Direct Phone & WhatsApp",
      subtitle: "Available Mon - Sat (9:00 AM - 8:00 PM IST)",
      value: "+91 8000101992",
      actionText: "Call Now",
      href: "tel:+918000101992",
      secondaryHref: "https://wa.me/918000101992",
      secondaryActionText: "WhatsApp",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-500",
    },
    {
      id: "location",
      icon: MapPin,
      title: "Headquarters",
      subtitle: "PropVerse AI Tech Center",
      value: "Jaipur, Rajasthan, India",
      actionText: "View on Map",
      href: "https://maps.google.com/?q=Jaipur,+Rajasthan,+India",
      color: "from-amber-500/20 to-rose-500/20 text-amber-500",
    },
  ];

  const faqs = [
    {
      q: "How fast will I receive a response?",
      a: "Our dedicated support team and AI assistant respond within 1-2 hours during business hours.",
    },
    {
      q: "Can I list my property in Jaipur or other cities?",
      a: "Yes! You can list residential and commercial properties across Jaipur, Rajasthan, and nationwide.",
    },
    {
      q: "Is there any cost for property evaluation?",
      a: "No, property valuation and AI price predictions are 100% free for all registered users.",
    },
    {
      q: "How can builders partner with PropVerse AI?",
      a: "Contact us directly via email or phone (+91 8000101992) for builder dashboard integration.",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        inquiryType: "buying",
        subject: "",
        message: "",
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[var(--bg-primary)]">
      {/* Header Banner */}
      <section className="relative overflow-hidden py-16 mb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 via-accent-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4 border border-primary-200 dark:border-primary-800">
              <Sparkles size={14} /> Get in Touch with Us
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4">
              We'd Love to Hear From You
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Have questions about buying, selling, renting, or AI real estate predictions? Reach out to our team in Jaipur, Rajasthan, India.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactInfo.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all border border-[var(--border-primary)] relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} rounded-bl-full filter blur-xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-5`}>
                      <card.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[var(--text-tertiary)] mb-3">
                      {card.subtitle}
                    </p>
                    <p className="text-base font-semibold text-primary-600 dark:text-primary-400 mb-6 break-words">
                      {card.value}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-secondary)]">
                    <a
                      href={card.href}
                      target={card.href.startsWith("http") ? "_blank" : "_self"}
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
                    >
                      {card.actionText}
                      <ExternalLink size={12} />
                    </a>
                    {card.secondaryHref && (
                      <a
                        href={card.secondaryHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        {card.secondaryActionText}
                        <MessageSquare size={12} />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Form & Map/Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7">
            <Card hover={false} className="p-8 border border-[var(--border-primary)] shadow-lg">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Send Us a Message
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Fill out the form below and Vansh Gupta or our real estate team will get back to you promptly.
              </p>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-2xl shadow-lg">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                      Thank You!
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                      Your message has been successfully received. We will contact you at <strong className="text-primary-600 dark:text-primary-400">{formData.email || "vanshgupta200431@gmail.com"}</strong> or mobile number soon!
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                      className="mt-4"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Vansh Gupta"
                          className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="vanshgupta200431@gmail.com"
                          className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 8000101992"
                          className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                          Inquiry Type
                        </label>
                        <select
                          value={formData.inquiryType}
                          onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                          className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="buying">Buying Property</option>
                          <option value="selling">Selling Property</option>
                          <option value="builder">Builder / Agent Partnership</option>
                          <option value="ai">AI Search & Analytics</option>
                          <option value="general">General Query</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Property Inquiry in Jaipur, Rajasthan"
                        className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us details about your property search or inquiry..."
                        className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full h-12 text-sm font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending Message...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send size={16} /> Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Location & Quick Info Side Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Office Info Banner */}
            <Card hover={false} className="p-6 border border-[var(--border-primary)] bg-gradient-to-br from-primary-600/10 via-accent-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">PropVerse AI HQ</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">Jaipur Hub</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Based out of <strong>Jaipur, Rajasthan, India</strong>, PropVerse AI powers next-generation real estate solutions for buyers, sellers, and builders across India.
              </p>
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary-600" />
                  <span>vanshgupta200431@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-primary-600" />
                  <span>+91 8000101992</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary-600" />
                  <span>Jaipur, Rajasthan, India</span>
                </div>
              </div>
            </Card>

            {/* Support Highlights */}
            <Card hover={false} className="p-6 border border-[var(--border-primary)] space-y-4">
              <h3 className="font-bold text-base text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <ShieldCheck className="text-primary-600" size={18} /> Why Contact PropVerse AI?
              </h3>
              <ul className="space-y-3 text-xs text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <Headphones size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Dedicated Representative:</strong> Direct support from Vansh Gupta and our real estate technical team.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Rapid Response:</strong> Most queries answered within 1-2 hours on business days.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Globe size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span><strong>Pan-India Coverage:</strong> Expertise in Jaipur, Delhi-NCR, Mumbai, Bengaluru, and top Indian hubs.</span>
                </li>
              </ul>
            </Card>

            {/* Map Preview Card */}
            <Card hover={false} className="overflow-hidden border border-[var(--border-primary)]">
              <div className="h-44 bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 p-6 flex flex-col justify-between text-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                <div className="relative z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-white/20 backdrop-blur-md">
                    Location Center
                  </span>
                  <h4 className="text-lg font-bold mt-2">Jaipur, Rajasthan, India</h4>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs text-white/80">Pink City Tech Hub</span>
                  <a
                    href="https://maps.google.com/?q=Jaipur,+Rajasthan,+India"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-accent-300 hover:underline flex items-center gap-1"
                  >
                    Open Google Maps <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQs */}
        <section className="pt-8 border-t border-[var(--border-secondary)]">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <Card key={i} hover={false} className="p-6 border border-[var(--border-primary)]">
                <h3 className="font-semibold text-base text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {faq.q}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] pl-8 leading-relaxed">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
