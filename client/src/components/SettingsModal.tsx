import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Settings, Eye, Map, MapPin, Satellite, Bell, Vibrate, Moon, Clock, Shield, ChevronRight, Wrench, Trash2, AlertTriangle, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Category = "dating" | "friends" | "business";

const catColors: Record<Category, { accent: string; glow: string; bg: string; text: string; border: string }> = {
  dating:   { accent: "#f43f5e", glow: "rgba(244,63,94,0.3)", bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30" },
  friends:  { accent: "#10b981", glow: "rgba(16,185,129,0.3)", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
  business: { accent: "#6366f1", glow: "rgba(99,102,241,0.3)", bg: "bg-indigo-500", text: "text-indigo-400", border: "border-indigo-500/30" },
};

interface SettingsModalProps {
  onClose: () => void;
  mapStyle?: 'street' | 'satellite' | 'radar' | 'heatmap';
  onToggleMapStyle?: () => void;
  onSetMapStyle?: (style: 'street' | 'satellite' | 'radar' | 'heatmap') => void;
}

// ─── Animated Toggle ───────────────────────────────────────────────────────────
function AnimatedToggle({ checked, onToggle, accent }: { checked: boolean; onToggle: () => void; accent: string }) {
  return (
    <motion.button
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-300"
      style={{
        background: checked ? accent : "rgba(71,85,105,0.5)",
        boxShadow: checked ? `0 0 12px ${accent}40` : "none",
      }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

export default function SettingsModal({ onClose, mapStyle = 'street', onToggleMapStyle, onSetMapStyle }: SettingsModalProps) {
  const handleMapStyleSelect = (style: 'street' | 'satellite' | 'radar' | 'heatmap') => {
    if (onSetMapStyle) {
      onSetMapStyle(style);
    } else if (onToggleMapStyle && mapStyle !== style) {
      onToggleMapStyle();
    }
    window.dispatchEvent(new CustomEvent('f2f:mapStyleChange', { detail: style }));
  };

  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState<Category>(() =>
    (localStorage.getItem("f2f_activeCategory") as Category) || "dating"
  );
  const c = catColors[category];

  useEffect(() => {
    const sync = () => {
      const cat = localStorage.getItem("f2f_activeCategory") as Category;
      if (cat) setCategory(cat);
    };
    window.addEventListener("f2f:categoryChange", sync);
    return () => window.removeEventListener("f2f:categoryChange", sync);
  }, []);

  const [sex, setSex] = useState(user?.sex || "other");
  const [age, setAge] = useState(user?.age || 18);
  const [height, setHeight] = useState(user?.height || "");
  const [weight, setWeight] = useState(user?.weight || "");
  const [datingPreference, setDatingPreference] = useState(user?.datingPreference || "women");
  const [userCategory, setUserCategory] = useState(user?.category || "friendships");
  const [seeking, setSeeking] = useState(user?.seeking || "");
  const [showOnMap, setShowOnMap] = useState(user?.isActive !== false);
  const [inactiveTimeout, setInactiveTimeout] = useState(user?.inactiveTimeout || 30);

  // App preferences — persisted in localStorage
  const [pushNotifs, setPushNotifs] = useState(() => {
    const saved = localStorage.getItem('f2f_pushNotifs');
    return saved !== null ? saved === 'true' : true;
  });
  const [haptic, setHaptic] = useState(() => {
    const saved = localStorage.getItem('f2f_haptic');
    return saved !== null ? saved === 'true' : true;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('f2f_darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  // Persist app preferences to localStorage on change
  useEffect(() => { localStorage.setItem('f2f_pushNotifs', String(pushNotifs)); }, [pushNotifs]);
  useEffect(() => { localStorage.setItem('f2f_haptic', String(haptic)); }, [haptic]);
  useEffect(() => {
    localStorage.setItem('f2f_darkMode', String(darkMode));
    // Dispatch event so other components can react to dark mode changes
    window.dispatchEvent(new CustomEvent('f2f:darkModeChange', { detail: darkMode }));
  }, [darkMode]);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/users/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete account");
      }
      // Clear all local data
      localStorage.clear();
      // Redirect to landing
      window.location.href = "/";
    } catch (error: any) {
      toast({ title: "Deletion failed", description: error.message || "Could not delete your account.", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        sex,
        age,
        height: height || undefined,
        weight: weight || undefined,
        category: userCategory,
        datingPreference,
        seeking: seeking || undefined,
        isActive: showOnMap,
        inactiveTimeout,
      });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      toast({ title: "Update failed", description: error?.message || "There was a problem saving your settings.", variant: "destructive" });
    } finally {
      onClose();
    }
  };

  const sectionDelay = (i: number) => ({ opacity: 0, y: 15, transition: { delay: i * 0.08 } });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-slate-700/40 text-white p-0 rounded-2xl">
        {/* ── SVG Noise ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-0" aria-hidden>
          <filter id="stNoise"><feTurbulence baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#stNoise)" />
        </svg>

        {/* ── Background Orbs ── */}
        <motion.div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none z-0"
          style={{ background: `radial-gradient(circle, ${c.accent}12, transparent 70%)`, filter: "blur(40px)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full pointer-events-none z-0"
          style={{ background: `radial-gradient(circle, ${c.accent}10, transparent 70%)`, filter: "blur(30px)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* ── Header ── */}
        <div className="relative z-10 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${c.accent}20, ${c.accent}08)`,
                border: `1px solid ${c.accent}30`,
                boxShadow: `0 0 16px ${c.accent}15`,
              }}
            >
              <Settings className={`w-5 h-5 ${c.text}`} />
            </div>
            <div>
              <h2
                className="text-lg font-black bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, #fff, ${c.accent})` }}
              >
                Settings
              </h2>
              <p className="text-[11px] text-slate-500">Manage preferences & visibility</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-6 space-y-5">
          {/* ═══ App Preferences ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-2.5"
          >
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Bell className="w-3 h-3" /> App Preferences
            </Label>

            {[
              { icon: Bell, label: "Push Notifications", sub: "Get alerts for bumps & messages", state: pushNotifs, toggle: () => setPushNotifs(!pushNotifs) },
              { icon: Vibrate, label: "Haptic Feedback", sub: "Vibrate on interactions", state: haptic, toggle: () => setHaptic(!haptic) },
              { icon: Moon, label: "Dark Mode", sub: "Always-on dark theme", state: darkMode, toggle: () => setDarkMode(!darkMode) },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
                style={{
                  background: "rgba(15,23,42,0.5)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(148,163,184,0.08)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.sub}</p>
                  </div>
                </div>
                <AnimatedToggle checked={item.state} onToggle={item.toggle} accent={c.accent} />
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ Visibility & Map ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2.5 border-t border-slate-800/60 pt-5"
          >
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> Visibility & Map
            </Label>

            {/* Show on Map toggle */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 }}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
              style={{
                background: showOnMap ? `${c.accent}10` : "rgba(15,23,42,0.5)",
                backdropFilter: "blur(8px)",
                border: showOnMap ? `1px solid ${c.accent}30` : "1px solid rgba(148,163,184,0.08)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MapPin className={`w-4 h-4 ${showOnMap ? c.text : 'text-slate-400'} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-slate-200">Show on Map</p>
                  <p className="text-[10px] text-slate-500">{showOnMap ? 'Others can see you nearby' : 'You are hidden from the map'}</p>
                </div>
              </div>
              <AnimatedToggle checked={showOnMap} onToggle={() => setShowOnMap(!showOnMap)} accent={c.accent} />
            </motion.div>

            {/* Map Style Picker */}
            <div
              className="rounded-xl px-4 py-4"
              style={{
                background: "rgba(15,23,42,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(148,163,184,0.08)",
              }}
            >
              <span className="text-sm font-semibold text-slate-300 block mb-3">Map Style</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'street' as const, icon: Map, label: 'Street', img: '/images/street_style.png' },
                  { key: 'satellite' as const, icon: Satellite, label: 'Satellite', img: '/images/satellite_style.png' },
                  { key: 'radar' as const, icon: Eye, label: 'Radar', img: '/images/radar_style.png' },
                  { key: 'heatmap' as const, icon: Flame, label: 'Heatmap', img: '/images/heatmap_style.png' },
                ].map((s) => (
                  <motion.button
                    key={s.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMapStyleSelect(s.key)}
                    className={`relative overflow-hidden rounded-xl h-24 transition-all duration-300 border-2 ${
                      mapStyle === s.key
                        ? `${c.border} shadow-lg`
                        : 'border-slate-700/50 hover:border-slate-500'
                    }`}
                    style={mapStyle === s.key ? { boxShadow: `0 0 20px ${c.glow}` } : {}}
                  >
                    <img src={s.img} alt={s.label} className="absolute inset-0 w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${mapStyle === s.key ? 'from-slate-900/90' : 'from-slate-900/80'} to-transparent`} />
                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 text-white">
                      <s.icon size={14} className={mapStyle === s.key ? c.text : 'text-slate-300'} />
                      <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Screen Timeout */}
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(15,23,42,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(148,163,184,0.08)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">Screen Timeout</p>
                  <p className="text-[10px] text-slate-500">Hide from map when app is backgrounded</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number" min={1} max={120} value={inactiveTimeout}
                  onChange={(e) => setInactiveTimeout(parseInt(e.target.value) || 30)}
                  className="w-20 bg-slate-800/60 border-slate-700/50 text-slate-200 h-9 rounded-lg text-center focus:border-blue-500/50 focus:ring-blue-500/20"
                  style={{ fontSize: "14px" }}
                />
                <span className="text-xs text-slate-500 font-medium">minutes</span>
              </div>
            </div>
          </motion.div>

          {/* ═══ Device Diagnostics ═══ */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onClose();
              setTimeout(() => { window.location.hash = ''; window.history.pushState({}, '', '/dev'); window.dispatchEvent(new PopStateEvent('popstate')); }, 100);
            }}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-colors group"
            style={{
              background: "rgba(15,23,42,0.5)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(148,163,184,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Device Diagnostics</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </motion.button>
        {/* ═══ Danger Zone: Delete Account ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2.5 border-t border-red-900/30 pt-5"
          >
            <Label className="text-[10px] font-bold text-red-400/70 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Danger Zone
            </Label>

            <div
              className="rounded-xl px-4 py-4"
              style={{
                background: "rgba(127,29,29,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-300">Delete Account</p>
                  <p className="text-[10px] text-red-400/60">Permanently remove your profile and data</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!showDeleteConfirm ? (
                  <motion.div
                    key="delete-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full h-10 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold text-xs tracking-wide transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete My Account
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="delete-confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-300 text-xs font-medium leading-relaxed">
                        This action is <span className="font-bold">irreversible</span>. Your profile, messages, and all data will be permanently removed.
                      </p>
                    </div>
                    <div>
                      <label className="text-red-400/80 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Type DELETE to confirm</label>
                      <Input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="DELETE"
                        className="bg-slate-900/80 border-red-500/30 text-red-300 h-10 rounded-lg text-center font-bold tracking-widest text-sm focus:border-red-500/60 focus:ring-red-500/20 placeholder:text-red-400/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                        variant="ghost"
                        className="flex-1 h-9 text-slate-400 text-xs hover:text-slate-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || isDeleting}
                        className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
                      >
                        {isDeleting ? (
                          <><span className="animate-spin mr-1.5">⏳</span> Deleting...</>
                        ) : "Confirm Delete"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Cancel / Save Buttons ── */}
        <div className="relative z-10 px-6 pb-6 pt-2 border-t border-slate-800/40">
          <div className="flex gap-3">
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                type="button" onClick={onClose}
                className="w-full h-12 rounded-xl font-bold text-sm tracking-wide text-slate-300 transition-all bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                type="button" onClick={handleSave}
                className="w-full h-12 rounded-xl font-bold text-sm tracking-wide text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`,
                  boxShadow: `0 4px 20px ${c.glow}`,
                }}
              >
                Save Settings
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
