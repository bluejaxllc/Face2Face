import { useState } from "react";
import { Filter, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define our filter options and types
export interface FilterOptions {
  datingPreference: 'any' | 'men' | 'women' | 'everyone';
  showCasual: boolean;
  showIntimate: boolean;
  showMen: boolean;
  showWomen: boolean;
  ageRange: [number, number];
  radius: number;
  minRating: number;
}

interface FilterDrawerProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
}

export default function FilterDrawer({ options, onChange }: FilterDrawerProps) {
  const [localOptions, setLocalOptions] = useState<FilterOptions>(options);

  const updateOption = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setLocalOptions(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onChange(localOptions);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          aria-label="Filter"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto bg-slate-900 border-l border-slate-700/50 text-white">
        <SheetHeader className="mb-5">
          <SheetTitle className="flex items-center text-white font-heading">
            <Filter className="mr-2 h-5 w-5 text-blue-400" />
            Filter Options
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-20">
          {/* Seeking — symbol toggles */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Seeking</Label>
            <div className="flex gap-3">
              {/* Triangle = Men */}
              <button
                type="button"
                onClick={() => {
                  const next = !localOptions.showMen;
                  const pref = next && localOptions.showWomen ? 'any' : next ? 'men' : localOptions.showWomen ? 'women' : 'any';
                  setLocalOptions(prev => ({ ...prev, showMen: next, datingPreference: pref }));
                }}
                className={`flex-1 flex items-center justify-center rounded-xl p-4 border-2 transition-all duration-300 ${localOptions.showMen
                  ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.35)]'
                  : 'bg-slate-800/50 border-slate-700/30 opacity-40'
                  }`}
              >
                <svg width="40" height="40" viewBox="0 0 100 100">
                  <polygon points="50,8 94,92 6,92" fill={localOptions.showMen ? '#4285F4' : '#475569'} stroke={localOptions.showMen ? '#1a73e8' : '#334155'} strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Circle = Women */}
              <button
                type="button"
                onClick={() => {
                  const next = !localOptions.showWomen;
                  const pref = localOptions.showMen && next ? 'any' : !localOptions.showMen && next ? 'women' : localOptions.showMen ? 'men' : 'any';
                  setLocalOptions(prev => ({ ...prev, showWomen: next, datingPreference: pref }));
                }}
                className={`flex-1 flex items-center justify-center rounded-xl p-4 border-2 transition-all duration-300 ${localOptions.showWomen
                  ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_16px_rgba(236,72,153,0.35)]'
                  : 'bg-slate-800/50 border-slate-700/30 opacity-40'
                  }`}
              >
                <svg width="40" height="40" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill={localOptions.showWomen ? '#EA4335' : '#475569'} stroke={localOptions.showWomen ? '#c5221f' : '#334155'} strokeWidth="4" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Types */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">User Types</Label>
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <Label htmlFor="show-casual" className="cursor-pointer text-slate-300">Show Casual users</Label>
              <Switch
                id="show-casual"
                checked={localOptions.showCasual}
                onCheckedChange={(checked) => updateOption('showCasual', checked)}
              />
            </div>
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <Label htmlFor="show-intimate" className="cursor-pointer text-slate-300">Show Intimate users</Label>
              <Switch
                id="show-intimate"
                checked={localOptions.showIntimate}
                onCheckedChange={(checked) => updateOption('showIntimate', checked)}
              />
            </div>
          </div>

          {/* Age Range Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Age Range</Label>
              <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-2 py-1 rounded-full">
                {localOptions.ageRange[0]} - {localOptions.ageRange[1]} years
              </span>
            </div>
            <Slider
              defaultValue={localOptions.ageRange}
              min={18}
              max={80}
              step={1}
              onValueChange={(value) => updateOption('ageRange', value as [number, number])}
            />
          </div>

          {/* Distance Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Search Radius</Label>
              <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-2 py-1 rounded-full">
                {localOptions.radius >= 25000 ? 'Unlimited' : `${localOptions.radius} miles`}
              </span>
            </div>
            <Slider
              defaultValue={[localOptions.radius]}
              min={1}
              max={25000}
              step={100}
              onValueChange={(value) => updateOption('radius', value[0])}
            />
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Minimum Rating</Label>
            <Select
              value={localOptions.minRating.toString()}
              onValueChange={(value) => updateOption('minRating', parseInt(value))}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200">
                <SelectValue placeholder="Select minimum rating" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectItem value="1">⭐ (Any)</SelectItem>
                <SelectItem value="2">⭐⭐</SelectItem>
                <SelectItem value="3">⭐⭐⭐</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setLocalOptions(options)}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Reset
            </Button>
            <SheetClose asChild>
              <Button
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-blue-500/25"
              >
                Apply Filters
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}