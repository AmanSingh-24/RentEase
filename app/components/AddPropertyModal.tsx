"use client";

import React, { useState, useEffect } from "react";
import { 
  X, MapPin, Plus, Box, Layers, Sparkles, Building2, Home, 
  Building, Warehouse, Bed, Layout, PawPrint, Ban, HelpCircle, FileText
} from "lucide-react";
import AddressMapPicker, { type GeoLocation } from "../components/AddressMapPicker";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProperty: any;
  ownerId: string;
}

const AMENITIES_LIST = [
  "WiFi", "Air Conditioning", "Parking", "Generator Backup",
  "Gym", "Lift / Elevator", "CCTV Security", "Security Guard",
  "Swimming Pool", "Garden / Park", "Balcony", "Gas Pipeline",
  "Water 24x7", "Club House", "Kids Play Area",
];

export default function AddPropertyModal({ isOpen, onClose, editingProperty, ownerId }: AddPropertyModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    propertyType: "apartment", // apartment, house, villa, studio, pg
    address: "",
    city: "",
    state: "",
    pincode: "",
    lat: 0,
    lng: 0,
    formattedAddress: "",
    furnishing: "unfurnished",
    amenities: [] as string[],
    description: "",
    totalFloors: "1",
    floorNumber: "0",
    petsAllowed: false,
    rentAmount: "",
    depositAmount: "",
    ownershipProof: "", // Base64 tax receipt / deed
    images: [] as string[], // Base64 array
    gracePeriodDays: "7",
    repairThreshold: "500",
    lockInMonths: "11",
    noticePeriodDays: "30",
    bhk: "1",
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProperty) {
        setFormData({
          propertyType: editingProperty.propertyType || "apartment",
          address: editingProperty.address || "",
          city: editingProperty.city || "",
          state: editingProperty.state || "",
          pincode: editingProperty.pincode || "",
          lat: editingProperty.location?.coordinates?.[1] || 0,
          lng: editingProperty.location?.coordinates?.[0] || 0,
          formattedAddress: editingProperty.formattedAddress || editingProperty.address || "",
          furnishing: editingProperty.furnishing || "unfurnished",
          amenities: editingProperty.amenities || [],
          description: editingProperty.description || "",
          totalFloors: editingProperty.totalFloors?.toString() || "1",
          floorNumber: editingProperty.floorNumber?.toString() || "0",
          petsAllowed: editingProperty.petsAllowed || false,
          rentAmount: editingProperty.rentAmount?.toString() || "",
          depositAmount: editingProperty.depositAmount?.toString() || "",
          ownershipProof: "",
          images: [],
          gracePeriodDays: editingProperty.maintenanceRules?.gracePeriodDays?.toString() || "7",
          repairThreshold: editingProperty.maintenanceRules?.repairThreshold?.toString() || "500",
          lockInMonths: editingProperty.exitPolicy?.lockInMonths?.toString() || "11",
          noticePeriodDays: editingProperty.exitPolicy?.noticePeriodDays?.toString() || "30",
          bhk: editingProperty.bhk?.toString() || "1",
        });
      } else {
        setFormData({
          propertyType: "apartment",
          address: "",
          city: "",
          state: "",
          pincode: "",
          lat: 0,
          lng: 0,
          formattedAddress: "",
          furnishing: "unfurnished",
          amenities: [],
          description: "",
          totalFloors: "1",
          floorNumber: "0",
          petsAllowed: false,
          rentAmount: "",
          depositAmount: "",
          ownershipProof: "",
          images: [],
          gracePeriodDays: "7",
          repairThreshold: "500",
          lockInMonths: "11",
          noticePeriodDays: "30",
          bhk: "1",
        });
      }
      setStep(1);
    }
  }, [isOpen, editingProperty]);

  if (!isOpen) return null;

  const toggleAmenity = (a: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a]
    }));
  };

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, ownershipProof: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.address.trim() || !formData.city.trim()) {
      return alert("Property location details (address & city) are required.");
    }
    if (!formData.rentAmount) {
      return alert("Monthly rent is required.");
    }
    if (!editingProperty && !formData.ownershipProof) {
      return alert("Please upload ownership proof / sale deed for verification.");
    }

    setLoading(true);
    try {
      const isEditing = !!(editingProperty && editingProperty._id);
      
      // Combine step templates for structure generation mapping
      const templateMap: Record<string, string> = {
        "1": "1BHK", "2": "2BHK", "3": "3BHK", "4": "4BHK"
      };
      const templateType = templateMap[formData.bhk] || "1BHK";

      const payload = {
        ownerId,
        address: formData.formattedAddress || formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.lat || undefined,
        longitude: formData.lng || undefined,
        formattedAddress: formData.formattedAddress || undefined,
        bhk: Number(formData.bhk),
        furnishing: formData.furnishing,
        amenities: formData.amenities,
        description: formData.description,
        propertyType: formData.propertyType,
        totalFloors: Number(formData.totalFloors),
        floorNumber: Number(formData.floorNumber),
        petsAllowed: formData.petsAllowed,
        rentAmount: Number(formData.rentAmount),
        depositAmount: Number(formData.depositAmount) || 0,
        images: formData.images,
        ownershipProof: formData.ownershipProof || undefined,
        templateType,
        maintenanceRules: { gracePeriodDays: Number(formData.gracePeriodDays), repairThreshold: Number(formData.repairThreshold) },
        exitPolicy: { lockInMonths: Number(formData.lockInMonths), noticePeriodDays: Number(formData.noticePeriodDays) },
        guidelines: [],
        ...(isEditing && { propertyId: editingProperty._id }),
      };

      const endpoint = isEditing ? "/api/properties/update" : "/api/properties/create";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit property details.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    "Classification",
    "Address Mapping",
    "Amenities Details",
    "Photo Galleries",
    "Pricing Setup",
    "Rules Config",
    "Deed Proofs"
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative max-h-[85vh] overflow-hidden flex flex-col border border-neutral-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-neutral-950">
              {editingProperty ? "Modify Asset details" : "Initialize New Property"}
            </h2>
            
            {/* Visual Number Indicator Stepper Sequence */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {stepsList.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum;
                return (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                      isActive ? "bg-neutral-900 text-white shadow-xs" : 
                      isDone ? "bg-neutral-950 text-white" : 
                      "bg-neutral-100 text-neutral-400"
                    }`}>
                      {isDone ? "✓" : stepNum}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider ${
                      isActive ? "text-neutral-950" : "text-neutral-400"
                    }`}>
                      {label.split(" ")[0]}
                    </span>
                    {stepNum < stepsList.length && <span className="text-[10px] text-neutral-300 font-bold">·</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-950 transition-all cursor-pointer border-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* STEP 1: Classification type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-950 mb-1">Select Property Type</h3>
                <p className="text-[11px] text-neutral-500 mb-3">Choose the category descriptor representing your listing</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "apartment", label: "Apartment", icon: Building2 },
                    { id: "house", label: "House", icon: Home },
                    { id: "villa", label: "Villa", icon: Warehouse },
                    { id: "studio", label: "Studio Space", icon: Layout },
                    { id: "pg", label: "PG/Hostel Room", icon: Bed },
                  ].map((item) => {
                    const active = formData.propertyType === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, propertyType: item.id })}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          active ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950" : "border-neutral-200 hover:border-neutral-400 bg-white"
                        }`}
                      >
                        <IconComp size={16} className="text-neutral-800" />
                        <span className="text-xs font-bold text-neutral-950">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">BHK Configuration</label>
                  <select 
                    value={formData.bhk} 
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs cursor-pointer focus:border-neutral-950"
                    onChange={e => setFormData({ ...formData, bhk: e.target.value })}
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Furnishing status</label>
                  <select 
                    value={formData.furnishing} 
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs cursor-pointer focus:border-neutral-950"
                    onChange={e => setFormData({ ...formData, furnishing: e.target.value })}
                  >
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi_furnished">Semi-Furnished</option>
                    <option value="fully_furnished">Fully Furnished</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Address Mapping Geolocation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Search Address (Map pin selection) *</label>
                <AddressMapPicker
                  placeholder="Enter society name, landmark, road coordinates..."
                  initialValue={
                    formData.lat ? { lat: formData.lat, lng: formData.lng, formattedAddress: formData.formattedAddress } : undefined
                  }
                  onChange={(geo: GeoLocation) => {
                    setFormData(prev => ({
                      ...prev,
                      address: geo.formattedAddress,
                      formattedAddress: geo.formattedAddress,
                      city: geo.city || prev.city,
                      state: geo.state || prev.state,
                      pincode: geo.pincode || prev.pincode,
                      lat: geo.lat,
                      lng: geo.lng
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">City *</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, city: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">State</label>
                  <input 
                    type="text" 
                    value={formData.state} 
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, state: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Amenities details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Floor number</label>
                  <input 
                    type="number" 
                    value={formData.floorNumber} 
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, floorNumber: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Total Floors</label>
                  <input 
                    type="number" 
                    value={formData.totalFloors} 
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, totalFloors: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-1.5 border-t border-neutral-100 pt-3">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Select Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITIES_LIST.map((item) => {
                    const active = formData.amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                          active ? "bg-neutral-950 border-neutral-950 text-white" : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400"
                        }`}
                      >
                        {active ? "✓ " : ""}{item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-neutral-100 pt-3">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Property Description</label>
                <textarea 
                  value={formData.description} 
                  rows={3} 
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-xs resize-none"
                  placeholder="Tell tenants about your property specifications..."
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Photo Galleries */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-neutral-950">Add Property baseline images</h3>
              <p className="text-[11px] text-neutral-400">Upload multiple photos detailing the active layout condition of rooms</p>
              
              <div className="grid grid-cols-4 gap-2">
                {formData.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-200 relative">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                      className="absolute top-1 right-1 w-5 h-5 bg-neutral-950 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-0 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border border-neutral-200 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 transition-all shrink-0">
                  <Plus size={16} className="text-neutral-400 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-neutral-400 mt-1">Upload</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Pricing Setup */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Monthly Rent (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.rentAmount} 
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    placeholder="25000"
                    onChange={e => setFormData({ ...formData, rentAmount: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Security Deposit (₹)</label>
                  <input 
                    type="number" 
                    value={formData.depositAmount} 
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    placeholder="75000"
                    onChange={e => setFormData({ ...formData, depositAmount: e.target.value })} 
                  />
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/50 flex items-center justify-between text-xs font-bold text-neutral-700">
                <span>Pets Allowed Policy</span>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, petsAllowed: true })} 
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold cursor-pointer transition-colors ${
                      formData.petsAllowed ? "bg-neutral-950 text-white" : "bg-white text-neutral-600 border-neutral-200"
                    }`}
                  >
                    Yes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, petsAllowed: false })} 
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold cursor-pointer transition-colors ${
                      !formData.petsAllowed ? "bg-neutral-950 text-white" : "bg-white text-neutral-600 border-neutral-200"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Rules Config */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Grace Period (Days)</label>
                  <input 
                    type="number" 
                    value={formData.gracePeriodDays} 
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, gracePeriodDays: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Tenant Repair Cap (₹)</label>
                  <input 
                    type="number" 
                    value={formData.repairThreshold} 
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, repairThreshold: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Lock-in Period (Months)</label>
                  <input 
                    type="number" 
                    value={formData.lockInMonths} 
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, lockInMonths: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 ml-1">Notice Period (Days)</label>
                  <input 
                    type="number" 
                    value={formData.noticePeriodDays} 
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-bold text-xs" 
                    onChange={e => setFormData({ ...formData, noticePeriodDays: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Deed Proof document upload */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-neutral-950">Ownership document validation</h3>
              <p className="text-[11px] text-neutral-400">Upload ownership deed registry proof or property tax slip for host verification. Document remains encrypted.</p>
              
              <div className="border border-neutral-200/80 rounded-xl p-4 bg-neutral-50 flex items-center justify-between">
                <div className="min-w-0">
                  {formData.ownershipProof ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-neutral-950 rounded-full" />
                      <p className="text-xs font-bold text-neutral-800">Deed proof attached ✓</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 font-semibold italic">Upload verification document (PDF/Image)</p>
                  )}
                </div>
                <label className="px-3.5 py-1.5 bg-white border border-neutral-200 text-neutral-800 rounded-lg text-[10px] font-bold shadow-3xs cursor-pointer hover:bg-neutral-50 transition-colors">
                  Choose Document
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleDeedUpload} />
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex gap-2 justify-end">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-neutral-200 rounded-xl font-bold text-xs text-neutral-600 hover:bg-white cursor-pointer transition-colors"
            >
              Back
            </button>
          )}

          <button 
            onClick={() => step < 7 ? setStep(step + 1) : handleSubmit()}
            disabled={loading}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-black disabled:bg-neutral-400 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {loading ? "Registering..." : step < 7 ? "Next Step" : editingProperty ? "Confirm Changes" : "Initialize Asset"}
          </button>
        </div>

      </div>
    </div>
  );
}
