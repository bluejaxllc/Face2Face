import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Personal */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Age</Label>
                <Input type="number" min={18} max={99} value={age} onChange={(e) => setAge(parseInt(e.target.value) || 18)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Height</Label>
                <Input placeholder="e.g. 5ft 10in" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Weight</Label>
                <Input placeholder="e.g. 165 lbs" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferences</Label>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Interested In</Label>
              <div className="flex space-x-2">
                <Button type="button" variant={datingPreference === "men" ? "default" : "outline"}
                  className={datingPreference === "men" ? "bg-secondary text-white flex-1" : "flex-1"}
                  onClick={() => setDatingPreference("men")}>Men</Button>
                <Button type="button" variant={datingPreference === "women" ? "default" : "outline"}
                  className={datingPreference === "women" ? "bg-secondary text-white flex-1" : "flex-1"}
                  onClick={() => setDatingPreference("women")}>Women</Button>
                <Button type="button" variant={datingPreference === "all" ? "default" : "outline"}
                  className={datingPreference === "all" ? "bg-secondary text-white flex-1" : "flex-1"}
                  onClick={() => setDatingPreference("all")}>All</Button>
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label>
              <div className="flex space-x-2">
                <Button type="button" variant={category === "casual" ? "default" : "outline"}
                  className={category === "casual" ? "bg-secondary text-white flex-1" : "flex-1"}
                  onClick={() => setCategory("casual")}>Connect</Button>
                <Button type="button" variant={category === "intimate" ? "default" : "outline"}
                  className={category === "intimate" ? "bg-primary text-white flex-1" : "flex-1"}
                  onClick={() => setCategory("intimate")}>Grind</Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Seeking</Label>
              <Input placeholder="e.g. Friendship, Dating, Networking" value={seeking} onChange={(e) => setSeeking(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visibility</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Show my profile on map</span>
              <Switch checked={showOnMap} onCheckedChange={setShowOnMap} />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Inactive timeout ({inactiveTimeout}m)</Label>
              <Input type="number" min={5} max={120} value={inactiveTimeout} onChange={(e) => setInactiveTimeout(parseInt(e.target.value) || 30)} />
              <p className="text-xs text-gray-400 mt-1">Hide from map after this many minutes</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} className="w-full bg-secondary hover:bg-secondary/90">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
