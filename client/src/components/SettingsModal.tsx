import { useState } from "react";
import { useLocation } from "wouter";
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
  mapStyle?: 'street' | 'satellite';
  onToggleMapStyle?: () => void;
}

export default function SettingsModal({ onClose, mapStyle = 'street', onToggleMapStyle }: SettingsModalProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [gender, setGender] = useState(user?.gender || "other");
  const [age, setAge] = useState(user?.age || 18);
  const [height, setHeight] = useState(user?.height || "");
  const [weight, setWeight] = useState(user?.weight || "");
  const [datingPreference, setDatingPreference] = useState(user?.datingPreference || "women");
  const [category, setCategory] = useState(user?.category || "friendships");
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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-slate-900/95 border border-slate-700/50 text-white">
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
          {/* App Preferences */}
          <div className="space-y-4">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3 h-3" />
              App Preferences
            </Label>
            
            <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Push Notifications</span>
              <Switch defaultChecked={true} />
            </div>

            <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Haptic Feedback</span>
              <Switch defaultChecked={true} />
            </div>

            <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Dark Mode</span>
              <Switch defaultChecked={true} />
            </div>
          </div>

          {/* Visibility  & Timeout */}
          <div className="space-y-4 border-t border-slate-700/50 pt-4">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Visibility & Map
            </Label>
            
            <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Satellite Map Style</span>
              <Switch checked={mapStyle === 'satellite'} onCheckedChange={() => onToggleMapStyle?.()} />
            </div>

            <div className="px-1">
              <Label className="text-xs font-medium text-slate-300 mb-1 block">Screen Timeout (Minutes)</Label>
              <Input
                type="number" min={1} max={120} value={inactiveTimeout}
                onChange={(e) => setInactiveTimeout(parseInt(e.target.value) || 30)}
                className="bg-slate-800/60 border-slate-700/50 text-slate-200 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
              />
              <p className="text-[10px] text-slate-400 mt-1">Hide from map while app is backgrounded</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              onClose();
              setTimeout(() => { window.location.hash = ''; window.history.pushState({}, '', '/dev'); window.dispatchEvent(new PopStateEvent('popstate')); }, 100);
            }}
            className="flex items-center justify-center gap-2 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30 hover:bg-slate-700/40 transition-colors w-full mt-4"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Device Diagnostics</span>
          </button>
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button" onClick={handleSave}
            className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 hover:text-white transition-all"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
