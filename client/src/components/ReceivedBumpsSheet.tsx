import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeftRight, X, Clock, Eye, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { triggerHapticPattern } from "@/services/haptics-service";
import { useToast } from "@/hooks/use-toast";

interface ReceivedBump {
    id: number;
    userId: number;
    message: string | null;
    timestamp: string;
    sender: {
        id: number;
        firstName: string;
        lastName: string;
        sex: string;
        age: number;
        category: string;
        profilePhoto: string | null;
        latitude: number;
        longitude: number;
        favoriteColor?: string | null;
        favoriteSong?: string | null;
        fieldOfStudy?: string | null;
        seeking?: string | null;
    } | null;
}

interface ReceivedBumpsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBumpBack: (senderId: number) => void;
    onShowOnMap?: (lat: number, lng: number) => void;
}

export default function ReceivedBumpsSheet({ open, onOpenChange, onBumpBack, onShowOnMap }: ReceivedBumpsSheetProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [respondingId, setRespondingId] = useState<number | null>(null);

    const { data: receivedBumps = [] } = useQuery<ReceivedBump[]>({
        queryKey: ["/api/bumps/received"],
        refetchInterval: 5000,
        enabled: open,
    });

    const handleRespond = async (bumpId: number, action: "bump_back" | "ignore" | "reply_later", senderName: string, senderId?: number) => {
        setRespondingId(bumpId);
        try {
            await apiRequest("PATCH", `/api/bumps/${bumpId}/respond`, { action });

            if (action === "bump_back") {
                // Haptic: heartbeat for bump back confirmation
                triggerHapticPattern([100, 50, 100]);
                toast({ title: "Bumping back!", description: `Sending bump back to ${senderName}...` });
                onOpenChange(false);
                if (senderId) onBumpBack(senderId);
            } else if (action === "ignore") {
                toast({ title: "Ignored", description: `${senderName} has been notified.` });
            } else {
                toast({ title: "Reply later", description: `${senderName} will know you'll get back to them.` });
            }

            // Refresh bumps list
            queryClient.invalidateQueries({ queryKey: ["/api/bumps/received"] });
        } catch (error) {
            toast({ title: "Failed", description: "Could not respond to bump", variant: "destructive" });
        } finally {
            setRespondingId(null);
        }
    };

    const getInitials = (first: string, last: string) =>
        `${first[0]}${(last || '')[0] || ''}`.toUpperCase();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[75vh] bg-slate-900 border-t border-fuchsia-500/30 rounded-t-2xl text-white overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center text-white font-heading">
                        <Zap className="mr-2 h-5 w-5 text-fuchsia-400" />
                        Been Bumped ({receivedBumps.length})
                    </SheetTitle>
                </SheetHeader>

                {receivedBumps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Zap className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-sm text-slate-500 font-medium">No bumps yet</p>
                        <p className="text-xs text-slate-600 mt-1">When someone bumps you, they'll appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-8">
                        <AnimatePresence>
                            {receivedBumps.map((bump, index) => (
                                <motion.div
                                    key={bump.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 space-y-3"
                                >
                                    {/* Sender info */}
                                    {bump.sender && (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-[2px] rounded-full ${bump.sender.sex === 'male'
                                                ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                                : 'bg-gradient-to-br from-pink-400 to-rose-500'
                                                }`}>
                                                <Avatar className="h-12 w-12 border-2 border-slate-900">
                                                    <AvatarFallback className="text-sm font-bold bg-slate-800 text-slate-300">
                                                        {getInitials(bump.sender.firstName, bump.sender.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                    {bump.sender.firstName}, {bump.sender.age}
                                                    <span className="inline-flex">
                                                        {bump.sender.sex === 'male'
                                                            ? <svg width="12" height="12" viewBox="0 0 100 100"><polygon points="50,8 94,92 6,92" fill="#4285F4" stroke="#1a73e8" strokeWidth="6" strokeLinejoin="round" /></svg>
                                                            : <svg width="12" height="12" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#EA4335" stroke="#c5221f" strokeWidth="6" /></svg>
                                                        }
                                                    </span>
                                                </h4>

                                            </div>
                                            <span className="text-[10px] text-slate-600 font-mono">
                                                {new Date(bump.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Bump message */}
                                    {bump.message && (
                                        <div className="bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/30">
                                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{bump.message}</p>
                                        </div>
                                    )}

                                    {/* Response buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleRespond(bump.id, "bump_back", bump.sender?.firstName || "User", bump.sender?.id)}
                                            disabled={respondingId === bump.id}
                                            className="flex-1 h-10 rounded-xl text-xs font-bold tracking-wide bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-fuchsia-500/20 border border-fuchsia-400/30 text-white"
                                        >
                                            <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                                            Bump Back
                                        </Button>
                                        {onShowOnMap && bump.sender && (
                                            <Button
                                                onClick={() => {
                                                    onShowOnMap(bump.sender!.latitude, bump.sender!.longitude);
                                                    onOpenChange(false);
                                                }}
                                                variant="outline"
                                                className="h-10 rounded-xl text-xs font-bold tracking-wide bg-slate-800/50 border-blue-700/30 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                                            >
                                                <MapPin className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleRespond(bump.id, "reply_later", bump.sender?.firstName || "User")}
                                            disabled={respondingId === bump.id}
                                            variant="outline"
                                            className="h-10 rounded-xl text-xs font-bold tracking-wide bg-slate-800/50 border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
                                        >
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            Later
                                        </Button>
                                        <Button
                                            onClick={() => handleRespond(bump.id, "ignore", bump.sender?.firstName || "User")}
                                            disabled={respondingId === bump.id}
                                            variant="outline"
                                            className="h-10 rounded-xl text-xs font-bold tracking-wide bg-slate-800/50 border-red-900/30 text-red-400/70 hover:text-red-400 hover:bg-red-950/30"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
