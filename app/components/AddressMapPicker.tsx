"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2, CheckCircle2, X } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import("./LeafletDraggableMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={24} />
    </div>
  ),
});

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface Suggestion {
  properties: {
    formatted: string;
    city?: string;
    state?: string;
    postcode?: string;
    lat: number;
    lon: number;
  };
}

interface AddressMapPickerProps {
  /** Called whenever the location is confirmed (suggestion selected or pin dragged) */
  onChange: (loc: GeoLocation) => void;
  /** Initial value if editing an existing property */
  initialValue?: GeoLocation;
  /** Placeholder for the search input */
  placeholder?: string;
}

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

export default function AddressMapPicker({
  onChange,
  initialValue,
  placeholder = "Search address, landmark, area...",
}: AddressMapPickerProps) {
  const [query, setQuery] = useState(initialValue?.formattedAddress || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<GeoLocation | null>(initialValue || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from Geoapify autocomplete
  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_KEY}&limit=6&lang=en`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the API call
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  // When user picks a suggestion from the dropdown
  const handleSelect = (s: Suggestion) => {
    const loc: GeoLocation = {
      lat: s.properties.lat,
      lng: s.properties.lon,
      formattedAddress: s.properties.formatted,
      city: s.properties.city,
      state: s.properties.state,
      pincode: s.properties.postcode,
    };
    setQuery(s.properties.formatted);
    setSelected(loc);
    setSuggestions([]);
    setShowDropdown(false);
    onChange(loc);
  };

  // When user drags the map pin — update coordinates but keep address
  const handlePinDrag = useCallback(
    (lat: number, lng: number) => {
      if (!selected) return;
      const updated: GeoLocation = { ...selected, lat, lng };
      setSelected(updated);
      onChange(updated);
    },
    [selected, onChange]
  );

  const clearSelection = () => {
    setQuery("");
    setSelected(null);
    setSuggestions([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-50 transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : query ? (
            <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-[9999] overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
              >
                <MapPin size={14} className="text-[#0052CC] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 line-clamp-2">{s.properties.formatted}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map — shown only once an address is selected */}
      {selected && (
        <div className="space-y-2">
          <div className="w-full h-[280px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <LeafletMap
              lat={selected.lat}
              lng={selected.lng}
              onDrag={handlePinDrag}
              draggable
            />
          </div>
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-snug">
              <span className="font-semibold text-gray-700">Location set.</span>{" "}
              Drag the pin to fine-tune the exact building.
            </p>
          </div>
        </div>
      )}

      {!selected && (
        <div className="w-full h-[280px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
          <MapPin size={32} className="text-gray-300" />
          <p className="text-sm font-medium">Search an address above to pin the location</p>
          <p className="text-xs text-gray-300">The map will appear here once you select a suggestion</p>
        </div>
      )}
    </div>
  );
}
