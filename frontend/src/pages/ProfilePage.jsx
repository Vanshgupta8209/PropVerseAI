import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Building, ShieldCheck, Edit3, Save, CheckCircle, Heart, Building2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/lib/api";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    state: "",
    bio: "",
    company_name: "",
  });
  const [savedCount, setSavedCount] = useState(0);
  const [myListingsCount, setMyListingsCount] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        city: user.city || "Mumbai",
        state: user.state || "Maharashtra",
        bio: user.bio || "Real estate enthusiast looking for prime properties.",
        company_name: user.company_name || "",
      });

      // Fetch user stats
      if (user.id) {
        supabase.from("property_favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => {
          setSavedCount(count || 0);
        });
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id).then(({ count }) => {
          setMyListingsCount(count || 0);
        });
      }
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.id) {
        // Update via backend FastAPI API + Supabase fallback
        try {
          await authApi.updateProfile(formData);
        } catch {
          await supabase.from("profiles").update(formData).eq("id", user.id);
        }
        await fetchProfile();
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-32 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Please Log In</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">You must be logged in to view your profile.</p>
        <Link to="/login">
          <Button variant="gradient" size="md">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=random`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card hover={false} className="p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-500/10 via-accent-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={user.full_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-primary-500/20 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md" title="Verified Profile">
                  <ShieldCheck size={16} />
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{user.full_name || "User Profile"}</h1>
                      <Badge variant="gradient" className="capitalize">{user.role || "Buyer"}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center justify-center sm:justify-start gap-1">
                      <Mail size={14} /> {user.email}
                    </p>
                  </div>

                  <Button
                    variant={isEditing ? "outline" : "gradient"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Cancel" : <><Edit3 size={16} /> Edit Profile</>}
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border-secondary)] flex flex-wrap gap-4 text-xs text-[var(--text-tertiary)] justify-center sm:justify-start">
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-primary-500" /> {formData.city}, {formData.state}</span>
                  {user.phone && <span className="flex items-center gap-1"><Phone size={14} className="text-emerald-500" /> {user.phone}</span>}
                  {user.company_name && <span className="flex items-center gap-1"><Building size={14} className="text-violet-500" /> {user.company_name}</span>}
                  <span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle size={14} /> Account Active</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "My Listings", val: myListingsCount.toString(), icon: Building2, color: "text-primary-600", link: "/dashboard/seller" },
            { label: "Saved Favorites", val: savedCount.toString(), icon: Heart, color: "text-rose-500", link: "/dashboard/buyer" },
            { label: "Role Access", val: (user.role || "Buyer").toUpperCase(), icon: ShieldCheck, color: "text-emerald-500", link: `/dashboard/${user.role || "buyer"}` },
            { label: "Supabase Sync", val: "Connected", icon: MessageSquare, color: "text-violet-500", link: "/chat" },
          ].map((s, i) => (
            <Link key={i} to={s.link}>
              <Card hover={true} className="p-5">
                <s.icon size={22} className={`${s.color} mb-3`} />
                <p className="text-2xl font-bold text-[var(--text-primary)]">{s.val}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.label}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Profile Edit / Display Form */}
        <Card hover={false} className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <User size={20} className="text-primary-600" /> Account Details & Bio
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Phone Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">City</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">State</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-75"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Company / Organization</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="PropVerse Real Estate Pvt Ltd"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-75"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Bio / About Me</label>
                <textarea
                  rows={3}
                  disabled={!isEditing}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-75"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
                <Button type="button" variant="outline" size="md" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="md" disabled={saving}>
                  {saving ? "Saving Changes..." : <><Save size={16} /> Save Profile</>}
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
