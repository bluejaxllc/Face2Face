import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, updateProfile } = useAuth();

  const [radius, setRadius] = useState(25000);
  const [datingPreference, setDatingPreference] = useState(user?.datingPreference || "all");
  const [ageRange, setAgeRange] = useState([18, 35]);
  const [category, setCategory] = useState(user?.category || "casual");
  const [showOnMap, setShowOnMap] = useState(user?.isActive !== false);
  const [receiveNotifications, setReceiveNotifications] = useState(true);

  const handleSave = async () => {
    try {
      await updateProfile({
        category,
        datingPreference,
        isActive: showOnMap,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const prefBtn = (val: string, label: string) => (
    <Button
      type="button"
      variant={datingPreference === val ? "default" : "outline"}
      className={datingPreference === val
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md shadow-blue-500/20"
        : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}
      onClick={() => setDatingPreference(val)}
    >
      {label}
    </Button>
  );

  const catBtn = (val: string, label: string, gradient: string) => (
    <Button
      type="button"
      variant={category === val ? "default" : "outline"}
      className={category === val
        ? `${gradient} text-white border-0 shadow-md`
        : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"}
      onClick={() => setCategory(val)}
    >
      {label}
    </Button>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white font-heading">Preferences</DialogTitle>
          <DialogDescription className="text-slate-400">
            Customize your profile settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <Label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Distance Radius</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[radius]}
                onValueChange={(values) => setRadius(values[0])}
                max={25000}
                min={1}
                step={100}
              />
              <span className="text-sm font-semibold text-slate-300 w-20">{radius >= 25000 ? 'Unlimited' : `${radius} mi`}</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Interested In</Label>
            <div className="flex space-x-2">
              {prefBtn("men", "Men")}
              {prefBtn("women", "Women")}
              {prefBtn("all", "All")}
            </div>
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Age Range</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={ageRange}
                onValueChange={setAgeRange}
                max={65}
                min={18}
                step={1}
              />
              <span className="text-sm font-semibold text-slate-300 w-16">{ageRange[0]}-{ageRange[1]}</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Preferred Category</Label>
            <div className="flex space-x-2">
              {catBtn("casual", "Connect", "bg-gradient-to-r from-blue-500 to-blue-600")}
              {catBtn("intimate", "Grind", "bg-gradient-to-r from-pink-500 to-rose-500")}
              {catBtn("both", "Both", "bg-gradient-to-r from-blue-500 to-pink-500")}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-sm font-medium text-slate-300">Show my profile on map</span>
            <Switch
              checked={showOnMap}
              onCheckedChange={setShowOnMap}
            />
          </div>

          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-sm font-medium text-slate-300">Receive connection notifications</span>
            <Switch
              checked={receiveNotifications}
              onCheckedChange={setReceiveNotifications}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-blue-500/25 rounded-xl h-12"
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
