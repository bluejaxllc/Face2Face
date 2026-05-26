import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUp, Smartphone, MoveUp, Zap, Check } from "lucide-react";
import { triggerBumpHaptic } from "@/services/haptics-service";

/* ─── props (unchanged) ─── */
interface ConnectOverlayProps {
    onSuccess: () => void;
    onCancel: () => void;
    targetUser: { firstName: string; latitude: number; longitude: number };
    currentLocation: { latitude: number; longitude: number };
}

/* ─── category color map ─── */
type CategoryKey = "dating" | "friends" | "business";
const PALETTE: Record<CategoryKey, { from: string; via: string; to: string; glow: string; badge: string }> = {
    dating:   { from: "#fb7185", via: "#f472b6", to: "#e879f9", glow: "rgba(244,114,182,0.35)", badge: "bg-pink-500/20 text-pink-300" },
    friends:  { from: "#34d399", via: "#2dd4bf", to: "#22d3ee", glow: "rgba(45,212,191,0.35)",  badge: "bg-emerald-500/20 text-emerald-300" },
    business: { from: "#60a5fa", via: "#818cf8", to: "#a78bfa", glow: "rgba(129,140,248,0.35)", badge: "bg-indigo-500/20 text-indigo-300" },
};

function getCategory(): CategoryKey {
    const raw = localStorage.getItem("f2f_activeCategory");
    if (raw === "friends" || raw === "business") return raw;
    return "dating";
}

/* ─── SVG noise filter (static, no extra file) ─── */
const NoiseSVG = () => (
    <svg className="fixed inset-0 w-full h-full pointer-events-none z-[1] opacity-[0.04]" aria-hidden>
        <filter id="bumpNoise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#bumpNoise)" />
    </svg>
);

/* ─── floating energy particle ─── */
const EnergyOrb = ({ i, color }: { i: number; color: string }) => {
    const size = 4 + Math.random() * 6;
    const left = 10 + Math.random() * 80;
    const dur = 6 + Math.random() * 6;
    const delay = Math.random() * 4;
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ width: size, height: size, left: `${left}%`, bottom: -10, background: color, boxShadow: `0 0 ${size * 2}px ${color}` }}
            animate={{ y: [0, -(window.innerHeight + 40)], x: [0, (Math.random() - 0.5) * 80], opacity: [0, 0.8, 0.6, 0] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
        />
    );
};

/* ─── sonar radar ring ─── */
const RadarRing = ({ delay, color }: { delay: number; color: string }) => (
    <motion.div
        className="absolute inset-0 rounded-full border pointer-events-none"
        style={{ borderColor: color }}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: [1, 2.4], opacity: [0.45, 0] }}
        transition={{ duration: 2.4, delay, repeat: Infinity, ease: "easeOut" }}
    />
);

/* ─── success burst particle ─── */
const BurstParticle = ({ angle, color }: { angle: number; color: string }) => {
    const rad = (angle * Math.PI) / 180;
    const dist = 100 + Math.random() * 80;
    return (
        <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}`, top: "50%", left: "50%" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        />
    );
};

/* ─── step data ─── */
const STEPS = [
    { icon: Smartphone, label: "Hold phone up" },
    { icon: MoveUp,     label: "Move toward them" },
    { icon: Zap,        label: "Bump!" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function ConnectOverlay({ onSuccess, onCancel, targetUser, currentLocation }: ConnectOverlayProps) {
    const [rotation, setRotation] = useState(0);
    const [instruction, setInstruction] = useState("Hold your phone up and move towards them");
    const [bumped, setBumped] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const isConnectingRef = useRef(false);

    const category = useMemo(getCategory, []);
    const pal = PALETTE[category];

    /* ── animated step cycling ── */
    useEffect(() => {
        if (bumped) return;
        const id = setInterval(() => setActiveStep(s => (s + 1) % 3), 2800);
        return () => clearInterval(id);
    }, [bumped]);

    /* ── bearing calculation (original) ── */
    useEffect(() => {
        const lat1 = (currentLocation.latitude * Math.PI) / 180;
        const lon1 = (currentLocation.longitude * Math.PI) / 180;
        const lat2 = (targetUser.latitude * Math.PI) / 180;
        const lon2 = (targetUser.longitude * Math.PI) / 180;

        const dLon = lon2 - lon1;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const brng = Math.atan2(y, x);
        const bearingDeg = ((brng * 180) / Math.PI + 360) % 360;

        setRotation(0);
    }, [currentLocation, targetUser]);

    /* ── motion detection (original logic preserved) ── */
    useEffect(() => {
        let cleanup: (() => void) | null = null;

        const startMotionDetection = async () => {
            try {
                // iOS 13+ requires explicit permission request from user gesture
                if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                    const permission = await (DeviceMotionEvent as any).requestPermission();
                    if (permission !== 'granted') return;
                }

                const handleMotion = (event: DeviceMotionEvent) => {
                    if (isConnectingRef.current) return;

                    const accel = event.accelerationIncludingGravity;
                    if (!accel) return;

                    const accY = Math.abs(accel.y ?? 0);
                    const accZ = Math.abs(accel.z ?? 0);

                    if (accY > 15 || accZ > 15) {
                        isConnectingRef.current = true;
                        handlePhysicalConnectDetected();
                    }
                };

                window.addEventListener('devicemotion', handleMotion);
                cleanup = () => window.removeEventListener('devicemotion', handleMotion);

            } catch (err) {
                console.warn("Motion detection not supported or permission denied", err);
                setInstruction("Motion not available. Tap the circle below to connect.");
            }
        };

        startMotionDetection();

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    /* ── bump handler (original + cinematic state) ── */
    const handlePhysicalConnectDetected = async () => {
        setBumped(true);
        setInstruction("Bump Sent! ✨");

        // Use the cross-platform haptics service
        triggerBumpHaptic();

        setTimeout(() => {
            onSuccess();
        }, 1500);
    };

    /* ── gradient string helper ── */
    const grad = `linear-gradient(135deg, ${pal.from}, ${pal.via}, ${pal.to})`;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[3000] flex flex-col items-center justify-center overflow-hidden select-none"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* ── background layers ── */}
                <div className="absolute inset-0 bg-slate-950" />

                {/* breathing radial pulse */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 45%, ${pal.glow} 0%, transparent 65%)` }}
                    animate={{ opacity: [0.5, 0.85, 0.5] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* rotating conic ring */}
                <motion.div
                    className="absolute w-[340px] h-[340px] rounded-full pointer-events-none opacity-20"
                    style={{
                        top: "50%", left: "50%", x: "-50%", y: "-55%",
                        background: `conic-gradient(from 0deg, ${pal.from}, transparent 40%, ${pal.to}, transparent 80%, ${pal.from})`,
                        maskImage: "radial-gradient(circle, transparent 42%, black 44%, black 48%, transparent 50%)",
                        WebkitMaskImage: "radial-gradient(circle, transparent 42%, black 44%, black 48%, transparent 50%)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                <NoiseSVG />

                {/* floating energy orbs */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <EnergyOrb key={i} i={i} color={i % 2 === 0 ? pal.from : pal.to} />
                ))}

                {/* ── close button ── */}
                <motion.button
                    onClick={onCancel}
                    className="absolute top-8 right-8 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X className="w-5 h-5" />
                </motion.button>

                {/* ── category badge ── */}
                <motion.div
                    className={`absolute top-9 left-8 z-10 px-3 py-1 rounded-full text-xs font-semibold tracking-wide capitalize backdrop-blur-xl border border-white/10 ${pal.badge}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {category}
                </motion.div>

                {/* ── header ── */}
                <motion.div
                    className="relative z-10 text-center mb-8"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                >
                    <h2
                        className="text-4xl font-black tracking-tight mb-2"
                        style={{ background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                    >
                        {bumped ? "BUMPED!" : "Ready to Bump?"}
                    </h2>

                    {/* pulsing search indicator */}
                    {!bumped && (
                        <motion.p
                            className="text-slate-400 text-sm font-medium flex items-center justify-center gap-2"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pal.from }} />
                            Searching for {targetUser.firstName}...
                        </motion.p>
                    )}
                </motion.div>

                {/* ── main bump circle ── */}
                <div className="relative z-10 flex items-center justify-center" style={{ width: 200, height: 200 }}>
                    {/* sonar radar rings */}
                    {!bumped && [0, 0.8, 1.6].map((d, i) => (
                        <RadarRing key={i} delay={d} color={pal.from + "55"} />
                    ))}

                    {/* outer glow ring */}
                    <motion.div
                        className="absolute inset-[-6px] rounded-full pointer-events-none"
                        style={{ border: `2px solid ${pal.from}33`, boxShadow: `0 0 40px ${pal.glow}, inset 0 0 40px ${pal.glow}` }}
                        animate={bumped ? { scale: [1, 1.6], opacity: [0.6, 0] } : { opacity: [0.3, 0.6, 0.3] }}
                        transition={bumped ? { duration: 0.6, ease: "easeOut" } : { duration: 2.5, repeat: Infinity }}
                    />

                    {/* inner circle */}
                    <motion.div
                        className="w-full h-full rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
                        style={{
                            background: "rgba(15,23,42,0.8)",
                            border: `3px solid ${pal.from}44`,
                            boxShadow: `0 0 60px ${pal.glow}, 0 0 20px ${pal.glow}`,
                            transform: `rotate(${rotation}deg)`,
                        }}
                        animate={bumped ? { scale: [1, 1.25, 1.1] } : { scale: [1, 1.04, 1] }}
                        transition={bumped ? { duration: 0.4, ease: "easeOut" } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        whileHover={!bumped ? { scale: 1.06, borderColor: pal.from + "88" } : undefined}
                        whileTap={!bumped ? { scale: 0.95 } : undefined}
                        onClick={() => {
                            if (!isConnectingRef.current) {
                                isConnectingRef.current = true;
                                handlePhysicalConnectDetected();
                            }
                        }}
                    >
                        {/* inner glow layer */}
                        <div
                            className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
                            style={{ background: `radial-gradient(circle at 50% 40%, ${pal.glow}, transparent 70%)` }}
                        />

                        <AnimatePresence mode="wait">
                            {bumped ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                    <Check className="w-20 h-20" style={{ color: pal.from }} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="arrow"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <ArrowUp className="w-20 h-20" style={{ color: pal.from, filter: `drop-shadow(0 0 12px ${pal.glow})` }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* burst particles on success */}
                    {bumped && Array.from({ length: 14 }).map((_, i) => (
                        <BurstParticle key={i} angle={(360 / 14) * i} color={i % 2 === 0 ? pal.from : pal.to} />
                    ))}
                </div>

                {/* ── screen flash on bump ── */}
                <AnimatePresence>
                    {bumped && (
                        <motion.div
                            className="absolute inset-0 z-20 pointer-events-none bg-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.35, 0] }}
                            transition={{ duration: 0.5 }}
                        />
                    )}
                </AnimatePresence>

                {/* ── instruction text ── */}
                <motion.p
                    className="relative z-10 mt-6 text-slate-300 text-sm font-medium max-w-xs text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    key={instruction}
                >
                    {instruction}
                </motion.p>

                {/* ── step indicators ── */}
                {!bumped && (
                    <motion.div
                        className="relative z-10 mt-8 flex gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {STEPS.map((step, i) => {
                            const Icon = step.icon;
                            const isActive = activeStep === i;
                            return (
                                <motion.div
                                    key={i}
                                    className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl backdrop-blur-xl border transition-colors duration-300"
                                    style={{
                                        background: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                                        borderColor: isActive ? pal.from + "44" : "rgba(255,255,255,0.06)",
                                        boxShadow: isActive ? `0 0 20px ${pal.glow}` : "none",
                                    }}
                                    animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                                    transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: isActive ? pal.from : "rgb(148,163,184)" }} />
                                    <span className="text-[10px] font-semibold tracking-wide" style={{ color: isActive ? pal.from : "rgb(148,163,184)" }}>
                                        {step.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* ── success message ── */}
                <AnimatePresence>
                    {bumped && (
                        <motion.div
                            className="relative z-10 mt-6 text-center"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                        >
                            <p className="text-lg font-bold tracking-widest" style={{ color: pal.from }}>
                                Connected!
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                {targetUser.firstName} felt your presence ✨
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── bottom info ── */}
                {!bumped && (
                    <motion.p
                        className="absolute bottom-10 z-10 text-slate-500 text-xs max-w-[260px] text-center leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Bumping sends a face-to-face request to {targetUser.firstName}. They'll feel your presence instantly.
                    </motion.p>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
