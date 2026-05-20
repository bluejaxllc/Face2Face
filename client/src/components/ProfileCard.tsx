import { useState } from "react";
import { triggerHeartbeatHaptic } from "@/services/haptics-service";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/distance";
import { X, Music, Palette, BookOpen, Heart, Sparkles, Send, ChevronDown, Ruler, Weight, Eye, UserPlus, Briefcase, Zap, Target, Linkedin, Smile, MessageSquare, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import DirectionalArrow from "./DirectionalArrow";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  sex: string;
  age: number;
  selfRating: number;
  isActive: boolean;
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  bio?: string | null;
  bumpMessage?: string | null;
  profilePhoto?: string | null;
  latitude?: number;
  longitude?: number;

  // New Category Fields
  jobTitle?: string | null;
  company?: string | null;
  industry?: string | null;
  skills?: string | null;
  networkingGoal?: string | null;
  linkedinUrl?: string | null;
  vibeStatus?: string | null;
  currentActivity?: string | null;
  icebreaker?: string | null;
  relationshipGoal?: string | null;
  loveLanguage?: string | null;
  mbti?: string | null;
  perfectDate?: string | null;
  isHiring?: boolean | null;
  hiringRoles?: string | null;
  businessPhone?: string | null;
  businessService?: string | null;
  businessNeed?: string | null;
  businessPartners?: string | null;
}

interface ProfileCardProps {
  user: User;
  onClose: () => void;
  onConnect: (message?: string) => void;
  distance: number | null;
  myLocation?: { latitude: number; longitude: number } | null;
}

export default function ProfileCard({ user, onClose, onConnect, distance, myLocation }: ProfileCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showBumpComposer, setShowBumpComposer] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [bumpMessage, setBumpMessage] = useState("");
  const [shareProfile, setShareProfile] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);

  // Check if we already bumped this person
  const { data: existingBumps = [] } = useQuery<any[]>({
    queryKey: ["/api/bumps", user.id],
    refetchOnWindowFocus: false,
  });

  const hasBumped = existingBumps.length > 0;
  const hasMutualBumps = existingBumps.length >= 2 ||
    existingBumps.some((b: any) => ['bumping_back', 'sender_revealed', 'receiver_revealed', 'revealed'].includes(b.status));
  const isRevealed = existingBumps.some((b: any) => b.status === 'revealed');
  const isPartialReveal = existingBumps.some((b: any) => ['sender_revealed', 'receiver_revealed'].includes(b.status));

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${(lastName || '')[0] || ''}`.toUpperCase();

  const sexIcon = user.sex === 'male'
    ? <svg width="16" height="16" viewBox="0 0 100 100"><defs><linearGradient id="pc-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs><polygon points="50,8 94,92 6,92" fill="url(#pc-blue-grad)" stroke="#2563eb" strokeWidth="6" strokeLinejoin="round" /></svg>
    : user.sex === 'female' 
      ? <svg width="16" height="16" viewBox="0 0 100 100"><defs><linearGradient id="pc-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#pc-pink-grad)" stroke="#db2777" strokeWidth="6" /></svg>
      : <Sparkles className="w-4 h-4 text-purple-400" />;

  // Step 1: User taps SEND BUMP → prepare message, show directional arrow
  const handleSendBump = () => {
    const finalMessage = shareProfile
      ? `${bumpMessage}\n\n— ${currentUser?.firstName || 'Someone'} wants to meet you`
      : bumpMessage || "👋 Bump!";
    setPendingMessage(finalMessage);
    setShowBumpComposer(false);
    setShowArrow(true);
  };

  // Step 2: Directional arrow gesture detected → actually send the bump
  const handleArrowComplete = async () => {
    setIsSending(true);
    try {
      await onConnect(pendingMessage);
    } finally {
      setIsSending(false);
      setShowArrow(false);
    }
  };

  // Step 3: Reveal profile (mutual opt-in)
  const handleReveal = async () => {
    const bump = existingBumps[0];
    if (!bump) return;
    setIsRevealing(true);
    try {
      const res = await apiRequest("PATCH", `/api/bumps/${bump.id}/reveal`, {});
      const data = await res.json();
      if (data.mutual) {
        triggerHeartbeatHaptic();
        toast({ title: "Profiles Revealed! 🥳", description: `You and ${user.firstName} can now see each other's full profiles.` });
      } else {
        toast({ title: "Reveal sent", description: `Waiting for ${user.firstName} to reveal theirs too.` });
      }
    } catch {
      toast({ title: "Failed", description: "Could not reveal profile", variant: "destructive" });
    } finally {
      setIsRevealing(false);
    }
  };

  // Info pills that are available
  const infoPills = [
    user.favoriteSong && { icon: <Music className="w-3.5 h-3.5 text-blue-400" />, label: "Song", value: user.favoriteSong },
    user.favoriteColor && { icon: <Palette className="w-3.5 h-3.5 text-pink-400" />, label: "Color", value: user.favoriteColor },
    user.fieldOfStudy && { icon: <BookOpen className="w-3.5 h-3.5 text-purple-400" />, label: "Study", value: user.fieldOfStudy },
    user.height && { icon: <Ruler className="w-3.5 h-3.5 text-cyan-400" />, label: "Height", value: user.height },
    user.weight && { icon: <Weight className="w-3.5 h-3.5 text-orange-400" />, label: "Weight", value: user.weight },
  ].filter(Boolean) as { icon: JSX.Element; label: string; value: string }[];

  return (
    <>
      <Card className={`fixed left-1/2 transform -translate-x-1/2 bottom-20 w-11/12 max-w-sm border-slate-700/50 rounded-3xl shadow-[0_-8px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[2000] p-0 max-h-[75vh] overflow-y-auto transition-all duration-500 ${user.category === 'business' ? 'theme-business border-blue-500/30 bg-mesh-business' :
          user.category === 'friendships' ? 'theme-friends border-emerald-500/30 bg-mesh-friends' :
            user.category === 'dating' ? 'theme-dating border-pink-500/30 bg-mesh-dating' : 'bg-slate-900/95'
        }`}>
        <div className="relative pt-10 pb-6 px-6 flex flex-col items-center">
          {/* Header gradient overlay */}
          <div className={`absolute top-0 left-0 w-full h-40 transition-all duration-700 opacity-60 ${user.category === 'business'
              ? 'bg-gradient-to-b from-blue-600/40 via-indigo-600/10 to-transparent'
              : user.category === 'friendships'
                ? 'bg-gradient-to-b from-emerald-500/40 via-teal-500/10 to-transparent'
                : user.category === 'dating'
                  ? 'bg-gradient-to-b from-pink-500/40 via-rose-500/10 to-transparent'
                  : 'bg-gradient-to-b from-slate-700/20 to-transparent'
            }`} />


          {/* Close */}
          <button
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800/50 z-20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Avatar */}
          <div className={`p-[3px] rounded-full z-10 transition-all duration-500 ${user.category === 'business'
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : user.category === 'friendships'
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : user.category === 'dating'
                  ? 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                  : 'bg-slate-700'
            }`}>
            <Avatar className="h-28 w-28 border-2 border-slate-900 bg-slate-800">
              {/* Per spec: profile photo only visible after mutual Reveal */}
              {(isRevealed || user.category === 'business') && user.profilePhoto && (
                <AvatarImage src={user.profilePhoto} alt={`${user.firstName}'s photo`} />
              )}
              <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name + Age + Gender */}
          <div className="text-center mt-3 z-10 w-full">
            <h3 className="text-xl font-black text-white tracking-tight flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                {user.category === 'business' ? (user.company || 'Business Name') : `${user.firstName}, ${user.age || 20}`}
                <span className="inline-flex">{sexIcon}</span>
              </div>
              {user.category === 'business' && (
                <span className="text-xs text-blue-400/80 font-bold uppercase tracking-wider">{user.company || 'Business'} • Professional</span>
              )}
            </h3>

            {/* Distance row (Rating removed) */}
            <div className="flex items-center justify-center mt-2.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] bg-slate-800/40 px-3 py-1 rounded-full border border-white/5">
                {distance ? formatDistance(distance) : "Nearby"}
              </span>
            </div>

            {/* Category Marker */}
            <div className="flex justify-center mt-3">
              <Badge className={`px-4 py-1 text-[11px] uppercase font-black tracking-[0.12em] border transition-all duration-700 ${user.category === 'business' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                  user.category === 'friendships' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                    user.category === 'dating' ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-slate-800 border-slate-700'
                }`}>
                {user.category === 'business' ? 'Pro-X Professional' : user.category === 'friendships' ? 'VibeCheck Friend' : 'Aura Dating'}
              </Badge>
            </div>


            {/* Category Details */}
            {user.category === 'business' && (
              <div className="mt-5 w-full space-y-3">
                <div className="glass-card pro-x-card p-5 border-blue-500/20 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-blue-500/5 group-hover:text-blue-500/10 transition-colors">
                    <Briefcase className="w-20 h-20 rotate-12" />
                  </div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Service</span>
                  </div>
                  <p className="text-base text-white font-black relative z-10">{user.jobTitle || "Professional Services"}</p>
                  <p className="text-xs text-slate-400 relative z-10 mb-3 italic">"{user.industry || "Active in Sector"}"</p>
                  
                  {/* Hiring Badge inside Card */}
                  {user.isHiring && (
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-emerald-500/30 animate-pulse mb-3">
                      <Flame className="w-3 h-3" /> Hiring Now
                    </div>
                  )}

                  {user.networkingGoal && (
                    <div className="pt-3 border-t border-blue-500/10 flex items-start gap-2 relative z-10">
                      <Target className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-300 leading-snug"><span className="text-blue-400 font-bold uppercase text-[9px] mr-1">Direct Goal:</span> {user.networkingGoal}</p>
                    </div>
                  )}
                </div>

                {user.skills && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {user.skills.split(',').slice(0, 4).map((skill, i) => (
                      <span key={i} className="text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-blue-300 uppercase">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user.category === 'friendships' && (
              <div className="mt-4 w-full space-y-3">
                <div className="glass-card vibecheck-card p-4 border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Smile className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Vibe</span>
                  </div>
                  <p className="text-sm text-white font-bold flex items-center gap-2">
                    {user.vibeStatus === 'chill' ? '🍃 Chill Mode' :
                      user.vibeStatus === 'energetic' ? '🔥 High Energy' :
                        user.vibeStatus === 'productive' ? '💻 Productive' : '😊 Friendly'}
                  </p>
                  {user.currentActivity && (
                    <p className="text-[11px] text-slate-400 mt-1">{user.currentActivity}</p>
                  )}
                </div>
                {user.icebreaker && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Icebreaker</p>
                    <p className="text-xs text-slate-200 italic">"{user.icebreaker}"</p>
                  </div>
                )}
              </div>
            )}

            {user.category === 'dating' && (
              <div className="mt-4 w-full space-y-3">
                <div className="glass-card aura-card p-4 border-pink-500/10 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aura Stats</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black">Goal</p>
                      <p className="text-xs text-white font-bold">{user.relationshipGoal || "Casual"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black">MBTI</p>
                      <p className="text-xs text-white font-bold">{user.mbti || "Unknown"}</p>
                    </div>
                  </div>
                </div>
                {user.perfectDate && (
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-pink-500/20 shadow-inner">
                    <p className="text-[10px] text-pink-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Perfect Date
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed truncate">{user.perfectDate}</p>
                  </div>
                )}
              </div>
            )}

            {/* Seeking tags */}
            {user.seeking && (
              <div className="mt-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Seeking</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {user.seeking.split(",").map((item, i) => (
                    <span key={i} className="text-[11px] bg-indigo-950/50 border border-indigo-800/40 rounded-full px-2.5 py-0.5 text-indigo-300 font-medium">
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bump greeting message (spec: "a text message from the user") */}
            {user.bumpMessage && (
              <div className="mt-3 bg-fuchsia-950/20 border border-fuchsia-700/20 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-fuchsia-400/70 uppercase tracking-wider font-bold mb-1">Bump Greeting</p>
                <p className="text-xs text-slate-300 italic leading-relaxed">"{user.bumpMessage}"</p>
              </div>
            )}

            {/* Interests (if mutual / revealed) */}
            {isRevealed && user.interests && (
              <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-xl">
                <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Mutual — Full Profile</span>
                </div>
                <p className="text-xs text-slate-300">{user.interests}</p>
                {user.bio && <p className="text-xs text-slate-400 mt-1">{user.bio}</p>}
              </div>
            )}

            {/* ═══════ BUMP BUTTON ═══════ */}
            <AnimatePresence mode="wait">
              {!showBumpComposer ? (
                <motion.div
                  key="bump-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5"
                >
                  <Button
                    onClick={() => setShowBumpComposer(true)}
                    disabled={hasBumped && !hasMutualBumps}
                    className={`w-full h-14 rounded-xl font-black text-base tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${hasBumped
                      ? 'bg-slate-700 text-slate-400 shadow-none cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 shadow-fuchsia-500/25 border border-fuchsia-400/30 text-white'
                      }`}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {hasBumped ? "BUMPED ✓" : "BUMP"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="bump-composer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4 w-full"
                >
                  <div className="bg-slate-800/60 border border-fuchsia-500/30 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Send a Bump
                      </span>
                      <button
                        onClick={() => setShowBumpComposer(false)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Message input */}
                    <textarea
                      value={bumpMessage}
                      onChange={(e) => setBumpMessage(e.target.value)}
                      placeholder="Say something..."
                      maxLength={200}
                      rows={2}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/25"
                    />

                    {/* Share profile toggle */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[11px] text-slate-400 font-medium">Share your profile with this bump</span>
                      <div
                        onClick={() => setShareProfile(!shareProfile)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${shareProfile ? 'bg-fuchsia-500' : 'bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${shareProfile ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>

                    {/* Send */}
                    <Button
                      onClick={handleSendBump}
                      disabled={isSending}
                      className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 shadow-lg shadow-fuchsia-500/20 border border-fuchsia-400/30 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSending ? "SENDING..." : "SEND BUMP"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════ REVEAL / ADD CONTACT ═══════ */}
            {hasMutualBumps && !isRevealed && (
              <div className="mt-3">
                <Button
                  onClick={handleReveal}
                  disabled={isRevealing}
                  className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 border border-emerald-400/30 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isPartialReveal ? "WAITING FOR REVEAL..." : "REVEAL PROFILE"}
                </Button>
              </div>
            )}
            {isRevealed && (
              <div className="mt-3">
                <Button
                  className="w-full h-12 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20 border border-emerald-400/30 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> ADD CONTACT
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ═══════ Directional Arrow Overlay ═══════ */}
      {
        showArrow && myLocation && (
          <DirectionalArrow
            targetLat={user.latitude ?? 0}
            targetLng={user.longitude ?? 0}
            myLat={myLocation.latitude}
            myLng={myLocation.longitude}
            targetName={user.firstName}
            onBumpComplete={handleArrowComplete}
            onCancel={() => setShowArrow(false)}
          />
        )
      }
    </>
  );
}
