"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Cell 
} from "recharts";
import { 
  TrendingUp, BellRing, Loader2, BadgeCheck, 
  IndianRupee, Zap, Target, Clock, 
  Filter, Home, Calendar, XCircle, Search, User
} from "lucide-react";
import { motion } from "framer-motion";

export default function OwnerFinancials() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ INDIVIDUAL PENALTY STATE
  const [disabledPenalties, setDisabledPenalties] = useState<Set<string>>(new Set());

  // ✅ GLOBAL FILTERS
  const [filters, setFilters] = useState({
    property: "all",
    month: "all",
    year: "2026",
    status: "all"
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const ownerId = localStorage.getItem("userId");
      const res = await fetch(`/api/payments/get-for-owner?ownerId=${ownerId}`);
      const data = await res.json();
      if (res.ok) {
        // Filter out any virtual records that occur BEFORE the lease start date
        const validPayments = (data.payments || []).filter((p: any) => {
          if (!p.propertyId?.leaseStartDate) return true;
          const leaseStart = new Date(p.propertyId.leaseStartDate);
          const recordDate = new Date(`${p.month} 1, ${p.year || 2026}`);
          return recordDate >= new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
        });
        setPayments(validPayments);
      }
    } catch (err) {
      console.error("Ledger sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DYNAMIC FILTERING LOGIC (Applied to Table and Graph)
  const filteredData = useMemo(() => {
    return payments.filter((p: any) => {
      const matchProp = filters.property === "all" || p.propertyId?.address === filters.property;
      const matchMonth = filters.month === "all" || p.month === filters.month;
      const matchYear = filters.year === "all" || String(p.year) === filters.year;
      const matchStatus = filters.status === "all" || 
        (filters.status === "paid" && (p.status === "completed" || p.status === "verified")) ||
        (filters.status === "overdue" && p.status === "overdue");

      return matchProp && matchMonth && matchYear && matchStatus;
    });
  }, [payments, filters]);

// ✅ SAFE CHART DATA
const chartData = useMemo(() => {
  const months = ["January", "February", "March", "April", "May", "June"];
  return months.map(m => {
    const monthPayments = filteredData.filter(p => p.month === m);
    const collected = monthPayments
      .filter(p => p.status === "completed" || p.status === "verified")
      .reduce((sum, p) => sum + Number(p.totalAmountPaid || p.amount || 0), 0);
    const pending = monthPayments
      .filter(p => p.status === "overdue")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { name: m.substring(0, 3), collected, pending };
  }).filter(d => d.collected > 0 || d.pending > 0);
}, [filteredData]);

// ✅ SAFE STATS CALCULATION (Prevents NaN)
const stats = useMemo(() => {
  const totalCollected = filteredData
    .filter(p => p.status === "completed" || p.status === "verified")
    .reduce((sum, p) => sum + Number(p.totalAmountPaid || p.amount || 0), 0);
  
  const totalPending = filteredData
    .filter(p => p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount || p.baseRent || 0), 0);
  
  return { totalCollected, totalPending, count: filteredData.length };
}, [filteredData]);

  const togglePenalty = (id: string) => {
    setDisabledPenalties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  const uniqueProperties = Array.from(new Set(payments.map((p: any) => p.propertyId?.address).filter(Boolean)));

  return (
    <div className="p-4 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 bg-[#F9FAFB] min-h-screen">
      
      {/* 🟢 HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#1F2937] tracking-tighter italic">Treasury Control</h1>
          <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">Filtered Portfolio Revenue & Penalty Management</p>
        </div>

        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="flex items-center gap-2 px-4 border-r border-gray-100">
            <Home size={14} className="text-blue-500" />
            <select className="text-[11px] font-black text-[#1F2937] bg-transparent outline-none cursor-pointer" value={filters.property} onChange={(e) => setFilters({...filters, property: e.target.value})}>
              <option value="all">All Properties</option>
              {uniqueProperties.map((addr: any) => <option key={addr} value={addr}>{addr.split(',')[0]}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 border-r border-gray-100">
            <Calendar size={14} className="text-emerald-500" />
            <select className="text-[11px] font-black text-[#1F2937] bg-transparent outline-none cursor-pointer" value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})}>
              <option value="all">All Months</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-4">
            <Filter size={14} className="text-orange-500" />
            <select className="text-[11px] font-black text-[#1F2937] bg-transparent outline-none cursor-pointer" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </header>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1F2937] p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
          <Target className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform" size={120} />
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Net Filtered Revenue</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">₹{stats.totalCollected.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Receivables</p>
          <h3 className="text-4xl font-black text-red-500 tracking-tighter">₹{stats.totalPending.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matched Records</p>
          <h3 className="text-4xl font-black text-blue-600 tracking-tighter">{stats.count}</h3>
        </div>
      </div>

      {/* 🧾 DATA TABLE */}
      <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-xl font-black text-[#1F2937] tracking-tight">Cycle Status Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-50">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tenant Details</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Late Fee Toggle</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-all"><User size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-[#1F2937] uppercase">{item.tenantId?.name || "Tenant"}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">{item.propertyId?.address.split(',')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <p className="text-sm font-black text-[#1F2937]">
  ₹{(item.amount ?? item.totalAmountPaid ?? 0).toLocaleString()}
</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{item.month} {item.year}</p>
                  </td>
                  <td className="px-6 py-8">
                    <div className="flex justify-center">
                      <button onClick={() => togglePenalty(item._id)} className={`w-10 h-5 rounded-full transition-all relative p-1 ${!disabledPenalties.has(item._id) ? 'bg-orange-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-all shadow-sm ${!disabledPenalties.has(item._id) ? 'translate-x-5' : 'translate-x-0'}`}/>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-8 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${item.status === 'overdue' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    {item.status === 'overdue' ? (
                      <button className="p-3 bg-[#1F2937] text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"><BellRing size={16} /></button>
                    ) : (
                      <div className="flex items-center justify-end text-emerald-500 gap-2"><BadgeCheck size={20} /><span className="text-[9px] font-black uppercase italic">Verified</span></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📊 BOTTOM ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
        <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm space-y-8">
          <div><h3 className="text-xl font-black text-[#1F2937] tracking-tight">Revenue Breakdown</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Collected vs. Unpaid</p></div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Collected" dataKey="collected" fill="#10B981" radius={[10, 10, 0, 0]} barSize={35} />
                <Bar name="Overdue" dataKey="pending" fill="#F87171" radius={[10, 10, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1F2937] p-10 rounded-[56px] shadow-2xl space-y-8">
          <div><h3 className="text-xl font-black text-white tracking-tight">Portfolio Pulse</h3><p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Total Potential Revenue</p></div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', background: '#2D3748', color: '#FFF' }} itemStyle={{ color: '#60A5FA' }} />
                <Bar dataKey="total" fill="#3B82F6" radius={[20, 20, 20, 20]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}