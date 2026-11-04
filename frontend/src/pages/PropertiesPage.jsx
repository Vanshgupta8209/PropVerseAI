import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Search, SlidersHorizontal, Grid3X3, List, MapPin, BedDouble, Bath,
  Maximize, Heart, Eye, BadgeCheck, X, Plus, Sparkles, Loader2,
} from "lucide-react";
import { cn, formatPrice, formatArea } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import CreateListingModal from "@/components/CreateListingModal";

function PropertyCard({ property, index, userFavorites, onToggleFavorite }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const isFav = userFavorites.includes(property.id);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden group cursor-pointer h-full flex flex-col justify-between">
        <Link to={`/properties/${property.id}`}>
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={property.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop"}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex gap-1.5">
              {property.is_featured && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">FEATURED</span>}
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase">{property.listing_type}</span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(property.id);
              }}
              className={cn(
                "absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer",
                isFav ? "bg-rose-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
              )}
            >
              <Heart size={14} fill={isFav ? "white" : "none"} />
            </button>

            <div className="absolute bottom-3 left-3">
              <p className="text-xl font-bold text-white">
                {formatPrice(property.price, true)}
                {property.listing_type === "rent" && <span className="text-xs font-normal text-white/70">/mo</span>}
              </p>
            </div>
          </div>
        </Link>

        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <Link to={`/properties/${property.id}`}>
              <h3 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-1 mb-1.5 hover:text-primary-600 transition-colors">
                {property.title}
              </h3>
            </Link>
            <div className="flex items-center gap-1 text-[var(--text-tertiary)] mb-3">
              <MapPin size={12} />
              <span className="text-xs">{property.locality || property.address || "Centrally Located"}, {property.city}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1"><BedDouble size={13} /> {property.bedrooms || 1} Bed</span>
              <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms || 1} Bath</span>
              <span className="flex items-center gap-1"><Maximize size={13} /> {formatArea(property.area_sqft || 1000)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-secondary)]">
            {property.is_verified && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] ml-auto">
              <Eye size={11} /> {(property.view_count || 1).toLocaleString()} views
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PropertiesPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFavorites, setUserFavorites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activePill, setActivePill] = useState("All");

  const [filters, setFilters] = useState({
    location: searchParams.get("location") || searchParams.get("city") || searchParams.get("q") || "",
    listing_type: searchParams.get("type") || "",
    property_type: "",
    bedrooms: "",
  });

  // Fetch properties from Supabase live database
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error("Error fetching properties from Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user favorites
  const fetchFavorites = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("property_favorites")
        .select("property_id")
        .eq("user_id", user.id);
      if (data) {
        setUserFavorites(data.map((f) => f.property_id));
      }
    } catch {
      // Ignore error
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFavorites();

    // Supabase Realtime Subscription for Properties
    const channel = supabase
      .channel("public:properties")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleToggleFavorite = async (propertyId) => {
    if (!user?.id) return;
    const isFav = userFavorites.includes(propertyId);
    try {
      if (isFav) {
        setUserFavorites((prev) => prev.filter((id) => id !== propertyId));
        await supabase
          .from("property_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId);
      } else {
        setUserFavorites((prev) => [...prev, propertyId]);
        await supabase
          .from("property_favorites")
          .insert([{ user_id: user.id, property_id: propertyId }]);
      }
    } catch {
      fetchFavorites();
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (filters.listing_type && p.listing_type !== filters.listing_type) return false;
    if (filters.property_type && p.property_type !== filters.property_type) return false;
    if (filters.bedrooms && p.bedrooms !== parseInt(filters.bedrooms)) return false;
    if (filters.location) {
      const loc = filters.location.trim().toLowerCase();
      const matchCity = (p.city || "").toLowerCase().includes(loc);
      const matchLocality = (p.locality || "").toLowerCase().includes(loc);
      const matchState = (p.state || "").toLowerCase().includes(loc);
      const matchTitle = (p.title || "").toLowerCase().includes(loc);
      if (!matchCity && !matchLocality && !matchState && !matchTitle) return false;
    }
    return true;
  });

  const handlePillClick = (pill) => {
    setActivePill(pill);
    if (pill === "All") {
      setFilters({ ...filters, listing_type: "", property_type: "" });
    } else if (pill === "Buy") {
      setFilters({ ...filters, listing_type: "sale" });
    } else if (pill === "Rent") {
      setFilters({ ...filters, listing_type: "rent" });
    } else if (pill === "Apartment") {
      setFilters({ ...filters, property_type: "apartment" });
    } else if (pill === "Villa") {
      setFilters({ ...filters, property_type: "villa" });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Header & Location Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Explore Properties</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"} available in Supabase
              {filters.location && <span> in "<span className="font-semibold text-primary-600 dark:text-primary-400">{filters.location}</span>"</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Post Listing Button */}
            <Button variant="gradient" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Post Listing
            </Button>

            {/* Search location input */}
            <div className="relative flex-1 sm:w-80">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-600 dark:text-primary-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search location (e.g. Bandra, Mumbai, Whitefield...)"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-[var(--text-tertiary)] shadow-sm"
              />
              {filters.location && (
                <button
                  onClick={() => setFilters({ ...filters, location: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /> Filters
            </Button>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)]">
              <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode === "grid" ? "bg-[var(--bg-surface)] shadow-sm" : "text-[var(--text-tertiary)]")}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode === "list" ? "bg-[var(--bg-surface)] shadow-sm" : "text-[var(--text-tertiary)]")}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8">
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <select value={filters.listing_type} onChange={(e) => setFilters({ ...filters, listing_type: e.target.value })} className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]">
                  <option value="">All Listing Types</option>
                  <option value="sale">Buy</option>
                  <option value="rent">Rent</option>
                </select>
                <select value={filters.property_type} onChange={(e) => setFilters({ ...filters, property_type: e.target.value })} className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]">
                  <option value="">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="house">House</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="studio">Studio</option>
                  <option value="farmhouse">Farmhouse</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter by city / locality..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                />
                <select value={filters.bedrooms} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })} className="h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]">
                  <option value="">Bedrooms</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5+ BHK</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => { setFilters({ location: "", listing_type: "", property_type: "", bedrooms: "" }); setActivePill("All"); }}>
                  <X size={14} /> Clear All
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["All", "Buy", "Rent", "Apartment", "Villa"].map((pill) => (
            <button
              key={pill}
              onClick={() => handlePillClick(pill)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer",
                activePill === pill
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:shadow-sm"
              )}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={40} className="animate-spin text-primary-600 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">Connecting to Supabase...</p>
          </div>
        ) : (
          /* Property Grid */
          <div className={cn(
            "grid gap-6",
            viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            {filteredProperties.map((property, i) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={i}
                userFavorites={userFavorites}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {!loading && filteredProperties.length === 0 && (
          <div className="text-center py-20">
            <Search size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No properties found</h3>
            <p className="text-[var(--text-secondary)] mb-4">No database records match your search criteria.</p>
            <Button variant="gradient" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Be the first to post a property!
            </Button>
          </div>
        )}
      </div>

      <CreateListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchProperties()}
      />
    </div>
  );
}
