import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { calculateDistance } from "@/lib/distance";
import { Loader2, Search, Ruler, Weight, ShieldCheck, Star } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

export default function Dating() {
    const { currentLocation } = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();

    // Default filters
    const [showMen, setShowMen] = useState(true);
    const [showWomen, setShowWomen] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const isActive = user?.isActive ?? true;

    const { data: nearbyUsers = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/users/nearby", { radius: 25000, category: "dating" }],
        enabled: !!currentLocation && isActive,
        refetchInterval: 1000,
    });

    const filteredUsers = nearbyUsers.filter(u => {
        if (!showMen && u.gender === 'male') return false;
        if (!showWomen && u.gender === 'female') return false;
        return true;
    });

    const handleBump = async (message?: string) => {
        if (!selectedUser) return;
        try {
            await apiRequest("POST", "/api/bumps", {
                bumpedUserId: selectedUser.id,
                message,
            });

            toast({
                title: "Bump sent!",
                description: `You bumped ${selectedUser.firstName}! They will be notified.`,
            });
            setSelectedUser(null);
        } catch (error) {
            toast({
                title: "Bump failed",
                description: "Failed to send bump",
                variant: "destructive",
            });
        }
    };

    const getGenderBadge = (gender: string) => {
        if (gender === 'male') return { icon: 'â™‚', color: 'text-blue-400' };
        if (gender === 'female') return { icon: 'â™€', color: 'text-pink-400' };
        return { icon: 'âš¥', color: 'text-purple-400' };
    };

    return (
        <PageTransition className="h-screen w-full page-dark">
            <Header />
            <div className="fixed left-0 right-0 overflow-y-auto px-4" style={{ top: "40px", bottom: "64px" }}>
                <div className="w-full max-w-md mx-auto">
                    <div className="flex items-center justify-between pt-4 mb-4">
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Dating</span>
                        </h1>
                        {filteredUsers.length > 0 && (
                            <span className="text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/30">
                                {filteredUsers.length} matches
                            </span>
                        )}
                    </div>

                    {/* ═══════ TOP CENTER: Mode Toggles ═══════ */}
                    <div className="flex justify-center mb-6">
                        <div className="flex bg-white/90 border border-gray-200 p-1 rounded-full shadow-lg gap-1.5 items-center">
                            <button
                                onClick={() => {
                                    if (showMen && !showWomen) return; // Prevent both false
                                    setShowMen(!showMen);
                                }}
                                className={`w-12 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative ${showMen
                                    ? 'bg-blue-50/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                    : 'hover:bg-slate-50 opacity-60 hover:opacity-100'
                                    }`}
                                aria-label="Show men"
                            >
                                <svg width="20" height="20" viewBox="0 0 100 100" className={showMen ? "drop-shadow-sm" : ""}>
                                    {showMen && (
                                        <defs>
                                            <linearGradient id="blue-grad-explore" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#60a5fa" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    )}
                                    <polygon points="50,12 90,88 10,88" fill={showMen ? "url(#blue-grad-explore)" : "#94a3b8"} strokeLinejoin="round" />
                                </svg>
                            </button>
                            <div className="w-[1px] h-6 bg-gray-200 rounded-full"></div>
                            <button
                                onClick={() => {
                                    if (!showMen && showWomen) return; // Prevent both false
                                    setShowWomen(!showWomen);
                                }}
                                className={`w-12 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative ${showWomen
                                    ? 'bg-pink-50/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(236,72,153,0.15)] ring-1 ring-pink-500/20'
                                    : 'hover:bg-slate-50 opacity-60 hover:opacity-100'
                                    }`}
                                aria-label="Show women"
                            >
                                <svg width="20" height="20" viewBox="0 0 100 100" className={showWomen ? "drop-shadow-sm" : ""}>
                                    {showWomen && (
                                        <defs>
                                            <linearGradient id="pink-grad-explore" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#f472b6" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    )}
                                    <circle cx="50" cy="50" r="38" fill={showWomen ? "url(#pink-grad-explore)" : "#94a3b8"} />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center mt-10">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                        </div>
                    ) : nearbyUsers.length === 0 ? (
                        <div className="text-center mt-10 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h2 className="font-bold text-slate-300">No matches nearby yet</h2>
                            <p className="text-sm text-slate-400 mt-1">Make sure you are active and have location enabled.</p>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[10px] font-semibold">Every profile here is a real person</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 pb-4">
                            {filteredUsers.map((nearbyUser, i) => {
                                const genderInfo = getGenderBadge(nearbyUser.gender);
                                const categoryColor = nearbyUser.category === 'dating' ? 'pink' : nearbyUser.category === 'business' ? 'blue' : 'emerald';
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={nearbyUser.id}
                                        className="glass-card overflow-hidden cursor-pointer active:scale-95 transition-all duration-300 hover:border-slate-600/50"
                                        onClick={() => setSelectedUser(nearbyUser)}
                                    >
                                        <div className={`h-28 flex items-center justify-center relative bg-gradient-to-br from-${categoryColor}-500/10 to-slate-800/10`}>
                                            <Avatar className={`h-16 w-16 border-2 shadow-xl border-${categoryColor}-500/30`}>
                                                {nearbyUser.profilePhoto && (
                                                    <AvatarImage src={nearbyUser.profilePhoto} alt={nearbyUser.firstName} />
                                                )}
                                                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-slate-700 to-slate-800 text-white">
                                                    {nearbyUser.firstName[0]}{(nearbyUser.lastName || '')[0] || ''}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={`absolute top-2 right-2 text-lg drop-shadow-md ${genderInfo.color}`}>{genderInfo.icon}</span>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h2 className="font-bold text-white truncate text-sm flex-1">
                                                    {nearbyUser.firstName}, {nearbyUser.age}
                                                </h2>
                                                <div className="flex items-center gap-0.5 bg-slate-900/50 rounded-full px-1.5 py-0.5 border border-slate-700/50">
                                                    <Star className="w-2.5 h-2.5 text-yellow-500" />
                                                    <span className="text-[10px] font-bold text-amber-400">{nearbyUser.selfRating || 5}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize bg-${categoryColor}-500/15 text-${categoryColor}-400 border border-${categoryColor}-500/20`}>
                                                    {nearbyUser.category}
                                                </span>
                                                {nearbyUser.height && (
                                                    <span className="text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded-full text-cyan-400 flex items-center gap-0.5">
                                                        <Ruler className="w-2.5 h-2.5" />{nearbyUser.height}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {currentLocation && calculateDistance(currentLocation.latitude, currentLocation.longitude, nearbyUser.latitude, nearbyUser.longitude).toFixed(1)} mi away
                                            </p>
                                            {nearbyUser.seeking && (
                                                <div className="flex flex-wrap gap-0.5 mt-1.5">
                                                    {nearbyUser.seeking.split(",").slice(0, 2).map((item: string, idx: number) => (
                                                        <span key={idx} className="text-[9px] bg-slate-800 border border-slate-700/50 rounded-full px-1.5 py-0.5 text-slate-300 truncate max-w-[80px]">
                                                            {item.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full relative z-[200]">
                        <ProfileCard
                            user={selectedUser}
                            onClose={() => setSelectedUser(null)}
                            onConnect={handleBump}
                            distance={
                                currentLocation
                                    ? calculateDistance(
                                        currentLocation.latitude,
                                        currentLocation.longitude,
                                        selectedUser.latitude,
                                        selectedUser.longitude
                                    )
                                    : null
                            }
                        />
                    </div>
                </div>
            )}

            <BottomNavigation />
        </PageTransition>
    );
}
