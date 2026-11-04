import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Eye, MessageSquare, TrendingUp, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import CreateListingModal from "@/components/CreateListingModal";
import { Link } from "react-router-dom";

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSellerListings = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        setMyProperties(data || []);
      } else {
        // Fetch public properties if user not logged in
        const { data } = await supabase.from("properties").select("*").limit(4);
        setMyProperties(data || []);
      }
    } catch (err) {
      console.error("Error fetching seller listings:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSellerListings();
  }, [fetchSellerListings]);

  const handleDeleteListing = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property listing from Supabase?")) return;
    try {
      await supabase.from("properties").delete().eq("id", propertyId);
      setMyProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const totalViews = myProperties.reduce((acc, p) => acc + (p.view_count || 0), 0);
  const activeCount = myProperties.filter((p) => p.status === "active").length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Seller Dashboard</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage active properties, track total views, and add new listings to Supabase.</p>
          </div>
          <Button variant="gradient" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add New Listing
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Listings", val: activeCount.toString(), icon: Building2, color: "text-primary-600" },
            { label: "Total Views", val: totalViews.toLocaleString(), icon: Eye, color: "text-accent-500" },
            { label: "Total Properties", val: myProperties.length.toString(), icon: MessageSquare, color: "text-emerald-500" },
            { label: "Sync Status", val: "Live DB", icon: TrendingUp, color: "text-amber-500" },
          ].map((s, i) => (
            <Card key={i} hover={false} className="p-5">
              <s.icon size={20} className={`${s.color} mb-3`} />
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.val}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Listings Table */}
        <Card hover={false} className="p-6">
          <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4">My Property Listings</h2>
          
          {loading ? (
            <p className="text-xs text-[var(--text-tertiary)]">Loading your properties from Supabase...</p>
          ) : myProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={40} className="mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">No listings created yet</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Click "Add New Listing" above to publish your first property to the database.</p>
              <Button variant="gradient" size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} /> Create Listing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myProperties.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] text-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <Link to={`/properties/${item.id}`} className="font-semibold text-[var(--text-primary)] hover:text-primary-600 transition-colors truncate block">
                      {item.title}
                    </Link>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {(item.view_count || 1).toLocaleString()} views · {item.city} ({item.listing_type})
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-primary-600">{formatPrice(item.price)}</span>
                    <Badge variant={item.status === "active" ? "success" : "warning"}>
                      {item.status}
                    </Badge>
                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Listing"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <CreateListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchSellerListings()}
      />
    </div>
  );
}
