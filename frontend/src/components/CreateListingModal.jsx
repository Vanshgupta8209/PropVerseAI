import { useState } from "react";
import { X, Building2, Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";

export default function CreateListingModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    property_type: "apartment",
    listing_type: "sale",
    price: "",
    city: "Mumbai",
    locality: "Bandra West",
    address: "",
    bedrooms: "2",
    bathrooms: "2",
    area_sqft: "1100",
    description: "",
    image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      setError("You must be logged in to post a listing.");
      return;
    }
    if (!formData.title || !formData.price || !formData.city) {
      setError("Please fill in all required fields (Title, Price, City).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
      
      const payload = {
        owner_id: user.id,
        title: formData.title,
        slug: slug,
        description: formData.description || `${formData.title} in ${formData.locality}, ${formData.city}.`,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        status: "active",
        price: parseFloat(formData.price),
        city: formData.city,
        locality: formData.locality,
        address: formData.address || `${formData.locality}, ${formData.city}`,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        area_sqft: parseFloat(formData.area_sqft) || 1000,
        image_url: formData.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop",
        is_verified: true,
        is_featured: false,
        view_count: 1,
        inquiry_count: 0,
      };

      const { data, error: insertErr } = await supabase
        .from("properties")
        .insert([payload])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Also record post in posts table
      await supabase.from("posts").insert([
        {
          user_id: user.id,
          property_id: data.id,
          title: data.title,
          content: `Listed new property: ${data.title} in ${data.city} for ₹${data.price.toLocaleString()}`,
          image_url: data.image_url,
        }
      ]);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        if (onSuccess) onSuccess(data);
        onClose();
      }, 1200);

    } catch (err) {
      setError(err.message || "Failed to create post.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card hover={false} className="w-full max-w-2xl bg-[var(--bg-surface)] p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Post New Listing</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Publish your property listing directly to Supabase</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Listing Published!</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Saved to Supabase database. Updating your feed...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Property Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Skyline Residency — Luxury 3BHK Apartment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Property Type</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                >
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="house">House</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="studio">Studio</option>
                  <option value="farmhouse">Farmhouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Listing Type</label>
                <select
                  value={formData.listing_type}
                  onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 8500000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Area (sq.ft)</label>
                <input
                  type="number"
                  placeholder="1200"
                  value={formData.area_sqft}
                  onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Locality</label>
                <input
                  type="text"
                  placeholder="Bandra West"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Bedrooms</label>
                <select
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                >
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5+ BHK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe property features, community amenities, and location highlights..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={loading}>
                {loading ? "Publishing..." : <><Sparkles size={16} /> Publish Listing</>}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
