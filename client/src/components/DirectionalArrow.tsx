import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Navigation, Check } from "lucide-react";
import { triggerBumpHaptic, triggerHaptic } from "@/services/haptics-service";

interface DirectionalArrowProps {
    /** The GPS coordinates of the target user */
    targetLat: number;
    targetLng: number;
    /** Our own GPS coordinates */
    myLat: number;
    myLng: number;
    /** Name of the person we're bumping */
    targetName: string;
    /** Called when the physical bump gesture is successfully detected */
    onBumpComplete: () => void;
    /** Called to cancel/dismiss the arrow overlay */
    onCancel: () => void;
}

/**
 * Calculate the bearing (compass heading) from point A to point B.
 * Returns degrees 0–360 where 0 = North, 90 = East, etc.
 */
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x =
        Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

    let bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360; // normalize to 0–360
}

export default function DirectionalArrow({
    targetLat,
    targetLng,
    myLat,
    myLng,
    targetName,
    onBumpComplete,
    onCancel,
}: DirectionalArrowProps) {
    const [compassHeading, setCompassHeading] = useState<number | null>(null);
    const [gestureDetected, setGestureDetected] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [phase, setPhase] = useState<"orient" | "thrust" | "done">("orient");
    const thrustAccumulator = useRef(0);
    const lastAccel = useRef({ x: 0, y: 0, z: 0 });
    const thrustTimeout = useRef<number | null>(null);

    // Calculate the target bearing once
    const targetBearing = calculateBearing(myLat, myLng, targetLat, targetLng);

    // Request sensor permissions (required on iOS 13+)
    const requestPermissions = useCallback(async () => {
        try {
            // iOS requires explicit permission request
            if (
                typeof (DeviceOrientationEvent as any).requestPermission === "function"
            ) {
                const orientPerm = await (DeviceOrientationEvent as any).requestPermission();
                if (orientPerm !== "granted") return;
                const motionPerm = await (DeviceMotionEvent as any).requestPermission();
                if (motionPerm !== "granted") return;
            }
            setPermissionGranted(true);
        } catch (err) {
            console.error("[DirectionalArrow] Permission error:", err);
            // Fallback: just mark as granted and use what we can
            setPermissionGranted(true);
        }
    }, []);

    useEffect(() => {
        requestPermissions();
    }, [requestPermissions]);

    // Listen to compass heading
    useEffect(() => {
        if (!permissionGranted) return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            // `webkitCompassHeading` is iOS-specific; `alpha` is Android (relative to initial)
            const heading =
                (e as any).webkitCompassHeading ??
                (e.alpha !== null ? (360 - e.alpha) % 360 : null);
            if (heading !== null) {
                setCompassHeading(heading);
            }
        };

        window.addEventListener("deviceorientation", handleOrientation, true);
        return () => window.removeEventListener("deviceorientation", handleOrientation, true);
    }, [permissionGranted]);

    // Listen to accelerometer for the "thrust" gesture
    useEffect(() => {
        if (!permissionGranted || phase !== "orient") return;

        const handleMotion = (e: DeviceMotionEvent) => {
            const accel = e.accelerationIncludingGravity;
            if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

            // Calculate the delta (jerk) from the last reading
            const dx = Math.abs((accel.x ?? 0) - lastAccel.current.x);
            const dy = Math.abs((accel.y ?? 0) - lastAccel.current.y);
            const dz = Math.abs((accel.z ?? 0) - lastAccel.current.z);
            const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

            lastAccel.current = {
                x: accel.x ?? 0,
                y: accel.y ?? 0,
                z: accel.z ?? 0,
            };

            // A deliberate push/thrust typically produces >8 m/s² jerk
            if (magnitude > 8) {
                thrustAccumulator.current++;
            }

            // Need 3+ strong readings in quick succession to count as a real thrust
            if (thrustAccumulator.current >= 3) {
                setPhase("thrust");
                setGestureDetected(true);

                // Haptic: 2-second vibration for sender confirmation (cross-platform)
                triggerBumpHaptic();

                // Complete after brief UI feedback
                setTimeout(() => {
                    setPhase("done");
                    onBumpComplete();
                }, 2500);
            }

            // Reset accumulator if too slow between thrusts
            if (thrustTimeout.current) clearTimeout(thrustTimeout.current);
            thrustTimeout.current = window.setTimeout(() => {
                thrustAccumulator.current = 0;
            }, 600);
        };

        window.addEventListener("devicemotion", handleMotion, true);
        return () => window.removeEventListener("devicemotion", handleMotion, true);
    }, [permissionGranted, phase, onBumpComplete]);

    // Auto-complete on desktop (no sensors) after 3 seconds
    useEffect(() => {
        // If no compass heading received after 3s, assume desktop → skip gesture
        const timer = setTimeout(() => {
            if (compassHeading === null && !gestureDetected) {
                setPhase("done");
                triggerHaptic(200);
                onBumpComplete();
            }
        }, 4000);
        return () => clearTimeout(timer);
    }, [compassHeading, gestureDetected, onBumpComplete]);

    // Rotation angle: how much to rotate the arrow
    // Arrow should point toward the target relative to where the phone is facing
    const arrowRotation =
        compassHeading !== null ? targetBearing - compassHeading : targetBearing;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[3000] flex flex-col items-center justify-center"
                style={{ background: "rgba(5, 8, 22, 0.95)", backdropFilter: "blur(20px)" }}
            >
                {/* Close/Cancel */}
                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800/50"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Title */}
                <div className="text-center mb-8 px-6">
                    <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-[0.2em] mb-2">
                        {phase === "done" ? "Bump Sent!" : "Bump Direction"}
                    </p>
                    <h2 className="text-2xl font-black text-white">
                        {phase === "done"
                            ? `You bumped ${targetName}!`
                            : `Point toward ${targetName}`}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 max-w-[260px] mx-auto">
                        {phase === "done"
                            ? "They'll feel it."
                            : "Thrust your phone in this direction to BUMP!"}
                    </p>
                </div>

                {/* Arrow */}
                <motion.div
                    className="relative"
                    animate={
                        phase === "done"
                            ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 0] }
                            : { scale: [1, 1.05, 1] }
                    }
                    transition={
                        phase === "done"
                            ? { duration: 1.5 }
                            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }
                >
                    {phase === "done" ? (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border-2 border-emerald-400/50 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
                            <Check className="w-16 h-16 text-emerald-400" />
                        </div>
                    ) : (
                        <div
                            className="w-40 h-40 flex items-center justify-center transition-transform duration-100"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                        >
                            {/* Large arrow SVG with a thrust animation */}
                            <motion.svg 
                                width="120" height="120" viewBox="0 0 100 100"
                                animate={{ y: [0, -30, 4, 0, 0] }}
                                transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity, 
                                    times: [0, 0.15, 0.3, 0.4, 1], 
                                    ease: "easeInOut" 
                                }}
                            >
                                <defs>
                                    <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                    <filter id="arrowGlow">
                                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a855f7" floodOpacity="0.6" />
                                    </filter>
                                </defs>
                                <polygon
                                    points="50,5 85,75 65,65 65,95 35,95 35,65 15,75"
                                    fill="url(#arrowGrad)"
                                    filter="url(#arrowGlow)"
                                    stroke="rgba(255,255,255,0.15)"
                                    strokeWidth="1"
                                />
                            </motion.svg>
                        </div>
                    )}
                </motion.div>

                {/* Compass info */}
                {compassHeading !== null && phase !== "done" && (
                    <p className="text-[10px] text-slate-600 mt-6 font-mono tracking-wider">
                        {Math.round(targetBearing)}° · {compassHeading !== null ? `Facing ${Math.round(compassHeading)}°` : ""}
                    </p>
                )}

                {/* Pulsing ring animation behind arrow when orienting */}
                {phase === "orient" && (
                    <>
                        <motion.div
                            className="absolute w-48 h-48 rounded-full border border-fuchsia-500/20"
                            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.div
                            className="absolute w-48 h-48 rounded-full border border-fuchsia-500/20"
                            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                        />
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
