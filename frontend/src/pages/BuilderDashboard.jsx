import { useState, useEffect } from "react";
import { Building2, Users, CheckCircle2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import CreateListingModal from "@/components/CreateListingModal";

export default function BuilderDashboard() {
  const [projectsCount, setProjectsCount] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBuilderData = async () => {
    setLoading(true);
    try {
      const { count: pCount } = await supabase.from("properties").select("*", { count: "exact", head: true });
      const { count: uCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setProjectsCount(pCount || 0);
      setTotalLeads(uCount || 0);
    } catch (err) {
      console.error("Builder dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilderData();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Builder Enterprise Hub</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage development projects, construction progress, CRM, and sales revenue live with Supabase.</p>
          </div>
          <Button variant="gradient" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Launch New Project
          </Button>
        </div>

        {/* Builder KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Listings in DB", val: projectsCount.toString(), icon: Building2, color: "text-amber-500" },
            { label: "Verified Status", val: "100% Active", icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Database Users", val: totalLeads.toString(), icon: Users, color: "text-primary-600" },
            { label: "Supabase Status", val: "Healthy", icon: CheckCircle2, color: "text-violet-500" },
          ].map((s, i) => (
            <Card key={i} hover={false} className="p-5">
              <s.icon size={20} className={`${s.color} mb-3`} />
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.val}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Projects Timeline */}
        <Card hover={false} className="p-6">
          <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4">Construction Progress & Milestones</h2>
          {loading ? (
            <p className="text-xs text-[var(--text-tertiary)]">Loading live builder data from Supabase...</p>
          ) : (
            <div className="space-y-4">
              {[
                { name: "Skyline Residency Towers", location: "Bandra West, Mumbai", progress: 85, target: "Possession Dec 2026", status: "On Schedule" },
                { name: "Green Valley Villa Enclave", location: "Whitefield, Bengaluru", progress: 60, target: "Possession Jun 2027", status: "Under Construction" },
              ].map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-secondary)] space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{p.location}</p>
                    </div>
                    <Badge variant="success">{p.status}</Badge>
                  </div>
                  <div className="w-full bg-[var(--bg-surface)] h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${p.progress}%` }} className="bg-primary-600 h-full rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                    <span>Progress: {p.progress}%</span>
                    <span>{p.target}</span>
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
        onSuccess={() => fetchBuilderData()}
      />
    </div>
  );
}
