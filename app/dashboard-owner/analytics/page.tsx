"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, IndianRupee, Users, Building2,
  Percent, ArrowUpRight, ArrowDownRight, Clock, ShieldAlert,
  Loader2, Calendar
} from "lucide-react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    totalProperties: 0,
    occupiedProperties: 0,
    occupancyRate: 0,
    totalRevenue: 0,
    pendingMaintenance: 0,
    monthlyYield: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/properties/get");
        const data = await res.json();
        
        if (res.ok && data.properties) {
          const props = data.properties;
          const occupied = props.filter((p: any) => p.assignedTenant).length;
          const totalRent = props.reduce((acc: number, curr: any) => acc + (Number(curr.rentAmount) || 0), 0);
          
          setAnalyticsData({
            totalProperties: props.length,
            occupiedProperties: occupied,
            occupancyRate: props.length > 0 ? Math.round((occupied / props.length) * 100) : 0,
            totalRevenue: totalRent,
            pendingMaintenance: 0,
            monthlyYield: props.length > 0 ? Math.round(totalRent / props.length) : 0,
          });
        }
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight mb-1">
          Analytics & Performance
        </h1>
        <p className="text-xs text-neutral-500 font-medium">
          Monitor your real estate metrics, monthly yield statistics, and lease occupancy tracking.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neutral-900" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Portfolio Occupancy",
                value: `${analyticsData.occupancyRate}%`,
                desc: `${analyticsData.occupiedProperties} of ${analyticsData.totalProperties} Rented`,
                icon: Percent,
                color: "bg-indigo-50 text-indigo-600 border-indigo-100",
              },
              {
                title: "Total Yield (Potential)",
                value: `₹${analyticsData.totalRevenue.toLocaleString("en-IN")}`,
                desc: "Combined Monthly Rental Income",
                icon: IndianRupee,
                color: "bg-emerald-50 text-emerald-600 border-emerald-100",
              },
              {
                title: "Average Rent Yield",
                value: `₹${analyticsData.monthlyYield.toLocaleString("en-IN")}`,
                desc: "Per Asset Average Rent Yield",
                icon: TrendingUp,
                color: "bg-amber-50 text-amber-600 border-amber-100",
              },
              {
                title: "Maintenance Health",
                value: `${analyticsData.pendingMaintenance}`,
                desc: "Unresolved Maintenance Tickets",
                icon: ShieldAlert,
                color: "bg-rose-50 text-rose-600 border-rose-100",
              },
            ].map((metric, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-black text-neutral-900 mt-1">{metric.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${metric.color}`}>
                    <metric.icon size={16} />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 font-semibold mt-4 flex items-center gap-1">
                  <Calendar size={11} className="text-neutral-400" /> {metric.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Chart Placeholder Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200/85 shadow-2xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900">Revenue Stream (Gross monthly)</h3>
                  <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Rent income trends over the past fiscal quarters</p>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  Real-time Data
                </span>
              </div>

              {/* Graphical Placeholder Grid */}
              <div className="h-64 flex items-end justify-between gap-2 pt-6 border-b border-neutral-100">
                {[45, 60, 55, 70, 85, 90, 80, 95, 100, 110, 105, 120].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    {/* Tooltip */}
                    <div className="absolute mb-16 opacity-0 group-hover:opacity-100 transition-all bg-neutral-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none">
                      {val}%
                    </div>
                    {/* Bar */}
                    <div
                      className="w-full bg-neutral-150 group-hover:bg-neutral-950 rounded-t-md transition-all duration-300"
                      style={{ height: `${val * 1.5}px` }}
                    />
                    <span className="text-[9px] text-neutral-400 font-bold uppercase mt-2">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/85 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 mb-4">Portfolio Diagnostics</h3>
                
                <div className="space-y-4">
                  {[
                    {
                      label: "Lease Renewal Probabilities",
                      desc: "High potential (7 tenants exceeding lock-in periods)",
                      rate: 85,
                      trend: "up",
                    },
                    {
                      label: "Yield Optimization Score",
                      desc: "Average yield matches platform parameters",
                      rate: 74,
                      trend: "neutral",
                    },
                    {
                      label: "Asset Quality Index",
                      desc: "Low maintenance tickets filed this quarter",
                      rate: 92,
                      trend: "up",
                    },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-neutral-800">{item.label}</span>
                        <span className="font-bold text-neutral-900">{item.rate}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-950 rounded-full"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-semibold">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-bold leading-normal">
                  💡 Tip: Boost occupancy yield by enabling automated agreement renewals via Email notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
