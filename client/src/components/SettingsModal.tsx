import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Settings, Eye, Heart, User } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [gender, setGender] = useState(user?.gender || "other");
  const [age, setAge] = useState(user?.age || 18);
  const [height, setHeight] = useState(user?.height || "");
  const [weight, setWeight] = useState(user?.weight || "");
  const [datingPreference, setDatingPreference] = useState(user?.datingPreference || "all");
  const [category, setCategory] = useState(user?.category || "casual");
  const [seeking, setSeeking] = useState(user?.seeking || "");
  const [showOnMap, setShowOnMap] = useState(user?.isActive !== false);
  const [inactiveTimeout, setInactiveTimeout] = useState(user?.inactiveTimeout || 30);

  const handleSave = async () => {
    try {
      await updateProfile({
        gender,
        age,
        height: height || undefined,
        weight: weight || undefined,
        category,
        datingPreference,
        seeking: seeking || undefined,
        isActive: showOnMap,
        inactiveTimeout,
      });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
      onClose();
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({ title: "Update failed", description: "There was a problem saving your settings.", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage your profile and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Personal */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Personal
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-300 mb-1 block">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-slate-200 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-300 mb-1 block">Age</Label>
                <Input
                  type="number" min={18} max={99} value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                  className="bg-slate-800/60 border-slate-700/50 text-slate-200 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-300 mb-1 block">Height</Label>
                <Input
                  placeholder="e.g. 5ft 10in" value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-slate-200 placeholder:text-slate-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-300 mb-1 block">Weight</Label>
                <Input
                  placeholder="e.g. 165 lbs" value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-slate-200 placeholder:text-slate-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3 border-t border-slate-700/50 pt-4">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Heart className="w-3 h-3" />
              Preferences
            </Label>
            <div>
              <Label className="block text-xs font-medium text-slate-300 mb-2">Interested In</Label>
              <div className="flex space-x-2">
                <Button type="button"
                  variant={datingPreference === "men" ? "default" : "outline"}
                  className={`flex-1 rounded-xl h-10 font-semibold transition-all ${datingPreference === "men"
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 border-blue-400/50"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  onClick={() => setDatingPreference("men")}>Men</Button>
                <Button type="button"
                  variant={datingPreference === "women" ? "default" : "outline"}
                  className={`flex-1 rounded-xl h-10 font-semibold transition-all ${datingPreference === "women"
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25 border-pink-400/50"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  onClick={() => setDatingPreference("women")}>Women</Button>
                <Button type="button"
                  variant={datingPreference === "all" ? "default" : "outline"}
                  className={`flex-1 rounded-xl h-10 font-semibold transition-all ${datingPreference === "all"
                      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 border-purple-400/50"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  onClick={() => setDatingPreference("all")}>All</Button>
              </div>
            </div>
            <div>
              <Label className="block text-xs font-medium text-slate-300 mb-2">Category</Label>
              <div className="flex space-x-2">
                <Button type="button"
                  variant={category === "casual" ? "default" : "outline"}
                  className={`flex-1 rounded-xl h-10 font-semibold transition-all ${category === "casual"
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 border-blue-400/50"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  onClick={() => setCategory("casual")}>Connect</Button>
                <Button type="button"
                  variant={category === "intimate" ? "default" : "outline"}
                  className={`flex-1 rounded-xl h-10 font-semibold transition-all ${category === "intimate"
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25 border-pink-400/50"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  onClick={() => setCategory("intimate")}>Grind</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-300 mb-1 block">Seeking</Label>
              <Input
                placeholder="e.g. Friendship, Dating, Networking" value={seeking}
                onChange={(e) => setSeeking(e.target.value)}
                className="bg-slate-800/60 border-slate-700/50 text-slate-200 placeholder:text-slate-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
              />
              <p className="text-[10px] text-slate-500 mt-1">Comma-separated</p>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-3 border-t border-slate-700/50 pt-4">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Visibility
            </Label>
            <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Show my profile on map</span>
              <Switch checked={showOnMap} onCheckedChange={setShowOnMap} />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-300 mb-1 block">Inactive timeout ({inactiveTimeout}m)</Label>
              <Input
                type="number" min={5} max={120} value={inactiveTimeout}
                onChange={(e) => setInactiveTimeout(parseInt(e.target.value) || 30)}
                className="bg-slate-800/60 border-slate-700/50 text-slate-200 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
              />
              <p className="text-[10px] text-slate-500 mt-1">Hide from map after this many minutes</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button" onClick={handleSave}
            className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25 border border-blue-400/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
