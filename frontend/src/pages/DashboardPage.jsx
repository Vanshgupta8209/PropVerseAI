import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Heart, MessageSquare, Bell, BarChart3,
  Search, Brain, Eye, Sparkles, TrendingUp, ArrowRight, Plus, Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { dashboardApi, propertiesApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import CreateListingModal from "@/components/CreateListingModal";

const quickActions = [
  { icon: Search, label: "Search Properties", href: "/search", color: "from-primary-500 to-primary-600" },
  { icon: Heart, label: "Explore Listings", href: "/properties", color: "from-rose-500 to-rose-600" },
  { icon: Brain, label: "AI Search", href: "/search", color: "from-violet-500 to-violet-600" },
  { icon: BarChart3, label: "EMI Calculator", href: "/calculator", color: "from-emerald-500 to-emerald-600" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const displayName = user?.full_name?.split(" ")[0] || "User";
  const [stats, setStats] = useState({
    savedCount: 0,
    messagesCount: 0,
    notificationsCount: 0,
    myListingsCount: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        try {
          const { data: bStats } = await dashboardApi.getStats();
          if (bStats) {
            setStats({
              savedCount: bStats.saved_count || 0,
              messagesCount: bStats.messages_count || 0,
              notificationsCount: bStats.notifications_count || 0,
              myListingsCount: bStats.my_listings_count || 0,
            });
          }
        } catch {
          // Fallback to Supabase
          const { count: savedCount } = await supabase.from("property_favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id);
          const { count: messagesCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("sender_id", user.id);
          const { count: notificationsCount } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id);
          const { count: myListingsCount } = await supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", user.id);
          setStats({ savedCount: savedCount || 0, messagesCount: messagesCount || 0, notificationsCount: notificationsCount || 0, myListingsCount: myListingsCount || 0 });
        }
      }

      // Fetch recent properties
      try {
        const { data: pData } = await propertiesApi.search({ limit: 3, sort_by: "created_at", sort_order: "desc" });
        if (pData?.items) {
          setRecentProperties(pData.items);
        } else {
          const { data: props } = await supabase.from("properties").select("*").order("created_at", { ascending: false }).limit(3);
          setRecentProperties(props || []);
        }
      } catch {
        const { data: props } = await supabase.from("properties").select("*").order("created_at", { ascending: false }).limit(3);
        setRecentProperties(props || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {displayName} 👋
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">Here is your live real-time dashboard from Supabase.</p>
          </div>

          <Button variant="gradient" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Listing / Post
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: "My Listings", value: stats.myListingsCount, change: "Live", color: "text-primary-600" },
            { icon: Heart, label: "Saved Properties", value: stats.savedCount, change: "Live", color: "text-rose-600" },
            { icon: MessageSquare, label: "Chat Messages", value: stats.messagesCount, change: "Live", color: "text-violet-600" },
            { icon: Bell, label: "Notifications", value: stats.notificationsCount, change: "Live", color: "text-amber-600" },
          ].map((stat) => (
            <Card key={stat.label} hover={false} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={20} className={stat.color} />
                <Badge variant="success" className="text-[10px]">{stat.change}</Badge>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}>
                <Card className="p-5 text-center group cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                    <action.icon size={22} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{action.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recently Added Properties */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Latest Database Properties</h2>
              <Link to="/properties" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</Link>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">Loading live database properties...</div>
            ) : recentProperties.length === 0 ? (
              <Card hover={false} className="p-8 text-center text-xs text-[var(--text-tertiary)]">
                No properties in database yet. Click "Create Listing" above to publish the first one!
              </Card>
            ) : (
              <div className="space-y-3">
                {recentProperties.map((prop) => (
                  <Link key={prop.id} to={`/properties/${prop.id}`}>
                    <Card className="overflow-hidden group cursor-pointer">
                      <div className="flex items-center gap-4 p-4">
                        <img
                          src={prop.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop"}
                          alt={prop.title}
                          className="w-20 h-16 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">{prop.title}</h3>
                          <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                            <Eye size={11} /> {(prop.view_count || 1).toLocaleString()} views · {prop.city}
                          </p>
                        </div>
                        <p className="text-lg font-bold gradient-text">{formatPrice(prop.price)}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">AI Market Insights</h2>
            <Card hover={false} className="p-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Live Database Trends</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Real estate market listings in <strong>Mumbai, Bengaluru, and Goa</strong> are actively syncing live via Supabase.
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">Bullish Real Estate Market</span>
              </div>
            </Card>

            <Card hover={false} className="p-6 mt-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Recommended For You</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">Search properties dynamically matching your needs:</p>
              <Link to="/search">
                <Button variant="outline" size="sm" className="w-full">
                  <Brain size={14} /> View AI Search <ArrowRight size={14} />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>

      <CreateListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
