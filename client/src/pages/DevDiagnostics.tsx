import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/PageTransition";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import {
  triggerHaptic,
  triggerBumpHaptic,
  triggerHeartbeatHaptic,
  triggerHapticPattern,
  triggerLightTap,
  isHapticsSupported,
} from "@/services/haptics-service";
import {
  Vibrate,
  Smartphone,
  MapPin,
  Compass,
  Activity,
  RotateCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Gauge,
  Navigation,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

interface MotionData {
  x: number | null;
  y: number | null;
  z: number | null;
  timestamp: number;
}

interface OrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  timestamp: number;
}

export default function DevDiagnostics() {
  const { user } = useAuth();
  const { currentLocation } = useLocationContext();
  const [, setLocation] = useLocation();

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "success" | "error">("idle");
  const [gpsError, setGpsError] = useState<string>("");
  const [rawGps, setRawGps] = useState<GeolocationCoordinates | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<number>(0);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);

  // IMU state
  const [motionPermission, setMotionPermission] = useState<string>("unknown");
  const [motionData, setMotionData] = useState<MotionData>({ x: null, y: null, z: null, timestamp: 0 });
  const [motionMax, setMotionMax] = useState<MotionData>({ x: 0, y: 0, z: 0, timestamp: 0 });
  const [orientationData, setOrientationData] = useState<OrientationData>({ alpha: null, beta: null, gamma: null, timestamp: 0 });
  const [imuActive, setImuActive] = useState(false);
  const [motionHistory, setMotionHistory] = useState<MotionData[]>([]);
  const [magnitude, setMagnitude] = useState(0);
  const [peakMagnitude, setPeakMagnitude] = useState(0);

  // Vibration state
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [lastVibration, setLastVibration] = useState<string>("none");
  const [customDuration, setCustomDuration] = useState(200);
  const [customPattern, setCustomPattern] = useState("100,50,100,400,100,50,100");

  // UI state
  const [expandedSection, setExpandedSection] = useState<string | null>("gps");
  const logRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 100));
  };

  // Device info
  const [deviceInfo] = useState(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    hasVibrate: !!navigator.vibrate,
    hasMotion: typeof DeviceMotionEvent !== "undefined",
    hasOrientation: typeof DeviceOrientationEvent !== "undefined",
    hasMotionPermission: typeof DeviceMotionEvent !== "undefined" && typeof (DeviceMotionEvent as any).requestPermission === "function",
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
  }));

  useEffect(() => {
    setVibrationSupported(isHapticsSupported());
  }, []);

  // ─── GPS ────────────────────────────────────────────────
  const requestGps = () => {
    setGpsStatus("requesting");
    addLog("Requesting GPS position...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus("success");
        setRawGps(pos.coords);
        setGpsAccuracy(pos.coords.accuracy);
        setGpsTimestamp(pos.timestamp);
        addLog(`GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} (±${pos.coords.accuracy.toFixed(0)}m)`);
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(err.message);
        addLog(`GPS ERROR: ${err.message} (code: ${err.code})`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startGpsWatch = () => {
    if (gpsWatchId !== null) return;
    addLog("Starting GPS watch...");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setRawGps(pos.coords);
        setGpsAccuracy(pos.coords.accuracy);
        setGpsTimestamp(pos.timestamp);
      },
      (err) => {
        addLog(`GPS Watch ERROR: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    setGpsWatchId(id);
  };

  const stopGpsWatch = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
      addLog("GPS watch stopped");
    }
  };

  // ─── IMU / Motion ──────────────────────────────────────
  const requestMotionPermission = async () => {
    addLog("Requesting motion permission...");
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const perm = await (DeviceMotionEvent as any).requestPermission();
        setMotionPermission(perm);
        addLog(`Motion permission: ${perm}`);
      } else {
        setMotionPermission("not-required");
        addLog("Motion permission not required on this device");
      }

      if (typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        addLog(`Orientation permission: ${perm}`);
      }
    } catch (err: any) {
      setMotionPermission("error");
      addLog(`Motion permission error: ${err.message}`);
    }
  };

  const startIMU = () => {
    setImuActive(true);
    setMotionMax({ x: 0, y: 0, z: 0, timestamp: 0 });
    setPeakMagnitude(0);
    addLog("IMU sensors started");

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const data: MotionData = {
        x: acc.x,
        y: acc.y,
        z: acc.z,
        timestamp: Date.now(),
      };
      setMotionData(data);

      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      setMagnitude(mag);
      setPeakMagnitude(prev => Math.max(prev, mag));

      setMotionMax(prev => ({
        x: Math.max(Math.abs(prev.x || 0), Math.abs(acc.x || 0)),
        y: Math.max(Math.abs(prev.y || 0), Math.abs(acc.y || 0)),
        z: Math.max(Math.abs(prev.z || 0), Math.abs(acc.z || 0)),
        timestamp: Date.now(),
      }));

      setMotionHistory(prev => [...prev.slice(-49), data]);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      setOrientationData({
        alpha: e.alpha,
        beta: e.beta,
        gamma: e.gamma,
        timestamp: Date.now(),
      });
    };

    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  };

  const stopIMU = () => {
    setImuActive(false);
    addLog(`IMU stopped. Peak magnitude: ${peakMagnitude.toFixed(2)}`);
  };

  useEffect(() => {
    if (!imuActive) return;
    const cleanup = startIMU();
    return cleanup;
  }, [imuActive]);

  // ─── Vibration ─────────────────────────────────────────
  const testVibration = (type: string) => {
    setLastVibration(type);
    addLog(`Vibration: ${type}`);
    switch (type) {
      case "light":
        triggerLightTap();
        break;
      case "bump_sender":
        triggerBumpHaptic();
        break;
      case "bump_receiver":
        triggerHeartbeatHaptic();
        break;
      case "custom_duration":
        triggerHaptic(customDuration);
        break;
      case "custom_pattern":
        const pattern = customPattern.split(",").map(Number);
        triggerHapticPattern(pattern);
        break;
      case "raw_vibrate":
        if (navigator.vibrate) navigator.vibrate(customDuration);
        break;
    }
  };

  // ─── Helpers ───────────────────────────────────────────
  const getMagnitudeColor = (mag: number) => {
    if (mag < 10) return "text-green-400";
    if (mag < 15) return "text-yellow-400";
    if (mag < 20) return "text-orange-400";
    return "text-red-400";
  };

  const Section = ({ id, title, icon, children, badge }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; badge?: string }) => (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-white text-sm">{title}</span>
          {badge && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 font-bold">
              {badge}
            </span>
          )}
        </div>
        {expandedSection === id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {expandedSection === id && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  const DataRow = ({ label, value, unit, color }: { label: string; value: string | number | null; unit?: string; color?: string }) => (
    <div className="flex justify-between items-center py-1 border-b border-slate-700/30 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className={`text-xs font-mono font-bold ${color || "text-white"}`}>
        {value !== null && value !== undefined ? `${typeof value === "number" ? value.toFixed(4) : value}` : "—"}
        {unit && <span className="text-slate-500 ml-1">{unit}</span>}
      </span>
    </div>
  );

  return (
    <PageTransition className="h-screen w-full page-dark flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto pb-[64px] pt-[40px]">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Gauge className="w-5 h-5 text-blue-400" />
              Device Diagnostics
            </h1>
            <p className="text-xs text-slate-500 mt-1 mb-4">Test sensors, vibration, and GPS on this device</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                onClick={() => setLocation('/command-center')}
                className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 rounded-xl"
              >
                <ShieldAlert className="w-5 h-5 mr-2" />
                Open Command Center
              </Button>

              <Button 
                onClick={() => setLocation('/analytics')}
                variant="outline"
                className="w-full sm:w-auto h-12 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-bold text-lg rounded-xl"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Open Investor Analytics
              </Button>
            </div>
          </div>

          {/* Device Info Summary */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Device</p>
            <div className="flex flex-wrap gap-1.5">
              {deviceInfo.isIOS && <span className="text-[10px] bg-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 font-bold">iOS</span>}
              {deviceInfo.isAndroid && <span className="text-[10px] bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 font-bold">Android</span>}
              {deviceInfo.isSafari && <span className="text-[10px] bg-purple-500/20 text-purple-400 rounded-full px-2 py-0.5 font-bold">Safari</span>}
              {deviceInfo.hasVibrate && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 font-bold">Vibrate API</span>}
              {!deviceInfo.hasVibrate && <span className="text-[10px] bg-red-500/20 text-red-400 rounded-full px-2 py-0.5 font-bold">No Vibrate</span>}
              {deviceInfo.hasMotion && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 rounded-full px-2 py-0.5 font-bold">Motion</span>}
              {deviceInfo.hasMotionPermission && <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-bold">Needs Permission</span>}
              <span className="text-[10px] bg-slate-600/30 text-slate-400 rounded-full px-2 py-0.5 font-bold">
                {deviceInfo.screenWidth}×{deviceInfo.screenHeight} @{deviceInfo.devicePixelRatio}x
              </span>
            </div>
            <p className="text-[9px] text-slate-600 mt-1 font-mono break-all">{deviceInfo.userAgent.slice(0, 150)}</p>
          </div>

          {/* ═══════ GPS ═══════ */}
          <Section id="gps" title="GPS / Location" icon={<MapPin className="w-4 h-4 text-blue-400" />}
            badge={gpsStatus === "success" ? `±${gpsAccuracy?.toFixed(0)}m` : undefined}>
            
            <div className="space-y-2">
              <DataRow label="App Location (lat)" value={currentLocation?.latitude ?? null} />
              <DataRow label="App Location (lng)" value={currentLocation?.longitude ?? null} />
              <DataRow label="Server Location (lat)" value={user?.latitude ? Number(user.latitude) : null} />
              <DataRow label="Server Location (lng)" value={user?.longitude ? Number(user.longitude) : null} />
            </div>

            <div className="border-t border-slate-700/30 pt-2 space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Raw GPS</p>
              {rawGps && (
                <div className="space-y-1">
                  <DataRow label="Latitude" value={rawGps.latitude} />
                  <DataRow label="Longitude" value={rawGps.longitude} />
                  <DataRow label="Accuracy" value={rawGps.accuracy} unit="m" color={rawGps.accuracy < 20 ? "text-green-400" : rawGps.accuracy < 100 ? "text-yellow-400" : "text-red-400"} />
                  <DataRow label="Altitude" value={rawGps.altitude} unit="m" />
                  <DataRow label="Alt Accuracy" value={rawGps.altitudeAccuracy} unit="m" />
                  <DataRow label="Heading" value={rawGps.heading} unit="°" />
                  <DataRow label="Speed" value={rawGps.speed} unit="m/s" />
                  <DataRow label="Timestamp" value={new Date(gpsTimestamp).toLocaleTimeString()} />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={requestGps} className="flex-1 h-10 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Get Position
              </Button>
              <Button
                onClick={gpsWatchId !== null ? stopGpsWatch : startGpsWatch}
                className={`flex-1 h-10 rounded-xl text-xs font-bold ${gpsWatchId !== null ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                <Navigation className="w-3.5 h-3.5 mr-1" /> {gpsWatchId !== null ? "Stop Watch" : "Watch GPS"}
              </Button>
            </div>
          </Section>

          {/* ═══════ IMU / Motion ═══════ */}
          <Section id="imu" title="IMU / Accelerometer" icon={<Activity className="w-4 h-4 text-cyan-400" />}
            badge={imuActive ? `${magnitude.toFixed(1)} m/s²` : undefined}>
            
            {deviceInfo.hasMotionPermission && (
              <Button onClick={requestMotionPermission} className="w-full h-10 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 mb-2">
                <Smartphone className="w-3.5 h-3.5 mr-1" /> Request iOS Motion Permission ({motionPermission})
              </Button>
            )}

            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acceleration (incl. gravity)</p>
              <DataRow label="X" value={motionData.x} unit="m/s²" />
              <DataRow label="Y" value={motionData.y} unit="m/s²" />
              <DataRow label="Z" value={motionData.z} unit="m/s²" />
              <DataRow label="Magnitude" value={magnitude} unit="m/s²" color={getMagnitudeColor(magnitude)} />
              <DataRow label="Peak Magnitude" value={peakMagnitude} unit="m/s²" color="text-red-400" />
            </div>

            <div className="border-t border-slate-700/30 pt-2 space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Peak Values</p>
              <DataRow label="Max |X|" value={motionMax.x} unit="m/s²" />
              <DataRow label="Max |Y|" value={motionMax.y} unit="m/s²" />
              <DataRow label="Max |Z|" value={motionMax.z} unit="m/s²" />
            </div>

            <div className="border-t border-slate-700/30 pt-2 space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Orientation</p>
              <DataRow label="Alpha (compass)" value={orientationData.alpha} unit="°" />
              <DataRow label="Beta (tilt F/B)" value={orientationData.beta} unit="°" />
              <DataRow label="Gamma (tilt L/R)" value={orientationData.gamma} unit="°" />
            </div>

            {/* Magnitude bar visualizer */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live Magnitude</p>
              <div className="h-6 bg-slate-900/60 rounded-lg overflow-hidden border border-slate-700/30">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg"
                  animate={{ width: `${Math.min(100, (magnitude / 30) * 100)}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>0</span>
                <span>Bump threshold (~8)</span>
                <span>30+</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setImuActive(!imuActive)}
                className={`flex-1 h-10 rounded-xl text-xs font-bold ${imuActive ? "bg-red-600 hover:bg-red-700" : "bg-cyan-600 hover:bg-cyan-700"}`}
              >
                <Activity className="w-3.5 h-3.5 mr-1" /> {imuActive ? "Stop IMU" : "Start IMU"}
              </Button>
              <Button
                onClick={() => { setMotionMax({ x: 0, y: 0, z: 0, timestamp: 0 }); setPeakMagnitude(0); }}
                className="h-10 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600"
              >
                <RotateCw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>
          </Section>

          {/* ═══════ Vibration ═══════ */}
          <Section id="vibration" title="Vibration / Haptics" icon={<Vibrate className="w-4 h-4 text-fuchsia-400" />}
            badge={vibrationSupported ? "Supported" : "Limited"}>
            
            <div className="space-y-2">
              <DataRow label="navigator.vibrate" value={deviceInfo.hasVibrate ? "Yes" : "No"} color={deviceInfo.hasVibrate ? "text-green-400" : "text-red-400"} />
              <DataRow label="iOS Safari Hack" value={deviceInfo.isIOS && deviceInfo.isSafari ? "Available" : "N/A"} />
              <DataRow label="Last Vibration" value={lastVibration} />
            </div>

            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2">Preset Patterns</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => testVibration("light")} className="h-10 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600">
                <Zap className="w-3.5 h-3.5 mr-1" /> Light Tap (30ms)
              </Button>
              <Button onClick={() => testVibration("bump_sender")} className="h-10 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700">
                <Vibrate className="w-3.5 h-3.5 mr-1" /> Sender (2s)
              </Button>
              <Button onClick={() => testVibration("bump_receiver")} className="h-10 rounded-xl text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-700 col-span-2">
                <Vibrate className="w-3.5 h-3.5 mr-1" /> Receiver Heartbeat (♥♥—♥♥)
              </Button>
            </div>

            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2">Custom Test</p>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <label className="text-xs text-slate-400 w-20 shrink-0">Duration</label>
                <input
                  type="range"
                  min={10}
                  max={3000}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="flex-1 accent-fuchsia-500"
                />
                <span className="text-xs font-mono text-white w-14 text-right">{customDuration}ms</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => testVibration("custom_duration")} className="flex-1 h-9 rounded-xl text-xs bg-fuchsia-700 hover:bg-fuchsia-800">
                  Vibrate {customDuration}ms
                </Button>
                <Button onClick={() => testVibration("raw_vibrate")} className="flex-1 h-9 rounded-xl text-xs bg-slate-700 hover:bg-slate-600">
                  Raw navigator.vibrate
                </Button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custom Pattern (ms, comma-separated)</label>
                <input
                  type="text"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50"
                  placeholder="100,50,100,400,100,50,100"
                />
                <Button onClick={() => testVibration("custom_pattern")} className="w-full h-9 rounded-xl text-xs bg-fuchsia-700 hover:bg-fuchsia-800">
                  Play Pattern
                </Button>
              </div>
            </div>
          </Section>

          {/* ═══════ Event Log ═══════ */}
          <Section id="log" title="Event Log" icon={<Activity className="w-4 h-4 text-emerald-400" />}
            badge={`${logs.length}`}>
            <div ref={logRef} className="bg-slate-900/80 border border-slate-700/30 rounded-lg p-2 max-h-48 overflow-y-auto font-mono text-[10px] space-y-0.5">
              {logs.length === 0 ? (
                <p className="text-slate-600 text-center py-4">No events yet. Use the controls above.</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className="text-slate-400 leading-tight">{log}</p>
                ))
              )}
            </div>
            <Button onClick={() => setLogs([])} className="w-full h-8 rounded-xl text-xs bg-slate-700 hover:bg-slate-600">
              Clear Log
            </Button>
          </Section>

        </div>
      </div>
      <BottomNavigation />
    </PageTransition>
  );
}
