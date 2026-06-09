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
  Activity, UserPlus, Palette, LogOut, Plus, Star
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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useScrollSave } from "@/hooks/use-scroll-save";
import BottomNavigation, { CategoryKey, categoryConfig } from "@/components/BottomNavigation";
import { validateTags, validateModeration } from "@shared/moderation";

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
  displayAge: z.string().optional(),
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
  websiteUrl: z.string().optional(),
  menuUrl: z.string().optional(),
  bookingUrl: z.string().optional(),
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const profileScroll = useScrollSave("f2f_scroll_profile");
  const [, setLocation] = useLocation();
  const [showHiringMenu, setShowHiringMenu] = useState(false);
  const { user, updateProfile, logout, isLoading } = useAuth();
  
  // Show hiring setup box by default when user has hiring enabled
  useEffect(() => {
    if (user && (user as any).isHiring) {
      setShowHiringMenu(true);
    }
  }, [user]);

  const [localCategory, setLocalCategory] = useState<string | null>(() => {
    return localStorage.getItem("f2f_activeCategory");
  });

  useEffect(() => {
    const handleCategoryChange = (e: Event) => {
      setLocalCategory((e as CustomEvent).detail);
    };
    window.addEventListener("f2f:categoryChange", handleCategoryChange);
    return () => window.removeEventListener("f2f:categoryChange", handleCategoryChange);
  }, []);

  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [servicePhotos, setServicePhotos] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('f2f_service_photos') || '[]'); } catch { return []; }
  });
  const [customLinks, setCustomLinks] = useState<{label: string; url: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('f2f_custom_links') || '[]'); } catch { return []; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to resize and compress images before upload
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string); // fallback to original if canvas fails
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.8 quality
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Resize to max 800x800 for profile photos
      const base64 = await resizeImage(file, 800, 800);
      await updateProfile({ profilePhoto: base64 });
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    } catch (error) {
      toast({ title: "Upload failed", description: "There was a problem uploading your photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        displayAge: user.displayAge || "",
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
        websiteUrl: user.websiteUrl || "",
        menuUrl: user.menuUrl || "",
        bookingUrl: user.bookingUrl || "",
      });
    }
  }, [user, form, isEditing]);
  
  // Screenshot Prevention logic (PrintScreen key blocking only, removed blur per user request)
  useEffect(() => {
    const preventPrint = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(""); // Clear clipboard
        toast({ title: "Security Alert", description: "Screenshots are restricted on Face 2 Face profiles.", variant: "destructive" });
      }
    };
    window.addEventListener('keyup', preventPrint);
    return () => {
      window.removeEventListener('keyup', preventPrint);
    };
  }, [toast]);

  const selectedCategory = form.watch("category");



  const onSubmit = async (values: ProfileFormValues) => {
    // 1. Validate tag category isolation
    const tagValidation = validateTags(
      values.category || "friendships",
      values.interests,
      values.seeking,
      values.skills
    );
    if (!tagValidation.isValid) {
      toast({
        title: "Validation Error",
        description: tagValidation.error || "Invalid tag category configuration.",
        variant: "destructive"
      });
      return;
    }

    // 2. Validate moderation for friendships category
    if (values.category === "friendships") {
      const fieldsToModerate = {
        bio: values.bio,
        currentActivity: values.currentActivity,
        vibeStatus: values.vibeStatus,
        interests: values.interests,
        seeking: values.seeking,
        icebreaker: values.icebreaker,
      };
      const modValidation = validateModeration(fieldsToModerate);
      if (!modValidation.isValid) {
        toast({
          title: "Content Restricted",
          description: `Appropriate content required. Offensive language detected in ${modValidation.field}: "${modValidation.blockedWord}" is not allowed on friendship profiles.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      await updateProfile({ ...values, profileCompleted: true });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your profile has been successfully updated." });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      const errMsg = error?.message || "There was a problem updating your profile.";
      toast({ title: "Update failed", description: errMsg, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error("Logout error:", error); }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U";
    return `${firstName[0]}${lastName[0]}`;
  };

  if (isLoading) {
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

  if (!user) {
    return null; // Auth gate disabled for testing
  }

  // Rating stars removed as per request

  const sexIcon = user?.sex === 'male'
    ? <svg width="20" height="20" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"><defs><linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs><polygon points="50,8 94,92 6,92" fill="url(#blue-grad)" stroke="#2563eb" strokeWidth="6" strokeLinejoin="round" /></svg>
    : user?.sex === 'female'
      ? <svg width="20" height="20" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"><defs><linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#pink-grad)" stroke="#db2777" strokeWidth="6" /></svg>
      : <Sparkles className="w-5 h-5 text-purple-400" />;

  // Determine which category to use for styling (reactive to form and user state)
  const userCat = user?.category === 'friendships' ? 'friends' : user?.category;
  const activeCategory = isEditing 
    ? (selectedCategory === 'friendships' ? 'friends' : selectedCategory)
    : (localCategory || userCat);

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

    try {
      // Resize to max 1200x1200 for cover banners to prevent large JSON payloads
      const base64 = await resizeImage(file, 1200, 1200);
      await updateProfile({ bannerPhoto: base64 });
      toast({ title: "Banner updated", description: "Your profile banner has been saved." });
    } catch (error) {
      toast({ title: "Upload failed", description: "There was a problem uploading your banner.", variant: "destructive" });
    }
  };

  const bannerInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="transition-all duration-300">
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
        {/* Banner Section - Hidden for Business */}
        {activeCategory !== 'business' && (
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
              onCheckedChange={(checked) => {
                if (user.isPremium) {
                  updateProfile({ isPublic: checked });
                } else {
                  toast({
                    title: "Premium Feature",
                    description: "Get F2F+ to unlock Stealth Mode and browse invisibly.",
                    variant: "default",
                  });
                  setLocation("/store");
                }
              }}
              className="scale-75 data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
        )}

        {/* Profile hero section - Hidden for Business */}
        {activeCategory !== 'business' && (
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
        )}

        {/* Horizontal Quick Menu orientation layout - Hidden for Business */}
        {activeCategory !== 'business' && (
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
        )}

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

        {/* Seeking tags - Hidden for Business */}
        {user.seeking && !isEditing && activeCategory !== 'business' && (
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
        )}
        
        {/* Gamification Progress Card */}
        {!isEditing && (
          <motion.div variants={itemVariants} className="px-4 mt-6">
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl max-w-lg mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame className="w-24 h-24 text-orange-500" />
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center border-2 border-slate-900 shadow-xl">
                  <span className="text-2xl font-black text-white">{user.level || 1}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Level {user.level || 1}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{user.xp || 0} XP Total</p>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
                      <Flame className="w-3 h-3" />
                      <span className="text-[10px] font-black">{user.currentStreak || 0} Streak</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" 
                      style={{ width: `${((user.xp || 0) % 1000) / 10}%` }} 
                    />
                  </div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 text-right">
                    {1000 - ((user.xp || 0) % 1000)} XP to Next Level
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
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
                <div className="overflow-hidden relative mx-2 space-y-0 pt-16">
                  {/* Top Layer - Cover Photo + Company Identity */}
                  <div className="relative border-b border-blue-500/20 overflow-hidden">
                    {/* Cover Photo Background */}
                    <div className="absolute inset-0">
                      {user.bannerPhoto ? (
                        <img src={user.bannerPhoto} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600/30 via-blue-900/30 to-slate-950" />
                      )}
                      <div className="absolute inset-0 bg-slate-950/60" />
                    </div>
                    {/* Upload Button */}
                    <input type="file" ref={bannerInputRef} accept="image/*" className="hidden" onChange={handleBannerUpload} />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all z-10"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    {/* Draggable Slogan Box */}
                    <div className="relative z-[5] min-h-[190px] overflow-hidden">
                      <div
                        tabIndex={-1}
                        className="absolute group outline-none"
                        style={{
                          left: `${JSON.parse(localStorage.getItem(`f2f_slogan_pos_${user.id}`) || '{"x":50,"y":75}').x}%`,
                          top: `${JSON.parse(localStorage.getItem(`f2f_slogan_pos_${user.id}`) || '{"x":50,"y":75}').y}%`,
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '95%',
                        }}
                      >
                        {/* Drag Handle - visible on focus */}
                        <div
                          className="flex items-center justify-center gap-1 cursor-grab active:cursor-grabbing py-1 px-4 mx-auto w-fit rounded-t-md bg-white/10 backdrop-blur-sm select-none opacity-0 group-focus-within:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const draggable = e.currentTarget.parentElement!;
                            const container = draggable.parentElement!;
                            const rect = container.getBoundingClientRect();
                            const onMove = (ev: MouseEvent) => {
                              const x = Math.max(15, Math.min(85, ((ev.clientX - rect.left) / rect.width) * 100));
                              const y = Math.max(5, Math.min(95, ((ev.clientY - rect.top) / rect.height) * 100));
                              draggable.style.left = `${x}%`;
                              draggable.style.top = `${y}%`;
                              localStorage.setItem(`f2f_slogan_pos_${user.id}`, JSON.stringify({ x, y }));
                            };
                            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                            document.addEventListener('mousemove', onMove);
                            document.addEventListener('mouseup', onUp);
                          }}
                          onTouchStart={(e) => {
                            const draggable = e.currentTarget.parentElement!;
                            const container = draggable.parentElement!;
                            const rect = container.getBoundingClientRect();
                            const onMove = (ev: TouchEvent) => {
                              ev.preventDefault();
                              const t = ev.touches[0];
                              const x = Math.max(15, Math.min(85, ((t.clientX - rect.left) / rect.width) * 100));
                              const y = Math.max(5, Math.min(95, ((t.clientY - rect.top) / rect.height) * 100));
                              draggable.style.left = `${x}%`;
                              draggable.style.top = `${y}%`;
                              localStorage.setItem(`f2f_slogan_pos_${user.id}`, JSON.stringify({ x, y }));
                            };
                            const onUp = () => { document.removeEventListener('touchmove', onMove as any); document.removeEventListener('touchend', onUp); };
                            document.addEventListener('touchmove', onMove as any, { passive: false });
                            document.addEventListener('touchend', onUp);
                          }}
                        >
                          <span className="text-white/50 text-[8px] font-bold tracking-widest uppercase">⠿ drag</span>
                        </div>
                        {/* Slogan + Controls */}
                        <div
                          className="rounded-b-md rounded-tr-md p-2"
                          data-slogan-box="true"
                          style={{
                            backgroundColor: `rgba(0,0,0,${Number(localStorage.getItem(`f2f_slogan_blur_${user.id}`) || '4') > 0 ? 0.2 : 0})`,
                            backdropFilter: `blur(${localStorage.getItem(`f2f_slogan_blur_${user.id}`) || '4'}px)`,
                          }}
                        >
                          <textarea
                            defaultValue={(user as any).businessSlogan || ''}
                            onBlur={(e) => updateProfile({ businessSlogan: e.target.value } as any)}
                            maxLength={100}
                            style={{ color: localStorage.getItem(`f2f_slogan_color_${user.id}`) || '#93c5fd', resize: 'both', overflow: 'auto' }}
                            className="text-sm font-bold italic drop-shadow-md bg-transparent border-0 outline-none text-center placeholder:text-blue-300/40 appearance-none shadow-none min-w-[180px] max-w-[400px] block"
                            placeholder="All Your Needs From A to Z"
                            rows={2}
                          />
                          {/* Controls row - visible on focus */}
                          <div className="hidden group-focus-within:flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                            <input
                              type="color"
                              defaultValue={localStorage.getItem(`f2f_slogan_color_${user.id}`) || '#93c5fd'}
                              onChange={(e) => {
                                localStorage.setItem(`f2f_slogan_color_${user.id}`, e.target.value);
                                const ta = e.target.closest('[data-slogan-box]')?.querySelector('textarea');
                                if (ta) ta.style.color = e.target.value;
                              }}
                              className="w-5 h-5 rounded-full border border-white/20 cursor-pointer shrink-0"
                              style={{ WebkitAppearance: 'none', padding: 0 }}
                            />
                            <span className="text-white/40 text-[9px] shrink-0">BLUR</span>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="1"
                              defaultValue={localStorage.getItem(`f2f_slogan_blur_${user.id}`) || '4'}
                              onChange={(e) => {
                                const val = e.target.value;
                                localStorage.setItem(`f2f_slogan_blur_${user.id}`, val);
                                const box = e.target.closest('[data-slogan-box]') as HTMLElement;
                                if (box) {
                                  box.style.backdropFilter = `blur(${val}px)`;
                                  box.style.backgroundColor = Number(val) > 0 ? 'rgba(0,0,0,0.2)' : 'transparent';
                                }
                                const label = e.target.nextElementSibling as HTMLElement;
                                if (label) label.textContent = `${val}px`;
                              }}
                              className="flex-1 h-1 accent-blue-400 cursor-pointer"
                            />
                            <span className="text-white/40 text-[9px] shrink-0">{localStorage.getItem(`f2f_slogan_blur_${user.id}`) || '4'}px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services / Menu Layer */}
                  <div className="px-8 py-6 border-b border-blue-500/10">
                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-2">Services, Products, Menu</h4>
                    {user.menuData && (
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 mb-4">
                        {(() => {
                          try {
                            const menu = JSON.parse(user.menuData);
                            return menu.map((item: any, i: number) => (
                              <div key={i} className="min-w-[140px] p-4 rounded-xl bg-blue-950/30 border border-blue-500/10 flex flex-col justify-between h-24 backdrop-blur-sm">
                                <span className="text-xs text-slate-200 font-bold leading-snug line-clamp-2 uppercase tracking-tight">{item.name}</span>
                                <span className="text-sm text-blue-400 font-black tracking-tight">{item.price}</span>
                              </div>
                            ));
                          } catch (e) {
                            return <p className="text-xs text-slate-500 italic">Configuration Required</p>;
                          }
                        })()}
                      </div>
                    )}
                    <div className="space-y-3">
                      <textarea
                        defaultValue={user.businessService || user.jobTitle || ''}
                        onBlur={(e) => updateProfile({ businessService: e.target.value } as any)}
                        className="w-full text-lg text-slate-200 font-bold bg-transparent border border-white/10 rounded-lg p-3 outline-none focus:border-blue-500/40 transition-colors resize-none min-h-[50px] placeholder:text-slate-500"
                        placeholder="Describe your specialized business offering..."
                        rows={2}
                        maxLength={150}
                      />
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {servicePhotos.map((photo, i) => (
                          <div key={i} className="relative min-w-[100px] h-[80px] rounded-lg overflow-hidden group/photo">
                            <img src={photo} alt={`Service ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                const updated = servicePhotos.filter((_, idx) => idx !== i);
                                setServicePhotos(updated);
                                localStorage.setItem('f2f_service_photos', JSON.stringify(updated));
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/photo:opacity-100 transition-opacity"
                            >×</button>
                          </div>
                        ))}
                        <label className="min-w-[100px] h-[80px] rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-400/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-blue-950/20 shrink-0">
                          <Camera className="w-5 h-5 text-blue-400" />
                          <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Add Photos</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const maxW = 400, maxH = 300;
                                  let w = img.width, h = img.height;
                                  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                                  if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
                                  canvas.width = w; canvas.height = h;
                                  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                                  const base64 = canvas.toDataURL('image/jpeg', 0.7);
                                  setServicePhotos(prev => {
                                    const updated = [...prev, base64];
                                    localStorage.setItem('f2f_service_photos', JSON.stringify(updated));
                                    return updated;
                                  });
                                };
                                img.src = ev.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            });
                            e.target.value = '';
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details Layer */}
                  <div className="px-8 py-6 border-b border-blue-500/10 space-y-5">
                    {/* Map + Address Row */}
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Business Address</span>
                    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 3fr' }}>
                      <button 
                        onClick={() => {
                          try {
                            const saved = localStorage.getItem('face2face_filterOptions');
                            const opts = saved ? JSON.parse(saved) : {};
                            localStorage.setItem('face2face_filterOptions', JSON.stringify({
                              ...opts,
                              showBusiness: true,
                              showDating: false,
                              showFriendships: false,
                            }));
                          } catch(e) {}
                          setLocation("/");
                        }}
                        className="flex items-center justify-center gap-2 bg-blue-900/50 hover:bg-blue-800/60 border border-blue-500/30 rounded-lg px-3 h-10 group cursor-pointer transition-all"
                      >
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black text-white tracking-wider uppercase">View on Map</span>
                      </button>
                      <Input
                        defaultValue={user.bio?.includes('📍') ? user.bio.split('📍')[1]?.trim() : ''}
                        onBlur={(e) => {
                          const currentBio = user.bio || '';
                          const cleanBio = currentBio.replace(/📍.*$/, '').trim();
                          const newBio = e.target.value ? `${cleanBio} 📍 ${e.target.value}`.trim() : cleanBio;
                          updateProfile({ bio: newBio });
                        }}
                        className="bg-slate-950/50 border-blue-500/20 text-white text-sm font-medium h-10 rounded-lg placeholder:text-slate-600"
                        placeholder="Business Address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Phone #</span>
                        <Input
                          defaultValue={user.businessPhone || ''}
                          onBlur={(e) => updateProfile({ businessPhone: e.target.value } as any)}
                          className="bg-slate-950/50 border-blue-500/20 text-white text-sm font-bold h-9 rounded-lg placeholder:text-slate-600"
                          placeholder="(555) 123-4567"
                          type="tel"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Email</span>
                        <Input
                          defaultValue={user.email || ''}
                          onBlur={(e) => updateProfile({ email: e.target.value } as any)}
                          className="bg-slate-950/50 border-blue-500/20 text-white text-sm font-bold h-9 rounded-lg placeholder:text-slate-600"
                          placeholder="business@email.com"
                          type="email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Profile & Status Layer */}
                  <div className="px-8 py-6 border-b border-blue-500/10">
                    <div className="flex items-center gap-5 mb-5">
                      <label className="relative cursor-pointer group/portrait">
                        <Avatar className="w-24 h-24 !rounded-2xl border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                          {user.profilePhoto && <AvatarImage src={user.profilePhoto} className="object-cover !rounded-2xl" />}
                          <AvatarFallback className="bg-slate-900 text-blue-400 font-black !rounded-2xl flex flex-col items-center justify-center gap-0.5">
                            <Camera className="w-4 h-4" />
                            <span className="text-[7px] uppercase tracking-wider leading-none">Add Portrait</span>
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover/portrait:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                          <span className="text-[7px] text-white uppercase tracking-wider">Change</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const base64 = await resizeImage(file, 300, 300);
                            await updateProfile({ profilePhoto: base64 });
                          } catch (err) {
                            console.error('Portrait upload failed:', err);
                          }
                          e.target.value = '';
                        }} />
                      </label>
                      <div className="space-y-1 flex-1 border-l-2 border-blue-500/20 pl-4 py-1">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Face 2 Face Contact</p>
                        <div className="flex gap-2">
                          <Input
                            defaultValue={user.firstName || ''}
                            onBlur={(e) => updateProfile({ firstName: e.target.value })}
                            className="bg-transparent border-blue-500/20 text-xl font-black text-white h-8 rounded-md px-2 placeholder:text-slate-600"
                            placeholder="First"
                          />
                          <Input
                            defaultValue={user.lastName || ''}
                            onBlur={(e) => updateProfile({ lastName: e.target.value })}
                            className="bg-transparent border-blue-500/20 text-xl font-black text-white h-8 rounded-md px-2 placeholder:text-slate-600"
                            placeholder="Last"
                          />
                        </div>
                        <div className="pt-1">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Job Title</p>
                          <Input
                            defaultValue={user.jobTitle || ''}
                            onBlur={(e) => updateProfile({ jobTitle: e.target.value })}
                            className="bg-transparent border-blue-500/20 text-xs text-blue-400 font-bold uppercase tracking-widest h-7 rounded-md px-2 placeholder:text-slate-600"
                            placeholder="Job Title (e.g. Owner/Manager)"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          onClick={(e) => { e.preventDefault(); updateProfile({ isHiring: true }); setShowHiringMenu(true); }}
                          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${user.isHiring ? 'bg-blue-500/20 text-blue-400 border-blue-500 hover:bg-blue-500/30' : 'bg-transparent text-slate-500 border-slate-700 hover:bg-slate-800'}`}>
                          [ Hiring ]
                        </Badge>
                        <Badge 
                          onClick={(e) => { e.preventDefault(); updateProfile({ isHiring: false }); setShowHiringMenu(false); }}
                          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${!user.isHiring ? 'bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500/30' : 'bg-transparent text-slate-500 border-slate-700 hover:bg-slate-800'}`}>
                          [ Not Hiring ]
                        </Badge>
                      </div>

                      <AnimatePresence>
                        {showHiringMenu && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full relative overflow-hidden"
                          >
                            <div className="mt-4 p-5 rounded-xl bg-blue-950/20 border border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] space-y-4">
                              <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Hiring Setup
                              </h5>




                              <div className="p-2 rounded-lg bg-slate-900/60 border border-blue-500/10 flex items-center gap-3">
                                <label className="text-[10px] font-black text-blue-300/70 uppercase tracking-widest shrink-0">
                                  Open Positions
                                </label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={999}
                                  maxLength={3}
                                  defaultValue={(user as any).openPositions ?? 0}
                                  onBlur={(e) => updateProfile({ openPositions: parseInt(e.target.value) || 0 })}
                                  className="bg-slate-950/50 border-blue-500/20 text-white text-xs font-bold h-6 w-12 rounded px-1 text-center"
                                  placeholder="0"
                                />
                              </div>

                              {/* Roles / Description */}
                              <div className="p-3 rounded-lg bg-slate-900/60 border border-blue-500/10">
                                <label className="text-[10px] font-black text-blue-300/70 uppercase tracking-widest block mb-2">
                                  Roles & Requirements
                                </label>
                                <Textarea
                                  defaultValue={user.hiringRoles ?? ''}
                                  onBlur={(e) => updateProfile({ hiringRoles: e.target.value })}
                                  className="bg-slate-950/50 border-blue-500/20 text-white text-sm min-h-[80px] rounded-lg resize-none"
                                  placeholder="e.g. Barista (full-time), Cashier (weekends)..."
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Business Links / Bottom Layer */}
                  <div className="px-8 py-6 bg-blue-950/20">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Business Links</h4>
                    <div className="space-y-3">
                      {/* Custom Links */}
                      {customLinks.map((link, idx) => (
                        <div key={idx} className="flex items-end gap-2">
                          <div className="space-y-1 flex-1">
                            <Input
                              defaultValue={link.label}
                              onBlur={(e) => {
                                const updated = [...customLinks];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                setCustomLinks(updated);
                                localStorage.setItem('f2f_custom_links', JSON.stringify(updated));
                              }}
                              className="bg-slate-950/50 border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest h-6 rounded px-2 placeholder:text-slate-600"
                              placeholder="Link Name"
                            />
                            <Input
                              defaultValue={link.url}
                              onBlur={(e) => {
                                const updated = [...customLinks];
                                updated[idx] = { ...updated[idx], url: e.target.value };
                                setCustomLinks(updated);
                                localStorage.setItem('f2f_custom_links', JSON.stringify(updated));
                              }}
                              className="bg-slate-950/50 border-blue-500/20 text-white text-sm font-bold h-9 rounded-lg placeholder:text-slate-600"
                              placeholder="https://..."
                              type="url"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const updated = customLinks.filter((_, i) => i !== idx);
                              setCustomLinks(updated);
                              localStorage.setItem('f2f_custom_links', JSON.stringify(updated));
                            }}
                            className="text-red-400/60 hover:text-red-400 text-xs font-bold mb-2"
                          >✕</button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const updated = [...customLinks, { label: '', url: '' }];
                          setCustomLinks(updated);
                          localStorage.setItem('f2f_custom_links', JSON.stringify(updated));
                        }}
                        className="w-full py-2 rounded-lg border-2 border-dashed border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                      >
                        + Add Link
                      </button>
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


          {/* Category Navigation */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-8 mt-20">
            <Button
              variant="outline"
              onClick={() => setLocation('/games')}
              className="px-6 h-12 rounded-xl border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all font-black uppercase tracking-widest text-[10px] gap-1.5 [&_svg]:!size-auto"
            >
              <Plus className="w-7 h-7 shrink-0 -skew-x-12" strokeWidth={4} /> <span className="text-2xl leading-none shrink-0 -scale-x-100 text-green-400">♘</span> Games
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/groups')}
              className="px-6 h-12 rounded-xl border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all font-black uppercase tracking-widest text-[10px] gap-1.5 [&_svg]:!size-auto"
            >
              <Plus className="w-7 h-7 shrink-0 -skew-x-12" strokeWidth={4} /> <Users className="w-5 h-5 shrink-0 text-green-400" /> Groups
            </Button>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center justify-center mt-3">
            <Button
              variant="outline"
              onClick={() => setLocation('/dating')}
              className="px-6 h-12 rounded-xl border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all font-black uppercase tracking-widest text-[10px] gap-1.5 [&_svg]:!size-auto"
            >
              <Plus className="w-7 h-7 shrink-0 -skew-x-12" strokeWidth={4} /> <Heart className="w-5 h-5 shrink-0 text-red-400" /> Dates
            </Button>
          </motion.div>

          {/* Edit button */}
          <motion.div variants={itemVariants} className="flex flex-col justify-center items-center max-w-[200px] mx-auto gap-2 mt-20">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="w-full h-11 rounded-xl border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  aria-label="F2F Store"
                  className="w-full h-11 rounded-xl border-yellow-500/50 bg-yellow-950/20 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 transition-all font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                  onClick={() => setLocation("/store")}
                >
                  <Star className="w-4 h-4" />
                  {user.isPremium ? "Premium Active" : "Get F2F+ / Buy Bumps"}
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Log out"
                  className="w-full h-9 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </>
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
                        <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Primary Website URL</FormLabel>
                            <FormControl><Input {...field} placeholder="https://..." className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="menuUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Menu / Deals URL</FormLabel>
                            <FormControl><Input {...field} placeholder="https://..." className="auth-input" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="bookingUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300 text-sm">Booking / Appointment URL</FormLabel>
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
                <div className="text-right">
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
