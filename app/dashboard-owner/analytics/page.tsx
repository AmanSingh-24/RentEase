"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp, TrendingDown, Target, Building2, 
  Activity, ShieldAlert, ArrowRight, Activity as ActivityIcon,
  AlertTriangle, RefreshCw, Loader2, CheckCircle2, CalendarDays, IndianRupee
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie, LabelList
} from "recharts";
import { motion } from "framer-motion";

// Dynamically import the map to avoid SSR issues
const MultiPropertyMapComp = dynamic(() => import("../../components/MultiPropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-100 animate-pulse flex items-center justify-center min-h-[300px] rounded-2xl">
      <Loader2 size={24} className="animate-spin text-neutral-400" />
    </div>
  ),
});

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]); // For the map
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/get-owner-stats?year=${year}`);
      const result = await res.json();
      const propRes = await fetch("/api/properties/get");
      const propResult = await propRes.json();
      
      if (res.ok) setData(result);
      if (propRes.ok) setProperties(propResult.properties || []);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [year]);

  if (!data) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-neutral-900" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Syncing God-Mode Metrics...</p>
      </div>
    );
  }

  const { kpis, cashflow, funnel, riskMatrix, maintenanceHotspots, tenantReliability, upcomingRenewals } = data;

  // Generate years from 2025 to 2050
  const years = Array.from({ length: 26 }, (_, i) => (2025 + i).toString());

  return (
    <div className="space-y-6 pb-20">
      
      {/* 🟢 HEADER & ACTIONS */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Target size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Analytics & Insights</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">Portfolio Intelligence</h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">Real-time telemetry on revenue streams and lifecycle conversions.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
           <div className="flex items-center gap-2 bg-neutral-100/80 px-3 py-2 rounded-xl border border-neutral-200/50 shadow-3xs">
             <CalendarDays size={14} className="text-neutral-500" />
             <select 
               className="text-[10px] font-extrabold text-neutral-900 bg-transparent outline-none cursor-pointer uppercase tracking-wider"
               value={year}
               onChange={(e) => setYear(e.target.value)}
             >
               {years.map(y => (
                 <option key={y} value={y}>{y} Fiscal</option>
               ))}
             </select>
           </div>
           
           <button
             onClick={fetchAnalytics}
             disabled={loading}
             className="px-5 py-2.5 bg-neutral-950 text-white border border-neutral-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
           >
             <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Telemetry
           </button>
        </div>
      </header>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Yield (MoM)", 
            val: `₹${kpis.totalRevenue.toLocaleString("en-IN")}`, 
            growth: { text: '+4.2%', isGood: true } 
          },
          {
            label: "Total Properties",
            val: kpis.totalProperties,
            growth: { text: 'Active Nodes', isGood: true }
          },
          { 
            label: "Portfolio Occupancy", 
            val: `${kpis.occupancyRate}%`, 
            growth: { text: `Avg ${kpis.avgDaysOnMarket} Days on Market`, isGood: kpis.occupancyRate > 75 } 
          },
          { 
            label: "Active Pipelines", 
            val: kpis.activePipelines, 
            growth: { text: 'Leads & Exits', isGood: true } 
          },
          { 
            label: "Maintenance Liability", 
            val: `₹${kpis.totalMaintenanceCost.toLocaleString("en-IN")}`, 
            growth: { text: `${kpis.pendingMaintenance} Pending`, isGood: kpis.pendingMaintenance === 0 } 
          },
          {
            label: "Exits & Turnovers",
            val: kpis.exitsThisMonth,
            growth: { text: `${kpis.totalRefundsCount || 0} Refunds Processed`, isGood: kpis.exitsThisMonth === 0 }
          },
          {
            label: "Total Amount Refunded",
            val: `₹${kpis.totalRefunded.toLocaleString("en-IN")}`,
            growth: { text: 'Security Deposits', isGood: false }
          }
        ].map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-center relative overflow-hidden"
          >
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">{item.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-black text-neutral-950">{item.val}</p>
              {item.growth && (
                <div className={`flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  item.growth.isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {item.growth.text.includes('%') && (item.growth.text.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                  {item.growth.text}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📈 PRIMARY CHARTS SECTION (2/3 and 1/3 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* CHART 1: Cashflow Projection */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">12-Month Real Cashflow</h3>
              <p className="text-[10px] text-neutral-500 font-bold">Actual Income vs Settled Overheads</p>
            </div>
          </div>
           
          <div className="flex-1 min-h-[300px] relative">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={cashflow} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#1F2937" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#1F2937" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#D1D5DB" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#D1D5DB" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} />
                 <Tooltip 
                   formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} 
                   cursor={{ stroke: '#F3F4F6' }} 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                 />
                 <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                 <Area type="monotone" dataKey="income" name="Total Income" stroke="#1F2937" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)">
                   <LabelList dataKey="income" position="top" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#1F2937' }} formatter={(val: number) => val > 0 ? `₹${(val/1000).toFixed(0)}k` : ''} />
                 </Area>
                 <Area type="monotone" dataKey="expense" name="Maintenance & Refunds" stroke="#D1D5DB" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Tenant Lifecycle Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 lg:col-span-1 flex flex-col">
          <div className="mb-6">
             <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Tenant Lifecycle Funnel</h3>
             <p className="text-[10px] text-neutral-500 font-bold">Current state of the leasing funnel.</p>
          </div>

          <div className="flex-1 min-h-[300px] relative">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} width={90} />
                 <Tooltip 
                    cursor={{fill: '#F9FAFB'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                   {funnel.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={
                       entry.name === "Market Reach" ? "#FBBF24" :
                       entry.name === "Active Leads" ? "#9CA3AF" :
                       entry.name === "Occupied Units" ? "#1F2937" : "#EF4444"
                     } />
                   ))}
                   <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4B5563' }} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🧩 SECONDARY CHARTS SECTION (3-Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* CHART 3: Tenant Payment Reliability (Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 flex flex-col">
          <div className="mb-2">
             <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Tenant Payment Reliability</h3>
             <p className="text-[10px] text-neutral-500 font-bold">On-time payments vs default rates.</p>
          </div>
          <div className="flex-1 min-h-[200px] relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={tenantReliability} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                   {tenantReliability.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Maintenance Hotspots by Room */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 flex flex-col">
          <div className="mb-6">
             <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Maintenance by Room</h3>
             <p className="text-[10px] text-neutral-500 font-bold">Where your repair budget is going.</p>
          </div>
          <div className="flex-1 min-h-[200px] relative">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={maintenanceHotspots} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold' }} dy={5} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} />
                 <Tooltip 
                   formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} 
                   cursor={{ fill: '#F9FAFB' }} 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                 />
                 <Bar dataKey="value" fill="#6B7280" radius={[4, 4, 0, 0]} barSize={24}>
                   <LabelList dataKey="value" position="top" style={{ fontSize: '8px', fontWeight: 'bold', fill: '#4B5563' }} formatter={(val: number) => `₹${(val/1000).toFixed(1)}k`} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* LIST: Upcoming Renewals */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 flex flex-col">
          <div className="mb-6 flex justify-between items-start">
             <div>
               <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Upcoming Expirations</h3>
               <p className="text-[10px] text-neutral-500 font-bold">Lock-in periods ending in 90 days.</p>
             </div>
             <CalendarDays size={16} className="text-neutral-400" />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
             {upcomingRenewals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400">
                  <CheckCircle2 size={32} className="mb-2 opacity-20"/>
                  <p className="text-xs font-bold">No Expirations</p>
                  <p className="text-[10px]">All tenants securely locked in.</p>
                </div>
             ) : (
                upcomingRenewals.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                     <div>
                       <p className="text-xs font-extrabold text-neutral-900 truncate max-w-[120px]">{r.address}</p>
                       <p className="text-[9px] font-bold text-neutral-500 uppercase">{new Date(r.expiryDate).toLocaleDateString()}</p>
                     </div>
                     <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                       r.daysLeft <= 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                     }`}>
                       {r.daysLeft} Days
                     </span>
                  </div>
                ))
             )}
          </div>
        </div>

      </div>

      {/* 🌍 ROW 4: Geography & Risks (50/50 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch pt-4">
        
        {/* LEFT: Geographic Yield Heatmap */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col h-[450px]">
           <div className="mb-6 flex justify-between items-start">
             <div>
               <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Geographic Yield Heatmap</h3>
               <p className="text-[10px] text-neutral-500 font-bold">Visualizing property density & rent concentration.</p>
             </div>
             <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md text-[9px] font-black uppercase tracking-widest">
               {properties.length} Nodes
             </span>
           </div>
           
           <div className="flex-1 w-full rounded-xl overflow-hidden border border-neutral-200 relative">
             <MultiPropertyMapComp properties={properties} isHeatmap={true} />
             {/* Map overlay legend */}
             <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-neutral-200 flex justify-between text-[9px] font-black uppercase tracking-widest text-neutral-500 shadow-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Occupied Yield</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Vacant Void</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Notice Liability</div>
             </div>
           </div>
        </div>

        {/* RIGHT: Action Required Risk Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col h-[450px]">
           <div className="mb-6 flex justify-between items-start">
             <div>
               <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Action Required Matrix</h3>
               <p className="text-[10px] text-neutral-500 font-bold">Critical alerts requiring owner intervention.</p>
             </div>
             <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md text-[9px] font-black uppercase tracking-widest animate-pulse">
               {riskMatrix.filter((r: any) => r.type !== 'healthy').length} Alerts
             </span>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-none">
             {riskMatrix.map((risk: any, i: number) => (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                 key={i} 
                 className={`p-4 rounded-xl border flex gap-4 items-start ${
                   risk.severity === 'high' ? 'bg-red-50/50 border-red-100' :
                   risk.severity === 'medium' ? 'bg-amber-50/50 border-amber-100' :
                   'bg-emerald-50/50 border-emerald-100'
                 }`}
               >
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-3xs ${
                   risk.severity === 'high' ? 'bg-white text-red-500' :
                   risk.severity === 'medium' ? 'bg-white text-amber-500' :
                   'bg-white text-emerald-500'
                 }`}>
                   {risk.severity === 'high' ? <AlertTriangle size={18}/> :
                    risk.severity === 'medium' ? <ActivityIcon size={18}/> :
                    <CheckCircle2 size={18}/>}
                 </div>
                 
                 <div>
                   <h4 className={`text-sm font-black ${
                     risk.severity === 'high' ? 'text-red-900' :
                     risk.severity === 'medium' ? 'text-amber-900' :
                     'text-emerald-900'
                   }`}>{risk.title}</h4>
                   <p className={`text-[11px] font-medium mt-0.5 leading-relaxed ${
                     risk.severity === 'high' ? 'text-red-700/80' :
                     risk.severity === 'medium' ? 'text-amber-700/80' :
                     'text-emerald-700/80'
                   }`}>{risk.desc}</p>
                   
                   {risk.type !== 'healthy' && (
                     <button className={`mt-3 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity ${
                       risk.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                     }`}>
                       Resolve Issue <ArrowRight size={10}/>
                     </button>
                   )}
                 </div>
               </motion.div>
             ))}
           </div>
        </div>

      </div>

    </div>
  );
}
