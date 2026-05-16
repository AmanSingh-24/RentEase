"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  IndianRupee, 
  Wrench, 
  ShieldCheck, 
  LayoutGrid, 
  Settings,
  ArrowUpRight, 
  AlertCircle, 
  Plus, 
  Clock,
  MoreVertical
} from "lucide-react";
import { useProperty } from "../context/PropertyContext";

export default function OwnerDashboard() {
  const { openModal } = useProperty();
  const [stats, setStats] = useState({ count: 0, totalRent: 0 });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH REAL DATA FROM MONGODB
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/properties/get`);
        const data = await res.json();
        
        if (res.ok) {
          const props = data.properties || [];
          setRecentProperties(props.slice(0, 4)); // Show top 4 recent
          setStats({
            count: props.length,
            totalRent: props.reduce((acc: number, curr: any) => acc + (Number(curr.rentAmount) || 0), 0)
          });
        }
      } catch (err) {
        console.error("Dashboard sync failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Mobile Navigation Helper
  const mobileCards = [
    { name: "Portfolio", icon: LayoutGrid, color: "bg-gray-100", iconColor: "#1F2937", desc: `${stats.count} Active`, href: "/dashboard-owner" },
    { name: "Properties", icon: Building2, color: "bg-blue-50", iconColor: "#0052CC", desc: "View All", href: "/dashboard-owner/properties" },
    { name: "Add New", icon: Plus, color: "bg-green-50", iconColor: "#10B981", desc: "List Asset", onClick: openModal },
    { name: "Maintenance", icon: Wrench, color: "bg-orange-50", iconColor: "#F59E0B", desc: "0 Pending", href: "/dashboard-owner/maintenance" },
    { name: "Inspections", icon: ShieldCheck, color: "bg-teal-50", iconColor: "#0D9488", desc: "0 Review", href: "/dashboard-owner/inspections" },
    { name: "Settings", icon: Settings, color: "bg-purple-50", iconColor: "#8B5CF6", desc: "Preferences", href: "/dashboard-owner/settings" },
  ];

  return (
    <div className="p-4 md:p-10 lg:p-12">
      
      {/* 📱 MOBILE VIEW: INTERACTIVE GRID */}
      <div className="md:hidden">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Portfolio 👋</h1>
            <p className="text-xs text-gray-500 italic">"{stats.count} Properties Managed"</p>
          </div>
          <Image src="/mob.png" alt="RentEase" width={35} height={35} />
        </header>

        <div className="grid grid-cols-2 gap-4 pb-20">
          {mobileCards.map((card) => (
            card.onClick ? (
              <button key={card.name} onClick={card.onClick} className="p-5 bg-white border border-gray-100 rounded-[28px] shadow-sm flex flex-col items-start text-left">
                <div className={`w-10 h-10 rounded-2xl ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon style={{ color: card.iconColor }} size={20} />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{card.name}</h3>
                <p className="text-[10px] text-gray-400 font-medium">{card.desc}</p>
              </button>
            ) : (
              <Link href={card.href || "#"} key={card.name}>
                <div className="p-5 bg-white border border-gray-100 rounded-[28px] shadow-sm h-full flex flex-col items-start transition-colors active:bg-gray-50">
                  <div className={`w-10 h-10 rounded-2xl ${card.color} flex items-center justify-center mb-4`}>
                    <card.icon style={{ color: card.iconColor }} size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-[#1F2937]">{card.name}</h3>
                  <p className="text-[10px] text-gray-400 font-medium">{card.desc}</p>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* 💻 DESKTOP VIEW */}
      <div className="hidden md:block">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-[#1F2937] tracking-tight mb-2">Portfolio Overview</h1>
            <p className="text-gray-400 font-medium italic">High-level insights for your rental assets.</p>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={openModal}
                className="px-6 py-3 bg-white border border-gray-200 text-[#1F2937] rounded-xl font-bold text-xs hover:bg-gray-50 transition-all flex items-center gap-2"
             >
                <Plus size={16} /> Add Property
             </button>
             <button className="px-6 py-3 bg-[#0052CC] text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                Send Rent Reminders
             </button>
          </div>
        </header>

        {/* SECTION 1: DYNAMIC STATS CARDS */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Properties", val: stats.count, icon: Building2, color: "#0052CC" },
            { label: "Potential Revenue", val: `₹${stats.totalRent.toLocaleString('en-IN')}`, icon: IndianRupee, color: "#10B981" },
            { label: "Pending Issues", val: "0", icon: Wrench, color: "#F59E0B" },
            { label: "Payment Alerts", val: "0", icon: AlertCircle, color: "#EF4444" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-5"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}10` }}>
                <stat.icon style={{ color: stat.color }} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold text-[#1F2937]">{stat.val}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SECTION 2 & 3: RECENT LISTS */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Real Properties Status List */}
          <div className="col-span-8 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#1F2937]">Recent Property Status</h3>
              <Link href="/dashboard-owner/properties" className="text-xs font-bold text-[#0052CC] hover:underline">View All Portfolio</Link>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="py-10 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest animate-pulse">Syncing Vault...</div>
              ) : recentProperties.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm italic">No properties added yet.</div>
              ) : (
                recentProperties.map((prop: any, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full bg-[#0052CC]" />
                      <div>
                        <p className="text-sm font-bold text-[#1F2937]">{prop.address}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Code: {prop.inviteCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#1F2937]">₹{Number(prop.rentAmount).toLocaleString('en-IN')}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-tighter ${prop.status === 'vacant' ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                          {prop.status}
                        </p>
                      </div>
                      <MoreVertical size={16} className="text-gray-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Snapshot (Mock data for now, layout ready) */}
          <div className="col-span-4">
            <div className="bg-[#1F2937] rounded-[32px] p-8 text-white shadow-2xl h-full relative overflow-hidden">
              <h3 className="text-lg font-bold mb-8 relative z-10">Recent Activity</h3>
              <div className="space-y-8 relative z-10">
                <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-white/10" />
                {[
                  { title: "Property Listed", prop: "Latest Entry", time: "Just now", color: "#0052CC" },
                  { title: "System Online", prop: "Vault Secure", time: "Always", color: "#10B981" },
                ].map((act, i) => (
                  <div key={i} className="flex gap-4 relative z-10">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#1F2937] border-2 flex items-center justify-center shrink-0" style={{ borderColor: act.color }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: act.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none">{act.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{act.prop}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mt-2">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-10 block py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-center uppercase tracking-widest hover:bg-white/10 transition-all">
                Full Audit Log
              </button>
              <div className="absolute top-[-5%] right-[-5%] w-32 h-32 bg-[#0052CC]/10 blur-[50px] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}