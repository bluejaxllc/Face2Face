import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Vibrate, Check, ShieldCheck, Loader2 } from "lucide-react";
import { MotionService } from "@/services/motion-service";
import { triggerHaptic, isHapticsSupported } from "@/services/haptics-service";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "f2f_sensor_permission_granted";

interface SensorPermissionGateProps {
    children: React.ReactNode;
}

/* ── Category-aware accent palette ─────────────────────────── */
const CATEGORY_PALETTES: Record<string, { from: string; via: string; to: string; glow: string }> = {
    dating:    { from: "#ec4899", via: "#a855f7", to: "#6366f1", glow: "rgba(236,72,153,0.35)" },
    business:  { from: "#3b82f6", via: "#6366f1", to: "#8b5cf6", glow: "rgba(99,102,241,0.35)" },
    social:    { from: "#f59e0b", via: "#f97316", to: "#ef4444", glow: "rgba(245,158,11,0.35)" },
    default:   { from: "#3b82f6", via: "#6366f1", to: "#d946ef", glow: "rgba(99,102,241,0.35)" },
};

function getAccent() {
    try {
        const cat = localStorage.getItem("f2f_activeCategory") || "default";
        return CATEGORY_PALETTES[cat] ?? CATEGORY_PALETTES.default;
    } catch { return CATEGORY_PALETTES.default; }
}

/* ── SVG noise texture (inlined, no external asset) ────────── */
const NoiseOverlay = () => (
    <svg className="pointer-events-none fixed inset-0 z-[1] w-full h-full opacity-[0.035]" aria-hidden>
        <filter id="spg-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#spg-noise)" />
    </svg>
);

/* ── Floating particle orbs ────────────────────────────────── */
const FloatingOrbs = () => {
    const orbs = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
        id: i,
        size: 4 + Math.random() * 10,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 14 + Math.random() * 12,
        delay: Math.random() * -8,
        color: ["#3b82f6", "#d946ef", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#22d3ee"][i],
        opacity: 0.15 + Math.random() * 0.25,
    })), []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden>
            {orbs.map((o) => (
                <motion.div
                    key={o.id}
                    className="absolute rounded-full"
                    style={{
                        width: o.size,
                        height: o.size,
                        left: `${o.x}%`,
                        top: `${o.y}%`,
                        background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
                        opacity: o.opacity,
                        filter: `blur(${o.size * 0.4}px)`,
                    }}
                    animate={{
                        x: [0, 30, -20, 15, 0],
                        y: [0, -25, 15, -10, 0],
                        scale: [1, 1.3, 0.9, 1.15, 1],
                        opacity: [o.opacity, o.opacity * 1.4, o.opacity * 0.7, o.opacity * 1.2, o.opacity],
                    }}
                    transition={{
                        duration: o.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: o.delay,
                    }}
                />
            ))}
        </div>
    );
};

/* ── Concentric pulse rings ────────────────────────────────── */
const PulseRings = ({ color }: { color: string }) => (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{ borderColor: color, width: 96, height: 96 }}
                animate={{ scale: [1, 2.2 + i * 0.4], opacity: [0.4, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
            />
        ))}
    </div>
);

/* ── Particle burst for success state ──────────────────────── */
const ParticleBurst = () => {
    const particles = useMemo(() => Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 60 + Math.random() * 50;
        return {
            id: i,
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            color: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"][i % 4],
            size: 3 + Math.random() * 4,
        };
    }), []);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{ width: p.size, height: p.size, background: p.color }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            ))}
        </div>
    );
};

/* ── Feature card data ─────────────────────────────────────── */
const FEATURES = [
    {
        Icon: Vibrate,
        label: "Haptic Feedback",
        desc: "Feel bumps with vibration patterns",
        badgeColor: "from-fuchsia-500/30 to-fuchsia-600/10",
        borderColor: "border-fuchsia-500/20",
        iconColor: "text-fuchsia-400",
        glowColor: "rgba(217,70,239,0.15)",
    },
    {
        Icon: Smartphone,
        label: "Motion Detection",
        desc: "Bump by moving your phone toward someone",
        badgeColor: "from-blue-500/30 to-blue-600/10",
        borderColor: "border-blue-500/20",
        iconColor: "text-blue-400",
        glowColor: "rgba(59,130,246,0.15)",
    },
    {
        Icon: ShieldCheck,
        label: "Privacy First",
        desc: "Sensor data stays on your device",
        badgeColor: "from-emerald-500/30 to-emerald-600/10",
        borderColor: "border-emerald-500/20",
        iconColor: "text-emerald-400",
        glowColor: "rgba(16,185,129,0.15)",
    },
];

/**
 * One-time overlay that captures a user gesture to:
 * 1. Request iOS 13+ DeviceMotionEvent / DeviceOrientationEvent permission
 * 2. Test haptic feedback
 * 3. Stores permission state in localStorage so it never shows again
 *
 * This is REQUIRED because modern browser security policies demand
 * a direct user gesture before granting IMU sensor access.
 */
export default function SensorPermissionGate({ children }: SensorPermissionGateProps) {
    const { isAuthenticated } = useAuth();
    const [permissionGranted, setPermissionGranted] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) === "true";
    });
    const [isRequesting, setIsRequesting] = useState(false);
    const [step, setStep] = useState<"intro" | "granted">("intro");
    const accent = useMemo(getAccent, []);

    // Skip gate entirely for non-authenticated users (Register page doesn't need sensors)
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    const handleEnableSensors = async () => {
        setIsRequesting(true);

        try {
            // 1. Request iOS DeviceMotionEvent permission (if needed)
            if (typeof DeviceMotionEvent !== 'undefined' &&
                typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                const motionPerm = await (DeviceMotionEvent as any).requestPermission();
                if (motionPerm !== 'granted') {
                    console.warn('[SensorGate] Motion permission denied');
                }
            }

            // 2. Request iOS DeviceOrientationEvent permission (if needed)
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                const orientPerm = await (DeviceOrientationEvent as any).requestPermission();
                if (orientPerm !== 'granted') {
                    console.warn('[SensorGate] Orientation permission denied');
                }
            }

            // 3. Test haptic feedback (this user tap is the gesture we need)
            triggerHaptic(100);

        } catch (err) {
            console.warn('[SensorGate] Permission request error:', err);
            // Still proceed — permissions might just not be available on this device
        }

        // Mark as granted regardless (we don't block the app if sensors unavailable)
        localStorage.setItem(STORAGE_KEY, "true");
        setStep("granted");

        // Brief success animation, then dismiss
        setTimeout(() => {
            setPermissionGranted(true);
        }, 1500);

        setIsRequesting(false);
    };

    // Skip gate on desktop or when already granted
    const handleSkip = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setPermissionGranted(true);
    };

    const gradientCSS = `linear-gradient(135deg, ${accent.from}, ${accent.via}, ${accent.to})`;

    return (
        <>
            {children}
            <AnimatePresence>
                {!permissionGranted && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
                    style={{ background: "rgba(2, 6, 23, 0.97)" }}
                >
                    {/* Animated radial gradient pulse */}
                    <motion.div
                        className="pointer-events-none fixed inset-0 z-[0]"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${accent.from}15 0%, transparent 70%)`,
                        }}
                    />

                    <NoiseOverlay />
                    <FloatingOrbs />

                    {step === "intro" ? (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 180, damping: 22 }}
                            className="relative z-10 max-w-sm w-full text-center"
                        >
                            {/* ── Main Icon Block ─────────────────────── */}
                            <div className="relative mx-auto mb-8 w-24 h-24 flex items-center justify-center">
                                {/* Rotating conic gradient ring */}
                                <motion.div
                                    className="absolute -inset-3 rounded-3xl opacity-40"
                                    style={{
                                        background: `conic-gradient(from 0deg, ${accent.from}, ${accent.via}, ${accent.to}, transparent, ${accent.from})`,
                                        filter: "blur(8px)",
                                    }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                />

                                {/* Pulse rings */}
                                <PulseRings color={accent.from + "40"} />

                                {/* Glassmorphic icon card */}
                                <div
                                    className="relative w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                                    style={{
                                        background: "rgba(15, 23, 42, 0.6)",
                                        backdropFilter: "blur(16px)",
                                        WebkitBackdropFilter: "blur(16px)",
                                        border: "1px solid rgba(148, 163, 184, 0.15)",
                                        boxShadow: `0 0 40px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                                    }}
                                >
                                    {/* Double inner border glow */}
                                    <div
                                        className="absolute inset-[2px] rounded-[14px] pointer-events-none"
                                        style={{ border: `1px solid ${accent.from}20` }}
                                    />
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Smartphone className="w-10 h-10" style={{ color: accent.from }} />
                                    </motion.div>
                                </div>
                            </div>

                            {/* ── Title ────────────────────────────────── */}
                            <h2 className="text-[1.65rem] font-black text-white tracking-tight leading-tight mb-2">
                                Enable{" "}
                                <span
                                    className="text-transparent bg-clip-text"
                                    style={{ backgroundImage: gradientCSS }}
                                >
                                    Bump Features
                                </span>
                            </h2>

                            <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-[280px] mx-auto">
                                Face2Face uses your phone's motion sensors and haptic feedback
                                to create real, physical bump interactions nearby.
                            </p>

                            {/* ── Feature Cards ───────────────────────── */}
                            <div className="space-y-3 mb-8 text-left">
                                {FEATURES.map((feat, idx) => (
                                    <motion.div
                                        key={feat.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 22,
                                            delay: 0.15 + idx * 0.1,
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        className="group flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-shadow duration-300"
                                        style={{
                                            background: "rgba(15, 23, 42, 0.45)",
                                            backdropFilter: "blur(12px)",
                                            WebkitBackdropFilter: "blur(12px)",
                                            border: "1px solid rgba(148, 163, 184, 0.1)",
                                            boxShadow: `0 0 0px ${feat.glowColor}`,
                                        }}
                                        onHoverStart={(e) => {
                                            (e as any).target?.style && ((e as any).currentTarget.style.boxShadow = `0 0 24px ${feat.glowColor}`);
                                        }}
                                        onHoverEnd={(e) => {
                                            (e as any).target?.style && ((e as any).currentTarget.style.boxShadow = `0 0 0px ${feat.glowColor}`);
                                        }}
                                    >
                                        {/* Icon badge */}
                                        <div
                                            className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${feat.badgeColor} ${feat.borderColor} border flex items-center justify-center`}
                                        >
                                            <feat.Icon className={`w-5 h-5 ${feat.iconColor}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 tracking-wide">
                                                {feat.label}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-snug">
                                                {feat.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* ── CTA Button ──────────────────────────── */}
                            <motion.button
                                onClick={handleEnableSensors}
                                disabled={isRequesting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-full h-14 rounded-2xl font-black text-base tracking-wide text-white overflow-hidden disabled:opacity-70 disabled:cursor-wait"
                                style={{
                                    background: gradientCSS,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                }}
                            >
                                {/* Breathing glow shadow */}
                                <motion.div
                                    className="absolute -inset-1 rounded-2xl pointer-events-none"
                                    style={{ background: gradientCSS, filter: "blur(18px)", opacity: 0.35 }}
                                    animate={{ opacity: [0.25, 0.5, 0.25] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                />

                                {/* Shimmer sweep */}
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
                                    }}
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                                />

                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isRequesting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Enabling...
                                        </>
                                    ) : (
                                        "Enable Sensors & Enter"
                                    )}
                                </span>
                            </motion.button>

                            {/* ── Skip Link (glassmorphic pill) ────────── */}
                            <motion.button
                                onClick={handleSkip}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-5 mx-auto block text-xs text-slate-500 hover:text-slate-300 transition-colors px-5 py-2 rounded-full"
                                style={{
                                    background: "rgba(30, 41, 59, 0.45)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    border: "1px solid rgba(148, 163, 184, 0.08)",
                                }}
                            >
                                Skip for now (sensors won't work)
                            </motion.button>
                        </motion.div>
                    ) : (
                        /* ── Success State ─────────────────────────── */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 350, damping: 20 }}
                            className="relative z-10 text-center"
                        >
                            {/* White flash overlay */}
                            <motion.div
                                className="fixed inset-0 pointer-events-none z-[0]"
                                initial={{ opacity: 0.6 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                style={{ background: "white" }}
                            />

                            {/* Particle burst */}
                            <ParticleBurst />

                            {/* Success icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                                className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-5"
                                style={{
                                    background: "rgba(16, 185, 129, 0.12)",
                                    border: "2px solid rgba(52, 211, 153, 0.4)",
                                    boxShadow: "0 0 60px rgba(16, 185, 129, 0.25), 0 0 120px rgba(16, 185, 129, 0.1)",
                                }}
                            >
                                {/* Rotating glow ring */}
                                <motion.div
                                    className="absolute -inset-2 rounded-full opacity-30"
                                    style={{
                                        background: "conic-gradient(from 0deg, #10b981, #34d399, transparent, #10b981)",
                                        filter: "blur(6px)",
                                    }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                />
                                <Check className="w-11 h-11 text-emerald-400 relative z-10" />
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="text-xl font-black tracking-tight"
                            >
                                <span
                                    className="text-transparent bg-clip-text"
                                    style={{
                                        backgroundImage: "linear-gradient(135deg, #10b981, #34d399, #6ee7b7)",
                                    }}
                                >
                                    You're all set!
                                </span>
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm text-slate-400 mt-1.5"
                            >
                                Sensors enabled. Let's go.
                            </motion.p>
                        </motion.div>
                    )}
                </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
