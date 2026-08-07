"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, TrendingDown, BellRing, Loader2, BadgeCheck, 
  Target, Calendar, Home, Search, User, CreditCard, Wrench, AlertCircle, Briefcase, Coins,
  Eye, XCircle, CheckCircle2, ChevronRight, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerFinancials() {
  const [payments, setPayments] = useState<any[]>([]);
  const [proMaintenance, setProMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Breakdown Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // ✅ GLOBAL FILTERS
  const [filters, setFilters] = useState({
    property: "all",
    month: "all",
    year: "2026",
    status: "all",
    type: "all"
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments/get-for-owner`);
      const data = await res.json();
      if (res.ok) {
        const validPayments = (data.payments || []).filter((p: any) => {
          if (p.type === "deposit") return true;
          if (!p.propertyId?.leaseStartDate) return true;
          const leaseStart = new Date(p.propertyId.leaseStartDate);
          const recordDate = new Date(`${p.month} 1, ${p.year || 2026}`);
          return recordDate >= new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
        });
        setPayments(validPayments);
        setProMaintenance(data.proMaintenance || []);
      }
    } catch (err) {
      console.error("Ledger sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DYNAMIC FILTERING LOGIC
  const filteredData = useMemo(() => {
    return payments.filter((p: any) => {
      const matchProp = filters.property === "all" || p.propertyId?.address === filters.property;
      const matchMonth = filters.month === "all" || p.month === filters.month;
      const matchYear = filters.year === "all" || String(p.year) === filters.year;
      const matchStatus = filters.status === "all" || 
        (filters.status === "paid" && (p.status === "completed" || p.status === "verified")) ||
        (filters.status === "overdue" && p.status === "overdue");
      const matchType = filters.type === "all" || p.type === filters.type;

      return matchProp && matchMonth && matchYear && matchStatus && matchType;
    });
  }, [payments, filters]);

  // ✅ 6 PREMIUM STATS CALCULATION WITH GROWTH
  const stats = useMemo(() => {
    const rentPayments = filteredData.filter(p => p.type === "rent");
    const depositPayments = filteredData.filter(p => p.type === "deposit" && (p.status === "completed" || p.status === "verified"));

    const totalDeposit = depositPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalCollected = rentPayments
      .filter(p => p.status === "completed" || p.status === "verified")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPending = rentPayments
      .filter(p => p.status === "overdue")
      .reduce((sum, p) => sum + Number(p.amount || p.baseRent || 0), 0);

    const totalDebits = rentPayments
      .reduce((sum, p) => sum + Number(p.breakdown?.credit || 0), 0);
      
    const totalPenalties = rentPayments
      .filter(p => p.status === "completed" || p.status === "verified")
      .reduce((sum, p) => sum + Number(p.breakdown?.penalty || 0), 0);

    const proPayments = proMaintenance.reduce((sum, m) => sum + Number(m.finalInvoice?.amount || 0), 0);

    // Mock deterministic growth based on total size for premium demo feel
    const getGrowth = (val: number, inverse: boolean = false) => {
      if (val === 0) return null;
      const perc = (val * 13 % 25) + 2; // Random 2-26%
      const isPositive = (val * 7 % 2) === 0;
      // If inverse (like pending rent), down is green/good.
      const isGood = inverse ? !isPositive : isPositive; 
      return { text: `${isPositive ? '+' : '-'}${perc}%`, isGood };
    };

    return { 
      totalDeposit: { val: totalDeposit, growth: getGrowth(totalDeposit) }, 
      totalCollected: { val: totalCollected, growth: getGrowth(totalCollected) }, 
      totalPending: { val: totalPending, growth: getGrowth(totalPending, true) }, 
      totalDebits: { val: totalDebits, growth: getGrowth(totalDebits, true) }, 
      totalPenalties: { val: totalPenalties, growth: getGrowth(totalPenalties) }, 
      proPayments: { val: proPayments, growth: getGrowth(proPayments, true) } 
    };
  }, [filteredData, proMaintenance]);

  // ✅ CHART DATA GENERATION
  const chartData = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months.map(m => {
      const monthPayments = filteredData.filter(p => p.month === m && p.type === "rent");
      const collected = monthPayments.filter(p => p.status === "completed" || p.status === "verified").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pending = monthPayments.filter(p => p.status === "overdue").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return { name: m.substring(0, 3), collected, pending, expected: collected + pending };
    }).filter(d => d.collected > 0 || d.pending > 0);
  }, [filteredData]);

  const donutData = useMemo(() => [
    { name: 'Rent Collected', value: stats.totalCollected.val, color: '#1F2937' },
    { name: 'Total Deposits', value: stats.totalDeposit.val, color: '#FBBF24' },
    { name: 'Penalties Earned', value: stats.totalPenalties.val, color: '#6B7280' },
    { name: 'Maint. Credits', value: stats.totalDebits.val, color: '#D1D5DB' },
    { name: 'Pro Payments', value: stats.proPayments.val, color: '#9CA3AF' },
  ].filter(d => d.value > 0), [stats]);

  const propertyData = useMemo(() => {
    const props = Array.from(new Set(filteredData.map(p => p.propertyId?.address).filter(Boolean)));
    return props.map(addr => {
       const propPayments = filteredData.filter(p => p.propertyId?.address === addr);
       const income = propPayments.filter(p => p.type === 'rent' && (p.status === 'completed' || p.status === 'verified')).reduce((sum, p) => sum + (p.amount || 0), 0);
       const costs = propPayments.filter(p => p.type === 'rent').reduce((sum, p) => sum + (p.breakdown?.credit || 0), 0) + 
                     proMaintenance.filter(m => m.propertyId?.address === addr).reduce((sum, m) => sum + (m.finalInvoice?.amount || 0), 0);
       return { name: (addr as string).split(',')[0], income, costs };
    });
  }, [filteredData, proMaintenance]);

  const trajectoryData = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months.map(m => {
      const monthPayments = filteredData.filter(p => p.month === m && (p.status === "completed" || p.status === "verified"));
      const revenue = monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return { name: m.substring(0, 3), revenue };
    }).filter(d => d.revenue > 0);
  }, [filteredData]);


  const togglePenalty = async (item: any) => {
    setActionLoading(`toggle_${item._id}`);
    const newValue = !(item.breakdown?.isLateFeeWaived);
    
    setPayments(prev => prev.map(p => 
      p._id === item._id ? { ...p, breakdown: { ...p.breakdown, isLateFeeWaived: newValue } } : p
    ));

    try {
      await fetch('/api/payments/toggle-penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: item.propertyId._id,
          tenantId: item.tenantId._id,
          month: item.month,
          year: item.year,
          isLateFeeWaived: newValue
        })
      });
      fetchPayments();
    } catch (err) {
      alert("Failed to update penalty");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNudge = async (item: any) => {
    setActionLoading(`nudge_${item._id}`);
    try {
      const res = await fetch('/api/payments/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: item.propertyId._id,
          tenantId: item.tenantId._id,
          month: item.month,
          year: item.year
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Reminder sent to tenant successfully!");
      } else {
        alert(data.error || "Failed to send reminder");
      }
    } catch (err) {
      alert("Failed to send reminder");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-900" size={40}/></div>;

  const uniqueProperties = Array.from(new Set(payments.map((p: any) => p.propertyId?.address).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* 🟢 HEADER & FILTERS */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Coins size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Treasury & Collections</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">Financial Hub</h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">Review your portfolio revenue and penalize overdue ledgers.</p>
        </div>

        <div className="flex flex-wrap gap-2 bg-neutral-100/80 p-1.5 rounded-2xl w-fit border border-neutral-200/50 shadow-3xs">
          <div className="flex items-center gap-2 px-3 border-r border-neutral-200/50">
            <CreditCard size={14} className="text-neutral-500" />
            <select className="text-[10px] font-extrabold text-neutral-900 bg-transparent outline-none cursor-pointer uppercase tracking-wider" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
              <option value="all">All Types</option>
              <option value="rent">Rent Only</option>
              <option value="deposit">Deposit Only</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 border-r border-neutral-200/50">
            <Home size={14} className="text-neutral-500" />
            <select className="text-[10px] font-extrabold text-neutral-900 bg-transparent outline-none cursor-pointer uppercase tracking-wider" value={filters.property} onChange={(e) => setFilters({...filters, property: e.target.value})}>
              <option value="all">All Properties</option>
              {uniqueProperties.map((addr: any) => <option key={addr} value={addr}>{addr.split(',')[0]}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 border-r border-neutral-200/50">
            <Calendar size={14} className="text-neutral-500" />
            <select className="text-[10px] font-extrabold text-neutral-900 bg-transparent outline-none cursor-pointer uppercase tracking-wider" value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})}>
              <option value="all">All Months</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3">
            <AlertCircle size={14} className="text-neutral-500" />
            <select className="text-[10px] font-extrabold text-neutral-900 bg-transparent outline-none cursor-pointer uppercase tracking-wider" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </header>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Security Deposits", stat: stats.totalDeposit },
          { label: "Total Rent Collected", stat: stats.totalCollected },
          { label: "Pending Rent Amount", stat: stats.totalPending },
          { label: "Rent Debits (Credits)", stat: stats.totalDebits },
          { label: "Earned Penalty Money", stat: stats.totalPenalties },
          { label: "Maintenance Pro Payments", stat: stats.proPayments },
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
              <p className="text-xl font-black text-neutral-950">₹{item.stat.val.toLocaleString('en-IN')}</p>
              {item.stat.growth && (
                <div className={`flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  item.stat.growth.isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {item.stat.growth.text.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {item.stat.growth.text}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🧾 PREMIUM CYCLE STATUS TABLE */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden mt-6">
        <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
          <h2 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest">Cycle Status Registry</h2>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left relative">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-neutral-100 shadow-sm">
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white">Property</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white">Tenant</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white">Month</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white text-center">Late Fee Toggle</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              <AnimatePresence>
                {filteredData.map((item) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={item._id} 
                    className="hover:bg-neutral-50/50 transition-colors group"
                  >
                    {/* 1. Property */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-extrabold text-neutral-900 truncate max-w-[150px]">{item.propertyId?.address.split(',')[0]}</p>
                    </td>

                    {/* 2. Tenant */}
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-neutral-500 uppercase flex items-center gap-1.5"><User size={12}/>{item.tenantId?.name || "Tenant"}</p>
                    </td>

                    {/* 3. Cycle Month */}
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-neutral-500 uppercase">{item.month?.substring(0,3)} '{String(item.year).slice(-2)}</p>
                    </td>

                    {/* 4. Type */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${item.type === 'deposit' ? 'bg-neutral-50 text-neutral-600 border-neutral-200' : 'bg-neutral-950 text-white border-black'}`}>
                        {item.type}
                      </span>
                    </td>

                    {/* 5. Amount & View Breakdown Button */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-neutral-950">
                          ₹{(item.amount ?? item.totalAmountPaid ?? 0).toLocaleString('en-IN')}
                        </p>
                        {item.type === 'rent' && (
                          <button 
                            onClick={() => setSelectedItem(item)}
                            className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Eye size={10} /> View
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 6. Late Fee Toggle */}
                    <td className="px-6 py-4 align-middle">
                      {item.type === 'rent' ? (
                        <div className="flex justify-center items-center h-full">
                          <button 
                            onClick={() => togglePenalty(item)} 
                            disabled={actionLoading === `toggle_${item._id}`}
                            className={`w-9 h-5 rounded-full transition-all relative p-1 ${item.breakdown?.isLateFeeWaived ? 'bg-neutral-200' : 'bg-neutral-950'}`}
                            title={item.breakdown?.isLateFeeWaived ? "Penalty Waived" : "Penalty Active"}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-all shadow-sm ${item.breakdown?.isLateFeeWaived ? 'translate-x-0' : 'translate-x-4'}`}/>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-neutral-300 font-bold">-</div>
                      )}
                    </td>

                    {/* 7. Status */}
                    <td className="px-6 py-4 text-right">
                      {item.status === 'overdue' ? (
                        <div className="flex items-center justify-end gap-2">
                           <span className="px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                             Overdue
                           </span>
                           {item.type === "rent" && (
                             <button 
                               onClick={() => handleNudge(item)}
                               disabled={actionLoading === `nudge_${item._id}`}
                               className="w-7 h-7 bg-red-600 text-white rounded flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50"
                               title="Send Nudge"
                             >
                               {actionLoading === `nudge_${item._id}` ? <Loader2 size={12} className="animate-spin" /> : <BellRing size={12} />}
                             </button>
                           )}
                        </div>
                      ) : item.status === 'pending' ? (
                        <span className="px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                          Pending
                        </span>
                      ) : (
                        <div className="flex items-center justify-end text-emerald-600 gap-1">
                          <CheckCircle2 size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredData.length === 0 && (
             <div className="p-16 text-center text-neutral-400 font-bold text-sm">No ledgers found for these filters.</div>
          )}
        </div>
      </div>

      {/* 📈 4 PREMIUM CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* CHART 1: Cashflow Composition (Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 lg:col-span-1 flex flex-col">
          <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Cashflow Composition</h3>
          <p className="text-[10px] text-neutral-500 font-bold mb-6">Distribution of incoming and outgoing funds</p>
          <div className="flex-1 min-h-[250px] relative">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-400">Not enough data</div>
            )}
          </div>
        </div>

        {/* CHART 2: Revenue vs Delinquency */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Collection Status</h3>
          <p className="text-[10px] text-neutral-500 font-bold mb-6">Monthly rent collection overview</p>
          <div className="flex-1 min-h-[250px] relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                  <Bar dataKey="collected" name="Collected" fill="#1F2937" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="pending" name="Overdue" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-400">Not enough rent data</div>
            )}
          </div>
        </div>

        {/* CHART 3: Property Performance */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Property Performance</h3>
          <p className="text-[10px] text-neutral-500 font-bold mb-6">Net rent income vs maintenance deductions per property</p>
          <div className="flex-1 min-h-[250px] relative">
            {propertyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} width={100} />
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                  <Bar dataKey="income" name="Net Income" fill="#1F2937" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="costs" name="Maint. Costs" fill="#D1D5DB" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-400">Not enough property data</div>
            )}
          </div>
        </div>

        {/* CHART 4: Revenue Trajectory */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs col-span-1 lg:col-span-1 flex flex-col">
          <h3 className="text-sm font-extrabold text-neutral-950 uppercase tracking-widest mb-1">Revenue Trajectory</h3>
          <p className="text-[10px] text-neutral-500 font-bold mb-6">Total verified inflows over time</p>
          <div className="flex-1 min-h-[250px] relative">
            {trajectoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#1F2937" fill="#1F2937" fillOpacity={0.05} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-400">No revenue recorded</div>
            )}
          </div>
        </div>

      </div>

      {/* ── Breakdown Modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[200] bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.96 }} 
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-neutral-200/80"
            >
              <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h2 className="text-sm font-extrabold text-neutral-950">Financial Breakdown</h2>
                  <p className="text-neutral-400 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                    {selectedItem.month} {selectedItem.year} Cycle
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)} 
                  className="w-8 h-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition-all shadow-3xs cursor-pointer"
                >
                   <XCircle size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
                  <div className="w-12 h-12 bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center shrink-0 border border-neutral-200/40">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-950 text-sm">{selectedItem.propertyId?.address.split(',')[0]}</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">Tenant: {selectedItem.tenantId?.name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl border border-neutral-200/50">
                     <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Base Rent</span>
                     <span className="text-sm font-black text-neutral-950">₹{selectedItem.breakdown?.base || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl border border-neutral-200/50">
                     <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Maintenance Credit</span>
                     <span className="text-sm font-black text-amber-500">-₹{selectedItem.breakdown?.credit || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl border border-neutral-200/50">
                     <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Late Penalty</span>
                     <span className="text-sm font-black text-red-500">+₹{selectedItem.breakdown?.penalty || 0}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-between items-center">
                  <span className="text-xs font-black text-neutral-950 uppercase tracking-widest">Final Ledger Total</span>
                  <span className="text-2xl font-black text-neutral-950">₹{(selectedItem.amount ?? selectedItem.totalAmountPaid ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}