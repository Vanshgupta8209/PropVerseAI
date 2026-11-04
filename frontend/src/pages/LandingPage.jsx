import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Home,
  Star,
  BadgeCheck,
  BarChart3,
  MessageSquareText,
  BedDouble,
  Bath,
  Maximize,
  Eye,
} from "lucide-react";
import { cn, formatPrice, formatArea } from "@/lib/utils";
import { propertiesApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — The hero page of PropVerse AI.
   Sections: Hero → Stats → Features → Trending → Builders → Testimonials → CTA
   ═══════════════════════════════════════════════════════════════ */

// ── Animated Counter Hook ───────────────────────────────────────
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return [count, ref];
}

// ── Fade-in on Scroll Wrapper ───────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Featured Builders & Testimonials ───────────────────────────

const featuredBuilders = [
  { name: "Prestige Group", projects: 48, rating: 4.8, logo: "🏛️" },
  { name: "Godrej Properties", projects: 35, rating: 4.7, logo: "🏗️" },
  { name: "Sobha Ltd", projects: 42, rating: 4.9, logo: "🏢" },
  { name: "Brigade Group", projects: 30, rating: 4.6, logo: "🏠" },
];

const testimonials = [
  {
    name: "Priya Sharma", role: "Home Buyer",
    text: "PropVerse AI recommended the perfect apartment for us. The AI search understood exactly what we needed — 3BHK near a metro under our budget. Closed the deal in 2 weeks!",
    rating: 5, avatar: "PS",
  },
  {
    name: "Rahul Mehta", role: "Real Estate Investor",
    text: "The AI price prediction feature saved me from a bad deal. It flagged an overpriced property that competitors missed. My portfolio has grown 23% since I started using PropVerse.",
    rating: 5, avatar: "RM",
  },
  {
    name: "Anita Desai", role: "Property Seller",
    text: "Listed my villa and got 15 serious leads within the first week. The AI-generated description was better than what any agent wrote. Sold above asking price!",
    rating: 5, avatar: "AD",
  },
];

// ═══════════════════════════════════════════════════════════════
//  HERO SECTION
// ═══════════════════════════════════════════════════════════════
function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const suggestions = [
    "3BHK apartment under ₹80 lakh in Mumbai",
    "Villa with garden near Whitefield",
    "1BHK for rent near metro station",
    "Sea-facing flat in Goa under ₹50 lakh",
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }}>
        {/* Gradient Orbs */}
        <motion.div
          style={{ y }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow"
        />
        <motion.div
          style={{ y }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-pulse-slow"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div style={{ opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* AI Badge */}
          <FadeIn>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8"
            >
              <Sparkles size={14} className="text-accent-400" />
              <span className="text-sm font-medium text-white/80">
                Powered by Artificial Intelligence
              </span>
            </motion.div>
          </FadeIn>

          {/* Heading */}
          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 text-balance">
              The Intelligent
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">
                Future of Real Estate
              </span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover your dream property with AI-powered search, intelligent recommendations,
              and market insights. The smartest way to buy, sell, and invest.
            </p>
          </FadeIn>

          {/* AI Search Bar */}
          <FadeIn delay={0.3}>
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
              <div className="relative flex items-center glass rounded-2xl p-1.5 shadow-xl shadow-black/20">
                <div className="flex items-center gap-2 pl-4 text-white/40">
                  <Brain size={20} />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask AI: &quot;3BHK under ₹80L near metro in Mumbai&quot;"
                  className="flex-1 h-12 bg-transparent text-white placeholder:text-white/40 px-3 focus:outline-none text-sm sm:text-base"
                />
                <Button
                  type="submit"
                  variant="gradient"
                  size="md"
                  className="shrink-0"
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </form>
          </FadeIn>

          {/* Quick Suggestions */}
          <FadeIn delay={0.4}>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSearchQuery(s)}
                  className="px-3 py-1.5 rounded-full text-xs text-white/50 border border-white/10 hover:border-white/30 hover:text-white/80 transition-all bg-white/5 backdrop-blur-sm cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Quick Stats */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              {[
                { label: "Properties", value: "50K+" },
                { label: "Happy Buyers", value: "12K+" },
                { label: "Cities", value: "150+" },
                { label: "AI Matches", value: "98%" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <div className="w-1 h-2.5 bg-white/40 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STATS SECTION
// ═══════════════════════════════════════════════════════════════
function StatCard({ stat, i }) {
  const [count, ref] = useCounter(stat.value);
  return (
    <FadeIn key={stat.label} delay={i * 0.1}>
      <Card className="text-center p-6">
        <div className={cn(
          "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 shadow-lg",
          stat.color
        )}>
          <stat.icon size={24} className="text-white" />
        </div>
        <p ref={ref} className="text-3xl font-bold text-[var(--text-primary)]">
          {count.toLocaleString()}{stat.suffix}
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">{stat.label}</p>
      </Card>
    </FadeIn>
  );
}

function StatsSection() {
  const stats = [
    { icon: Home, label: "Properties Listed", value: 50000, suffix: "+", color: "from-primary-500 to-primary-600" },
    { icon: TrendingUp, label: "Successful Deals", value: 12000, suffix: "+", color: "from-accent-500 to-accent-600" },
    { icon: MapPin, label: "Cities Covered", value: 150, suffix: "+", color: "from-emerald-500 to-emerald-600" },
    { icon: Brain, label: "AI Accuracy", value: 98, suffix: "%", color: "from-amber-500 to-amber-600" },
  ];

  return (
    <section className="py-20 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FEATURES SECTION
// ═══════════════════════════════════════════════════════════════
function FeaturesSection() {
  const features = [
    {
      icon: Brain, title: "AI-Powered Search",
      description: "Describe your dream home in plain English. Our AI understands budgets, preferences, and lifestyle to find perfect matches.",
      gradient: "from-primary-500 to-primary-600",
    },
    {
      icon: TrendingUp, title: "Price Prediction",
      description: "Advanced ML models analyze market trends, location data, and comparable sales to predict future property values.",
      gradient: "from-accent-500 to-accent-600",
    },
    {
      icon: MessageSquareText, title: "AI Chat Assistant",
      description: "Get instant answers about buying, selling, loans, and legal queries. Available 24/7 with expert-level knowledge.",
      gradient: "from-violet-500 to-violet-600",
    },
    {
      icon: BarChart3, title: "Investment Analytics",
      description: "AI-driven investment scoring, rental yield estimates, and growth predictions to maximize your ROI.",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Shield, title: "Document Verification",
      description: "AI-powered OCR and fraud detection to verify property documents, ownership records, and RERA compliance.",
      gradient: "from-amber-500 to-amber-600",
    },
    {
      icon: Zap, title: "Instant Matching",
      description: "Connect with verified builders and sellers instantly. AI matches you based on preferences, budget, and behavior.",
      gradient: "from-rose-500 to-rose-600",
    },
  ];

  return (
    <section className="py-24 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge variant="glass" className="mb-4 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              <Sparkles size={12} /> AI Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Intelligence Built Into Every Step
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              From property discovery to investment analysis, AI powers every interaction
              to help you make smarter real estate decisions.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.08}>
              <Card className="p-6 h-full group cursor-pointer">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-md",
                  "group-hover:scale-110 group-hover:shadow-lg transition-all duration-300",
                  feature.gradient
                )}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TRENDING PROPERTIES SECTION
// ═══════════════════════════════════════════════════════════════
function TrendingSection() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await propertiesApi.getTrending();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setProperties(res.data);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch trending properties, trying general search...", err);
      }

      try {
        const resSearch = await propertiesApi.search({ limit: 4 });
        const items = resSearch.data?.items || resSearch.data || [];
        if (items.length > 0) {
          setProperties(items);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch search properties fallback:", err);
      }

      // Supabase direct query fallback
      try {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4);
        if (data && data.length > 0) {
          setProperties(data);
        }
      } catch {
        // Ignore error
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <section className="py-24 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="glass" className="mb-4 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
                <TrendingUp size={12} /> Trending Now
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Most Viewed Properties
              </h2>
            </div>
            <Link to="/properties" className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:gap-2 transition-all font-medium text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>

        {loading ? (
          <div className="text-center py-12 text-sm text-[var(--text-secondary)]">Loading live Supabase data...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((property, i) => (
              <FadeIn key={property.id} delay={i * 0.1}>
                <Link to={`/properties/${property.id}`}>
                  <Card className="overflow-hidden group cursor-pointer h-full flex flex-col justify-between">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={property.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop"}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {property.is_featured && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                            FEATURED
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase">
                          {property.listing_type}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <p className="text-xl font-bold text-white">
                          {formatPrice(property.price, true)}
                          {property.listing_type === "rent" && (
                            <span className="text-xs font-normal text-white/70">/mo</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-1 mb-1.5">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[var(--text-tertiary)] mb-3">
                          <MapPin size={12} />
                          <span className="text-xs">{property.locality || property.address || "Central"}, {property.city}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <BedDouble size={13} /> {property.bedrooms || 1} Bed
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath size={13} /> {property.bathrooms || 1} Bath
                          </span>
                          <span className="flex items-center gap-1">
                            <Maximize size={13} /> {formatArea(property.area_sqft || 1000)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-secondary)]">
                        {property.is_verified && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <BadgeCheck size={12} /> Verified
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] ml-auto">
                          <Eye size={11} /> {(property.view_count || 1).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}

        <div className="text-center mt-8 sm:hidden">
          <Link to="/properties">
            <Button variant="outline" size="md">
              View All Properties <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FEATURED BUILDERS SECTION
// ═══════════════════════════════════════════════════════════════
function BuildersSection() {
  return (
    <section className="py-24 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <Badge variant="glass" className="mb-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              <Building2 size={12} /> Top Builders
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Trusted by India's Best Builders
            </h2>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBuilders.map((builder, i) => (
            <FadeIn key={builder.name} delay={i * 0.1}>
              <Card className="p-6 text-center group cursor-pointer">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {builder.logo}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{builder.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{builder.rating}</span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">{builder.projects} Projects</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TESTIMONIALS SECTION
// ═══════════════════════════════════════════════════════════════
function TestimonialsSection() {
  return (
    <section className="py-24 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <Badge variant="glass" className="mb-4 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              <Star size={12} /> Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Loved by Thousands of Users
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <Card className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 mb-6">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-secondary)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{t.role}</p>
                  </div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CTA SECTION
// ═══════════════════════════════════════════════════════════════
function CTASection() {
  return (
    <section className="py-24 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] p-12 md:p-20 text-center">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 text-balance">
                Ready to Find Your
                <br />
                <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  Dream Property?
                </span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto mb-10 text-lg">
                Join 12,000+ users who found their perfect home with PropVerse AI.
                Start your intelligent property search today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/register">
                  <Button variant="gradient" size="xl">
                    Get Started Free <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="glass" size="xl" className="text-white border-white/20 hover:bg-white/10">
                    Contact Us
                  </Button>
                </Link>
              </div>

              {/* Direct Contact Bar */}
              <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
                <a href="mailto:vanshgupta200431@gmail.com" className="hover:text-primary-400 transition-colors flex items-center gap-2">
                  📧 vanshgupta200431@gmail.com
                </a>
                <span>•</span>
                <a href="tel:+918000101992" className="hover:text-primary-400 transition-colors flex items-center gap-2">
                  📞 +91 8000101992
                </a>
                <span>•</span>
                <span className="flex items-center gap-2">
                  📍 Jaipur, Rajasthan, India
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TrendingSection />
      <BuildersSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
