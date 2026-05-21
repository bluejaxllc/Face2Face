import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Heart, Search, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function DatingMenu() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"viewing" | "seeking" | "offering" | "events" | null>((user?.datingMode as any) || null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"seeking" | "offering" | "events" | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: ""
  });

  const datingModes = [
    { id: "viewing", label: "Just Viewing", icon: Search, color: "text-slate-400" },
    { id: "seeking", label: "Seek a Date", icon: Heart, color: "text-rose-400" },
    { id: "offering", label: "Offer a Date", icon: Coffee, color: "text-amber-400" },
    { id: "events", label: "Find Events", icon: Calendar, color: "text-indigo-400" },
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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 bg-slate-900/95 backdrop-blur-xl border border-pink-500/20 rounded-3xl p-4 shadow-2xl shadow-pink-900/20 flex flex-col gap-2 w-64"
            >
              <h4 className="text-pink-400 font-bold text-center text-[10px] uppercase tracking-widest mb-2 font-heading">Dating Strategy</h4>
              {datingModes.map((m) => {
                const Icon = m.icon;
                return (
                  <Button
                    key={m.id}
                    variant={mode === m.id ? "default" : "ghost"}
                    className={`w-full justify-start h-12 rounded-2xl transition-all ${
                      mode === m.id
                        ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 border-none"
                        : "bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white"
                    }`}
                    onClick={() => handleModeSelect(m.id as any)}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${mode === m.id ? "text-white" : m.color}`} />
                    <span className="font-bold text-sm tracking-wide">{m.label}</span>
                  </Button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full h-12 bg-slate-900/90 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] border-2 border-pink-500/40 hover:scale-105 active:scale-95 transition-all w-52 flex items-center justify-between px-5 backdrop-blur-md"
        >
          <span className="font-black tracking-widest uppercase text-[10px] text-pink-400">
            {mode ? datingModes.find(m => m.id === mode)?.label : "Set Dating Mode"}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-pink-400" /> : <ChevronUp className="w-4 h-4 text-pink-400" />}
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-400">
              {modalType === 'events' ? 'Post a Dating Event' : 
               modalType === 'seeking' ? 'What are you looking for?' : 
               'Offer a Date'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {modalType === 'events' ? 'Create a local meetup or dating event for others to join.' : 
               modalType === 'seeking' ? 'Describe the kind of date or connection you are seeking right now.' : 
               'Describe the date experience you are offering to take someone on.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {modalType === 'events' && (
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Event Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Coffee & Chat at Starbucks" 
                  className="bg-slate-800 border-slate-700 text-white" 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Share some details..." 
                className="bg-slate-800 border-slate-700 text-white resize-none h-24" 
              />
            </div>
            {modalType === 'events' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-white">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-white">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input 
                    id="location" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. 123 Main St, Denver, CO" 
                    className="bg-slate-800 border-slate-700 text-white" 
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleModalSubmit} className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              {modalType === 'events' ? 'Create Event' : 'Post Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
