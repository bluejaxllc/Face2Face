import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import Header from "@/components/Header";
import { 
  User as UserIcon, Camera, Loader2, Sparkles, 
  MapPin, Heart, Target, Briefcase, Ruler, Weight, Search, 
  Smile, Coffee, Zap, Shield, MessageSquare, 
  Navigation, Linkedin, ExternalLink, BookOpen, Play, 
  Users, CheckCircle, Flame, Music, Beer, Sun, Moon,
  Activity, UserPlus, Palette, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useScrollSave } from "@/hooks/use-scroll-save";
import BottomNavigation, { CategoryKey, categoryConfig } from "@/components/BottomNavigation";

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
  sex: z.string().default("other"),
  dateOfBirth: z.string().optional(),
  age: z.coerce.number().min(0).max(99).default(18),
  height: z.string().optional(),
  weight: z.string().optional(),
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
  bannerPhoto: z.string().optional(),

  // Privacy
  isPublic: z.boolean().default(true),
  // New Business Fields
  businessPhone: z.string().optional(),
  businessNeed: z.string().optional(),
  businessPartners: z.string().optional(),
  isNetworkingOpen: z.boolean().default(true),
  isHiring: z.boolean().default(false),
  hiringRoles: z.string().optional(),
  menuData: z.string().optional(),
  businessService: z.string().optional(),
  businessSlogan: z.string().optional(),
  openPositions: z.coerce.number().optional(),
  displayAge: z.string().optional(),
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
        sex: user.sex || "other",
        age: user.age || 18,
        dateOfBirth: user.dateOfBirth || "",
        height: user.height || "",
        weight: user.weight || "",
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
        // Sync with global category change
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
        bannerPhoto: user.bannerPhoto || "",
        isPublic: user.isPublic ?? true,
        businessPhone: user.businessPhone || "",
        businessNeed: user.businessNeed || "",
        businessPartners: user.businessPartners || "",
        isNetworkingOpen: user.isNetworkingOpen ?? true,
        isHiring: user.isHiring ?? false,
        hiringRoles: user.hiringRoles || "",
        menuData: user.menuData || "",
        businessService: user.businessService || "",
        businessSlogan: user.businessSlogan || "",
        openPositions: user.openPositions || undefined,
        displayAge: user.displayAge || "",
      });
    }
  }, [user, form, isEditing]);
  
  // Screenshot Prevention logic
  const [isBlurred, setIsBlurred] = useState(false);
  useEffect(() => {
    const handleVisibility = () => setIsBlurred(document.hidden);
    const handleFocus = () => setIsBlurred(false);
    const handleBlur = () => setIsBlurred(true);
    const preventPrint = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(""); // Clear clipboard
        toast({ title: "Security Alert", description: "Screenshots are restricted on Face 2 Face profiles.", variant: "destructive" });
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keyup', preventPrint);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keyup', preventPrint);
    };
  }, [toast]);

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

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [isLoading, user, setLocation]);

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

  // Rating stars removed as per request

  const sexIcon = user?.sex === 'male'
    ? <svg width="20" height="20" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"><defs><linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs><polygon points="50,8 94,92 6,92" fill="url(#blue-grad)" stroke="#2563eb" strokeWidth="6" strokeLinejoin="round" /></svg>
    : user?.sex === 'female'
      ? <svg width="20" height="20" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"><defs><linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#pink-grad)" stroke="#db2777" strokeWidth="6" /></svg>
      : <Sparkles className="w-5 h-5 text-purple-400" />;

  // Determine which category to use for styling (reactive to form and user state)
  const activeCategory = isEditing 
    ? (selectedCategory === 'friendships' ? 'friends' : selectedCategory)
    : (user.category === 'friendships' ? 'friends' : user.category);

  const themeConfig = {
    business: {
      primary: "blue-500",
      text: "text-blue-500",
      bg: "bg-blue-600",
      bgActive: "bg-blue-500",
      border: "border-blue-500/20",
      mesh: "bg-mesh-business",
      badge: "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      statBorder: "border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
    },
    friends: {
      primary: "emerald-500",
      text: "text-emerald-500",
      bg: "bg-emerald-600",
      bgActive: "bg-emerald-500",
      border: "border-emerald-500/20",
      mesh: "bg-mesh-friends",
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      statBorder: "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
    },
    dating: {
      primary: "pink-500",
      text: "text-pink-500",
      bg: "bg-pink-600",
      bgActive: "bg-pink-500",
      border: "border-pink-500/20",
      mesh: "bg-mesh-dating",
      badge: "bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.2)]",
      statBorder: "border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.1)]"
    }
  };

  const theme = themeConfig[activeCategory as CategoryKey] || themeConfig.friends;

  const renderCategoryStats = () => {
    // Stats do not belong in Business category or simplified profiles
    if (activeCategory === 'business') return null;

    const stats = [
      { label: user?.category === 'dating' ? "Aura" : "Vibe", value: user?.category === 'dating' ? "9.8" : "Active", icon: user?.category === 'dating' ? Heart : Sparkles, color: user?.category === 'dating' ? "text-pink-400" : "text-emerald-400" },
      { label: "Bumps", value: "24", icon: Users, color: "text-blue-400" },
      { label: "Pulse", value: "85%", icon: Zap, color: "text-amber-400" },
      { label: "Check-ins", value: "12", icon: MapPin, color: "text-purple-400" },
    ];
    return (
      <div className="grid grid-cols-4 gap-2 mt-4 max-w-sm mx-auto">
        {stats.map((stat, i) => (
          <div key={i} className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900/60 border ${theme.statBorder} backdrop-blur-md`}>
            <stat.icon className={`w-4 h-4 mb-1.5 ${stat.color}`} />
            <span className="text-[14px] font-black text-white">{stat.value}</span>
            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 2MB.", variant: "destructive" });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateProfile({ bannerPhoto: base64 });
        toast({ title: "Banner updated", description: "Your profile banner has been saved." });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload failed", description: "There was a problem uploading your banner.", variant: "destructive" });
    }
  };

  const bannerInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={isBlurred ? "blur-md pointer-events-none transition-all duration-300" : "transition-all duration-300"}>
    <PageTransition className={`h-screen overflow-y-auto ${theme.mesh}`}>
      <Header />

      <motion.div
        ref={profileScroll.ref}
        onScroll={profileScroll.onScroll}
        className="fixed left-0 right-0 overflow-y-auto pb-32 md:pb-6 page-enter"
        style={{ top: "0px", bottom: "64px" }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Banner Section */}
        <div className="relative h-80 w-full overflow-hidden">
          {user.bannerPhoto ? (
            <img 
              src={user.bannerPhoto} 
              alt="Profile Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${
              activeCategory === 'business' ? 'from-blue-600/40 via-blue-900/40 to-slate-950' :
              activeCategory === 'friends' ? 'from-emerald-600/40 via-emerald-900/40 to-slate-950' :
              'from-pink-600/40 via-pink-900/40 to-slate-950'
            }`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          
          <input
            type="file"
            ref={bannerInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleBannerUpload}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-12 right-4 bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60"
            onClick={() => bannerInputRef.current?.click()}
          >
            <Camera className="w-4 h-4 mr-2" /> Edit Banner
          </Button>

          {/* Privacy Toggle Overlay */}
          <div className="absolute top-12 left-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {user.isPublic ? 'Public' : 'Private'}
            </span>
            <Switch 
              checked={user.isPublic ?? true} 
              onCheckedChange={(checked) => updateProfile({ isPublic: checked })}
              className="scale-75 data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        {/* Profile hero section */}
        <motion.div variants={itemVariants} className="px-4 -mt-24 pb-6 text-center relative z-20">
          <div className="relative inline-block">
            <div className={`avatar-ring shadow-[0_0_60px_rgba(59,130,246,0.5)] rounded-full p-1.5 bg-gradient-to-br ${
              activeCategory === 'business' ? 'from-blue-400 to-blue-600' :
              activeCategory === 'friends' ? 'from-emerald-400 to-emerald-600' :
              'from-pink-400 to-pink-600'
            }`}>
              <Avatar className="h-48 w-48 border-8 border-slate-950 ring-2 ring-white/10 shadow-2xl">
                {user.profilePhoto && (
                  <AvatarImage src={user.profilePhoto} alt={`${user.firstName}'s photo`} className="object-cover" />
                )}
                <AvatarFallback className="text-5xl bg-slate-900 text-white font-heading font-black">
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
              className={`absolute bottom-1 right-1 ${theme.bgActive} text-white rounded-full p-2.5 shadow-xl border-2 border-slate-950 hover:scale-110 transition-all z-30`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            {/* Online status indicator */}
            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-lg z-20" />
          </div>

          <div className="mt-6 text-center w-full">
            <motion.h2
              layoutId="profile-name"
              className="text-4xl font-black text-white tracking-tight flex flex-col items-center justify-center gap-1 drop-shadow-md px-4"
            >
              <div className="flex items-center flex-wrap justify-center gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
                  {activeCategory === 'business' ? (user.company || 'Your Business Name') : `${user.firstName} ${user.lastName}`}
                </span>
                <span className="inline-block transform hover:scale-125 transition-all duration-500 cursor-help active:scale-95">{sexIcon}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 opacity-70">
                <span className="text-base font-black tracking-widest text-slate-400 uppercase">
                  {user.displayAge ? user.displayAge : `Age ${user.age || 18}`}
                </span>
              </div>
            </motion.h2>

            <div className="flex items-center justify-center mt-4 gap-3">
              <Badge className={`px-6 py-2 text-[12px] font-black tracking-[0.2em] border shadow-lg transition-all duration-700 ${theme.badge}`}>
                {activeCategory === 'business' ? 'PRO-X BUSINESS' : activeCategory === 'friends' ? 'VIBECHECK SOCIAL' : activeCategory === 'dating' ? 'AURA DATING' : 'SELECT MODE'}
              </Badge>
            </div>
            {renderCategoryStats()}
          </div>
        </motion.div>

        {/* Horizontal Quick Menu orientation layout */}
        <motion.div variants={itemVariants} className="w-full max-w-lg mx-auto mt-2 overflow-x-auto no-scrollbar pb-2 px-4">
          <div className="flex gap-3 w-max mx-auto pb-2">
            {activeCategory === 'business' ? (
              <>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Briefcase className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white truncate w-full">{user.company || "Independent"}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Company</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Target className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white truncate w-full">{user.networkingGoal || "Networking"}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Success Goal</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <ExternalLink className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white">Portfolio</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">External Hub</p>
                </div>
              </>
            ) : activeCategory === 'friends' ? (
              <>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Smile className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white capitalize">{user.vibeStatus || "Chill"}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Current Vibe</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Coffee className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white truncate w-full">{user.currentActivity || "Relaxing"}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Activity</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Search className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white">Exploring</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Seeking</p>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Heart className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white capitalize">{user.relationshipGoal || "Open"}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Intensity</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <Sparkles className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white">{user.mbti || "ENFP"}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">DNA Code</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-900/60 border ${theme.border} w-[140px] text-center backdrop-blur-sm shadow-xl shrink-0`}>
                  <MapPin className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} />
                  <p className="text-sm font-bold text-white">{user.inactiveTimeout}m</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Range</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Physical stats row - Hidden for Business */}
        {activeCategory !== 'business' && (user.height || user.weight) && (
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
            <div className={`flex justify-center flex-wrap gap-1.5 ${
              activeCategory === 'business' ? 'text-blue-400' :
              activeCategory === 'friends' ? 'text-emerald-400' :
              'text-pink-400'
            }`}>
              <Search className="w-3.5 h-3.5 mt-0.5" />
              {user.seeking.split(",").map((item: string, i: number) => (
                <span key={i} className={`text-xs border rounded-full px-2.5 py-1 font-medium ${
                  activeCategory === 'business' ? 'bg-blue-950/60 border-blue-800/40 text-blue-300' :
                  activeCategory === 'friends' ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300' :
                  'bg-pink-950/60 border-pink-800/40 text-pink-300'
                }`}>
                  {item.trim()}
                </span>
              ))}
            </div>
          </motion.div>
        )}        <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
          {/* 18+ Dating Restriction Check */}
          {!isEditing && activeCategory === 'dating' && (user.age || 18) < 18 && (
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-red-500/30 text-center space-y-4 backdrop-blur-xl">
              <Shield className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Restricted Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aura Dating features are strictly restricted to users 18 and up. Please update your profile or switch mode.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest h-11 rounded-xl"
                onClick={() => setIsEditing(true)}
              >
                Update Birth Date
              </Button>
            </div>
          )}

          {/* Category-Specific View Mode */}
          {!isEditing && (activeCategory !== 'dating' || (user.age || 18) >= 18) && (
            <motion.div variants={itemVariants} className="space-y-4">
              {activeCategory === "business" && (
                <div className="glass-card business-card p-0 border-blue-500/30 overflow-hidden shadow-2xl relative bg-slate-900/40 backdrop-blur-2xl ring-1 ring-white/10">
                  {/* Subtle hiring badge */}
                  {user.isHiring && (
                    <div className="absolute top-4 right-4 z-30">
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none animate-pulse px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/40 flex flex-col items-end gap-0.5">
                        <span>HIRING: {user.hiringRoles || "Staff"}</span>
                        {user.openPositions && (
                          <span className="text-[9px] opacity-90">{user.openPositions} Open Positions</span>
                        )}
                      </Badge>
                    </div>
                  )}

                  <div className="p-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="space-y-1.5 pr-4">
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{user.company || "Your Brand"}</h3>
                        <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] pl-0.5 opacity-80">{user.industry || "Professional Sector"}</p>
                        {user.businessSlogan && (
                          <p className="text-slate-300 text-sm mt-3 font-medium italic border-l-2 border-blue-500 pl-3 py-0.5">
                            "{user.businessSlogan}"
                          </p>
                        )}
                      </div>
                      <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner shrink-0">
                        <Briefcase className="w-7 h-7 text-blue-400" />
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Product/Service focus */}
                      <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40" />
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.25em] mb-2 opacity-70">Core Service / Product</p>
                        <p className="text-lg text-slate-100 font-bold leading-tight">
                          {user.businessService || user.jobTitle || "Your specialized business offering"}
                        </p>
                      </div>

                      {/* Business Context Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Current Priority</p>
                          <p className="text-sm text-white font-bold leading-none">{user.businessNeed || "Growth"}</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Network Context</p>
                          <p className="text-sm text-white font-bold leading-none">{user.businessPartners || "Collaborative"}</p>
                        </div>
                      </div>

                      {/* Networking & Actions */}
                      <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${user.isNetworkingOpen ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-slate-700'}`} />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.isNetworkingOpen ? 'Accepting Connections' : 'Limited Networking'}</span>
                          </div>
                          <div className="flex gap-4">
                            {user.linkedinUrl && (
                              <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="w-5 h-5 text-blue-400 opacity-60 hover:opacity-100 transition-all hover:scale-110" />
                              </a>
                            )}
                            {user.portfolioUrl && (
                               <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-5 h-5 text-slate-400 opacity-60 hover:opacity-100 transition-all hover:scale-110" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Call to Actions (Unified & High Impact) */}
                        <div className="flex flex-col gap-3">
                          {user.businessPhone && (
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl h-14 rounded-2xl text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-[0.98]">
                              <Zap className="w-4 h-4 mr-3 fill-current" /> Contact Business Now
                            </Button>
                          )}
                        </div>

                        {/* Menu Display for Restaurants/Services - Refined Horizontal Cards */}
                        {user.menuData && (
                          <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-2.5 px-1">
                              <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                              <span className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em]">Featured Catalog</span>
                            </div>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                              {(() => {
                                try {
                                  const menu = JSON.parse(user.menuData);
                                  return menu.map((item: any, i: number) => (
                                    <div key={i} className="min-w-[160px] p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-28 backdrop-blur-sm group hover:bg-white/[0.05] transition-colors cursor-default">
                                      <span className="text-xs text-slate-200 font-bold leading-snug line-clamp-2 uppercase tracking-tight">{item.name}</span>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-[16px] text-amber-400 font-black tracking-tight">{item.price}</span>
                                      </div>
                                    </div>
                                  ));
                                } catch (e) {
                                  return <p className="text-[10px] text-slate-500 italic">Configuration Required</p>;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "friends" && (
                <div className="glass-card friends-card border-emerald-500/10 hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Smile className="w-24 h-24 text-emerald-400" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Smile className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-white font-heading">VibeCheck Social</h3>
                      <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/40">Social Mode</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Currently</p>
                        <p className="text-sm text-slate-100 font-medium mt-1">
                          {user.currentActivity || "Just hanging out"}
                        </p>
                      </div>

                      {user.icebreaker && (
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Icebreaker</p>
                          <p className="text-sm text-emerald-100 italic mt-1">"{user.icebreaker}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Music className="w-4 h-4 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Music</p>
                            <p className="text-sm text-slate-200">{user.favoriteSong || "Not set"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Palette className="w-4 h-4 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Color</p>
                            <p className="text-sm text-slate-200">{user.favoriteColor || "Not set"}</p>
                          </div>
                        </div>
                      </div>

                      {user.interests && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {user.interests.split(",").map((interest: string, i: number) => (
                            <span key={i} className="text-[11px] bg-emerald-950/40 border border-emerald-500/20 rounded-lg px-2.5 py-1 text-emerald-200 font-medium">
                              {interest.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === "dating" && (
                <div className="glass-card dating-card border-pink-500/10 hover:border-pink-500/30 transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Heart className="w-24 h-24 text-pink-400" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <h3 className="text-lg font-bold text-white font-heading">Aura Dating</h3>
                      <Badge className="ml-auto bg-pink-500/20 text-pink-400 border-pink-500/40">Dating Mode</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10">
                          <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">Relationship Goal</p>
                          <p className="text-sm text-slate-100 font-bold mt-1 capitalize">{user.relationshipGoal || "Open-minded"}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10">
                          <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">MBTI / DNA</p>
                          <p className="text-sm text-slate-100 font-bold mt-1 uppercase">{user.mbti || "ENFP"}</p>
                        </div>
                      </div>

                      {user.perfectDate && (
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ideal Date</p>
                          <p className="text-sm text-pink-100 italic mt-1">"{user.perfectDate}"</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-slate-300">Coffee: <span className="text-slate-100 font-bold capitalize">{user.lifestyleCoffee || "Social"}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Beer className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-slate-300">Drink: <span className="text-slate-100 font-bold capitalize">{user.lifestyleAlcohol || "Social"}</span></span>
                        </div>
                      </div>
                    </div>
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
          <motion.div variants={itemVariants} className="flex justify-center max-w-sm mx-auto gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 h-11 rounded-xl border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
            {!isEditing && (
              <Button
                variant="outline"
                aria-label="Log out"
                className="h-11 px-4 rounded-xl border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all"
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

                  <div className="grid grid-cols-4 gap-3">
                    <FormField control={form.control} name="sex" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Sex</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="auth-input"><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.value === 'custom' && (
                          <div className="mt-2">
                            <Input 
                              placeholder="Type your preference" 
                              className="auth-input text-xs h-8"
                              autoFocus
                            />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-slate-300 text-sm">Date of Birth</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                            className="auth-input" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="displayAge" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Custom Age</FormLabel>
                        <FormControl><Input placeholder='e.g. "Old"' {...field} value={field.value || ""} className="auth-input" /></FormControl>
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
                      <FormLabel className="text-slate-300 text-sm">
                        {selectedCategory === 'business' ? 'Networking Goals' : 
                         selectedCategory === 'dating' ? 'What you are looking for' : 
                         'Looking for Vibe'}
                      </FormLabel>
                      <FormControl><Input placeholder={
                        selectedCategory === 'business' ? "e.g. Investors, Partners, Clients" :
                        selectedCategory === 'dating' ? "e.g. Relationship, Casual, Coffee" :
                        "e.g. Hiking partners, Gaming friends"
                      } {...field} value={field.value || ""} className="auth-input" /></FormControl>
                      <FormDescription className="text-slate-400 text-xs">Comma-separated list</FormDescription>
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
                          <FormDescription className="text-slate-400 text-[10px]">Show on map</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="isPublic" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between glass-card p-3">
                        <div>
                          <FormLabel className="text-slate-300 text-sm">Public</FormLabel>
                          <FormDescription className="text-slate-400 text-[10px]">Visible to all</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="inactiveTimeout" render={({ field }) => (
                    <FormItem className="glass-card p-3">
                      <FormLabel className="text-slate-300 text-sm">Auto-Hide After ({field.value}m)</FormLabel>
                      <FormControl>
                        <Input type="number" min="5" max="120" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="auth-input" />
                      </FormControl>
                    </FormItem>
                  )} />

                  <AnimatePresence mode="wait">
                    {selectedCategory === "business" && (
                      <motion.div
                        key="business-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-blue-500/20"
                      >
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Business Card Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="company" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Business Name</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Blue Jax LLC" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="industry" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Industry</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Technology" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="skills" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Skills</FormLabel>
                              <FormControl><Input {...field} placeholder="React, Node.js, AI" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="businessService" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Service/Product</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Web Development" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
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
                        <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">LinkedIn URL</FormLabel>
                            <FormControl><Input {...field} placeholder="https://linkedin.com/in/..." className="auth-input" /></FormControl>
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
                        <FormField control={form.control} name="businessSlogan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Business Slogan / Pitch</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. We build the future" className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <FormField control={form.control} name="isHiring" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between glass-card p-3 bg-blue-500/5">
                              <div>
                                <FormLabel className="text-blue-400 text-xs font-black uppercase">Currently Hiring</FormLabel>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="isNetworkingOpen" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between glass-card p-3 bg-blue-500/5">
                              <div>
                                <FormLabel className="text-blue-400 text-xs font-black uppercase">Open to Network</FormLabel>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>

                        {form.watch("isHiring") && (
                          <div className="grid grid-cols-3 gap-3">
                            <FormField control={form.control} name="hiringRoles" render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel className="text-slate-300 text-sm">Job Titles</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g. Servers" className="auth-input" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="openPositions" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-300 text-sm">Positions</FormLabel>
                                <FormControl><Input type="number" min="1" {...field} value={field.value || ""} onChange={(e) => field.onChange(parseInt(e.target.value))} className="auth-input" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        )}

                        <FormField control={form.control} name="businessPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Business Phone Number</FormLabel>
                            <FormControl><Input {...field} placeholder="+1 (555) 000-0000" className="auth-input" /></FormControl>
                            <FormDescription className="text-[10px] text-slate-500">For direct calls (replaces in-app booking)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="businessNeed" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Current Needs</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. More staff, Investors" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="businessPartners" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300 text-sm">Partners</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Local Farms, Tech Inc" className="auth-input" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="menuData" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Menu / Services (JSON)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder='[{"name": "Burger", "price": "$12"}, {"name": "Fires", "price": "$5"}]' 
                                className="auth-input min-h-[100px] text-[10px] font-mono" 
                              />
                            </FormControl>
                            <FormDescription className="text-[9px] text-slate-500">Input as a JSON array of objects with name and price.</FormDescription>
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
                        <FormField control={form.control} name="icebreaker" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Icebreaker</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. Ask me about..." className="auth-input" /></FormControl>
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
                        <FormField control={form.control} name="perfectDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Perfect Date</FormLabel>
                            <FormControl><Input {...field} placeholder="e.g. Late night drive and tacos" className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
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
    </div>
  );
}
