import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Heart, Search, Calendar, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Category = "dating" | "friends" | "business";

const catAccents: Record<Category, { accent: string; glow: string; text: string; gradient: string }> = {
  dating:   { accent: "#f43f5e", glow: "rgba(244,63,94,0.3)", text: "text-rose-400", gradient: "from-pink-500 to-rose-600" },
  friends:  { accent: "#10b981", glow: "rgba(16,185,129,0.3)", text: "text-emerald-400", gradient: "from-emerald-500 to-teal-600" },
  business: { accent: "#6366f1", glow: "rgba(99,102,241,0.3)", text: "text-indigo-400", gradient: "from-indigo-500 to-blue-600" },
};

export default function DatingMenu() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"viewing" | "seeking" | "offering" | "events" | null>((user?.datingMode as any) || null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"seeking" | "offering" | "events" | null>(null);

  const [category, setCategory] = useState<Category>(() =>
    (localStorage.getItem("f2f_activeCategory") as Category) || "dating"
  );
  const c = catAccents[category];

  useEffect(() => {
    const sync = () => {
      const cat = localStorage.getItem("f2f_activeCategory") as Category;
      if (cat) setCategory(cat);
    };
    window.addEventListener("f2f:categoryChange", sync);
    return () => window.removeEventListener("f2f:categoryChange", sync);
  }, []);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: ""
  });

  const datingModes = [
    { id: "viewing", label: "Just Viewing", icon: Search, color: "text-slate-400", activeColor: "text-white" },
    { id: "seeking", label: "Seek a Date", icon: Heart, color: "text-rose-400", activeColor: "text-white" },
    { id: "offering", label: "Offer a Date", icon: Coffee, color: "text-amber-400", activeColor: "text-white" },
    { id: "events", label: "Find Events", icon: Calendar, color: "text-indigo-400", activeColor: "text-white" },
  ];

  const handleModeSelect = async (newMode: typeof mode) => {
    setMode(newMode);
    setIsOpen(false);
    
    if (newMode !== "viewing" && newMode !== null) {
      setModalType(newMode);
      setModalOpen(true);
    }
    
    if (updateProfile) {
      try {
        await updateProfile({ datingMode: newMode } as any);
      } catch (err) {
        console.error("Failed to update dating mode", err);
      }
    }
  };

  const handleModalSubmit = async () => {
    try {
      const payload = {
        type: modalType,
        title: formData.title,
        description: formData.description,
        date: formData.date ? `${formData.date}T${formData.time || '00:00'}` : null,
        location: formData.location
      };
      
      const res = await fetch("/api/dating-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to post event");
      
      setModalOpen(false);
      setFormData({ title: "", description: "", date: "", time: "", location: "" });
      toast({
        title: "Successfully Posted!",
        description: `Your ${modalType === 'events' ? 'event' : 'dating request'} has been posted to the network.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem posting your request.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="mb-4 relative overflow-hidden rounded-3xl w-64"
            >
              {/* Glassmorphic container */}
              <div
                className="relative p-4 flex flex-col gap-2"
                style={{
                  background: "rgba(2,6,23,0.95)",
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${c.accent}25`,
                  borderRadius: "24px",
                  boxShadow: `0 20px 60px ${c.glow}, 0 0 0 1px rgba(148,163,184,0.05)`,
                }}
              >
                {/* SVG noise */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" aria-hidden>
                  <filter id="dmNoise"><feTurbulence baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
                  <rect width="100%" height="100%" filter="url(#dmNoise)" />
                </svg>

                {/* Floating orb */}
                <motion.div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${c.accent}15, transparent 70%)`, filter: "blur(20px)" }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="flex items-center justify-center gap-1.5 mb-2 relative z-10">
                  <Sparkles className={`w-3 h-3 ${c.text}`} />
                  <h4
                    className="font-black text-center text-[10px] uppercase tracking-[0.2em] bg-clip-text text-transparent"
                    style={{ backgroundImage: `linear-gradient(135deg, #fff, ${c.accent})` }}
                  >
                    Dating Strategy
                  </h4>
                </div>

                {datingModes.map((m, i) => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start h-12 rounded-2xl transition-all relative overflow-hidden ${
                          isActive
                            ? `bg-gradient-to-r ${c.gradient} text-white shadow-lg border-none`
                            : "bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 text-slate-300 hover:text-white"
                        }`}
                        style={isActive ? { boxShadow: `0 8px 24px ${c.glow}` } : {}}
                        onClick={() => handleModeSelect(m.id as any)}
                      >
                        <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-white" : m.color}`} />
                        <span className="font-bold text-sm tracking-wide">{m.label}</span>
                        {isActive && (
                          <motion.div
                            className="absolute right-3 w-2 h-2 rounded-full bg-white"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full h-12 text-white w-52 flex items-center justify-between px-5 transition-all"
            style={{
              background: "rgba(2,6,23,0.92)",
              backdropFilter: "blur(16px)",
              border: `2px solid ${c.accent}40`,
              boxShadow: `0 0 24px ${c.glow}`,
            }}
          >
            <span
              className="font-black tracking-widest uppercase text-[10px] bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${c.accent}, #fff)` }}
            >
              {mode ? datingModes.find(m => m.id === mode)?.label : "Set Dating Mode"}
            </span>
            {isOpen ? <ChevronDown className={`w-4 h-4 ${c.text}`} /> : <ChevronUp className={`w-4 h-4 ${c.text}`} />}
          </Button>
        </motion.div>
      </div>

      {/* ─── Post Modal ───────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-md p-0 rounded-2xl overflow-hidden border-0"
          style={{
            background: "rgba(2,6,23,0.97)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${c.accent}20`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${c.glow}`,
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle
              className="text-lg font-black bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, #fff, ${c.accent})` }}
            >
              {modalType === 'events' ? 'Post a Dating Event' : 
               modalType === 'seeking' ? 'What are you looking for?' : 
               'Offer a Date'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {modalType === 'events' ? 'Create a local meetup or dating event for others to join.' : 
               modalType === 'seeking' ? 'Describe the kind of date or connection you are seeking right now.' : 
               'Describe the date experience you are offering to take someone on.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-6 py-4">
            {modalType === 'events' && (
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Event Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Coffee & Chat at Starbucks" 
                  className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl h-11 focus:ring-1"
                  style={{ borderColor: `${c.accent}20` }}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Description</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Share some details..." 
                className="bg-slate-800/50 border-slate-700/50 text-white resize-none h-24 rounded-xl focus:ring-1" 
                style={{ borderColor: `${c.accent}20` }}
              />
            </div>
            {modalType === 'events' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl h-11" 
                      style={{ borderColor: `${c.accent}20` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl h-11" 
                      style={{ borderColor: `${c.accent}20` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Location</Label>
                  <Input 
                    id="location" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. 123 Main St, Denver, CO" 
                    className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl h-11" 
                    style={{ borderColor: `${c.accent}20` }}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-6 pb-6 pt-2 gap-2">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </Button>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                onClick={handleModalSubmit}
                className={`bg-gradient-to-r ${c.gradient} text-white font-bold rounded-xl px-6`}
                style={{ boxShadow: `0 4px 16px ${c.glow}` }}
              >
                {modalType === 'events' ? 'Create Event' : 'Post Status'}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
