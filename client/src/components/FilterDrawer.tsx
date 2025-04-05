import { useState } from "react";
import { Filter, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define our filter options and types
export interface FilterOptions {
  datingPreference: 'any' | 'men' | 'women' | 'everyone';
  showBump: boolean;
  showGrind: boolean;
  ageRange: [number, number];
  radius: number;
  minRating: number;
}

interface FilterDrawerProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
}

export default function FilterDrawer({ options, onChange }: FilterDrawerProps) {
  // Create a local state to manage changes before applying them
  const [localOptions, setLocalOptions] = useState<FilterOptions>(options);
  
  // Helper to update specific field in the options
  const updateOption = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setLocalOptions(prev => ({ ...prev, [key]: value }));
  };
  
  // Apply all changes at once
  const applyFilters = () => {
    onChange(localOptions);
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Filter">
          <Sliders className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Options
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 pb-20">
          {/* Dating Preference */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dating Preference</Label>
            <RadioGroup 
              value={localOptions.datingPreference} 
              onValueChange={(value) => updateOption('datingPreference', value as FilterOptions['datingPreference'])}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="pref-any" />
                <Label htmlFor="pref-any">Any</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="men" id="pref-men" />
                <Label htmlFor="pref-men">Men</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="women" id="pref-women" />
                <Label htmlFor="pref-women">Women</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="everyone" id="pref-everyone" />
                <Label htmlFor="pref-everyone">Everyone</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* User Types */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">User Types</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-bump" className="cursor-pointer">Show Bump users</Label>
              <Switch 
                id="show-bump" 
                checked={localOptions.showBump} 
                onCheckedChange={(checked) => updateOption('showBump', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-grind" className="cursor-pointer">Show Grind users</Label>
              <Switch 
                id="show-grind" 
                checked={localOptions.showGrind} 
                onCheckedChange={(checked) => updateOption('showGrind', checked)}
              />
            </div>
          </div>
          
          {/* Age Range Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Age Range</Label>
              <span className="text-xs text-gray-500">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Search Radius</Label>
              <span className="text-xs text-gray-500">{localOptions.radius} miles</span>
            </div>
            <Slider
              defaultValue={[localOptions.radius]}
              min={1}
              max={50}
              step={1}
              onValueChange={(value) => updateOption('radius', value[0])}
            />
          </div>
          
          {/* Minimum Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Minimum Rating</Label>
            <Select 
              value={localOptions.minRating.toString()} 
              onValueChange={(value) => updateOption('minRating', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select minimum rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 star</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setLocalOptions(options)}
              className="flex-1 mr-2"
            >
              Reset
            </Button>
            <SheetClose asChild>
              <Button 
                onClick={applyFilters}
                className="flex-1 ml-2"
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