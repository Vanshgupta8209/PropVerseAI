import { useState } from "react";
import { motion } from "framer-motion";
import { GitCompare } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatPrice, formatArea } from "@/lib/utils";

const sampleProperties = [
  {
    id: "1",
    title: "Skyline Residency 3BHK",
    price: 8500000,
    price_sqft: 5862,
    city: "Mumbai",
    locality: "Bandra West",
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1450,
    property_type: "Apartment",
    builder: "Prestige Group",
    possession: "Ready to Move",
    ai_score: 9.2,
    growth_forecast: "+12.4% (3 Yrs)",
    amenities: ["Swimming Pool", "Gym", "Security", "Power Backup", "Club House"],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Green Valley Villa 4BHK",
    price: 15000000,
    price_sqft: 5357,
    city: "Bengaluru",
    locality: "Whitefield",
    bedrooms: 4,
    bathrooms: 3,
    area_sqft: 2800,
    property_type: "Villa",
    builder: "Godrej Properties",
    possession: "Dec 2026",
    ai_score: 8.9,
    growth_forecast: "+15.1% (3 Yrs)",
    amenities: ["Swimming Pool", "Gym", "Security", "Garden", "Club House", "Tennis Court"],
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
  },
];

export default function PropertyComparePage() {
  const [properties] = useState(sampleProperties);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
            <GitCompare size={16} className="text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Side-by-Side Analysis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Property Comparison Matrix
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Compare prices, area, builder credentials, AI investment scores, and amenities side-by-side to make informed investment choices.
          </p>
        </motion.div>

        <div className="overflow-x-auto pb-6">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-4 flex flex-col justify-end">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Features & Metrics</h3>
                <p className="text-xs text-[var(--text-tertiary)]">AI-powered comparative analysis</p>
              </div>
              {properties.map((p) => (
                <Card key={p.id} hover={false} className="p-4 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-36 object-cover rounded-xl mb-3" />
                  <h4 className="font-bold text-sm text-[var(--text-primary)] line-clamp-1">{p.title}</h4>
                  <p className="text-xs text-[var(--text-tertiary)]">{p.locality}, {p.city}</p>
                  <p className="text-lg font-extrabold gradient-text mt-2">{formatPrice(p.price, true)}</p>
                </Card>
              ))}
            </div>

            {/* Comparison Rows */}
            <div className="space-y-3">
              {[
                { label: "Price per Sq.Ft.", key1: `₹${properties[0]?.price_sqft}/sqft`, key2: `₹${properties[1]?.price_sqft}/sqft` },
                { label: "Carpet Area", key1: formatArea(properties[0]?.area_sqft), key2: formatArea(properties[1]?.area_sqft) },
                { label: "Bedrooms / Bathrooms", key1: `${properties[0]?.bedrooms} Bed / ${properties[0]?.bathrooms} Bath`, key2: `${properties[1]?.bedrooms} Bed / ${properties[1]?.bathrooms} Bath` },
                { label: "Property Type", key1: properties[0]?.property_type, key2: properties[1]?.property_type },
                { label: "Builder", key1: properties[0]?.builder, key2: properties[1]?.builder },
                { label: "Possession Status", key1: properties[0]?.possession, key2: properties[1]?.possession },
                { label: "AI Investment Score", key1: `🌟 ${properties[0]?.ai_score}/10`, key2: `🌟 ${properties[1]?.ai_score}/10` },
                { label: "Projected 3-Yr Growth", key1: properties[0]?.growth_forecast, key2: properties[1]?.growth_forecast },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-6 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-sm">
                  <div className="font-medium text-[var(--text-secondary)]">{row.label}</div>
                  <div className="font-semibold text-[var(--text-primary)]">{row.key1}</div>
                  <div className="font-semibold text-[var(--text-primary)]">{row.key2}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
