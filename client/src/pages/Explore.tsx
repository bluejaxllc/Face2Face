import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { calculateDistance } from "@/lib/distance";
import { Loader2, Search, Ruler, Weight } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function Explore() {
    const { currentLocation } = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();

    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const isActive = user?.isActive ?? true;

    const { data: nearbyUsers = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/users/nearby", { radius: 25000, category: "both" }],
        enabled: !!currentLocation && isActive,
    });

    const handleConnect = async (targetUser: any) => {
        try {
            await apiRequest("POST", "/api/bumps", {
                bumpedUserId: targetUser.id,
            });

            toast({
                title: "Connection sent!",
                description: `You connected with ${targetUser.firstName}! They will be notified.`,
            });
            setSelectedUser(null);
        } catch (error) {
            toast({
                title: "Connect failed",
                description: "Failed to send connection",
                variant: "destructive",
            });
        }
    };

    const getGenderBadge = (gender: string) => {
        if (gender === 'male') return { icon: '♂', color: 'text-blue-400' };
        if (gender === 'female') return { icon: '♀', color: 'text-pink-400' };
        return { icon: '⚥', color: 'text-purple-400' };
    };

    return (
        <div className="min-h-screen w-full flex flex-col page-dark pb-20">
            <Header />
            <div className="flex-1 mt-14 px-4 w-full max-w-md mx-auto">
                <h1 className="text-2xl font-black text-white tracking-tight mb-4 pt-4">Explore</h1>

                {isLoading ? (
                    <div className="flex justify-center mt-10">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    </div>
                ) : nearbyUsers.length === 0 ? (
                    <div className="text-center mt-10 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-300">No users found</h3>
                        <p className="text-sm text-slate-500 mt-1">Make sure you are active to see nearby users.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {nearbyUsers.map((nearbyUser, i) => {
                            const genderInfo = getGenderBadge(nearbyUser.gender);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={nearbyUser.id}
                                    className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden cursor-pointer active:scale-95 transition-all duration-200 hover:border-pink-500/30"
                                    onClick={() => setSelectedUser(nearbyUser)}
                                >
                                    <div className="h-28 bg-gradient-to-br from-pink-500/10 to-blue-500/10 flex items-center justify-center relative">
                                        <Avatar className="h-16 w-16 border-2 border-slate-700 shadow-xl">
                                            {nearbyUser.profilePhoto && (
                                                <AvatarImage src={nearbyUser.profilePhoto} alt={nearbyUser.firstName} />
                                            )}
                                            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-slate-700 to-slate-800 text-white">
                                                {nearbyUser.firstName[0]}{(nearbyUser.lastName || '')[0] || ''}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className={`absolute top-2 right-2 text-lg ${genderInfo.color}`}>{genderInfo.icon}</span>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-white truncate text-sm">
                                            {nearbyUser.firstName}, {nearbyUser.age}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                                            <span className="text-[10px] font-medium bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-400 capitalize">
                                                {nearbyUser.category}
                                            </span>
                                            {nearbyUser.height && (
                                                <span className="text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded-full text-cyan-400 flex items-center gap-0.5">
                                                    <Ruler className="w-2.5 h-2.5" />{nearbyUser.height}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {currentLocation && calculateDistance(currentLocation.latitude, currentLocation.longitude, nearbyUser.latitude, nearbyUser.longitude).toFixed(1)} mi
                                        </p>
                                        {nearbyUser.seeking && (
                                            <div className="flex flex-wrap gap-0.5 mt-1">
                                                {nearbyUser.seeking.split(",").slice(0, 2).map((item: string, idx: number) => (
                                                    <span key={idx} className="text-[9px] bg-pink-950/50 border border-pink-800/30 rounded-full px-1.5 py-0.5 text-pink-300 truncate max-w-[80px]">
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

            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full relative z-[200]">
                        <ProfileCard
                            user={selectedUser}
                            onClose={() => setSelectedUser(null)}
                            onConnect={() => handleConnect(selectedUser)}
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
        </div>
    );
}
