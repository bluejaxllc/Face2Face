import { useState } from "react";
import { Flame, MapPin, Eye, Layers, Settings, ChevronDown, Heart, Handshake, Briefcase, Gauge, Tag } from "lucide-react";
import { useLocation } from "wouter";
import SettingsModal from "./SettingsModal";
import { FilterOptions } from "./FilterDrawer";

interface TopToolbarProps {
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  userCount?: number;
  accentColor?: string;
  accentBg?: string;
  category?: 'dating' | 'friends' | 'business';
  mapStyle?: 'street' | 'satellite';
  onToggleMapStyle?: () => void;
}

export default function TopToolbar({
  isActive,
  onToggleActive,
  filterOptions,
  onFilterChange,
  userCount = 0,
  accentColor = 'text-rose-400',
  accentBg = 'bg-rose-500 hover:bg-rose-600',
  category = 'dating',
  mapStyle = 'street',
  onToggleMapStyle,
}: TopToolbarProps) {
  const [, navigate] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showDistance, setShowDistance] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Category-specific toolbar labels
  const toolbarLabels = {
    dating:   { distance: 'DISTANCE', show: 'SHOW',   radius: 'Radius' },
    friends:  { distance: 'NEARBY',   show: 'FILTER', radius: 'Range' },
    business: { distance: 'RANGE',    show: 'FILTER', radius: 'Range' },
  };
  const labels = toolbarLabels[category];

  // Category-specific accent for KM/MI toggle
  const accentPill = {
    dating:   'bg-rose-500',
    friends:  'bg-emerald-500',
    business: 'bg-blue-500',
  }[category];

  // Category-specific live icon and color
  const liveIndicator = {
    dating:   { icon: Heart, color: 'text-rose-400' },
    friends:  { icon: Handshake, color: 'text-emerald-400' },
    business: { icon: Briefcase, color: 'text-blue-400' },
  }[category];

  const toolbarItems = [
    {
      id: "live",
      icon: liveIndicator.icon,
      label: isActive ? `LIVE · ${userCount}` : "OFFLINE",
      active: isActive,
      hasDropdown: false,
      onClick: () => onToggleActive(!isActive),
      activeColor: liveIndicator.color,
    },
    {
      id: "distance",
      icon: MapPin,
      label: labels.distance,
      active: showDistance,
      hasDropdown: true,
      onClick: () => { setShowDistance(!showDistance); setShowFilters(false); },
      activeColor: accentColor,
    },
    {
      id: "show",
      icon: Eye,
      label: labels.show,
      active: showFilters,
      hasDropdown: true,
      onClick: () => { setShowFilters(!showFilters); setShowDistance(false); },
      activeColor: accentColor,
    },
    {
      id: "settings",
      icon: Settings,
      label: "SETTINGS",
      active: false,
      hasDropdown: false,
      onClick: () => setShowSettings(true),
      activeColor: accentColor,
    },
    {
      id: "dev",
      icon: Gauge,
      label: "DEV",
      active: false,
      hasDropdown: false,
      onClick: () => navigate("/dev"),
      activeColor: "text-amber-400 animate-pulse",
    },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 w-full" style={{ height: "48px", padding: "4px 6px" }}>
          <div className="flex items-center justify-evenly h-full relative" style={{ gap: "2px" }}>
            {toolbarItems.map(({ id, icon: Icon, label, active, hasDropdown, onClick, activeColor }) => (
              <button
                key={id}
                onClick={onClick}
                className={`flex items-center justify-center gap-0.5 py-1.5 rounded-full transition-all duration-300 relative min-w-0 ${
                  active ? "bg-white/5 opacity-100" : "opacity-70 hover:opacity-100 hover:bg-white/5"
                }`}
                style={{ padding: "6px 6px" }}
              >
                <Icon
                  className={`flex-shrink-0 transition-colors duration-300 ${active ? activeColor : "text-slate-400"}`}
                  style={{ width: "14px", height: "14px" }}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span
                  className={`font-semibold tracking-wider uppercase transition-colors duration-300 truncate ${
                    active ? activeColor : "text-slate-400"
                  }`}
                  style={{ fontSize: "8px", lineHeight: "1" }}
                >
                  {label}
                </span>
                {hasDropdown && (
                  <ChevronDown
                    className="text-slate-500 flex-shrink-0"
                    style={{ width: "8px", height: "8px", marginLeft: "-1px" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Distance dropdown */}
      {showDistance && (
        <div
          className="fixed z-[10000] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
          style={{ top: "52px", left: "50%", transform: "translateX(-50%)", minWidth: "160px" }}
        >
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block text-center">{labels.radius}</span>
          {/* Typed distance input */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/10 rounded-md shadow-inner px-2 py-1.5 mb-2">
            <input
              type="number"
              value={filterOptions.radius >= 25000 ? "" : filterOptions.radius}
              placeholder="∞"
              min={1}
              max={25000}
              aria-label="Search radius"
              onChange={(e) => {
                const val = e.target.value;
                if (val.length > 5) return;
                if (val === "" || val === "0") {
                  onFilterChange({ ...filterOptions, radius: 25000 });
                } else {
                  onFilterChange({ ...filterOptions, radius: Math.min(25000, Math.max(1, parseInt(val) || 1)) });
                }
              }}
              className="bg-transparent text-white font-bold text-center outline-none border-none placeholder:text-slate-500 flex-1"
              style={{ width: "6ch", fontSize: "14px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
            />
          </div>
          {/* KM / MI toggle */}
          <div className="flex bg-slate-950/80 rounded-lg p-0.5 border border-white/10 mb-3">
            <button
              onClick={() => onFilterChange({ ...filterOptions, distanceUnit: 'mi' })}
              className={`flex-1 text-center py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                (filterOptions.distanceUnit ?? 'mi') === 'mi'
                  ? `${accentPill} text-white shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MI
            </button>
            <button
              onClick={() => onFilterChange({ ...filterOptions, distanceUnit: 'km' })}
              className={`flex-1 text-center py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                (filterOptions.distanceUnit ?? 'mi') === 'km'
                  ? `${accentPill} text-white shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              KM
            </button>
          </div>
          {/* Set button */}
          <button
            onClick={() => setShowDistance(false)}
            className={`w-full py-1.5 rounded-lg ${accentBg} text-white text-xs font-bold uppercase tracking-wider transition-all duration-200`}
          >
            Set
          </button>
        </div>
      )}

      {/* Show/Filter dropdown */}
      {showFilters && (() => {
        const filterItems: Record<string, { key: string; label: string }[]> = {
          dating: [
            { key: "showAll", label: "All" },
            { key: "showMen", label: "Male" },
            { key: "showWomen", label: "Female" },
            { key: "showCustom", label: "Custom" },
            { key: "showGroups", label: "Groups" },
            { key: "showDates", label: "Dates" },
            { key: "showHotspots", label: "Hotspots" },
          ],
          friends: [
            { key: "showAll", label: "All" },
            { key: "showMen", label: "Male" },
            { key: "showWomen", label: "Female" },
            { key: "showCustom", label: "Custom" },
            { key: "showGroups", label: "Groups" },
            { key: "showNearby", label: "Nearby" },
            { key: "showHotspots", label: "Hotspots" },
          ],
          business: [
            { key: "showAll", label: "All" },
            { key: "showProfessionals", label: "Professionals" },
            { key: "showRecruiters", label: "Recruiters" },
            { key: "showCustom", label: "Custom" },
            { key: "showGroups", label: "Groups" },
            { key: "showStartups", label: "Startups" },
            { key: "showHotspots", label: "Hotspots" },
          ],
        };
        const items = filterItems[category] || filterItems.dating;

        return (
          <div
            className="fixed z-[10000] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
            style={{ top: "52px", left: "50%", transform: "translateX(-50%)", minWidth: "180px" }}
          >
            <div className="flex flex-col gap-1.5 mb-2">
              {items.map(({ key, label }) => {
                const isOn = key === "showAll"
                  ? items.filter(i => i.key !== "showAll").every(i => (filterOptions as any)[i.key] !== false)
                  : (filterOptions as any)[key] !== false;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "showAll") {
                        // Toggle all items on
                        const allOn = items.filter(i => i.key !== "showAll").every(i => (filterOptions as any)[i.key] !== false);
                        const updates: any = { ...filterOptions };
                        items.forEach(i => { if (i.key !== "showAll") updates[i.key] = !allOn; });
                        updates.showAll = !allOn;
                        onFilterChange(updates);
                      } else {
                        onFilterChange({ ...filterOptions, [key]: !isOn });
                      }
                    }}
                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200"
                  >
                    <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                      isOn ? 'text-slate-200' : 'text-slate-500'
                    }`}>
                      {label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-auto ${
                        isOn
                          ? `${accentPill} border-transparent`
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isOn && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Age Range */}
            <div className="border-t border-slate-700/50 pt-2 mt-1">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 block text-center">Age Range</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={filterOptions.ageRange[0]}
                  min={18}
                  max={80}
                  aria-label="Minimum age"
                  onChange={(e) => {
                    const val = Math.min(80, Math.max(18, parseInt(e.target.value) || 18));
                    onFilterChange({ ...filterOptions, ageRange: [val, Math.max(val, filterOptions.ageRange[1])] });
                  }}
                  className="bg-slate-950/80 border border-white/10 rounded-md px-2 py-1.5 text-white font-bold text-center outline-none focus:border-slate-500 transition-colors flex-1"
                  style={{ fontSize: "13px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
                />
                <span className="text-slate-500 text-xs font-bold">—</span>
                <input
                  type="number"
                  value={filterOptions.ageRange[1]}
                  min={18}
                  max={80}
                  aria-label="Maximum age"
                  onChange={(e) => {
                    const val = Math.min(80, Math.max(18, parseInt(e.target.value) || 80));
                    onFilterChange({ ...filterOptions, ageRange: [Math.min(val, filterOptions.ageRange[0]), val] });
                  }}
                  className="bg-slate-950/80 border border-white/10 rounded-md px-2 py-1.5 text-white font-bold text-center outline-none focus:border-slate-500 transition-colors flex-1"
                  style={{ fontSize: "13px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className={`w-full py-1.5 rounded-lg ${accentBg} text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 mb-2`}
            >
              Set
            </button>
            {/* Browse Tags button */}
            <div className="border-t border-slate-700/50 pt-2">
              <button
                onClick={() => { setShowFilters(false); navigate('/explore?tags=open'); }}
                className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all duration-200`}
              >
                <Tag className="h-3.5 w-3.5" />
                Browse Tags
              </button>
            </div>
          </div>
        );
      })()}

      {showSettings && <SettingsModal 
        onClose={() => setShowSettings(false)}
        mapStyle={mapStyle}
        onToggleMapStyle={onToggleMapStyle}
      />}
    </>
  );
}
