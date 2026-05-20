import { useState, useRef, useEffect } from "react";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, Camera, LogOut, Star, Heart, MapPin, Music, Palette, BookOpen, MessageCircle, Ruler, Weight, Search, Users, Briefcase, Linkedin, Smile, Sparkles, Target, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};


const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.string().default("other"),
  age: z.coerce.number().min(18).max(99).default(18),
  height: z.string().optional(),
  weight: z.string().optional(),
  selfRating: z.coerce.number().min(1).max(10).default(5),
  category: z.string().default("friendships"),
  bio: z.string().max(250, "Bio must be less than 250 characters").optional(),
  datingPreference: z.string().default("all"),
  seeking: z.string().optional(),
  favoriteColor: z.string().optional(),
  favoriteSong: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  interests: z.string().optional(),
  isActive: z.boolean().default(true),
  inactiveTimeout: z.coerce.number().min(5).max(120).default(30),

  // Business
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  skills: z.string().optional(),
  networkingGoal: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  professionalMotto: z.string().optional(),

  // Friends
  vibeStatus: z.string().optional(),
  currentActivity: z.string().optional(),
  icebreaker: z.string().optional(),
  weekendVibe: z.string().optional(),
  socialBattery: z.string().optional(),

  // Dating
  relationshipGoal: z.string().optional(),
  loveLanguage: z.string().optional(),
  mbti: z.string().optional(),
  perfectDate: z.string().optional(),
  lifestyleCoffee: z.string().optional(),
  lifestyleAlcohol: z.string().optional(),
  lifestyleSchedule: z.string().optional(),
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const profileScroll = useScrollSave("f2f_scroll_profile");
  const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 2MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateProfile({ profilePhoto: base64 });
        toast({ title: "Photo updated", description: "Your profile photo has been saved." });
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast({ title: "Upload failed", description: "Could not read the image file.", variant: "destructive" });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload failed", description: "There was a problem uploading your photo.", variant: "destructive" });
      setIsUploading(false);
    }
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      category: "friendships",
    },
  });

  // Sync form with user data when it loads
  useEffect(() => {
    if (user && !isEditing) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        gender: user.gender || "other",
        age: user.age || 18,
        height: user.height || "",
        weight: user.weight || "",
        selfRating: user.selfRating || 5,
        category: user.category || "friendships",
        bio: user.bio || "",
        datingPreference: user.datingPreference || "all",
        seeking: user.seeking || "",
        favoriteColor: user.favoriteColor || "",
        favoriteSong: user.favoriteSong || "",
        fieldOfStudy: user.fieldOfStudy || "",
        interests: user.interests || "",
        isActive: user.isActive ?? true,
        inactiveTimeout: user.inactiveTimeout || 30,
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        industry: user.industry || "",
        skills: user.skills || "",
        networkingGoal: user.networkingGoal || "networking",
        linkedinUrl: user.linkedinUrl || "",
        portfolioUrl: user.portfolioUrl || "",
        professionalMotto: user.professionalMotto || "",
        vibeStatus: user.vibeStatus || "chill",
        currentActivity: user.currentActivity || "",
        icebreaker: user.icebreaker || "",
        weekendVibe: user.weekendVibe || "relaxing",
        socialBattery: user.socialBattery || "ambivert",
        relationshipGoal: user.relationshipGoal || "chatting",
        loveLanguage: user.loveLanguage || "",
        mbti: user.mbti || "",
        perfectDate: user.perfectDate || "",
        lifestyleCoffee: user.lifestyleCoffee || "none",
        lifestyleAlcohol: user.lifestyleAlcohol || "never",
        lifestyleSchedule: user.lifestyleSchedule || "flexible",
      });
    }
  }, [user, form, isEditing]);

  const selectedCategory = form.watch("category");


  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({ ...values, profileCompleted: true });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your profile has been successfully updated." });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Update failed", description: "There was a problem updating your profile.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error("Logout error:", error); }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U";
    return `${firstName[0]}${lastName[0]}`;
  };

  const { isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading || !user) {
    return (
      <PageTransition className="h-screen page-dark">
        <Header />
        <div className="h-full flex flex-col items-center justify-center pb-20">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full border-2 border-t-blue-500 border-r-emerald-500 border-b-pink-500 border-l-purple-500 animate-[spin_3s_linear_infinite] shadow-[0_0_30px_rgba(59,130,246,0.3)]`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-white animate-spin" />
              </div>
            </div>
          </div>
          <p className="mt-8 text-xl font-black text-white tracking-[0.2em] animate-pulse uppercase">Syncing Profile</p>
          <p className="mt-2 text-slate-500 text-xs font-medium tracking-widest uppercase">Connecting to Face 2 Face</p>
        </div>
      </PageTransition>
    );
  }

  const ratingStars = Math.min(5, Math.round((user?.selfRating || 5) / 2));

  const genderIcon = user?.gender === 'male'
    ? <svg width="20" height="20" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"><defs><linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs><polygon points="50,8 94,92 6,92" fill="url(#blue-grad)" stroke="#2563eb" strokeWidth="6" strokeLinejoin="round" /></svg>
    : user?.gender === 'female'
      ? <svg width="20" height="20" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"><defs><linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#pink-grad)" stroke="#db2777" strokeWidth="6" /></svg>
      : <Sparkles className="w-5 h-5 text-purple-400" />;

  // Determine which category to use for styling (reactive to form and user state)
  const activeCategory = isEditing 
    ? (selectedCategory === 'friendships' ? 'friends' : selectedCategory)
    : (user.category === 'friendships' ? 'friends' : user.category);

  return (
    <PageTransition className={`h-screen ${
      activeCategory === 'business' ? 'bg-mesh-business' : 
      activeCategory === 'dating' ? 'bg-mesh-dating' : 
      'bg-mesh-friends'
    }`}>
      <Header />

      <motion.div
        ref={profileScroll.ref}
        onScroll={profileScroll.onScroll}
        className="fixed left-0 right-0 overflow-y-auto pb-32 md:pb-6 page-enter"
        style={{ top: "40px", bottom: "64px" }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Profile hero section */}
        <motion.div variants={itemVariants} className="profile-hero px-4 pt-8 pb-6 text-center relative">
          <div className="relative z-10">
            <div className="relative inline-block">
              <div className="avatar-ring shadow-[0_0_30px_rgba(59,130,246,0.5)] rounded-full">
                <Avatar className="h-24 w-24 border-2 border-white/10 ring-4 ring-slate-900 shadow-2xl">
                  {user.profilePhoto && (
                    <AvatarImage src={user.profilePhoto} alt={`${user.firstName}'s photo`} />
                  )}
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-heading">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {/* Online status indicator */}
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-slate-950 rounded-full shadow-lg z-20" />
          </div>

          <div className="mt-6 text-center z-10 w-full">
            <motion.h2
              layoutId="profile-name"
              className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3 drop-shadow-sm"
            >
              {user.firstName}
              <span className="text-pink-500 font-bold opacity-80">{user.age || 18}</span>
              <span className="inline-block transform hover:scale-110 transition-transform">{genderIcon}</span>
            </motion.h2>

            <div className="flex items-center justify-center mt-3 gap-3">
              <span className="premium-tag bg-slate-800/80 border-slate-700/50 flex items-center gap-1.5 px-3 py-1">
                <span className="text-[9px] text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">{'★'.repeat(ratingStars)}</span>
              </span>
              <Badge className={`px-4 py-1 text-[11px] font-black tracking-[0.15em] border transition-all duration-700 ${
                  activeCategory === 'business' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                  activeCategory === 'friends' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                  activeCategory === 'dating' ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.2)]' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                {activeCategory === 'business' ? 'PRO-X' : activeCategory === 'friends' ? 'VIBECHECK' : activeCategory === 'dating' ? 'AURA' : 'SELECT MODE'}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={itemVariants} className="px-4 -mt-2 relative z-20">
          <div className="grid grid-cols-3 gap-3">
            <div className={`stat-card hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cursor-pointer bg-slate-900/40 border rounded-2xl py-3 px-2 text-center text-white relative overflow-hidden group ${
              activeCategory === 'business' ? 'border-blue-500/30' : 
              activeCategory === 'dating' ? 'border-pink-500/30' : 
              'border-emerald-500/30'
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${
                activeCategory === 'business' ? 'from-blue-500/10' : 
                activeCategory === 'dating' ? 'from-pink-500/10' : 
                'from-emerald-500/10'
              }`} />
              <Star className={`w-5 h-5 mx-auto mb-1 drop-shadow-md transition-colors ${
                activeCategory === 'business' ? 'text-blue-400' : 
                activeCategory === 'dating' ? 'text-pink-400' : 
                'text-emerald-400'
              }`} />
              <p className={`text-lg font-bold font-heading ${
                activeCategory === 'business' ? 'text-blue-300' : 
                activeCategory === 'dating' ? 'text-pink-300' : 
                'text-emerald-300'
              }`}>{'⭐'.repeat(Math.min(5, Math.round((user.selfRating || 5) / 2)))}</p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Rating</p>
            </div>
            
            <div className={`stat-card hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cursor-pointer bg-slate-900/40 border rounded-2xl py-3 px-2 text-center text-white relative overflow-hidden group ${
              activeCategory === 'dating' ? 'border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 
              'border-slate-700/50'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1 drop-shadow-md" />
              <p className="text-sm font-black text-white font-heading uppercase tracking-tighter truncate">
                {user.datingPreference === "all" ? "Open" : user.datingPreference}
              </p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Looking for</p>
            </div>

            <div className={`stat-card hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cursor-pointer bg-slate-900/40 border rounded-2xl py-3 px-2 text-center text-white relative overflow-hidden group ${
              activeCategory === 'friends' ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
              'border-slate-700/50'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-1 drop-shadow-md" />
              <p className="text-xl font-bold text-white font-heading">{user.inactiveTimeout || 30}m</p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Timeout</p>
            </div>
          </div>
        </motion.div>

        {/* Physical stats row */}
        {(user.height || user.weight) && (
          <motion.div variants={itemVariants} className="px-4 mt-3">
            <div className="flex justify-center gap-3">
              {user.height && (
                <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full px-3 py-1.5">
                  <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-sm text-slate-200 font-medium">{user.height}</span>
                </div>
              )}
              {user.weight && (
                <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full px-3 py-1.5">
                  <Weight className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm text-slate-200 font-medium">{user.weight}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Seeking tags */}
        {user.seeking && !isEditing && (
          <motion.div variants={itemVariants} className="px-4 mt-3">
            <div className="flex justify-center flex-wrap gap-1.5">
              <Search className="w-3.5 h-3.5 text-pink-400 mt-0.5" />
              {user.seeking.split(",").map((item: string, i: number) => (
                <span key={i} className="text-xs bg-pink-950/60 border border-pink-800/40 rounded-full px-2.5 py-1 text-pink-300 font-medium">
                  {item.trim()}
                </span>
              ))}
            </div>
          </motion.div>
        )}        <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
          {/* Category-Specific View Mode */}
          {!isEditing && (
            <motion.div variants={itemVariants} className="space-y-4">
              {activeCategory === "business" && (
                <div className="glass-card business-card border-blue-500/10 hover:border-blue-500/30 transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Briefcase className="w-24 h-24" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white font-heading">Pro-X Business</h3>
                      <Badge className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm">Business Mode</Badge>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 shadow-inner group-hover:bg-blue-500/10 transition-all duration-500">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-lg">
                          <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Industry & Role</p>
                          <p className="text-base text-slate-100 font-bold leading-tight mt-0.5">
                            {user.jobTitle || "Business Professional"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {user.company ? `@ ${user.company}` : "Independent"} · {user.industry || "Global Market"}
                          </p>
                        </div>
                      </div>

                      {user.professionalMotto && (
                        <div className="relative pl-4 border-l-2 border-blue-500/30 py-1">
                          <p className="text-sm text-blue-100 italic leading-relaxed">"{user.professionalMotto}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        {user.skills && (
                          <div className="flex flex-wrap gap-1.5">
                            {user.skills.split(",").map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-800/80 border border-blue-500/20 rounded-md text-blue-200 text-[10px] font-semibold uppercase tracking-wider">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        {user.linkedinUrl && (
                          <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-blue-600/10 border border-blue-600/20 text-xs text-blue-300 hover:bg-blue-600/20 transition-all">
                            <Linkedin className="w-4 h-4" />
                            Professional LinkedIn
                          </a>
                        )}
                        {user.portfolioUrl && (
                          <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 hover:bg-slate-700/50 transition-all">
                            <ExternalLink className="w-4 h-4" />
                            Portfolio / Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "friends" && (
                <div className="glass-card vibecheck-card p-6 border-emerald-500/10 hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                  <div className="absolute top-1 right-3 text-emerald-500/10 animate-floating pointer-events-none">
                    <Smile className="w-12 h-12" />
                  </div>

                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Smile className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-lg font-bold text-white font-heading">VibeCheck Friends</h3>
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm">Friends Mode</Badge>
                  </div>

                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 vibe-pulse">
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 text-center">Current Mode</p>
                      <p className="text-xl text-white font-heading text-center flex items-center justify-center gap-2 capitalize">
                        {user.vibeStatus === "chill" ? "🍃 Chill & Relaxed" :
                         user.vibeStatus === "energetic" ? "🔥 Energetic & Active" :
                         user.vibeStatus === "productive" ? "💻 Productive & Focused" :
                         user.vibeStatus === "adventurous" ? "🎒 Adventurous" : "😊 Friendly"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-900/40 border border-emerald-500/20 rounded-xl text-center">
                        <p className="text-[10px] text-emerald-400/80 font-bold uppercase mb-1">Weekend Vibe</p>
                        <p className="text-xs text-slate-100 font-semibold capitalize font-heading">
                          {user.weekendVibe || "TBD"}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900/40 border border-emerald-500/20 rounded-xl text-center">
                        <p className="text-[10px] text-emerald-400/80 font-bold uppercase mb-1">Social Battery</p>
                        <p className="text-xs text-slate-100 font-semibold capitalize font-heading">
                          {user.socialBattery || "Unknown"}
                        </p>
                      </div>
                    </div>

                    {user.currentActivity && (
                      <div className="glass-card-inner bg-emerald-500/5 p-4 border-emerald-500/20">
                        <p className="text-[10px] text-slate-400 uppercase font-black mb-2 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-emerald-500" />
                          Live Status
                        </p>
                        <p className="text-sm text-slate-100">{user.currentActivity}</p>
                      </div>
                    )}

                    {user.icebreaker && (
                      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-4 rounded-xl border border-emerald-500/20 shadow-lg">
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">Icebreaker</p>
                        <p className="text-slate-200 italic font-medium leading-relaxed">"{user.icebreaker}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeCategory === "dating" && (
                <div className="glass-card aura-card p-6 border-pink-500/10 hover:border-pink-500/30 transition-colors relative overflow-hidden group">
                  <div className="absolute top-1 right-3 text-pink-500/10 animate-floating pointer-events-none">
                    <Heart className="w-12 h-12" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <Heart className="w-5 h-5 text-pink-400 group-hover:scale-125 transition-transform duration-500" />
                    <h3 className="text-lg font-bold text-white font-heading">Aura Dating</h3>
                    <Badge className="ml-auto bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-sm">Dating Mode</Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="stat-box bg-pink-500/5 p-4 rounded-2xl border border-pink-500/10 text-center">
                        <p className="text-[10px] text-pink-400 font-black uppercase mb-1 tracking-widest">Goal</p>
                        <p className="text-sm text-white font-bold leading-tight font-heading">
                          {user.relationshipGoal === "long-term" ? "💍 Long-term" :
                           user.relationshipGoal === "short-term" ? "🥂 Short-term Fun" :
                           user.relationshipGoal === "marriage" ? "👰 Marriage" : "💬 Chatting"}
                        </p>
                      </div>
                      <div className="stat-box bg-pink-500/5 p-4 rounded-2xl border border-pink-500/10 text-center">
                        <p className="text-[10px] text-pink-400 font-black uppercase mb-1 tracking-widest">MBTI</p>
                        <p className="text-lg text-white font-black tracking-widest font-heading">{user.mbti || "????"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center py-2">
                       {user.lifestyleCoffee && (
                        <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-pink-500/20 text-[10px] text-pink-200 flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                          <Coffee className="w-3 h-3 text-amber-600" />
                          {user.lifestyleCoffee}
                        </div>
                       )}
                       {user.lifestyleAlcohol && (
                        <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-pink-500/20 text-[10px] text-pink-200 flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                          <Beer className="w-3 h-3 text-yellow-500" />
                          {user.lifestyleAlcohol}
                        </div>
                       )}
                       {user.lifestyleSchedule && (
                        <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-pink-500/20 text-[10px] text-pink-200 flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                          {user.lifestyleSchedule === 'morning' ? <Sun className="w-3 h-3 text-orange-400" /> : <Moon className="w-3 h-3 text-blue-400" />}
                          {user.lifestyleSchedule}
                        </div>
                       )}
                    </div>

                    {user.loveLanguage && (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 to-transparent border border-pink-500/20">
                        <Sparkles className="w-5 h-5 text-pink-400 group-hover:rotate-45 transition-transform shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Love Language</p>
                          <p className="text-sm text-slate-100 font-semibold">{user.loveLanguage}</p>
                        </div>
                      </div>
                    )}

                    {user.perfectDate && (
                      <div className="relative p-5 rounded-2xl bg-slate-950/40 border border-pink-500/20 shadow-xl overflow-hidden">
                        <div className="absolute inset-0 bg-pink-500/5 blur-xl pointer-events-none" />
                        <div className="absolute -top-2 left-4 bg-slate-900 px-3 py-0.5 text-[9px] text-pink-400 font-black uppercase tracking-[0.2em] border border-pink-500/30 rounded-full z-10">Dream Date</div>
                        <p className="text-sm text-slate-100 leading-relaxed font-medium relative z-10">{user.perfectDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Standard info */}
          {!isEditing && (
            <motion.div variants={itemVariants} className="glass-card p-5 relative overflow-hidden group hover:border-slate-600/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
              <h3 className="text-[10px] font-bold text-slate-400 mb-4 tracking-widest uppercase">Favorites & Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Music</p>
                    <p className="text-sm text-slate-200 font-medium">{user.favoriteSong || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Palette className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Color</p>
                    <p className="text-sm text-slate-200 font-medium">{user.favoriteColor || "Not set"}</p>
                  </div>
                </div>
              </div>
              {user.interests && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-wider">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests.split(",").map((interest: string, i: number) => (
                      <span key={i} className="text-[11px] bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1 text-slate-300 font-medium group-hover:bg-slate-700/80 transition-colors">
                        {interest.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {/* Bio card */}
          {user.bio && !isEditing && (
            <motion.div variants={itemVariants} className="glass-card p-5 relative overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 tracking-wide uppercase">About</h3>
              <p className="text-slate-200">{user.bio}</p>
            </motion.div>
          )}

          {/* Edit button */}
          <motion.div variants={itemVariants} className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 h-11 rounded-xl border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
            {!isEditing && (
              <Button
                variant="outline"
                aria-label="Log out"
                className="h-11 rounded-xl border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </motion.div>

          {/* Edit form */}
          {isEditing && (
            <motion.div variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="glass-card p-6 mt-4 shadow-2xl shadow-blue-900/20 border-blue-500/20 ring-1 ring-blue-500/10">
              <h3 className="text-xl font-bold text-white mb-6 font-heading flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-400 to-pink-500 w-2 h-6 rounded-full inline-block" />
                Edit Profile
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Personal Info</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">First Name</FormLabel>
                        <FormControl><Input {...field} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Last Name</FormLabel>
                        <FormControl><Input {...field} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="auth-input"><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Age</FormLabel>
                        <FormControl><Input type="number" min="18" max="99" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="selfRating" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Rating</FormLabel>
                        <FormControl><Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="height" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Height</FormLabel>
                        <FormControl><Input placeholder="e.g. 5ft 10in" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Weight</FormLabel>
                        <FormControl><Input placeholder="e.g. 165 lbs" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="border-t border-slate-700/50 pt-4 mt-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferences</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="auth-input"><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dating">💕 Dating</SelectItem>
                            <SelectItem value="business">💼 Business</SelectItem>
                            <SelectItem value="friendships">🤝 Friendships</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="datingPreference" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="auth-input"><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="men">Men</SelectItem>
                            <SelectItem value="women">Women</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="seeking" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm">Seeking</FormLabel>
                      <FormControl><Input placeholder="e.g. Friendship, Dating, Networking" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                      <FormDescription className="text-slate-400 text-xs">Comma-separated list of what you're looking for</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Face2Face Favorites Section */}
                  <div className="border-t border-slate-700/50 pt-4">
                    <h4 className="text-sm font-semibold text-pink-400 mb-3">✨ Face2Face Profile</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="favoriteSong" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm">Music</FormLabel>
                          <FormControl><Input placeholder="e.g. Blinding Lights" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="favoriteColor" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm">Favorite Color</FormLabel>
                          <FormControl><Input placeholder="e.g. Midnight Blue" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="fieldOfStudy" render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel className="text-slate-300 text-sm">Field of Study/Work</FormLabel>
                        <FormControl><Input placeholder="e.g. Computer Science" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="interests" render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel className="text-slate-300 text-sm">Interests</FormLabel>
                        <FormControl><Input placeholder="e.g. Music, Travel, Coffee" {...field} value={field.value || ""} className="auth-input" /></FormControl>
                        <FormDescription className="text-slate-400 text-xs">Comma-separated list</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm">Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about yourself" {...field} value={field.value || ""} className="auth-input min-h-20" />
                      </FormControl>
                      <FormDescription className="text-slate-400 text-xs">Max 250 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="isActive" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between glass-card p-3">
                        <div>
                          <FormLabel className="text-slate-300 text-sm">Active</FormLabel>
                          <FormDescription className="text-slate-400 text-xs">Show on map</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="inactiveTimeout" render={({ field }) => (
                      <FormItem className="glass-card p-3">
                        <FormLabel className="text-slate-300 text-sm">Timeout ({field.value}m)</FormLabel>
                        <FormControl>
                          <Input type="number" min="5" max="120" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="auth-input" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedCategory === "business" && (
                      <motion.div
                        key="business-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-blue-500/20"
                      >
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Business (Pro-X)</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="jobTitle" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Job Title</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. CEO" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="company" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Company</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Google" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="industry" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Industry</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. Technology" className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="skills" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Skills</FormLabel>
                            <FormControl><Input {...field} placeholder="React, Node.js, AI" className="auth-input" /></FormControl>
                            <FormDescription className="text-xs text-slate-500">Comma-separated skills</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="networkingGoal" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Networking Goal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="auth-input"><SelectValue placeholder="Select Goal" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hiring">🚀 Hiring</SelectItem>
                                <SelectItem value="investing">💰 Investing</SelectItem>
                                <SelectItem value="mentorship">🎓 Mentorship</SelectItem>
                                <SelectItem value="networking">🤝 General Networking</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Portfolio/Website URL</FormLabel>
                            <FormControl><Input {...field} placeholder="https://..." className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="professionalMotto" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Professional Motto</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. Innovation through collaboration" className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {selectedCategory === "friendships" && (
                      <motion.div
                        key="friends-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-emerald-500/20"
                      >
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Friends (VibeCheck)</h4>
                        <FormField control={form.control} name="vibeStatus" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Vibe Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="auth-input"><SelectValue placeholder="Select Vibe" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="chill">🍃 Chill & Relaxed</SelectItem>
                                <SelectItem value="energetic">🔥 Energetic & Active</SelectItem>
                                <SelectItem value="productive">💻 Productive & Focused</SelectItem>
                                <SelectItem value="adventurous">🎒 Adventurous</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="currentActivity" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Current Activity</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. Drinking coffee, coding..." className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="weekendVibe" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Weekend Vibe</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="auth-input"><SelectValue placeholder="Weekend" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="outdoors">🌲 Outdoors</SelectItem>
                                  <SelectItem value="gaming">🎮 Gaming</SelectItem>
                                  <SelectItem value="relaxing">🛀 Relaxing</SelectItem>
                                  <SelectItem value="nightlife">💃 Nightlife</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="socialBattery" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Social Battery</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="auth-input"><SelectValue placeholder="Battery" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="introvert">🤫 Introvert</SelectItem>
                                  <SelectItem value="extrovert">🗣️ Extrovert</SelectItem>
                                  <SelectItem value="ambivert">⚖️ Ambivert</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </motion.div>
                    )}

                    {selectedCategory === "dating" && (
                      <motion.div
                        key="dating-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-pink-500/20"
                      >
                        <h4 className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Dating (Aura)</h4>
                        <FormField control={form.control} name="relationshipGoal" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Relationship Goal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="auth-input"><SelectValue placeholder="Select Goal" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="long-term">💍 Long-term Partner</SelectItem>
                                <SelectItem value="short-term">🥂 Short-term Fun</SelectItem>
                                <SelectItem value="chatting">💬 Just Chatting</SelectItem>
                                <SelectItem value="marriage">👰 Marriage-minded</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="loveLanguage" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Love Language</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Acts of Service" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="mbti" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">MBTI</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. ENFP" className="auth-input text-center uppercase" maxLength={4} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField control={form.control} name="lifestyleCoffee" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-xs">Coffee</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="auth-input text-xs"><SelectValue placeholder="Coffee" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="addict">Addict</SelectItem>
                                  <SelectItem value="decaf">Decaf</SelectItem>
                                  <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lifestyleAlcohol" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-xs">Alcohol</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="auth-input text-xs"><SelectValue placeholder="Alcohol" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="social">Social</SelectItem>
                                  <SelectItem value="frequent">Frequent</SelectItem>
                                  <SelectItem value="never">Never</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lifestyleSchedule" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-xs">Schedule</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="auth-input text-xs"><SelectValue placeholder="Schedule" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="morning">Morning</SelectItem>
                                  <SelectItem value="night">Night</SelectItem>
                                  <SelectItem value="flexible">Flexible</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>


                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Details card (view mode) */}
          {!isEditing && (
            <motion.div variants={itemVariants} className="glass-card p-5 border-t-0 border-x-0 rounded-t-none bg-transparent shadow-none border-b border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm text-slate-200 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Username</p>
                  <p className="text-sm text-slate-300 font-medium">@{user.username}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div >

      <BottomNavigation />
    </PageTransition>
  );
}
