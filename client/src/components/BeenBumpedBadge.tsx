import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { triggerHeartbeatHaptic } from "@/services/haptics-service";

interface BeenBumpedBadgeProps {
    onClick: () => void;
}

export default function BeenBumpedBadge({ onClick }: BeenBumpedBadgeProps) {
    const { data: receivedBumps = [] } = useQuery<any[]>({
        queryKey: ["/api/bumps/received"],
        refetchInterval: 5000,
        staleTime: 3000,
    });

    const count = receivedBumps.length;

    // Trigger heartbeat haptic when new bumps arrive (cross-platform)
    if (count > 0 && typeof window !== 'undefined') {
        const lastVibCount = parseInt(sessionStorage.getItem('f2f_lastVibCount') || '0');
        if (count > lastVibCount) {
            triggerHeartbeatHaptic();
            sessionStorage.setItem('f2f_lastVibCount', count.toString());
        }
    }

    if (count === 0) return null;

    return (
        <AnimatePresence>
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={onClick}
                className="flex items-center gap-1.5 bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-500/40 rounded-full px-3 py-1.5 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:bg-fuchsia-500/30 transition-all active:scale-95"
            >
                {/* Pulsing dot */}
                <span className="relative">
                    <Zap className="w-4 h-4 text-fuchsia-400" />
                    <motion.span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-fuchsia-400"
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </span>
                <span className="text-xs font-black text-fuchsia-300 tracking-wide">
                    {count}
                </span>
                <span className="text-[10px] text-fuchsia-400/70 font-semibold uppercase tracking-wider">
                    Bumped
                </span>
            </motion.button>
        </AnimatePresence>
    );
}
