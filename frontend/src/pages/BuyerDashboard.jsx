import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Calendar, FileText, Sparkles, ArrowRight, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

export default function BuyerDashboard() {
  const { user } = useAuthStore();
  const [savedCount, setSavedCount] = useState(0);
  const [inquiriesCount, setInquiriesCount] = useState(0);
  const [loansCount, setLoansCount] = useState(0);
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyerData = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const { data: favs } = await supabase
            .from("property_favorites")
            .select("*, properties(*)")
            .eq("user_id", user.id);

          if (favs) {
            setSavedCount(favs.length);
            setSavedProperties(favs.map((f) => f.properties).filter(Boolean));
          }

          const { count: inqCount } = await supabase
            .from("property_inquiries")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          setInquiriesCount(inqCount || 0);

          const { count: lCount } = await supabase
            .from("loan_applications")
            .select("*", { count: "exact", head: true })
            .eq("applicant_id", user.id);
          setLoansCount(lCount || 0);
        }
      } catch (err) {
        console.error("Error fetching buyer dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerData();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Buyer Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Track saved properties, inquiries, and loan applications live from Supabase.</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Saved Properties", val: savedCount.toString(), icon: Heart, color: "text-rose-500" },
            { label: "Site Visit Inquiries", val: inquiriesCount.toString(), icon: Calendar, color: "text-primary-600" },
            { label: "Loan Applications", val: loansCount > 0 ? `${loansCount} Active` : "None", icon: FileText, color: "text-emerald-500" },
            { label: "AI Matches", val: savedProperties.length > 0 ? `${savedProperties.length} Saved` : "0 Matches", icon: Sparkles, color: "text-violet-500" },
          ].map((s, i) => (
            <Card key={i} hover={false} className="p-5">
              <s.icon size={20} className={`${s.color} mb-3`} />
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.val}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Saved Properties */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card hover={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--text-primary)]">My Saved Properties</h3>
              <Link to="/properties" className="text-xs text-primary-600 hover:underline">Explore All</Link>
            </div>

            {loading ? (
              <p className="text-xs text-[var(--text-tertiary)]">Loading saved properties...</p>
            ) : savedProperties.length === 0 ? (
              <div className="text-center py-8">
                <Heart size={32} className="mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">No saved properties yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Browse properties and click the heart icon to save listings here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedProperties.map((prop) => (
                  <Link key={prop.id} to={`/properties/${prop.id}`}>
                    <div className="p-3 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors">
                      <div className="flex items-center gap-3">
                        <Building2 size={18} className="text-primary-600" />
                        <div>
                          <p className="font-semibold text-xs text-[var(--text-primary)]">{prop.title}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">{prop.locality || prop.city}</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-primary-600">{formatPrice(prop.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card hover={false} className="p-6">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Home Loan Status</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <div>
                <p className="font-bold text-sm text-emerald-600">Home Loan EMI Calculator</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Calculate live interest rates and monthly payments.</p>
              </div>
              <Badge variant="success">Available</Badge>
            </div>
            <Link to="/calculator">
              <Button variant="gradient" size="sm" className="w-full">Calculate EMI <ArrowRight size={14} /></Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
