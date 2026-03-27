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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Preferences</DialogTitle>
          <DialogDescription>
            Customize your profile settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Distance Radius</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[radius]}
                onValueChange={(values) => setRadius(values[0])}
                max={25000}
                min={1}
                step={100}
              />
              <span className="text-sm font-medium text-gray-700 w-20">{radius >= 25000 ? 'Unlimited' : `${radius} mi`}</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Interested In</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={datingPreference === "men" ? "default" : "outline"}
                className={datingPreference === "men" ? "bg-secondary text-white" : ""}
                onClick={() => setDatingPreference("men")}
              >
                Men
              </Button>
              <Button
                type="button"
                variant={datingPreference === "women" ? "default" : "outline"}
                className={datingPreference === "women" ? "bg-secondary text-white" : ""}
                onClick={() => setDatingPreference("women")}
              >
                Women
              </Button>
              <Button
                type="button"
                variant={datingPreference === "all" ? "default" : "outline"}
                className={datingPreference === "all" ? "bg-secondary text-white" : ""}
                onClick={() => setDatingPreference("all")}
              >
                All
              </Button>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Age Range</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={ageRange}
                onValueChange={setAgeRange}
                max={65}
                min={18}
                step={1}
              />
              <span className="text-sm font-medium text-gray-700 w-16">{ageRange[0]}-{ageRange[1]}</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Preferred Category</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={category === "casual" ? "default" : "outline"}
                className={category === "casual" ? "bg-secondary text-white" : ""}
                onClick={() => setCategory("casual")}
              >
                Connect
              </Button>
              <Button
                type="button"
                variant={category === "intimate" ? "default" : "outline"}
                className={category === "intimate" ? "bg-primary text-white" : ""}
                onClick={() => setCategory("intimate")}
              >
                Grind
              </Button>
              <Button
                type="button"
                variant={category === "both" ? "default" : "outline"}
                className={category === "both" ? "bg-secondary text-white" : ""}
                onClick={() => setCategory("both")}
              >
                Both
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show my profile on map</span>
            <Switch
              checked={showOnMap}
              onCheckedChange={setShowOnMap}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Receive connection notifications</span>
            <Switch
              checked={receiveNotifications}
              onCheckedChange={setReceiveNotifications}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} className="w-full bg-secondary hover:bg-secondary/90">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
