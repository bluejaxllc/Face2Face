import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Vibrate, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionService } from "@/services/motion-service";
import { triggerHaptic, isHapticsSupported } from "@/services/haptics-service";

const STORAGE_KEY = "f2f_sensor_permission_granted";

interface SensorPermissionGateProps {
    children: React.ReactNode;
}

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
    const [permissionGranted, setPermissionGranted] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) === "true";
    });
    const [isRequesting, setIsRequesting] = useState(false);
    const [step, setStep] = useState<"intro" | "granted">("intro");

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

    if (permissionGranted) {
        return <>{children}</>;
    }

    return (
        <>
            {children}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
                    style={{ background: "rgba(2, 6, 23, 0.97)", backdropFilter: "blur(20px)" }}
                >
                    {step === "intro" ? (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="max-w-sm w-full text-center"
                        >
                            {/* Icon */}
                            <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-fuchsia-500/20 border border-slate-700/50 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                                <Smartphone className="w-10 h-10 text-blue-400" />
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-black text-white font-heading mb-2">
                                Enable{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-fuchsia-500">
                                    Bump Features
                                </span>
                            </h2>

                            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                                Face2Face uses your phone's motion sensors and haptic feedback
                                to create real, physical bump interactions nearby.
                            </p>

                            {/* Feature list */}
                            <div className="space-y-3 mb-8 text-left">
                                <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
                                    <Vibrate className="w-5 h-5 text-fuchsia-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200">Haptic Feedback</p>
                                        <p className="text-xs text-slate-500">Feel bumps with vibration patterns</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
                                    <Smartphone className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200">Motion Detection</p>
                                        <p className="text-xs text-slate-500">Bump by moving your phone toward someone</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/30">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200">Privacy First</p>
                                        <p className="text-xs text-slate-500">Sensor data stays on your device</p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Button
                                onClick={handleEnableSensors}
                                disabled={isRequesting}
                                className="w-full h-14 rounded-2xl font-black text-base tracking-wide bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 hover:from-blue-600 hover:via-indigo-600 hover:to-fuchsia-600 shadow-[0_8px_32px_rgba(99,102,241,0.35)] border border-indigo-400/30 text-white transition-all hover:scale-[1.01] active:scale-[0.98]"
                            >
                                {isRequesting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enabling...
                                    </span>
                                ) : (
                                    "Enable Sensors & Enter"
                                )}
                            </Button>

                            {/* Skip link */}
                            <button
                                onClick={handleSkip}
                                className="mt-4 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                Skip for now (sensors won't work)
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-2 border-emerald-400/50 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.2)] mb-4">
                                <Check className="w-10 h-10 text-emerald-400" />
                            </div>
                            <p className="text-lg font-bold text-white">You're all set!</p>
                            <p className="text-sm text-slate-400 mt-1">Sensors enabled. Let's go.</p>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
}
