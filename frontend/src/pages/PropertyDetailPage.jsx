import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, BedDouble, Bath, Maximize, Heart, Share2, BadgeCheck,
  Star, Calendar, Building2, Phone, Mail, MessageSquare, ChevronLeft,
  ChevronRight, Ruler, Car, Layers, Compass, Shield, Eye, Loader2, Send,
} from "lucide-react";
import { cn, formatPrice, formatArea, formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchPropertyDetail = async () => {
      setLoading(true);
      try {
        let query = supabase.from("properties").select("*");
        if (id) {
          query = query.eq("id", id);
        }
        const { data, error } = await query.single();
        
        if (error) {
          // If id not found, fetch first available property
          const { data: firstProp } = await supabase.from("properties").select("*").limit(1).single();
          if (firstProp) setProperty(firstProp);
        } else if (data) {
          setProperty(data);
        }

        // Increment view count
        if (data?.id) {
          supabase.rpc("increment_view_count", { prop_id: data.id }).then(() => {}).catch(() => {});
        }
      } catch (err) {
        console.error("Error fetching property detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id]);

  // Fetch Owner Profile & Reviews
  useEffect(() => {
    if (!property?.id) return;

    // Fetch Owner
    if (property.owner_id) {
      supabase.from("profiles").select("*").eq("id", property.owner_id).single().then(({ data }) => {
        if (data) setOwner(data);
      });
    }

    // Fetch Reviews
    supabase.from("property_reviews").select("*, profiles(full_name, avatar_url)").eq("property_id", property.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setReviews(data);
    });

    // Check if favorited
    if (user?.id) {
      supabase.from("property_favorites").select("id").eq("user_id", user.id).eq("property_id", property.id).maybeSingle().then(({ data }) => {
        if (data) setBookmarked(true);
      });
    }
  }, [property?.id, property?.owner_id, user?.id]);

  const handleToggleBookmark = async () => {
    if (!user?.id || !property?.id) return;
    try {
      if (bookmarked) {
        setBookmarked(false);
        await supabase.from("property_favorites").delete().eq("user_id", user.id).eq("property_id", property.id);
      } else {
        setBookmarked(true);
        await supabase.from("property_favorites").insert([{ user_id: user.id, property_id: property.id }]);
      }
    } catch {
      // Revert if error
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user?.id || !property?.id || !newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase.from("property_reviews").insert([
        {
          user_id: user.id,
          property_id: property.id,
          rating: newRating,
          comment: newComment,
          is_verified: true,
        }
      ]).select("*, profiles(full_name, avatar_url)").single();

      if (!error && data) {
        setReviews([data, ...reviews]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-32 text-center">
        <Loader2 size={40} className="animate-spin text-primary-600 mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">Fetching details from Supabase...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-32 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Property Not Found</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">The requested listing does not exist in the database.</p>
        <Link to="/properties" className="mt-4 inline-block">
          <Button variant="gradient" size="sm">Back to Properties</Button>
        </Link>
      </div>
    );
  }

  const images = property.image_url ? [property.image_url] : [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop"
  ];

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20">
      {/* Image Gallery */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden bg-black">
        <motion.img
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={images[currentImage]}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleToggleBookmark} className={cn("w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer", bookmarked ? "bg-rose-500 text-white" : "bg-white/20 text-white hover:bg-white/40")}>
            <Heart size={18} fill={bookmarked ? "white" : "none"} />
          </button>
          <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer">
            <Share2 size={18} />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {property.is_featured && <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg">FEATURED</span>}
          {property.is_verified && <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"><BadgeCheck size={12} /> VERIFIED</span>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <MapPin size={16} />
                    <span className="text-sm">{property.address || property.locality}, {property.city}, {property.state}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold gradient-text">{formatPrice(property.price)}</p>
                {property.price_per_sqft && (
                  <p className="text-sm text-[var(--text-tertiary)]">₹{property.price_per_sqft.toLocaleString()}/sq.ft</p>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: BedDouble, label: "Bedrooms", value: `${property.bedrooms || 1} BHK` },
                  { icon: Bath, label: "Bathrooms", value: property.bathrooms || 1 },
                  { icon: Maximize, label: "Area", value: formatArea(property.area_sqft || 1000) },
                  { icon: Layers, label: "Floor", value: `${property.floor_number || 1}/${property.total_floors || 10}` },
                ].map((stat) => (
                  <Card key={stat.label} hover={false} className="p-4 text-center">
                    <stat.icon size={22} className="mx-auto mb-2 text-primary-600 dark:text-primary-400" />
                    <p className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card hover={false} className="p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">About This Property</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{property.description || "No description provided."}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border-secondary)]">
                  {[
                    { label: "Type", value: property.property_type, icon: Building2 },
                    { label: "Furnishing", value: (property.furnishing || "unfurnished").replace("_", " "), icon: Ruler },
                    { label: "Facing", value: property.facing || "North", icon: Compass },
                    { label: "Year Built", value: property.year_built || 2023, icon: Calendar },
                    { label: "Parking", value: `${property.parking_spaces || 1} Covered`, icon: Car },
                    { label: "RERA ID", value: property.rera_id || "Verified", icon: Shield },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center gap-2">
                      <detail.icon size={16} className="text-[var(--text-tertiary)]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{detail.label}</p>
                        <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{detail.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card hover={false} className="p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">User Reviews</h2>
                
                {user ? (
                  <form onSubmit={handleAddReview} className="mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-3">
                    <p className="text-xs font-bold text-[var(--text-primary)]">Leave a Review</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="cursor-pointer"
                        >
                          <Star size={18} className={star <= newRating ? "text-amber-500 fill-amber-500" : "text-gray-400"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Share your thoughts about this property..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                    <Button type="submit" variant="gradient" size="sm" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : <><Send size={14} /> Submit Review</>}
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)] mb-4">Sign in to leave a review for this property.</p>
                )}

                {reviews.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] italic">No reviews yet for this listing.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, j) => (
                              <Star key={j} size={14} className="text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{review.profiles?.full_name || "User"}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">{formatTimeAgo(review.created_at)}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card hover={false} className="p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                  {owner?.full_name?.[0]?.toUpperCase() || "O"}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{owner?.full_name || "Listed Owner"}</p>
                  <p className="text-xs text-[var(--text-tertiary)] capitalize">{owner?.role || "Seller"}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <a href={`tel:${owner?.phone || "+918000101992"}`} className="block w-full">
                  <Button variant="gradient" size="lg" className="w-full">
                    <Phone size={18} /> Call ({owner?.phone || "+91 8000101992"})
                  </Button>
                </a>
                <a href={`mailto:${owner?.email || "vanshgupta200431@gmail.com"}`} className="block w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    <Mail size={18} /> Email Owner
                  </Button>
                </a>
                <Link to="/chat" className="block w-full">
                  <Button variant="ghost" size="lg" className="w-full">
                    <MessageSquare size={18} /> Chat Now
                  </Button>
                </Link>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-[var(--border-secondary)] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Base Price</span>
                  <span className="font-medium text-[var(--text-primary)]">{formatPrice(property.price)}</span>
                </div>
                {property.maintenance_charge && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Maintenance</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatPrice(property.maintenance_charge)}/mo</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Card */}
            <Card hover={false} className="p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Listing Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Eye size={14} /> {(property.view_count || 1).toLocaleString()} views
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <MessageSquare size={14} /> {reviews.length} reviews
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Calendar size={14} /> Listed {formatTimeAgo(property.created_at)}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
