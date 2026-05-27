import { useState, useMemo } from "react";
import { MapPin, AlertCircle, Info, ArrowRight, AlertTriangle, RefreshCw, Settings, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "@/contexts/LocationContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── SVG noise texture overlay ──────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]">
      <svg width="100%" height="100%">
        <filter id="loc-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#loc-noise)" />
      </svg>
    </div>
  );
}

// ─── Floating ambient orbs (muted amber/orange) ────────────────────────────
function FloatingOrbs() {
  const orbs = useMemo(
    () => [
      { size: 220, x: "15%", y: "20%", color: "rgba(251,146,60,0.10)", dur: 18 },
      { size: 180, x: "80%", y: "15%", color: "rgba(245,158,11,0.08)", dur: 22 },
      { size: 260, x: "70%", y: "75%", color: "rgba(234,88,12,0.07)", dur: 25 },
      { size: 140, x: "25%", y: "80%", color: "rgba(251,191,36,0.09)", dur: 20 },
      { size: 160, x: "50%", y: "45%", color: "rgba(249,115,22,0.06)", dur: 16 },
      { size: 200, x: "90%", y: "50%", color: "rgba(217,119,6,0.07)", dur: 24 },
    ],
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.15, 0.9, 1.08, 1],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Ambient dust motes ────────────────────────────────────────────────────
function DustMotes() {
  const motes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 3,
        left: `${5 + Math.random() * 90}%`,
        delay: Math.random() * 6,
        dur: 8 + Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full bg-amber-300/40"
          style={{ width: m.size, height: m.size, left: m.left, bottom: "-5%" }}
          animate={{ y: [0, -window.innerHeight * 1.2], x: [0, 15, -10, 8, 0], opacity: [0, m.opacity, m.opacity, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

// ─── Pulsing error icon with concentric ripple ─────────────────────────────
function ErrorIcon() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-2">
      {/* Concentric ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-amber-500/30"
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 2.5, delay: i * 0.8, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      {/* Warning glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 30px 8px rgba(245,158,11,0.15)" }}
        animate={{ boxShadow: ["0 0 30px 8px rgba(245,158,11,0.15)", "0 0 50px 16px rgba(245,158,11,0.25)", "0 0 30px 8px rgba(245,158,11,0.15)"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Glassmorphic icon container */}
      <motion.div
        className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center border border-amber-500/30"
        style={{ background: "rgba(245,158,11,0.08)", backdropFilter: "blur(16px)" }}
        animate={{ rotate: [0, -3, 3, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <MapPin className="h-9 w-9 text-amber-400" />
          <motion.div
            className="absolute -top-1 -right-2 bg-red-500/90 rounded-full p-0.5"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <X className="h-3 w-3 text-white" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Step card component ───────────────────────────────────────────────────
function StepCard({ index, instruction, delay }: { index: number; instruction: string; delay: number }) {
  return (
    <motion.li
      className="flex items-start gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, type: "spring", stiffness: 120 }}
    >
      <div
        className="flex-shrink-0 rounded-lg h-7 w-7 flex items-center justify-center mt-0.5 text-xs font-bold border"
        style={{
          background: "rgba(245,158,11,0.1)",
          borderColor: "rgba(245,158,11,0.25)",
          color: "#fbbf24",
        }}
      >
        {index + 1}
      </div>
      <span className="text-sm text-slate-300 leading-relaxed">{instruction}</span>
    </motion.li>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface LocationErrorProps {
  onEnableLocation: () => Promise<void>;
}

export default function LocationError({ onEnableLocation }: LocationErrorProps) {
  const [isAttempting, setIsAttempting] = useState(false);
  const { resetError } = useLocation();

  const handleEnableLocation = async () => {
    setIsAttempting(true);
    try {
      resetError();
      await onEnableLocation();
    } catch (error) {
      // Error is already handled by the location context
    } finally {
      setIsAttempting(false);
    }
  };

  const browsers = [
    {
      name: "Chrome",
      instructions: [
        "Click the lock icon in the address bar",
        "Select 'Site settings'",
        "Set 'Location' to 'Allow'",
        "Reload the page",
      ],
    },
    {
      name: "Safari",
      instructions: [
        "Go to Safari Preferences",
        "Select 'Websites' tab and then 'Location'",
        "Find this website and set to 'Allow'",
        "Reload the page",
      ],
    },
    {
      name: "Firefox",
      instructions: [
        "Click the shield icon in the address bar",
        "Click 'Site Information' panel",
        "Go to Permissions and enable Location access",
        "Reload the page",
      ],
    },
  ];

  const devices = [
    {
      name: "iPhone",
      instructions: [
        "Open Settings app",
        "Scroll down and tap Safari (or your browser)",
        "Tap 'Location'",
        "Select 'While Using the App' or 'Ask Next Time'",
        "Return to the app and refresh",
      ],
    },
    {
      name: "Android",
      instructions: [
        "Open Settings app",
        "Tap 'Apps' or 'Applications'",
        "Find and tap your browser",
        "Tap 'Permissions'",
        "Tap 'Location'",
        "Select 'Allow only while using the app'",
        "Return to the app and refresh",
      ],
    },
  ];

  // ─── Container animation variants ──────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto z-50">
      {/* ─── Background atmosphere ─── */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 30%, #0f172a 70%, #0c0a09 100%)",
        }}
      />
      <motion.div
        className="fixed inset-0 z-0"
        animate={{
          background: [
            "radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.05) 0%, transparent 60%)",
            "radial-gradient(ellipse at 70% 80%, rgba(234,88,12,0.05) 0%, transparent 60%)",
            "radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.05) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <NoiseOverlay />
      <FloatingOrbs />
      <DustMotes />

      {/* ─── Main card ─── */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Rotating conic-gradient border glow */}
        <div className="absolute -inset-px rounded-[20px] overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: "conic-gradient(from 0deg, rgba(245,158,11,0.3), rgba(234,88,12,0.15), rgba(251,191,36,0.2), rgba(245,158,11,0.3))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <Card
          className="relative w-full border-0 rounded-[20px] overflow-hidden"
          style={{
            background: "rgba(15,15,20,0.85)",
            backdropFilter: "blur(40px)",
            boxShadow: "0 0 60px 10px rgba(245,158,11,0.05), 0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          <CardHeader className="pb-4 pt-8">
            <motion.div variants={itemVariants}>
              <ErrorIcon />
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mt-2">
              <CardTitle className="text-2xl md:text-3xl">
                <span
                  className="font-heading font-black tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #ea580c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Location Required
                </span>
              </CardTitle>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardDescription className="text-slate-400 text-sm mt-2 text-center leading-relaxed">
                We need your location to connect you with people nearby.
                <br />
                <span className="text-slate-500">Please enable location services to continue.</span>
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-5 px-5 pb-2">
            {/* Error alert */}
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-3 rounded-xl p-4 border"
              style={{
                background: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              </motion.div>
              <div>
                <p className="font-semibold text-red-300 text-sm">Location access denied</p>
                <p className="text-xs text-red-300/60 mt-1 leading-relaxed">
                  To find matches near you, we need permission to access your location. Your data is never shared.
                </p>
              </div>
            </motion.div>

            {/* Instructions header */}
            <motion.div variants={itemVariants} className="space-y-1">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.15)" }}
                >
                  <Info className="h-3 w-3 text-amber-400" />
                </div>
                How to enable location
              </h4>
              <p className="text-xs text-slate-500 pl-7">
                Select your device type and follow the steps:
              </p>
            </motion.div>

            {/* Tabs: Desktop / Mobile */}
            <motion.div variants={itemVariants}>
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList
                  className="grid grid-cols-2 w-full rounded-xl border"
                  style={{
                    background: "rgba(30,30,40,0.6)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <TabsTrigger
                    value="desktop"
                    className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 text-slate-500 text-xs rounded-lg transition-all duration-300"
                  >
                    🖥️ Desktop Browser
                  </TabsTrigger>
                  <TabsTrigger
                    value="mobile"
                    className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 text-slate-500 text-xs rounded-lg transition-all duration-300"
                  >
                    📱 Mobile Device
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="desktop">
                  <Tabs defaultValue="Chrome" className="w-full mt-2">
                    <TabsList
                      className="grid grid-cols-3 w-full rounded-xl border"
                      style={{
                        background: "rgba(30,30,40,0.6)",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {browsers.map((browser) => (
                        <TabsTrigger
                          key={browser.name}
                          value={browser.name}
                          className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-300 text-slate-500 text-xs rounded-lg transition-all duration-300"
                        >
                          {browser.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {browsers.map((browser) => (
                      <TabsContent key={browser.name} value={browser.name} className="mt-3">
                        <motion.div
                          className="rounded-xl p-4 border"
                          style={{
                            background: "rgba(30,30,40,0.4)",
                            borderColor: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(8px)",
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ol className="space-y-3 pl-0">
                            {browser.instructions.map((instruction, index) => (
                              <StepCard
                                key={index}
                                index={index}
                                instruction={instruction}
                                delay={index * 0.08}
                              />
                            ))}
                          </ol>
                        </motion.div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>

                <TabsContent value="mobile">
                  <Tabs defaultValue="iPhone" className="w-full mt-2">
                    <TabsList
                      className="grid grid-cols-2 w-full rounded-xl border"
                      style={{
                        background: "rgba(30,30,40,0.6)",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {devices.map((device) => (
                        <TabsTrigger
                          key={device.name}
                          value={device.name}
                          className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-300 text-slate-500 text-xs rounded-lg transition-all duration-300"
                        >
                          {device.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {devices.map((device) => (
                      <TabsContent key={device.name} value={device.name} className="mt-3">
                        <motion.div
                          className="rounded-xl p-4 border"
                          style={{
                            background: "rgba(30,30,40,0.4)",
                            borderColor: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(8px)",
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ol className="space-y-3 pl-0">
                            {device.instructions.map((instruction, index) => (
                              <StepCard
                                key={index}
                                index={index}
                                instruction={instruction}
                                delay={index * 0.08}
                              />
                            ))}
                          </ol>
                        </motion.div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>
              </Tabs>
            </motion.div>
          </CardContent>

          <CardFooter className="flex-col gap-3 pt-4 pb-8 px-5">
            {/* Primary: Try Again */}
            <motion.div variants={itemVariants} className="w-full">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="relative w-full text-white font-bold rounded-xl h-12 border-0 overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                    boxShadow: "0 0 24px 4px rgba(245,158,11,0.2), 0 8px 20px rgba(0,0,0,0.3)",
                  }}
                  onClick={handleEnableLocation}
                  disabled={isAttempting}
                  size="lg"
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isAttempting ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <RefreshCw className="h-5 w-5" />
                        </motion.div>
                        Requesting location...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5" />
                        Try Again
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Privacy note */}
            <motion.div variants={itemVariants} className="flex items-center justify-center gap-1.5 mt-1">
              <Shield className="h-3 w-3 text-slate-600" />
              <p className="text-[11px] text-center text-slate-600">
                Your location is only used for matchmaking and is never stored
              </p>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}