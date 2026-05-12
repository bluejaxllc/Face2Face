import { useState } from "react";
import { triggerHeartbeatHaptic } from "@/services/haptics-service";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/distance";
import { X, Music, Palette, BookOpen, Heart, Sparkles, Send, ChevronDown, Ruler, Weight, Eye, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  gender: string;
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

  const genderIcon = user.gender === 'male'
    ? <svg width="16" height="16" viewBox="0 0 100 100"><defs><linearGradient id="pc-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs><polygon points="50,8 94,92 6,92" fill="url(#pc-blue-grad)" stroke="#2563eb" strokeWidth="6" strokeLinejoin="round" /></svg>
    : <svg width="16" height="16" viewBox="0 0 100 100"><defs><linearGradient id="pc-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#pc-pink-grad)" stroke="#db2777" strokeWidth="6" /></svg>;

  const ratingStars = Math.min(5, Math.round(user.selfRating / 2));

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
        toast({ title: "Profiles Revealed! \ud83c\udf89", description: `You and ${user.firstName} can now see each other's full profiles.` });
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
      <Card className="fixed left-1/2 transform -translate-x-1/2 bottom-20 w-11/12 max-w-sm bg-slate-900/95  border border-slate-700/50 rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] overflow-hidden z-[2000] p-0 max-h-[70vh] overflow-y-auto">
        <div className="relative pt-8 pb-5 px-5 flex flex-col items-center">
          {/* Header gradient */}
          <div className={`absolute top-0 left-0 w-full h-28 ${user.gender === 'male'
            ? 'bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent'
            : 'bg-gradient-to-br from-pink-500/20 via-rose-500/10 to-transparent'
            }`} />

          {/* Close */}
          <button
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800/50 z-20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Avatar */}
          <div className={`p-[3px] rounded-full z-10 ${user.gender === 'male'
            ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
            : 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
            }`}>
            <Avatar className="h-20 w-20 border-2 border-slate-900 bg-slate-800">
              {/* Per spec: profile photo only visible after mutual Reveal */}
              {isRevealed && user.profilePhoto && (
                <AvatarImage src={user.profilePhoto} alt={`${user.firstName}'s photo`} />
              )}
              <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name + Age + Gender */}
          <div className="text-center mt-3 z-10 w-full">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              {user.firstName}, <span className="text-pink-400">{user.age || 20}</span>
              <span className="inline-flex">{genderIcon}</span>
            </h3>

            {/* Rating + Distance row */}
            <div className="flex items-center justify-center mt-1.5 gap-2">
              <span className="inline-flex items-center bg-slate-800/60 border border-slate-700/50 rounded-full px-2.5 py-0.5">
                <span className="text-[10px] font-bold text-slate-500 mr-1">RATING</span>
                <span className="text-xs text-amber-400">{'⭐'.repeat(ratingStars)}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {distance ? formatDistance(distance) : "Nearby"}
              </span>
            </div>

            {/* Connect message / bio */}
            {user.bio && (
              <div className="mt-3 bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-2.5">
                <p className="text-xs text-slate-300 italic leading-relaxed">"{user.bio}"</p>
              </div>
            )}

            {/* Info pills grid */}
            {infoPills.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                {infoPills.map((pill, i) => (
                  <div
                    key={i}
                    className={`bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/30 ${i === infoPills.length - 1 && infoPills.length % 2 !== 0 ? 'col-span-2' : ''
                      }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {pill.icon}
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{pill.label}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold truncate">{pill.value}</p>
                  </div>
                ))}
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
