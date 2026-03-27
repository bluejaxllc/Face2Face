import { useState, useRef } from "react";
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
import { Loader2, Camera, LogOut, Star, Heart, MapPin, Music, Palette, BookOpen, MessageCircle, Ruler, Weight, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

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
  category: z.string().default("casual"),
  bio: z.string().max(250, "Bio must be less than 250 characters").optional(),
  datingPreference: z.string().default("all"),
  seeking: z.string().optional(),
  favoriteColor: z.string().optional(),
  favoriteSong: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  interests: z.string().optional(),
  isActive: z.boolean().default(true),
  inactiveTimeout: z.coerce.number().min(5).max(120).default(30),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
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
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      gender: user?.gender || "other",
      age: user?.age || 18,
      height: user?.height || "",
      weight: user?.weight || "",
      selfRating: user?.selfRating || 5,
      category: user?.category || "casual",
      bio: user?.bio || "",
      datingPreference: user?.datingPreference || "all",
      seeking: user?.seeking || "",
      favoriteColor: user?.favoriteColor || "",
      favoriteSong: user?.favoriteSong || "",
      fieldOfStudy: user?.fieldOfStudy || "",
      interests: user?.interests || "",
      isActive: user?.isActive ?? true,
      inactiveTimeout: user?.inactiveTimeout || 30,
    },
  });

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

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center page-dark">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <p className="mt-2 text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <PageTransition className="h-screen page-dark">
      <Header />

      <motion.div
        className="fixed left-0 right-0 overflow-y-auto pb-6 page-enter"
        style={{ top: "48px", bottom: "52px" }}
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

            <h2 className="mt-4 text-2xl font-bold text-white font-heading flex items-center justify-center gap-1.5">
              {user.firstName} {user.lastName}
              <span className={`text-lg ${user.gender === 'male' ? 'text-blue-400' : user.gender === 'female' ? 'text-pink-400' : 'text-purple-400'}`}>
                {user.gender === 'male' ? '♂' : user.gender === 'female' ? '♀' : '⚥'}
              </span>
            </h2>
            <p className="text-slate-400 text-sm">@{user.username} · {user.age || 18} years old</p>

            <div className="flex justify-center mt-3 gap-2">
              <span className={user.category === "casual" ? "badge-casual" : "badge-intimate"}>
                {user.category === "casual" ? "Casual" : "Intimate"}
              </span>
              <span className={user.isActive ? "badge-active" : "badge-inactive"}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={itemVariants} className="px-4 -mt-2 relative z-20">
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl py-3 px-2 text-center text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1 drop-shadow-md" />
              <p className="text-lg font-bold text-amber-400 font-heading">{'⭐'.repeat(Math.min(5, Math.round((user.selfRating || 5) / 2)))}</p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Rating</p>
            </div>
            <div className="stat-card hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl py-3 px-2 text-center text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1 drop-shadow-md" />
              <p className="text-xl font-bold text-white font-heading capitalize">
                {user.datingPreference === "all" ? "All" : user.datingPreference}
              </p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Looking for</p>
            </div>
            <div className="stat-card hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl py-3 px-2 text-center text-white relative overflow-hidden group">
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
        )}

        <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
          {/* Favorites view (when not editing) */}
          {!isEditing && (
            <motion.div variants={itemVariants} className="glass-card p-5 relative overflow-hidden group hover:border-slate-600/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
              <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-wide uppercase">Favorites & Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Ruler className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Height</p>
                    <p className="text-sm text-slate-200">{user.height || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Weight className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Weight</p>
                    <p className="text-sm text-slate-200">{user.weight || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Music</p>
                    <p className="text-sm text-slate-200">{user.favoriteSong || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Palette className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Favorite Color</p>
                    <p className="text-sm text-slate-200">{user.favoriteColor || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Field of Study/Work</p>
                    <p className="text-sm text-slate-200">{user.fieldOfStudy || "Not set"}</p>
                  </div>
                </div>
              </div>
              {user.seeking && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Seeking</p>
                  <div className="flex flex-wrap gap-1">
                    {user.seeking.split(",").map((item: string, i: number) => (
                      <span key={i} className="text-xs bg-pink-950/50 border border-pink-800/50 rounded-full px-2 py-0.5 text-pink-300">
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.interests && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {user.interests.split(",").map((interest: string, i: number) => (
                      <span key={i} className="text-xs bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 text-slate-300">
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
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Personal Info</h4>
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
                            <SelectItem value="other">Other</SelectItem>
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
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preferences</h4>
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
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="intimate">Intimate</SelectItem>
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
                            <SelectItem value="all">Everyone</SelectItem>
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
                      <FormDescription className="text-slate-500 text-xs">Comma-separated list of what you're looking for</FormDescription>
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
                        <FormDescription className="text-slate-500 text-xs">Comma-separated list</FormDescription>
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
                      <FormDescription className="text-slate-500 text-xs">Max 250 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="isActive" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between glass-card p-3">
                        <div>
                          <FormLabel className="text-slate-300 text-sm">Active</FormLabel>
                          <FormDescription className="text-slate-500 text-xs">Show on map</FormDescription>
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
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm text-slate-200 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Username</p>
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
