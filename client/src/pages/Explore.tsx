import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { calculateDistance } from "@/lib/distance";
import { Loader2, Search } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import ConnectOverlay from "@/components/ConnectOverlay";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Explore() {
    const { currentLocation } = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();

    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isConnectingOverlayActive, setIsConnectingOverlayActive] = useState(false);
    const isActive = user?.isActive ?? true;

    const { data: nearbyUsers = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/users/nearby", { radius: 25000, category: "both" }],
        enabled: !!currentLocation && isActive,
    });

    const handleOpenConnect = (currentUser: any) => {
        setSelectedUser(currentUser);
        setIsConnectingOverlayActive(true);
    };

    const handlePhysicalConnectSuccess = async () => {
        if (!selectedUser) return;
        setIsConnectingOverlayActive(false);

        try {
            await apiRequest("POST", "/api/bumps", {
                bumpedUserId: selectedUser.id,
            });

            toast({
                title: "Connection successful!",
                description: `You connected with ${selectedUser.firstName}! They will be notified.`,
            });
            setSelectedUser(null);
        } catch (error) {
            toast({
                title: "Connect failed",
                description: "Failed to connect into this user",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-slate-50 pb-20">
            <Header />
            <div className="flex-1 mt-14 px-4 w-full max-w-md mx-auto">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-4 pt-4">Explore</h1>

                {isLoading ? (
                    <div className="flex justify-center mt-10">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    </div>
                ) : nearbyUsers.length === 0 ? (
                    <div className="text-center mt-10 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-600">No users found</h3>
                        <p className="text-sm text-slate-500 mt-1">Make sure you are active to see nearby users.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {nearbyUsers.map((nearbyUser) => (
                            <div
                                key={nearbyUser.id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer active:scale-95 transition-transform pb-2"
                                onClick={() => setSelectedUser(nearbyUser)}
                            >
                                <div className="h-28 bg-gradient-to-br from-pink-400/20 to-blue-500/20 flex items-center justify-center">
                                    <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                                        <AvatarFallback className="text-xl font-bold bg-slate-800 text-white">
                                            {nearbyUser.firstName[0]}{(nearbyUser.lastName || '')[0] || ''}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="p-3 bg-white">
                                    <h3 className="font-bold text-slate-800 truncate">{nearbyUser.firstName}, {nearbyUser.age}</h3>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-slate-500 capitalize">{nearbyUser.category}</span>
                                        <span className="text-[10px] font-medium bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                                            {currentLocation && calculateDistance(currentLocation.latitude, currentLocation.longitude, nearbyUser.latitude, nearbyUser.longitude).toFixed(1)} mi
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedUser && !isConnectingOverlayActive && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full relative z-[200]">
                        <ProfileCard
                            user={selectedUser}
                            onClose={() => setSelectedUser(null)}
                            onConnect={() => handleOpenConnect(selectedUser)}
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

            {isConnectingOverlayActive && selectedUser && currentLocation && (
                <BumpOverlay
                    onSuccess={handlePhysicalConnectSuccess}
                    onCancel={() => setIsConnectingOverlayActive(false)}
                    targetUser={selectedUser}
                    currentLocation={currentLocation}
                />
            )}

            <BottomNavigation />
        </div>
    );
}
