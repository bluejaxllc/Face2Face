import { useState, useMemo } from "react";
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

/* ─── Category-responsive accent palette ─── */
type AccentPalette = {
    primary: string; glow: string; gradient: string; gradientHover: string;
    border: string; ring: string; text: string; orbFrom: string; orbTo: string;
    badgeBg: string; badgeText: string; subtleBg: string;
};

const PALETTES: Record<string, AccentPalette> = {
    dating: {
        primary: "fuchsia", glow: "shadow-fuchsia-500/30", gradient: "from-pink-500 via-fuchsia-500 to-rose-500",
        gradientHover: "hover:from-pink-600 hover:via-fuchsia-600 hover:to-rose-600",
        border: "border-fuchsia-500/20", ring: "from-pink-400 to-fuchsia-500",
        text: "text-fuchsia-400", orbFrom: "rgb(236 72 153 / 0.15)", orbTo: "rgb(217 70 239 / 0.08)",
        badgeBg: "bg-fuchsia-500/15", badgeText: "text-fuchsia-300",
        subtleBg: "bg-fuchsia-500/5",
    },
    friends: {
        primary: "emerald", glow: "shadow-emerald-500/30", gradient: "from-emerald-500 via-teal-500 to-green-500",
        gradientHover: "hover:from-emerald-600 hover:via-teal-600 hover:to-green-600",
        border: "border-emerald-500/20", ring: "from-emerald-400 to-teal-500",
        text: "text-emerald-400", orbFrom: "rgb(16 185 129 / 0.15)", orbTo: "rgb(20 184 166 / 0.08)",
        badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-300",
        subtleBg: "bg-emerald-500/5",
    },
    business: {
        primary: "blue", glow: "shadow-blue-500/30", gradient: "from-blue-500 via-indigo-500 to-violet-500",
        gradientHover: "hover:from-blue-600 hover:via-indigo-600 hover:to-violet-600",
        border: "border-blue-500/20", ring: "from-blue-400 to-indigo-500",
        text: "text-blue-400", orbFrom: "rgb(59 130 246 / 0.15)", orbTo: "rgb(99 102 241 / 0.08)",
        badgeBg: "bg-blue-500/15", badgeText: "text-blue-300",
        subtleBg: "bg-blue-500/5",
    },
};

function getAccent(): AccentPalette {
    try {
        const cat = localStorage.getItem("f2f_activeCategory") || "dating";
        return PALETTES[cat] || PALETTES.dating;
    } catch {
        return PALETTES.dating;
    }
}

/* ─── SVG noise texture (tiny inlined) ─── */
const NoiseOverlay = () => (
    <svg className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.035]" aria-hidden>
        <filter id="bumpNoise"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#bumpNoise)" />
    </svg>
);

/* ─── Floating background orbs ─── */
const FloatingOrb = ({ accent, i }: { accent: AccentPalette; i: number }) => {
    const size = [140, 100, 120][i % 3];
    const paths = [
        { x: [0, 40, -30, 0], y: [0, -50, 30, 0], dur: 14 },
        { x: [0, -35, 50, 0], y: [0, 40, -20, 0], dur: 18 },
        { x: [0, 25, -45, 0], y: [0, -35, 45, 0], dur: 16 },
    ];
    const p = paths[i % 3];
    const positions = [
        { top: "10%", right: "5%" },
        { bottom: "20%", left: "8%" },
        { top: "50%", right: "15%" },
    ];

    return (
        <motion.div
            className="absolute rounded-full blur-3xl pointer-events-none"
            style={{
                width: size, height: size, ...positions[i % 3],
                background: `radial-gradient(circle, ${accent.orbFrom}, ${accent.orbTo})`,
            }}
            animate={{ x: p.x, y: p.y, scale: [1, 1.15, 0.9, 1] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut" }}
        />
    );
};

/* ─── Relative timestamp helper ─── */
function relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Main Component ─── */
export default function ReceivedBumpsSheet({ open, onOpenChange, onBumpBack, onShowOnMap }: ReceivedBumpsSheetProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const accent = useMemo(getAccent, [open]);

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

    /* ─── Card entrance variants ─── */
    const cardVariants = {
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        visible: (i: number) => ({
            opacity: 1, y: 0, scale: 1,
            transition: { delay: i * 0.07, type: "spring", stiffness: 320, damping: 28 },
        }),
        exit: { opacity: 0, x: -120, scale: 0.95, transition: { duration: 0.25, ease: "easeIn" } },
    };

    /* ─── Count badge spring ─── */
    const badgeVariants = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 20 } },
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[78vh] rounded-t-3xl border-t bg-slate-950/95 backdrop-blur-xl text-white overflow-hidden p-0"
                style={{ borderColor: `var(--accent-border, rgba(168,85,247,0.2))` }}
            >
                {/* ── Noise overlay ── */}
                <NoiseOverlay />

                {/* ── Floating accent orbs ── */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    {[0, 1, 2].map(i => <FloatingOrb key={i} accent={accent} i={i} />)}
                </div>

                {/* ── Scrollable content layer ── */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* ── Drag handle ── */}
                    <div className="flex justify-center pt-3 pb-1">
                        <motion.div
                            className="w-10 h-1 rounded-full bg-white/20"
                            initial={{ scaleX: 0.5, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                        />
                    </div>

                    {/* ── Header ── */}
                    <SheetHeader className="px-5 pb-4 pt-1">
                        <SheetTitle className="flex items-center gap-3 text-white font-heading text-lg">
                            {/* Zap icon with glow ring */}
                            <motion.div
                                className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${accent.ring} shadow-lg ${accent.glow}`}
                                animate={{ rotate: [0, -8, 8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Zap className="w-5 h-5 text-white" fill="currentColor" />
                                <motion.div
                                    className="absolute inset-0 rounded-xl"
                                    style={{ background: `conic-gradient(from 0deg, transparent 70%, rgba(255,255,255,0.15) 100%)` }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>

                            {/* Title with gradient */}
                            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent tracking-tight">
                                Received Bumps
                            </span>

                            {/* Animated count badge */}
                            <AnimatePresence mode="wait">
                                {receivedBumps.length > 0 && (
                                    <motion.span
                                        key={receivedBumps.length}
                                        variants={badgeVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={`ml-auto inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold tracking-wide ${accent.badgeBg} ${accent.badgeText} border ${accent.border}`}
                                    >
                                        {receivedBumps.length}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </SheetTitle>
                    </SheetHeader>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto px-4 pb-8 scrollbar-thin scrollbar-thumb-white/10">
                        {receivedBumps.length === 0 ? (
                            /* ── Empty state ── */
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <motion.div className="relative mb-5">
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${accent.ring} blur-xl`}
                                        style={{ width: 72, height: 72, top: -8, left: -8 }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.8, 1], opacity: [0.15, 0, 0.15] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${accent.ring} blur-2xl`}
                                        style={{ width: 88, height: 88, top: -16, left: -16 }}
                                    />
                                    <motion.div
                                        className={`relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${accent.ring} shadow-lg ${accent.glow}`}
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Zap className="w-7 h-7 text-white" fill="currentColor" />
                                    </motion.div>
                                </motion.div>
                                <p className={`text-sm font-semibold bg-gradient-to-r ${accent.ring} bg-clip-text text-transparent tracking-wide`}>
                                    No bumps yet
                                </p>
                                <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                                    When someone nearby bumps you, they'll appear here
                                </p>
                            </div>
                        ) : (
                            /* ── Bump cards ── */
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {receivedBumps.map((bump, index) => (
                                        <motion.div
                                            key={bump.id}
                                            custom={index}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                            whileTap={{ scale: 0.98 }}
                                            className={`relative rounded-2xl border backdrop-blur-md p-4 space-y-3 ${accent.subtleBg} border-white/[0.06] bg-white/[0.03]`}
                                        >
                                            {/* ── Sender row ── */}
                                            {bump.sender && (
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar with animated gradient ring */}
                                                    <motion.div
                                                        className={`relative p-[2.5px] rounded-full bg-gradient-to-br ${
                                                            bump.sender.sex === 'male'
                                                                ? 'from-blue-400 via-indigo-400 to-blue-500'
                                                                : 'from-pink-400 via-rose-400 to-fuchsia-500'
                                                        }`}
                                                        animate={{ rotate: [0, 360] }}
                                                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                                        style={{ backgroundSize: "200% 200%" }}
                                                    >
                                                        <div className="rounded-full bg-slate-950 p-[2px]">
                                                            <Avatar className="h-14 w-14">
                                                                {bump.sender.profilePhoto && (
                                                                    <AvatarImage src={bump.sender.profilePhoto} alt={bump.sender.firstName} />
                                                                )}
                                                                <AvatarFallback className="text-sm font-bold bg-slate-800/80 text-slate-300">
                                                                    {getInitials(bump.sender.firstName, bump.sender.lastName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                        {/* Glow halo */}
                                                        <div className={`absolute -inset-1 rounded-full blur-md opacity-30 bg-gradient-to-br ${
                                                            bump.sender.sex === 'male' ? 'from-blue-400 to-indigo-500' : 'from-pink-400 to-rose-500'
                                                        } pointer-events-none`} />
                                                    </motion.div>

                                                    {/* Name + gender indicator */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                            {bump.sender.firstName}, {bump.sender.age}
                                                            <span className="inline-flex drop-shadow-sm">
                                                                {bump.sender.sex === 'male'
                                                                    ? <svg width="13" height="13" viewBox="0 0 100 100"><polygon points="50,8 94,92 6,92" fill="#60A5FA" stroke="#3B82F6" strokeWidth="5" strokeLinejoin="round" /><polygon points="50,8 94,92 6,92" fill="url(#mGlow)" opacity="0.3" /><defs><radialGradient id="mGlow"><stop offset="0%" stopColor="#93C5FD" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs></svg>
                                                                    : <svg width="13" height="13" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#FB7185" stroke="#F43F5E" strokeWidth="5" /><circle cx="50" cy="50" r="38" fill="url(#fGlow)" opacity="0.3" /><defs><radialGradient id="fGlow"><stop offset="0%" stopColor="#FDA4AF" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs></svg>
                                                                }
                                                            </span>
                                                        </h4>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3 text-slate-500" />
                                                            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                                                                {relativeTime(bump.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Glassmorphic message bubble ── */}
                                            {bump.message && (
                                                <div className="relative ml-[72px]">
                                                    {/* Speech triangle */}
                                                    <div className="absolute -left-2 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-white/[0.06]" />
                                                    <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl rounded-tl-sm px-3.5 py-2.5 border border-white/[0.06]">
                                                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                                            "{bump.message}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Action buttons ── */}
                                            <div className="flex gap-2 pt-0.5">
                                                {/* Bump Back — primary gradient */}
                                                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        onClick={() => handleRespond(bump.id, "bump_back", bump.sender?.firstName || "User", bump.sender?.id)}
                                                        disabled={respondingId === bump.id}
                                                        className={`w-full h-10 rounded-xl text-xs font-bold tracking-wide bg-gradient-to-r ${accent.gradient} ${accent.gradientHover} shadow-lg ${accent.glow} border border-white/10 text-white transition-shadow`}
                                                    >
                                                        <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                                                        Bump Back
                                                    </Button>
                                                </motion.div>

                                                {/* Map button */}
                                                {onShowOnMap && bump.sender && (
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                                                        <Button
                                                            onClick={() => {
                                                                onShowOnMap(bump.sender!.latitude, bump.sender!.longitude);
                                                                onOpenChange(false);
                                                            }}
                                                            variant="outline"
                                                            className="h-10 w-10 rounded-xl bg-white/[0.04] backdrop-blur-sm border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0"
                                                        >
                                                            <MapPin className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                )}

                                                {/* Later button */}
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        onClick={() => handleRespond(bump.id, "reply_later", bump.sender?.firstName || "User")}
                                                        disabled={respondingId === bump.id}
                                                        variant="outline"
                                                        className="h-10 rounded-xl text-xs font-bold tracking-wide bg-white/[0.03] backdrop-blur-sm border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                                                    >
                                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                                        Later
                                                    </Button>
                                                </motion.div>

                                                {/* Ignore button */}
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        onClick={() => handleRespond(bump.id, "ignore", bump.sender?.firstName || "User")}
                                                        disabled={respondingId === bump.id}
                                                        variant="outline"
                                                        className="h-10 rounded-xl text-xs font-bold tracking-wide bg-white/[0.02] border-red-500/15 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
