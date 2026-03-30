import { useEffect, useState, useRef } from "react";
import { X, ArrowUp } from "lucide-react";
import { triggerBumpHaptic } from "@/services/haptics-service";

interface ConnectOverlayProps {
    onSuccess: () => void;
    onCancel: () => void;
    targetUser: { firstName: string; latitude: number; longitude: number };
    currentLocation: { latitude: number; longitude: number };
}

export default function ConnectOverlay({ onSuccess, onCancel, targetUser, currentLocation }: ConnectOverlayProps) {
    const [rotation, setRotation] = useState(0);
    const [instruction, setInstruction] = useState("Hold your phone up and move towards them");
    const isConnectingRef = useRef(false);

    // Calculate bearing to target
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

    const handlePhysicalConnectDetected = async () => {
        setInstruction("Bump Sent! ✨");

        // Use the cross-platform haptics service
        triggerBumpHaptic();

        setTimeout(() => {
            onSuccess();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center transition-all duration-300">
            <button onClick={onCancel} className="absolute top-8 right-8 text-slate-400 hover:text-white p-2">
                <X className="w-8 h-8" />
            </button>

            <div className="mb-12">
                <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500">
                    Ready to Bump?
                </h2>
                <p className="text-slate-300 font-medium">{instruction}</p>
            </div>

            <div
                className="w-48 h-48 rounded-full bg-slate-800/80 border-4 border-blue-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.2),0_0_30px_rgba(236,72,153,0.15)] cursor-pointer hover:bg-slate-800 hover:border-pink-500/40 transition-all duration-500"
                style={{ transform: `rotate(${rotation}deg)` }}
                onClick={() => {
                    if (!isConnectingRef.current) {
                        isConnectingRef.current = true;
                        handlePhysicalConnectDetected();
                    }
                }}
            >
                <ArrowUp className="w-24 h-24 text-blue-400 animate-pulse" />
            </div>

            <p className="mt-12 text-slate-400 text-sm max-w-xs">
                Bumping sends a face-to-face request to {targetUser.firstName}. They'll feel your presence instantly.
            </p>
        </div>
    );
}
