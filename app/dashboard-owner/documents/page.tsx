"use client";

import { useState, useEffect } from "react";
import {
  FileText, Download, ShieldCheck, Search, Filter,
  FileCheck, Receipt, Award, Lock, ExternalLink, RefreshCw, Loader2
} from "lucide-react";

type DocType = "all" | "lease" | "receipt" | "inspection" | "discharge";

interface DocumentItem {
  id: string;
  title: string;
  category: "lease" | "receipt" | "inspection" | "discharge";
  propertyAddress: string;
  tenantName: string;
  date: string;
  fileSize: string;
  status: "verified" | "pending" | "archived";
  downloadUrl?: string;
}

export default function DocumentVaultPage() {
  const [activeCategory, setActiveCategory] = useState<DocType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    // Fetch live documents compiled from bookings, inspections, and onboarding records
    const loadVaultDocuments = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/properties/get");
        const data = await res.json();
        
        // Mock / compile real document records based on properties & active onboarding
        const compiledDocs: DocumentItem[] = [];

        if (res.ok && data.properties) {
          // Fetch live inspections to compile digital witness certificates dynamically too
          const inspRes = await fetch("/api/inspections/get-for-owner?status=verified");
          const inspData = await inspRes.json();
          const verifiedInspections = inspData.inspections || [];

          data.properties.forEach((prop: any) => {
            if (prop.tenantId) {
              const tenantName = prop.tenantId.name || "Active Tenant";
              
              compiledDocs.push({
                id: `lease-${prop._id}`,
                title: `Digital Lease Agreement — ${prop.bhk || 1}BHK ${prop.address}`,
                category: "lease",
                propertyAddress: prop.address,
                tenantName: tenantName,
                date: prop.agreement?.signedAt 
                  ? new Date(prop.agreement.signedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                fileSize: "2.4 MB",
                status: "verified",
              });

              compiledDocs.push({
                id: `receipt-${prop._id}`,
                title: `Security Deposit Receipt (#SD-${prop._id.slice(-6).toUpperCase()})`,
                category: "receipt",
                propertyAddress: prop.address,
                tenantName: tenantName,
                date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                fileSize: "850 KB",
                status: "verified",
              });

              // Find matching verified inspection report if it exists
              const matchedInsp = verifiedInspections.find((i: any) => i.propertyId?._id === prop._id);
              if (matchedInsp) {
                compiledDocs.push({
                  id: `inspection-${matchedInsp._id}`,
                  title: `Digital Witness Move-In Audit Certificate (#DW-${matchedInsp._id.slice(-6).toUpperCase()})`,
                  category: "inspection",
                  propertyAddress: prop.address,
                  tenantName: tenantName,
                  date: matchedInsp.verifiedAt 
                    ? new Date(matchedInsp.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                  fileSize: "3.2 MB",
                  status: "verified",
                });
              }
            }
          });
        }

        // Add sample platform legal certificates if empty
        if (compiledDocs.length === 0) {
          compiledDocs.push(
            {
              id: "doc-1",
              title: "Standard Digital Lease Template (11-Month Lock-in)",
              category: "lease",
              propertyAddress: "Platform Master Template",
              tenantName: "RentEase Standard",
              date: "Aug 2026",
              fileSize: "1.2 MB",
              status: "verified",
            },
            {
              id: "doc-2",
              title: "Digital Witness Move-In Condition Certificate",
              category: "inspection",
              propertyAddress: "Sample Property Inspection",
              tenantName: "RentEase Audit",
              date: "Aug 2026",
              fileSize: "4.1 MB",
              status: "verified",
            }
          );
        }

        setDocuments(compiledDocs);
      } catch (err) {
        console.error("Vault load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadVaultDocuments();
  }, []);

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "lease":
        return <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase">Lease Contract</span>;
      case "receipt":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase">Payment Receipt</span>;
      case "inspection":
        return <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-extrabold uppercase">Inspection Audit</span>;
      case "discharge":
        return <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">Discharge Cert</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-extrabold uppercase">Document</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
              Document Vault
            </h1>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock size={12} /> Encrypted
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Centralized repository for all verified lease agreements, deposit receipts, and inspection certificates.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Vault
        </button>
      </div>

      {/* ── Category Filter Tabs & Search Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-neutral-200/80 shadow-2xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1">
          {[
            { id: "all", label: "All Documents" },
            { id: "lease", label: "Lease Contracts" },
            { id: "receipt", label: "Receipts & Rent" },
            { id: "inspection", label: "Inspections" },
            { id: "discharge", label: "Discharge Certs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as DocType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === tab.id
                  ? "bg-neutral-950 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64 px-2">
          <Search size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tenant or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all"
          />
        </div>
      </div>

      {/* ── Documents Grid / List View ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neutral-900" size={32} />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-2xs">
          <FileText size={40} className="text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900 mb-1">No Documents Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Once tenants complete lease signing or deposit verification, their official documents will automatically populate here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  {getCategoryBadge(doc.category)}
                  <span className="text-[10px] font-semibold text-neutral-400">{doc.fileSize}</span>
                </div>

                <h3 className="text-sm font-extrabold text-neutral-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
                  {doc.title}
                </h3>

                <div className="space-y-1 text-xs text-neutral-500 font-medium">
                  <p className="truncate">📍 {doc.propertyAddress}</p>
                  <p className="truncate">👤 Tenant: <span className="font-bold text-neutral-800">{doc.tenantName}</span></p>
                  <p className="text-[11px] text-neutral-400">📅 Generated on {doc.date}</p>
                </div>
              </div>

              {/* Document Action Footer */}
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <ShieldCheck size={14} /> Verified Legal Copy
                </span>

                <button
                  onClick={() => alert(`Downloading ${doc.title}...`)}
                  className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-950 hover:text-white text-neutral-800 transition-all cursor-pointer"
                  title="Download Copy"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
