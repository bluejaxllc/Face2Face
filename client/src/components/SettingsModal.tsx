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
import { Settings, Eye, Heart, User, Map, Satellite } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
  mapStyle?: 'street' | 'satellite';
  onToggleMapStyle?: () => void;
  onSetMapStyle?: (style: 'street' | 'satellite') => void;
}

export default function SettingsModal({ onClose, mapStyle = 'street', onToggleMapStyle, onSetMapStyle }: SettingsModalProps) {
  const handleMapStyleSelect = (style: 'street' | 'satellite') => {
    if (onSetMapStyle) {
      onSetMapStyle(style);
    } else if (onToggleMapStyle && mapStyle !== style) {
      onToggleMapStyle();
    }
    // Dispatch the event so the Map component picks it up
    window.dispatchEvent(new CustomEvent('f2f:mapStyleChange', { detail: style }));
  };
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
            
            <div className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300 block mb-2.5">Map Style</span>
              <div className="flex bg-slate-950/80 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => handleMapStyleSelect('street')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    mapStyle === 'street'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Map style={{ width: "14px", height: "14px" }} />
                  Street
                </button>
                <button
                  onClick={() => handleMapStyleSelect('satellite')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    mapStyle === 'satellite'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Satellite style={{ width: "14px", height: "14px" }} />
                  Satellite
                </button>
              </div>
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
