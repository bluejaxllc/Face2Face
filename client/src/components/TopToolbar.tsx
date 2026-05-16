import { useState } from "react";
import { Flame, MapPin, Eye, Layers, Settings, ChevronDown } from "lucide-react";
import SettingsModal from "./SettingsModal";
import FilterDrawer, { FilterOptions } from "./FilterDrawer";

interface TopToolbarProps {
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  mapStyle: 'street' | 'satellite';
  onToggleMapStyle: () => void;
}

export default function TopToolbar({
  isActive,
  onToggleActive,
  filterOptions,
  onFilterChange,
  mapStyle,
  onToggleMapStyle,
}: TopToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showDistance, setShowDistance] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toolbarItems = [
    {
      id: "live",
      icon: Flame,
      label: "LIVE",
      active: isActive,
      hasDropdown: false,
      onClick: () => onToggleActive(!isActive),
      activeColor: "text-red-400",
    },
    {
      id: "distance",
      icon: MapPin,
      label: "DISTANCE",
      active: false,
      hasDropdown: true,
      onClick: () => setShowDistance(!showDistance),
      activeColor: "text-slate-300",
    },
    {
      id: "show",
      icon: Eye,
      label: "SHOW",
      active: false,
      hasDropdown: true,
      onClick: () => setShowFilters(!showFilters),
      activeColor: "text-slate-300",
    },
    {
      id: "layers",
      icon: Layers,
      label: "LAYERS",
      active: mapStyle === "satellite",
      hasDropdown: false,
      onClick: onToggleMapStyle,
      activeColor: "text-emerald-400",
    },
    {
      id: "settings",
      icon: Settings,
      label: "SETTINGS",
      active: false,
      hasDropdown: false,
      onClick: () => setShowSettings(true),
      activeColor: "text-slate-300",
    },
  ];

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/90 border-b border-slate-800/50 backdrop-blur-md pointer-events-auto"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex justify-around items-center w-full max-w-lg mx-auto" style={{ height: "44px" }}>
          {toolbarItems.map(({ id, icon: Icon, label, active, hasDropdown, onClick, activeColor }) => (
            <button
              key={id}
              onClick={onClick}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                active ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Icon
                className={`transition-colors duration-200 ${active ? activeColor : "text-slate-400"}`}
                style={{ width: "16px", height: "16px" }}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                className={`font-semibold tracking-wider uppercase ${
                  active ? activeColor : "text-slate-400"
                }`}
                style={{ fontSize: "9px" }}
              >
                {label}
              </span>
              {hasDropdown && (
                <ChevronDown
                  className="text-slate-500"
                  style={{ width: "10px", height: "10px" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Distance dropdown */}
      {showDistance && (
        <div
          className="fixed z-[10000] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
          style={{ top: "50px", left: "50%", transform: "translateX(-50%)", minWidth: "160px" }}
        >
          <div className="flex flex-col gap-2 items-center">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Search Radius</span>
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/10 rounded-md shadow-inner px-2 py-1">
              <input
                type="number"
                value={filterOptions.radius >= 25000 ? "" : filterOptions.radius}
                placeholder="∞"
                min={1}
                max={25000}
                aria-label="Search radius in miles"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length > 5) return;
                  if (val === "" || val === "0") {
                    onFilterChange({ ...filterOptions, radius: 25000 });
                  } else {
                    onFilterChange({ ...filterOptions, radius: Math.min(25000, Math.max(1, parseInt(val) || 1)) });
                  }
                }}
                className="bg-transparent text-white font-bold text-center outline-none border-none placeholder:text-slate-500"
                style={{ width: "6ch", fontSize: "14px", MozAppearance: "textfield", WebkitAppearance: "none" } as any}
              />
              <span className="text-slate-400 font-bold" style={{ fontSize: "10px" }}>MI</span>
            </div>
            
            <button
               onClick={() => onFilterChange({ ...filterOptions, radius: 25000 })}
               className="mt-1 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300"
            >
              Set Unlimited
            </button>
          </div>
          <button
            onClick={() => setShowDistance(false)}
            className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Close
          </button>
        </div>
      )}

      {/* Show/Filter dropdown */}
      {showFilters && (
        <div
          className="fixed z-[10000] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
          style={{ top: "50px", left: "50%", transform: "translateX(-50%)", minWidth: "220px" }}
        >
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Show Users</span>
          <div className="flex flex-col gap-2">
            {[
              { key: "showDating", label: "💕 Dating", checked: filterOptions.showDating },
              { key: "showBusiness", label: "💼 Business", checked: filterOptions.showBusiness },
              { key: "showFriendships", label: "🤝 Friends", checked: filterOptions.showFriendships },
            ].map(({ key, label, checked }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onFilterChange({ ...filterOptions, [key]: !checked })}
                  className="accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200 text-sm">{label}</span>
              </label>
            ))}
            <div className="border-t border-slate-700 pt-2 mt-1">
              {[
                { key: "showMen", label: "♂ Men", checked: filterOptions.showMen ?? true },
                { key: "showWomen", label: "♀ Women", checked: filterOptions.showWomen ?? true },
              ].map(({ key, label, checked }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onFilterChange({ ...filterOptions, [key]: !checked })}
                    className="accent-indigo-500 w-4 h-4"
                  />
                  <span className="text-slate-200 text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowFilters(false)}
            className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Close
          </button>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
