import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Zap,
  Trophy,
  RefreshCcw,
  User,
  Timer,
  Sparkles,
  Star,
  Crown,
  Shield,
  Target,
  Radio,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   MapProximityTag — Premium radar-sweep timing game
   5 rounds. Tap when the sweep passes the target arc.
   No header/back — parent bottom sheet handles that.

   FEATURES:
   - SVG noise texture overlay
   - Cinematic letterbox countdown with glow rings + shockwaves + GO! flash
   - Score odometer with spring-physics rolling digits
   - Screen shake on miss
   - Victory rays (conic-gradient rotation)
   - Glassmorphic results card with rotating conic-gradient border
   - Animated shimmer buttons
   - Gradient typography with letter-spacing hierarchy
   - Double-ring sonar blip from opponent position
   - 60° conic sweep trail
   - Enhanced scanlines (horizontal lines sweeping across radar)
   - Target lock animation (4 corner brackets closing on HIT)
   - Static/interference effect on MISS
   - Rank badge system (S/A/B/C/D)
   - Floating background orbs
   - Dynamic color temperature (warm when leading, cool when trailing)
   - Progressive intensity (speed/particles increase per round)
   - Ambient dust motes (8-12 dots drifting)
   - Depth-of-field blur during tag moment
   - Score change ripple
   - Leading player crown (bobbing gold crown)
   - Radar coordinate grid (crosshair + concentric dashed circles)
   - Sweep ghost trail (2-3 fading positions)
   - "TARGET ACQUIRED" military text on perfect/great
   - Distance indicator (~23m, ~8m near blip)
   - Score popups (+100 PERFECT! floating up)
   - Rotating dashed border (opposite to sweep)
   - Improved buttons with gradient shift, inset shadow, text-shadow, whileTap 0.93
   ──────────────────────────────────────────────────────────────── */

interface MapGameChildProps {
  opponent: {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    profilePhoto?: string | null;
    category: string;
  };
  category: "dating" | "friends" | "business";
  onComplete: () => void;
  onBack: () => void;
}

const THEMES = {
  dating: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.4)",
    glowStrong: "rgba(236,72,153,0.7)",
    glowSoft: "rgba(236,72,153,0.15)",
    color1: "#ec4899",
    color2: "#ef4444",
    color3: "#f472b6",
    scanline: "rgba(236,72,153,0.06)",
  },
  friends: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "rgba(16,185,129,0.4)",
    glowStrong: "rgba(16,185,129,0.7)",
    glowSoft: "rgba(16,185,129,0.15)",
    color1: "#10b981",
    color2: "#06b6d4",
    color3: "#34d399",
    scanline: "rgba(16,185,129,0.06)",
  },
  business: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "rgba(59,130,246,0.4)",
    glowStrong: "rgba(59,130,246,0.7)",
    glowSoft: "rgba(59,130,246,0.15)",
    color1: "#3b82f6",
    color2: "#8b5cf6",
    color3: "#60a5fa",
    scanline: "rgba(59,130,246,0.06)",
  },
} as const;

const TOTAL_ROUNDS = 5;
const SWEEP_DURATION = 2.5; // seconds for full rotation
const TARGET_ARC_DEG = 40; // target zone width in degrees

type Phase = "countdown" | "playing" | "reveal" | "results";

interface RoundResult {
  distance: number; // 0 = perfect, higher = worse
  points: number;
  rating: "perfect" | "great" | "good" | "miss";
  targetAngle: number;
  hitAngle: number | null;
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ── SVG Noise Texture ── */
function NoiseTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] z-50" aria-hidden>
      <filter id="noiseProxTag">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseProxTag)" />
    </svg>
  );
}

/* ── Ambient Dust Motes ── */
function DustMotes({ intensity = 1, round = 0 }: { intensity?: number; round?: number }) {
  const count = Math.round(8 + 4 * intensity + round);
  const motes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 50 + Math.random() * 50,
        size: 0.8 + Math.random() * 1.8,
        duration: 5 + Math.random() * 9,
        delay: Math.random() * 6,
        drift: (Math.random() - 0.5) * 35,
        opacity: 0.12 + Math.random() * 0.18,
      })),
    [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.x}%`,
            top: `${m.y}%`,
            background: `rgba(255,255,255,${m.opacity * intensity})`,
            boxShadow: `0 0 ${2 + intensity * 2}px rgba(255,255,255,${0.05 * intensity})`,
          }}
          animate={{
            y: [0, -(90 + intensity * 50)],
            x: [0, m.drift],
            opacity: [0, 0.5 * intensity, 0.35 * intensity, 0],
          }}
          transition={{
            duration: m.duration / (0.7 + intensity * 0.3),
            delay: m.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Ambient Particles (formal shared component) ── */
function AmbientParticles({ intensity = 1, color }: { intensity: number; color: string }) {
  return (
    <>
      {Array.from({ length: Math.round(8 * intensity) }, (_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 rounded-full pointer-events-none z-[5]"
          style={{
            background: color,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            opacity: 0.2 + Math.random() * 0.3,
          }}
          animate={{
            y: [0, -30 - Math.random() * 50],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </>
  );
}

/* ── Dynamic Color Temperature Orbs ── */
function DynamicOrbs({
  color1,
  color2,
  color3,
  isLeading,
  intensity,
}: {
  color1: string;
  color2: string;
  color3: string;
  isLeading: boolean;
  intensity: number;
}) {
  const warmTint = "rgba(251,191,36,0.18)";
  const coolTint = "rgba(59,130,246,0.18)";
  const tint = isLeading ? warmTint : coolTint;
  const tint2 = isLeading ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.12)";
  const speed = 0.7 + intensity * 0.5;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      {/* Top-left orb */}
      <motion.div
        className="absolute w-52 h-52 rounded-full"
        style={{ top: "-18%", left: "-22%", filter: "blur(60px)" }}
        animate={{
          x: [0, 30 + intensity * 15, 0],
          y: [0, 20, 0],
          background: [tint, color1, tint],
          opacity: [0.06, 0.15 + intensity * 0.05, 0.06],
        }}
        transition={{ duration: 9 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Bottom-right orb */}
      <motion.div
        className="absolute w-40 h-40 rounded-full"
        style={{ bottom: "2%", right: "-15%", filter: "blur(50px)" }}
        animate={{
          x: [0, -22, 0],
          y: [0, -28, 0],
          background: [color2, tint2, color2],
          opacity: [0.05, 0.12 + intensity * 0.04, 0.05],
        }}
        transition={{ duration: 11 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Center-bottom orb (new) */}
      <motion.div
        className="absolute w-36 h-36 rounded-full"
        style={{ bottom: "10%", left: "30%", filter: "blur(55px)" }}
        animate={{
          x: [0, 15, -10, 0],
          y: [0, -15, 5, 0],
          background: [color3, tint, color3],
          opacity: [0.04, 0.1, 0.04],
        }}
        transition={{ duration: 13 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Top-right accent orb (new) */}
      <motion.div
        className="absolute w-28 h-28 rounded-full"
        style={{ top: "5%", right: "5%", filter: "blur(45px)" }}
        animate={{
          background: [tint2, color1, tint2],
          opacity: [0.03, 0.08, 0.03],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 7 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Confetti / Particle Burst for wins ── */
function ConfettiBurst({ color1, color2 }: { color1: string; color2: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        angle: (i / 32) * 360 + Math.random() * 11,
        distance: 45 + Math.random() * 90,
        size: 2.5 + Math.random() * 4.5,
        color: i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : "#fbbf24",
        delay: Math.random() * 0.4,
        rotation: Math.random() * 540,
        type: i % 4 === 0 ? "circle" : "rect",
      })),
    [color1, color2]
  );
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.type === "rect" ? p.size * 1.8 : p.size,
            background: p.color,
            borderRadius: p.type === "circle" ? "50%" : 2,
            boxShadow: `0 0 6px ${p.color}60`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance + 40,
            opacity: 0,
            rotate: p.rotation,
            scale: 0.2,
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Sparkle Particles (for perfect/great hits) ── */
function SparkleParticles({ color }: { color: string }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        angle: (i / 8) * 360 + Math.random() * 20,
        dist: 20 + Math.random() * 40,
        size: 1.5 + Math.random() * 2,
        delay: Math.random() * 0.2,
      })),
    [color]
  );
  return (
    <>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.size,
            height: s.size,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            left: "50%",
            top: "50%",
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos((s.angle * Math.PI) / 180) * s.dist,
            y: Math.sin((s.angle * Math.PI) / 180) * s.dist,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.6, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/* ── Score Popup Floating Text ── */
function ScorePopup({
  points,
  rating,
  color,
}: {
  points: number;
  rating: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.4 }}
      animate={{ y: -60, opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
    >
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-xl font-black"
          style={{
            color,
            textShadow: `0 0 14px ${color}, 0 0 28px ${color}60, 0 2px 4px rgba(0,0,0,0.5)`,
          }}
        >
          +{points}
        </span>
        <span
          className="text-[9px] font-black uppercase"
          style={{
            color,
            letterSpacing: "0.25em",
            textShadow: `0 0 10px ${color}`,
          }}
        >
          {rating}!
        </span>
      </div>
    </motion.div>
  );
}

/* ── Distance Label near blip ── */
function DistanceLabel({ distance, color }: { distance: number; color: string }) {
  // Convert angular distance to approximate meters for flavor text
  const meters = Math.max(2, Math.round(2 + (distance / 180) * 50));
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-[7px] font-black pointer-events-none"
      style={{
        color,
        textShadow: `0 0 6px ${color}80`,
        letterSpacing: "0.05em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      ~{meters}m
    </motion.span>
  );
}

/* ── Score Change Ripple ── */
function ScoreRipple({ color, trigger }: { color: string; trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 3, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Odometer Digit (spring-physics rolling) ── */
function OdometerDigit({ value, color }: { value: number; color?: string }) {
  return (
    <span
      className="inline-flex overflow-hidden relative"
      style={{ height: "1.2em", width: "0.65em" }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -24, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 28,
            mass: 0.8,
          }}
          className="absolute inset-0 flex items-center justify-center"
          style={color ? { color } : undefined}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Animated Counter with odometer digits ── */
function AnimatedCounter({
  value,
  className,
  color,
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = value;
    const duration = 700;
    const startTime = Date.now();
    const startVal = display;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (end - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const digits = String(display).split("");
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {digits.map((d, i) => (
        <OdometerDigit key={`${i}-${d}`} value={parseInt(d)} color={color} />
      ))}
    </span>
  );
}

/* ── Radar Grid Lines (crosshair + concentric dashed circles) ── */
function RadarGridLines({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  return (
    <g>
      {/* Concentric dashed circles */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((frac) => (
        <circle
          key={frac}
          cx={cx}
          cy={cy}
          r={r * frac * 0.85}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity={0.1 + frac * 0.03}
          strokeDasharray="2 5"
        />
      ))}
      {/* 8-way crosshair lines */}
      {[0, 45, 90, 135].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * r * 0.85;
        const y1 = cy + Math.sin(rad) * r * 0.85;
        const x2 = cx - Math.cos(rad) * r * 0.85;
        const y2 = cy - Math.sin(rad) * r * 0.85;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="0.5"
            opacity={deg % 90 === 0 ? 0.12 : 0.06}
            strokeDasharray={deg % 90 === 0 ? undefined : "1 3"}
          />
        );
      })}
      {/* N/S/E/W labels */}
      {[
        { label: "N", x: cx, y: cy - r * 0.85 + 8 },
        { label: "S", x: cx, y: cy + r * 0.85 - 3 },
        { label: "E", x: cx + r * 0.85 - 6, y: cy + 3 },
        { label: "W", x: cx - r * 0.85 + 6, y: cy + 3 },
      ].map((l) => (
        <text
          key={l.label}
          x={l.x}
          y={l.y}
          fill={color}
          fontSize="5"
          fontWeight="900"
          textAnchor="middle"
          opacity={0.2}
          style={{ letterSpacing: "0.1em" }}
        >
          {l.label}
        </text>
      ))}
    </g>
  );
}

/* ── Enhanced Scanlines (horizontal lines sweeping) ── */
function ScanlineOverlay({
  color,
  size,
  intensity,
}: {
  color: string;
  size: number;
  intensity: number;
}) {
  const lineCount = 6;
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-full z-[15]"
      style={{ width: size, height: size }}
    >
      {Array.from({ length: lineCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0"
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: 0.04 + intensity * 0.03,
          }}
          animate={{
            top: ["-5%", "105%"],
          }}
          transition={{
            duration: 2.5 - intensity * 0.5,
            delay: i * (2.5 / lineCount),
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ── Target Lock Animation (4 corner brackets closing on HIT) ── */
function TargetLockBrackets({
  color,
  show,
}: {
  color: string;
  show: boolean;
}) {
  if (!show) return null;
  const bracketSize = 14;
  const bracketThickness = 2;
  const corners = [
    { top: -4, left: -4, borderTop: bracketThickness, borderLeft: bracketThickness },
    { top: -4, right: -4, borderTop: bracketThickness, borderRight: bracketThickness },
    { bottom: -4, left: -4, borderBottom: bracketThickness, borderLeft: bracketThickness },
    { bottom: -4, right: -4, borderBottom: bracketThickness, borderRight: bracketThickness },
  ];

  return (
    <>
      {corners.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: bracketSize,
            height: bracketSize,
            borderColor: color,
            borderStyle: "solid",
            borderWidth: 0,
            ...pos,
            filter: `drop-shadow(0 0 4px ${color})`,
          } as any}
          initial={{ opacity: 0, scale: 2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: i * 0.05,
            type: "spring",
            stiffness: 300,
          }}
        />
      ))}
    </>
  );
}

/* ── Static / Interference Effect on MISS ── */
function StaticInterference({ intensity = 1 }: { intensity?: number }) {
  const bars = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        y: Math.random() * 100,
        height: 1 + Math.random() * 3,
        opacity: 0.05 + Math.random() * 0.1 * intensity,
        delay: Math.random() * 0.3,
      })),
    [intensity]
  );
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-full"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {bars.map((b) => (
        <motion.div
          key={b.id}
          className="absolute left-0 right-0"
          style={{
            top: `${b.y}%`,
            height: b.height,
            background: `rgba(239,68,68,${b.opacity})`,
          }}
          animate={{
            x: [0, Math.random() * 10 - 5, 0],
            opacity: [b.opacity, 0, b.opacity * 0.5, 0],
          }}
          transition={{ duration: 0.4, delay: b.delay }}
        />
      ))}
      {/* CRT flicker */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(239,68,68,0.03)" }}
        animate={{ opacity: [0.08, 0, 0.05, 0] }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

/* ── "TARGET ACQUIRED" Military Text ── */
function TargetAcquiredText({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ scale: 2.5, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -5 }}
      transition={{ duration: 0.35, type: "spring", stiffness: 250, damping: 18 }}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    >
      <div
        className="px-4 py-1.5 rounded-md"
        style={{
          background: `${color}12`,
          border: `1.5px solid ${color}50`,
          boxShadow: `0 0 24px ${color}25, inset 0 0 12px ${color}08`,
          backdropFilter: "blur(8px)",
        }}
      >
        <motion.span
          className="text-[9px] font-black uppercase block"
          style={{
            letterSpacing: "0.25em",
            color,
            textShadow: `0 0 10px ${color}, 0 0 20px ${color}40`,
          }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 0.8, repeat: 1 }}
        >
          ▸ TARGET ACQUIRED ◂
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ── Distance Indicator Bar ── */
function DistanceIndicator({
  distance,
  maxDist,
  color,
}: {
  distance: number;
  maxDist: number;
  color: string;
}) {
  const normalized = Math.max(0, Math.min(1, 1 - distance / maxDist));
  const barColor =
    normalized > 0.8 ? "#34d399" : normalized > 0.5 ? "#fbbf24" : "#f87171";
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <span
        className="text-[7px] font-black text-slate-500 uppercase"
        style={{ letterSpacing: "0.15em" }}
      >
        Proximity
      </span>
      <div
        className="w-20 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(30,41,59,0.8)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
            boxShadow: `0 0 8px ${barColor}60`,
          }}
          animate={{ width: `${normalized * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span
        className="text-[8px] font-black"
        style={{
          color: barColor,
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 4px ${barColor}40`,
        }}
      >
        {Math.round(normalized * 100)}%
      </span>
    </motion.div>
  );
}

/* ── Victory Rays (conic-gradient rotation) ── */
function VictoryRays({ color1, color2 }: { color1: string; color2: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-[1]"
      style={{
        width: 240,
        height: 240,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.1) 8%, transparent 16%, transparent 25%, rgba(245,158,11,0.08) 33%, transparent 41%, transparent 50%, rgba(251,191,36,0.1) 58%, transparent 66%, transparent 75%, rgba(245,158,11,0.08) 83%, transparent 91%)`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ── Rank Badge System ── */
function RankBadge({
  scorePercent,
  delay = 0,
}: {
  scorePercent: number;
  delay?: number;
}) {
  const getRank = () => {
    if (scorePercent >= 95) return { letter: "S", color: "#fbbf24", glow: "rgba(251,191,36,0.6)", bg: "rgba(251,191,36,0.12)", label: "LEGENDARY" };
    if (scorePercent >= 80) return { letter: "A", color: "#34d399", glow: "rgba(52,211,153,0.5)", bg: "rgba(52,211,153,0.1)", label: "EXCELLENT" };
    if (scorePercent >= 60) return { letter: "B", color: "#3b82f6", glow: "rgba(59,130,246,0.5)", bg: "rgba(59,130,246,0.1)", label: "GOOD" };
    if (scorePercent >= 40) return { letter: "C", color: "#a78bfa", glow: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.08)", label: "AVERAGE" };
    return { letter: "D", color: "#94a3b8", glow: "rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.06)", label: "NOVICE" };
  };
  const rank = getRank();

  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 12 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-2 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${rank.glow}, transparent 70%)`,
          }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div
          className="relative w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: rank.bg,
            border: `2px solid ${rank.color}60`,
            boxShadow: `0 0 20px ${rank.glow}, inset 0 0 15px ${rank.glow}`,
          }}
        >
          <span
            className="text-2xl font-black"
            style={{
              color: rank.color,
              textShadow: `0 0 12px ${rank.glow}`,
            }}
          >
            {rank.letter}
          </span>
        </div>
      </div>
      <span
        className="text-[7px] font-black uppercase"
        style={{
          color: rank.color,
          letterSpacing: "0.2em",
          textShadow: `0 0 6px ${rank.glow}`,
        }}
      >
        {rank.label}
      </span>
    </motion.div>
  );
}

/* ── Double-Ring Sonar Blip ── */
function SonarBlip({ color, cx, cy }: { color: string; cx: number; cy: number }) {
  return (
    <>
      {[0, 1].map((ring) => (
        <motion.circle
          key={ring}
          cx={cx}
          cy={cy}
          r={6}
          fill="none"
          stroke={color}
          strokeWidth={1.5 - ring * 0.5}
          initial={{ r: 4, opacity: 0.6 }}
          animate={{ r: [4, 18 + ring * 8], opacity: [0.5 - ring * 0.15, 0] }}
          transition={{
            duration: 1.5,
            delay: ring * 0.3,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

/* ── Depth of Field Blur Overlay ── */
function DepthOfFieldBlur({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "rgba(0,0,0,0.15)",
            backdropFilter: "blur(1px)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Leading Player Crown ── */
function LeadingCrown({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, y: 5 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0 }}
          className="absolute -top-4 right-0 z-20"
        >
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [0, 3, -3, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Crown
              className="w-4 h-4"
              style={{
                color: "#fbbf24",
                filter:
                  "drop-shadow(0 0 6px rgba(251,191,36,0.7)) drop-shadow(0 0 12px rgba(251,191,36,0.3))",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Countdown Shockwave Ring ── */
function ShockwaveRing({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 60,
        height: 60,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        border: `2px solid ${color}`,
      }}
      initial={{ scale: 0.5, opacity: 0.9 }}
      animate={{ scale: 5, opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeOut", delay }}
    />
  );
}

/* ── Countdown Particle Burst ── */
function CountdownBurst({ color }: { color: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        angle: (i / 12) * 360,
        dist: 30 + Math.random() * 25,
        size: 2 + Math.random() * 2,
        delay: Math.random() * 0.15,
      })),
    [color]
  );
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            width: d.size,
            height: d.size,
            background: color,
            boxShadow: `0 0 4px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0.8 }}
          animate={{
            x: Math.cos((d.angle * Math.PI) / 180) * d.dist,
            y: Math.sin((d.angle * Math.PI) / 180) * d.dist,
            opacity: 0,
          }}
          transition={{ duration: 0.5, delay: d.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MapProximityTag({
  opponent,
  category,
  onComplete,
}: MapGameChildProps) {
  const theme = THEMES[category];
  const opponentName = opponent.firstName;
  const avatarUrl = opponent.profilePhoto || undefined;

  const RADAR_SIZE = 200;

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [score, setScore] = useState(0);

  // ── Round state ──
  const [targetAngle, setTargetAngle] = useState(0);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [canTap, setCanTap] = useState(false);
  const [showGo, setShowGo] = useState(false);

  // ── Screen shake ──
  const [shakeScreen, setShakeScreen] = useState(false);

  // ── Score popup state ──
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [scorePopupKey, setScorePopupKey] = useState(0);

  // ── Score ripple trigger ──
  const [scoreRipple, setScoreRipple] = useState(0);

  // ── "Target acquired" text ──
  const [showTargetText, setShowTargetText] = useState(false);

  // ── Static interference on miss ──
  const [showStatic, setShowStatic] = useState(false);

  // ── Target lock brackets ──
  const [showTargetLock, setShowTargetLock] = useState(false);

  // ── Depth of field blur ──
  const [depthBlur, setDepthBlur] = useState(false);

  // ── Radial wipe between rounds ──
  const [showWipe, setShowWipe] = useState(false);

  // ── Refs ──
  const sweepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sweepAngleRef = useRef(0);

  // ── Progressive intensity ──
  const progressIntensity = Math.min((currentRound + 1) / TOTAL_ROUNDS, 1);

  // ── useIntensity: progressive intensity scaling ──
  const intensity = useMemo(() => {
    const progress = (currentRound + 1) / TOTAL_ROUNDS;
    return 0.7 + progress * 0.5;
  }, [currentRound]);

  // ── Dynamic color temperature ──
  const avgPoints = results.length > 0 ? score / results.length : 0;
  const isLeading = avgPoints >= 75;

  // ── winnerTint: score-based color temperature ──
  const winnerTint = useMemo(() => {
    if (score > 0 && avgPoints >= 75) return 'warm';
    if (results.length > 0 && avgPoints < 50) return 'cool';
    return 'neutral';
  }, [score, avgPoints, results.length]);

  // ── Sweep speed (gets faster in later rounds) ──
  const sweepSpeed = useMemo(() => {
    return SWEEP_DURATION / (1 + progressIntensity * 0.3);
  }, [progressIntensity]);

  // ── Generate a random target angle ──
  const generateTarget = useCallback(() => {
    return Math.random() * 360;
  }, []);

  // ── Countdown ──
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      setShowGo(false);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowGo(true);
            setTimeout(() => {
              setShowGo(false);
              startRound();
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── Start a round ──
  const startRound = useCallback(() => {
    const newTarget = generateTarget();
    setTargetAngle(newTarget);
    setSweepAngle(0);
    sweepAngleRef.current = 0;
    setCanTap(true);
    setShowScorePopup(false);
    setShowTargetText(false);
    setShowStatic(false);
    setShowTargetLock(false);
    setDepthBlur(false);
    setPhase("playing");

    // Start sweep animation
    const interval = 16; // ~60fps
    const degreesPerMs = 360 / (sweepSpeed * 1000);
    sweepRef.current = setInterval(() => {
      sweepAngleRef.current =
        (sweepAngleRef.current + degreesPerMs * interval) % 360;
      setSweepAngle(sweepAngleRef.current);
    }, interval);
  }, [generateTarget, sweepSpeed]);

  // ── Handle tap ──
  const handleTap = useCallback(() => {
    if (!canTap || phase !== "playing") return;
    setCanTap(false);
    setDepthBlur(true);
    setTimeout(() => setDepthBlur(false), 400);

    // Stop sweep
    if (sweepRef.current) {
      clearInterval(sweepRef.current);
      sweepRef.current = null;
    }

    const hitAngle = sweepAngleRef.current;
    let diff = Math.abs(hitAngle - targetAngle);
    if (diff > 180) diff = 360 - diff;

    let points = 0;
    let rating: "perfect" | "great" | "good" | "miss";

    if (diff <= TARGET_ARC_DEG / 4) {
      points = 100;
      rating = "perfect";
    } else if (diff <= TARGET_ARC_DEG / 2) {
      points = 75;
      rating = "great";
    } else if (diff <= TARGET_ARC_DEG) {
      points = 50;
      rating = "good";
    } else {
      points = 0;
      rating = "miss";
      setShakeScreen(true);
      setShowStatic(true);
      setTimeout(() => setShakeScreen(false), 400);
      setTimeout(() => setShowStatic(false), 600);
    }

    // Target lock for hits
    if (rating !== "miss") {
      setShowTargetLock(true);
      setTimeout(() => setShowTargetLock(false), 800);
    }

    const result: RoundResult = {
      distance: diff,
      points,
      rating,
      targetAngle,
      hitAngle,
    };

    setLastResult(result);
    setResults((r) => [...r, result]);
    setScore((s) => s + points);
    setScoreRipple((t) => t + 1);

    // Show score popup
    if (points > 0) {
      setShowScorePopup(true);
      setScorePopupKey((k) => k + 1);
    }

    // Show "TARGET ACQUIRED" for perfect/great
    if (rating === "perfect" || rating === "great") {
      setShowTargetText(true);
      setTimeout(() => setShowTargetText(false), 900);
    }

    // Go to reveal after a brief pause
    setTimeout(() => {
      setPhase("reveal");
    }, 600);
  }, [canTap, phase, targetAngle]);

  // ── Auto-advance from reveal ──
  useEffect(() => {
    if (phase === "reveal") {
      const timer = setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          setPhase("results");
        } else {
          // Trigger radial wipe between rounds
          setShowWipe(true);
          setTimeout(() => setShowWipe(false), 700);
          setCurrentRound((r) => r + 1);
          startRound();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentRound]);

  // ── Auto-miss if full rotation without tap ──
  useEffect(() => {
    if (phase === "playing" && canTap) {
      const timeout = setTimeout(() => {
        if (canTap) {
          setCanTap(false);
          if (sweepRef.current) {
            clearInterval(sweepRef.current);
            sweepRef.current = null;
          }
          const result: RoundResult = {
            distance: 180,
            points: 0,
            rating: "miss",
            targetAngle,
            hitAngle: null,
          };
          setLastResult(result);
          setResults((r) => [...r, result]);
          setShakeScreen(true);
          setShowStatic(true);
          setTimeout(() => setShakeScreen(false), 400);
          setTimeout(() => setShowStatic(false), 600);
          setTimeout(() => setPhase("reveal"), 400);
        }
      }, sweepSpeed * 2 * 1000);
      return () => clearTimeout(timeout);
    }
  }, [phase, canTap, targetAngle, sweepSpeed]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (sweepRef.current) clearInterval(sweepRef.current);
    };
  }, []);

  // ── Play again ──
  const handlePlayAgain = useCallback(() => {
    if (sweepRef.current) {
      clearInterval(sweepRef.current);
      sweepRef.current = null;
    }
    setPhase("countdown");
    setCurrentRound(0);
    setResults([]);
    setScore(0);
    setCanTap(false);
    setSweepAngle(0);
    sweepAngleRef.current = 0;
    setShowScorePopup(false);
    setShowTargetText(false);
    setShowStatic(false);
    setShowTargetLock(false);
    setDepthBlur(false);
  }, []);

  // ── Derived values for results ──
  const maxScore = TOTAL_ROUNDS * 100;
  const scorePercent = Math.round((score / maxScore) * 100);
  const perfectCount = results.filter((r) => r.rating === "perfect").length;
  const greatCount = results.filter((r) => r.rating === "great").length;
  const goodCount = results.filter((r) => r.rating === "good").length;
  const missCount = results.filter((r) => r.rating === "miss").length;

  // ── Helper to draw arc path ──
  const arcPath = (
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number
  ) => {
    const startRad = ((startDeg - 90) * Math.PI) / 180;
    const endRad = ((endDeg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // ── Rating color map ──
  const ratingColor = (rating: string) => {
    switch (rating) {
      case "perfect":
        return "#34d399";
      case "great":
        return "#3b82f6";
      case "good":
        return "#fbbf24";
      case "miss":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const cx = RADAR_SIZE / 2;
  const cy = RADAR_SIZE / 2;

  // ── Conic sweep trail (60° arc) ──
  const sweepTrailGradient = useMemo(() => {
    return `conic-gradient(from ${sweepAngle - 90 - 60}deg at 50% 50%, transparent 0deg, ${theme.color1}08 20deg, ${theme.color1}18 50deg, ${theme.color1}35 60deg, transparent 61deg)`;
  }, [sweepAngle, theme.color1]);

  return (
    <motion.div
      className="relative flex flex-col w-full text-white select-none overflow-hidden"
      animate={
        shakeScreen
          ? { x: [0, -5, 7, -4, 3, -1, 0], y: [0, 2, -2, 1, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.4 }}
    >
      {/* ── Noise texture ── */}
      <NoiseTexture />

      {/* ── Dynamic color temperature orbs ── */}
      <DynamicOrbs
        color1={theme.glow}
        color2={theme.glowStrong}
        color3={theme.glowSoft}
        isLeading={isLeading}
        intensity={progressIntensity}
      />

      {/* ── Ambient dust motes ── */}
      <DustMotes
        intensity={0.5 + progressIntensity * 0.7}
        round={currentRound}
      />

      {/* ── Ambient particles (shared component) ── */}
      <AmbientParticles intensity={intensity} color={theme.color1} />

      {/* ── Radial Wipe (between-round transition) ── */}
      <AnimatePresence>
        {showWipe && (
          <motion.div
            key="radial-wipe"
            className="absolute inset-0 rounded-full pointer-events-none z-50"
            style={{
              background: `radial-gradient(circle, ${winnerTint === 'warm' ? theme.color1 : winnerTint === 'cool' ? '#3b82f6' : theme.color1} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* ═══ PHASE: COUNTDOWN ═══ */}
      <AnimatePresence mode="wait">
        {phase === "countdown" && (
          <motion.div
            key="countdown-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={{ duration: 0.35 }}
            className="relative flex flex-col items-center justify-center py-16"
          >
            {/* Cinematic letterbox bars */}
            <motion.div
              className="absolute top-0 left-0 right-0 bg-black z-30"
              initial={{ height: 40 }}
              animate={{ height: countdown === 0 ? 0 : 40 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black z-30"
              initial={{ height: 40 }}
              animate={{ height: countdown === 0 ? 0 : 40 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />

            {/* Radial background glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 3, ease: "easeOut" }}
              style={{
                background: `radial-gradient(circle at 50% 50%, ${theme.glow.replace(
                  "0.4",
                  "0.1"
                )} 0%, transparent 55%)`,
              }}
            />

            {/* Subtle vignette */}
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)",
              }}
            />

            {/* Title */}
            <motion.p
              initial={{ y: -15, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="text-[10px] font-black uppercase mb-3 z-20"
              style={{
                letterSpacing: "0.35em",
                background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2}, ${theme.color3})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
              }}
            >
              Proximity Tag
            </motion.p>

            {/* Crosshair icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="z-20"
            >
              <Crosshair
                className="w-7 h-7 mb-3"
                style={{
                  color: theme.color1,
                  filter: `drop-shadow(0 0 10px ${theme.glow}) drop-shadow(0 0 20px ${theme.glow})`,
                }}
              />
            </motion.div>

            {/* Countdown number / GO! */}
            <AnimatePresence mode="popLayout">
              {showGo ? (
                <motion.div
                  key="go"
                  initial={{ scale: 0, opacity: 0, rotate: -10 }}
                  animate={{ scale: 2.2, opacity: 1, rotate: 0 }}
                  exit={{
                    scale: 5,
                    opacity: 0,
                    filter: "blur(16px)",
                  }}
                  transition={{
                    duration: 0.45,
                    type: "spring",
                    stiffness: 180,
                    damping: 12,
                  }}
                  className="relative z-20"
                >
                  <span
                    className="text-7xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 50px ${theme.glowStrong})`,
                    }}
                  >
                    GO!
                  </span>
                  {/* GO flash ring */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${theme.glowStrong} 0%, transparent 60%)`,
                    }}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                  <ShockwaveRing color={theme.color1} />
                  <ShockwaveRing color={theme.color2} delay={0.1} />
                </motion.div>
              ) : countdown > 0 ? (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{
                    scale: 3.5,
                    opacity: 0,
                    filter: "blur(12px)",
                  }}
                  transition={{
                    duration: 0.65,
                    type: "spring",
                    stiffness: 140,
                    damping: 12,
                  }}
                  className="relative z-20"
                >
                  {/* Countdown number with colored gradient */}
                  <span
                    className="text-8xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 35px ${theme.glow})`,
                    }}
                  >
                    {countdown}
                  </span>

                  {/* Layered pulsing glow rings */}
                  {[0, 1, 2].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute rounded-full"
                      style={{
                        width: 80 + ring * 35,
                        height: 80 + ring * 35,
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        border: `${2 - ring * 0.5}px solid ${theme.color1}`,
                        opacity: 0.3 - ring * 0.1,
                        boxShadow: `0 0 ${10 + ring * 5}px ${theme.glow}`,
                      }}
                      animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.3 - ring * 0.1, 0, 0.3 - ring * 0.1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: ring * 0.15,
                      }}
                    />
                  ))}

                  {/* Shockwave ring per number */}
                  <ShockwaveRing color={theme.color1} />

                  {/* Background glow pulse */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 100,
                      height: 100,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      boxShadow: `0 0 80px 30px ${theme.glow}`,
                    }}
                    animate={{
                      opacity: [0.5, 0.15, 0.5],
                      scale: [1, 1.4, 1],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />

                  {/* Particle burst on each number */}
                  <CountdownBurst color={theme.color1} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Opponent name */}
            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-xs font-bold mt-10 uppercase z-20"
              style={{
                letterSpacing: "0.15em",
                background:
                  "linear-gradient(90deg, rgba(148,163,184,1), rgba(100,116,139,1))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tag {opponentName}!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PHASE: PLAYING / REVEAL ═══ */}
      {(phase === "playing" || phase === "reveal") && (
        <div className="relative flex flex-col items-center px-4 py-3">
          {/* Depth of field blur */}
          <DepthOfFieldBlur active={depthBlur} />

          {/* Top bar: avatar + round tracker + score */}
          <motion.div
            className="w-full flex items-center justify-between mb-3 relative z-10 px-3 py-2 rounded-2xl"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                {/* Avatar glow border */}
                <motion.div
                  className="absolute -inset-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                  }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={opponentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
              <div>
                <p
                  className="text-xs font-black text-white"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {opponentName}
                </p>
                <p
                  className="text-[8px] text-slate-500 uppercase font-bold"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Round {currentRound + 1}/{TOTAL_ROUNDS}
                </p>
              </div>
            </div>

            {/* Center: Round dots with connecting lines */}
            <div className="flex items-center gap-0">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                const result = results[i];
                let dotColor = "rgba(30,41,59,0.6)";
                let borderCol = "rgba(51,65,85,0.5)";
                let glow = "none";
                if (result) {
                  dotColor = `${ratingColor(result.rating)}20`;
                  borderCol = `${ratingColor(result.rating)}80`;
                  glow = `0 0 8px ${ratingColor(result.rating)}40`;
                } else if (i === currentRound) {
                  dotColor = `${theme.color1}15`;
                  borderCol = theme.color1;
                  glow = `0 0 12px ${theme.glow}`;
                }
                return (
                  <div key={i} className="flex items-center">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: dotColor,
                        border: `1.5px solid ${borderCol}`,
                        boxShadow: glow,
                      }}
                      animate={
                        i === currentRound && !result
                          ? { scale: [1, 1.3, 1] }
                          : {}
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    {i < TOTAL_ROUNDS - 1 && (
                      <div
                        className="w-2.5 h-[1px] mx-0.5"
                        style={{
                          background: result
                            ? `${ratingColor(result.rating)}40`
                            : "rgba(51,65,85,0.3)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Score with leading crown */}
            <div className="relative text-right">
              <LeadingCrown show={isLeading && results.length > 0} />
              <motion.p
                key={score}
                animate={{ scale: [1.25, 1] }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-lg font-black"
                style={{
                  background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontVariantNumeric: "tabular-nums",
                  filter: isLeading
                    ? `drop-shadow(0 0 6px ${theme.glow})`
                    : "none",
                }}
              >
                {score}
              </motion.p>
              <p
                className="text-[7px] text-slate-500 uppercase font-bold"
                style={{ letterSpacing: "0.2em" }}
              >
                pts
              </p>
              <ScoreRipple color={theme.color1} trigger={scoreRipple} />
            </div>
          </motion.div>

          {/* "TARGET ACQUIRED" text overlay */}
          <AnimatePresence>
            {showTargetText && <TargetAcquiredText color={theme.color1} />}
          </AnimatePresence>

          {/* ── RADAR ── */}
          <div
            className="relative"
            style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
          >
            {/* Rotating dashed border (opposite direction) */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-[12]"
              animate={{ rotate: -360 }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg width={RADAR_SIZE} height={RADAR_SIZE}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={cx - 1}
                  fill="none"
                  stroke={theme.color1}
                  strokeWidth="1"
                  strokeDasharray="5 9"
                  opacity={0.12}
                />
              </svg>
            </motion.div>

            {/* Second rotating dashed border (same direction as sweep, slower) */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-[11]"
              animate={{ rotate: 360 }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg width={RADAR_SIZE} height={RADAR_SIZE}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={cx - 6}
                  fill="none"
                  stroke={theme.color2}
                  strokeWidth="0.5"
                  strokeDasharray="3 12"
                  opacity={0.08}
                />
              </svg>
            </motion.div>

            {/* Radial glow behind radar */}
            <div
              className="absolute inset-0 rounded-full blur-xl pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${theme.glow.replace(
                  "0.4",
                  "0.12"
                )} 0%, transparent 55%)`,
              }}
            />

            {/* 60° Conic sweep trail */}
            {phase === "playing" && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none z-[13]"
                style={{
                  background: sweepTrailGradient,
                  opacity: 0.5 + progressIntensity * 0.3,
                }}
              />
            )}

            {/* Enhanced scanlines */}
            <ScanlineOverlay
              color={theme.color1}
              size={RADAR_SIZE}
              intensity={progressIntensity}
            />

            {/* Static interference on miss */}
            {showStatic && (
              <StaticInterference intensity={progressIntensity} />
            )}

            {/* Main radar SVG */}
            <svg
              width={RADAR_SIZE}
              height={RADAR_SIZE}
              className="relative z-10"
              style={{
                filter: `drop-shadow(0 0 25px ${theme.glow.replace(
                  "0.4",
                  "0.12"
                )})`,
              }}
            >
              {/* Background circle with subtle inner gradient */}
              <defs>
                <radialGradient id="radarBgGradPT" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor={theme.color1}
                    stopOpacity={0.03}
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(15,23,42)"
                    stopOpacity={0.85}
                  />
                </radialGradient>
              </defs>
              <circle
                cx={cx}
                cy={cy}
                r={cx - 4}
                fill="url(#radarBgGradPT)"
                stroke={theme.color1}
                strokeWidth="1.5"
                strokeOpacity={0.25}
              />

              {/* Grid lines */}
              <RadarGridLines color={theme.color1} size={RADAR_SIZE} />

              {/* Target zone arc (golden/highlighted area) */}
              <path
                d={arcPath(
                  cx,
                  cy,
                  cx - 14,
                  targetAngle - TARGET_ARC_DEG / 2,
                  targetAngle + TARGET_ARC_DEG / 2
                )}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="24"
                strokeLinecap="round"
                opacity={0.15}
                style={{ filter: "blur(2px)" }}
              />
              <path
                d={arcPath(
                  cx,
                  cy,
                  cx - 14,
                  targetAngle - TARGET_ARC_DEG / 2,
                  targetAngle + TARGET_ARC_DEG / 2
                )}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="20"
                strokeLinecap="round"
                opacity={0.3}
              />
              {/* Inner accent on target arc */}
              <path
                d={arcPath(
                  cx,
                  cy,
                  cx - 14,
                  targetAngle - TARGET_ARC_DEG / 4,
                  targetAngle + TARGET_ARC_DEG / 4
                )}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="20"
                strokeLinecap="round"
                opacity={0.12}
                style={{ filter: "blur(1px)" }}
              />

              {/* Target center marker — pulsing dot */}
              <circle
                cx={
                  cx +
                  (cx - 14) *
                    Math.cos(((targetAngle - 90) * Math.PI) / 180)
                }
                cy={
                  cy +
                  (cy - 14) *
                    Math.sin(((targetAngle - 90) * Math.PI) / 180)
                }
                r="4"
                fill="#fbbf24"
                opacity={0.9}
                style={{
                  filter:
                    "drop-shadow(0 0 8px rgba(251,191,36,0.9))",
                }}
              >
                <animate
                  attributeName="r"
                  values="3;5;3"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Double-ring sonar blip at target position */}
              <SonarBlip
                color="#fbbf24"
                cx={
                  cx +
                  (cx - 14) *
                    Math.cos(((targetAngle - 90) * Math.PI) / 180)
                }
                cy={
                  cy +
                  (cy - 14) *
                    Math.sin(((targetAngle - 90) * Math.PI) / 180)
                }
              />

              {/* Sweep ghost trail — 3 fading sweep arm positions */}
              {phase === "playing" &&
                [20, 12, 5].map((offset, i) => {
                  const ghostAngle = sweepAngle - offset;
                  const ghostRad =
                    ((ghostAngle - 90) * Math.PI) / 180;
                  return (
                    <line
                      key={`ghost-${i}`}
                      x1={cx}
                      y1={cy}
                      x2={cx + (cx - 14) * Math.cos(ghostRad)}
                      y2={cy + (cy - 14) * Math.sin(ghostRad)}
                      stroke={theme.color1}
                      strokeWidth={1}
                      opacity={0.06 + i * 0.03}
                      style={{
                        filter: `drop-shadow(0 0 2px ${theme.glow})`,
                      }}
                    />
                  );
                })}

              {/* Sweep ghost arc trail */}
              {phase === "playing" && (
                <>
                  <path
                    d={arcPath(
                      cx,
                      cy,
                      cx - 14,
                      sweepAngle - 40,
                      sweepAngle
                    )}
                    fill="none"
                    stroke={theme.color1}
                    strokeWidth="2"
                    opacity={0.1}
                    style={{
                      filter: `drop-shadow(0 0 4px ${theme.glow})`,
                    }}
                  />
                  <path
                    d={arcPath(
                      cx,
                      cy,
                      cx - 14,
                      sweepAngle - 15,
                      sweepAngle
                    )}
                    fill="none"
                    stroke={theme.color1}
                    strokeWidth="1.5"
                    opacity={0.2}
                  />
                </>
              )}

              {/* Main sweep line */}
              <line
                x1={cx}
                y1={cy}
                x2={
                  cx +
                  (cx - 14) *
                    Math.cos(((sweepAngle - 90) * Math.PI) / 180)
                }
                y2={
                  cy +
                  (cy - 14) *
                    Math.sin(((sweepAngle - 90) * Math.PI) / 180)
                }
                stroke={theme.color1}
                strokeWidth="2"
                opacity={0.85}
                style={{
                  filter: `drop-shadow(0 0 10px ${theme.glowStrong}) drop-shadow(0 0 4px ${theme.color1})`,
                }}
              />

              {/* Sweep dot (tip of sweep line) */}
              <circle
                cx={
                  cx +
                  (cx - 14) *
                    Math.cos(((sweepAngle - 90) * Math.PI) / 180)
                }
                cy={
                  cy +
                  (cy - 14) *
                    Math.sin(((sweepAngle - 90) * Math.PI) / 180)
                }
                r="5"
                fill={theme.color1}
                opacity={0.9}
                style={{
                  filter: `drop-shadow(0 0 8px ${theme.glowStrong})`,
                }}
              />

              {/* Hit marker (during reveal) with target lock brackets */}
              {phase === "reveal" &&
                lastResult &&
                lastResult.hitAngle !== null && (
                  <>
                    {/* Outer glow */}
                    <circle
                      cx={
                        cx +
                        (cx - 14) *
                          Math.cos(
                            ((lastResult.hitAngle - 90) * Math.PI) / 180
                          )
                      }
                      cy={
                        cy +
                        (cy - 14) *
                          Math.sin(
                            ((lastResult.hitAngle - 90) * Math.PI) / 180
                          )
                      }
                      r="10"
                      fill={ratingColor(lastResult.rating)}
                      opacity={0.2}
                      style={{
                        filter: `blur(2px)`,
                      }}
                    />
                    {/* Inner dot */}
                    <circle
                      cx={
                        cx +
                        (cx - 14) *
                          Math.cos(
                            ((lastResult.hitAngle - 90) * Math.PI) / 180
                          )
                      }
                      cy={
                        cy +
                        (cy - 14) *
                          Math.sin(
                            ((lastResult.hitAngle - 90) * Math.PI) / 180
                          )
                      }
                      r="4"
                      fill={ratingColor(lastResult.rating)}
                      opacity={0.95}
                      style={{
                        filter: `drop-shadow(0 0 8px ${ratingColor(
                          lastResult.rating
                        )})`,
                      }}
                    />
                  </>
                )}

              {/* Center crosshair */}
              <g opacity={0.5}>
                <line
                  x1={cx - 10}
                  y1={cy}
                  x2={cx + 10}
                  y2={cy}
                  stroke={theme.color1}
                  strokeWidth="1"
                />
                <line
                  x1={cx}
                  y1={cy - 10}
                  x2={cx}
                  y2={cy + 10}
                  stroke={theme.color1}
                  strokeWidth="1"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill="none"
                  stroke={theme.color1}
                  strokeWidth="1"
                />
              </g>

              {/* Opponent avatar in center */}
              <clipPath id="radarAvatarPT">
                <circle cx={cx} cy={cy} r="14" />
              </clipPath>
              {avatarUrl ? (
                <image
                  href={avatarUrl}
                  x={cx - 14}
                  y={cy - 14}
                  width="28"
                  height="28"
                  clipPath="url(#radarAvatarPT)"
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r="14"
                  fill="rgba(30,41,59,0.8)"
                  stroke={theme.color1}
                  strokeWidth="1"
                  strokeOpacity={0.3}
                />
              )}
            </svg>

            {/* Target lock brackets overlay */}
            {phase === "reveal" &&
              lastResult &&
              lastResult.hitAngle !== null &&
              lastResult.rating !== "miss" && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    left:
                      cx +
                      (cx - 14) *
                        Math.cos(
                          ((lastResult.hitAngle - 90) * Math.PI) / 180
                        ) -
                      12,
                    top:
                      cy +
                      (cy - 14) *
                        Math.sin(
                          ((lastResult.hitAngle - 90) * Math.PI) / 180
                        ) -
                      12,
                    width: 24,
                    height: 24,
                  }}
                >
                  <TargetLockBrackets
                    color={ratingColor(lastResult.rating)}
                    show={showTargetLock}
                  />
                  {/* Sparkle particles for perfect/great */}
                  {(lastResult.rating === "perfect" ||
                    lastResult.rating === "great") && (
                    <SparkleParticles
                      color={ratingColor(lastResult.rating)}
                    />
                  )}
                </div>
              )}

            {/* Distance label near blip (during reveal) */}
            <AnimatePresence>
              {phase === "reveal" && lastResult && lastResult.hitAngle !== null && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    left:
                      cx +
                      (cx - 14) *
                        Math.cos(
                          ((lastResult.hitAngle - 90) * Math.PI) / 180
                        ) +
                      10,
                    top:
                      cy +
                      (cy - 14) *
                        Math.sin(
                          ((lastResult.hitAngle - 90) * Math.PI) / 180
                        ) -
                      4,
                  }}
                >
                  <DistanceLabel
                    distance={lastResult.distance}
                    color={ratingColor(lastResult.rating)}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Score popup floating up */}
            <AnimatePresence>
              {showScorePopup &&
                lastResult &&
                lastResult.points > 0 && (
                  <ScorePopup
                    key={scorePopupKey}
                    points={lastResult.points}
                    rating={lastResult.rating}
                    color={ratingColor(lastResult.rating)}
                  />
                )}
            </AnimatePresence>
          </div>

          {/* Distance indicator bar (during reveal) */}
          <AnimatePresence>
            {phase === "reveal" && lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2"
              >
                <DistanceIndicator
                  distance={lastResult.distance}
                  maxDist={TARGET_ARC_DEG}
                  color={ratingColor(lastResult.rating)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAP button (during playing) */}
          {phase === "playing" && (
            <div className="relative w-full max-w-xs mt-4">
              {/* Pulse rings around button */}
              {canTap && (
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: `2px solid ${theme.glow}` }}
                    animate={{
                      scale: [1, 1.12],
                      opacity: [0.45, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: `1.5px solid ${theme.glow}` }}
                    animate={{
                      scale: [1, 1.18],
                      opacity: [0.3, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.4,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      border: `1px solid ${theme.glow}`,
                    }}
                    animate={{
                      scale: [1, 1.22],
                      opacity: [0.2, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.8,
                    }}
                  />
                </div>
              )}
              <motion.button
                onClick={handleTap}
                disabled={!canTap}
                whileTap={canTap ? { scale: 0.93 } : {}}
                whileHover={canTap ? { scale: 1.02 } : {}}
                className="relative w-full py-5 rounded-2xl text-white font-black text-sm uppercase flex items-center justify-center gap-2.5 overflow-hidden disabled:opacity-30 disabled:grayscale"
                style={{
                  letterSpacing: "0.2em",
                  background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                  boxShadow: canTap
                    ? `0 6px 30px ${theme.glow}, 0 0 40px ${theme.glow.replace(
                        "0.4",
                        "0.15"
                      )}, inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15)`
                    : "none",
                  textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}
              >
                {/* Button shimmer effect */}
                {canTap && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                      width: "35%",
                    }}
                    animate={{ x: ["-120%", "380%"] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
                <Crosshair
                  className="w-5 h-5 relative z-10"
                  style={{
                    filter:
                      "drop-shadow(0 0 6px rgba(255,255,255,0.6))",
                  }}
                />
                <span className="relative z-10">TAG NOW!</span>
              </motion.button>
            </div>
          )}

          {/* Reveal feedback card */}
          <AnimatePresence>
            {phase === "reveal" && lastResult && (
              <motion.div
                initial={{ y: 18, opacity: 0, scale: 0.88 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -12, opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 20,
                }}
                className="w-full max-w-xs mt-4"
              >
                <div
                  className="relative flex items-center justify-center gap-2.5 py-3 rounded-xl overflow-hidden"
                  style={{
                    background: `${ratingColor(lastResult.rating)}10`,
                    border: `1px solid ${ratingColor(lastResult.rating)}35`,
                    boxShadow: `0 0 25px ${ratingColor(
                      lastResult.rating
                    )}12, inset 0 0 20px ${ratingColor(
                      lastResult.rating
                    )}05`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <span
                    className="text-lg font-black uppercase"
                    style={{
                      letterSpacing: "0.12em",
                      background: `linear-gradient(90deg, ${ratingColor(
                        lastResult.rating
                      )}, ${ratingColor(lastResult.rating)}cc)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "none",
                    }}
                  >
                    {lastResult.rating}!
                  </span>
                  <span
                    className="text-sm font-black"
                    style={{
                      color: ratingColor(lastResult.rating),
                      fontVariantNumeric: "tabular-nums",
                      textShadow: `0 0 8px ${ratingColor(
                        lastResult.rating
                      )}40`,
                    }}
                  >
                    +{lastResult.points}
                  </span>
                  {lastResult.rating === "perfect" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Sparkles
                        className="w-4 h-4 text-emerald-400"
                        style={{
                          filter:
                            "drop-shadow(0 0 6px rgba(52,211,153,0.7))",
                        }}
                      />
                    </motion.div>
                  )}
                  {lastResult.rating === "great" && (
                    <Star
                      className="w-3.5 h-3.5 text-blue-400"
                      style={{
                        filter:
                          "drop-shadow(0 0 4px rgba(59,130,246,0.5))",
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ PHASE: RESULTS ═══ */}
      {phase === "results" && (
        <div className="relative flex flex-col items-center px-4 py-5">
          {/* Confetti for good scores */}
          {scorePercent >= 60 && (
            <ConfettiBurst color1={theme.color1} color2="#fbbf24" />
          )}

          {/* Victory rays for great scores */}
          {scorePercent >= 80 && (
            <VictoryRays color1={theme.color1} color2={theme.color2} />
          )}

          {/* Results card */}
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 35 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 160,
              damping: 14,
            }}
            className="w-full max-w-sm"
          >
            {/* Animated conic gradient border */}
            <div className="relative rounded-2xl overflow-visible">
              <motion.div
                className="absolute -inset-[1.5px] rounded-2xl pointer-events-none z-0"
                style={{
                  background:
                    scorePercent >= 80
                      ? `conic-gradient(from 0deg, rgba(251,191,36,0.35), transparent 20%, rgba(245,158,11,0.35) 40%, transparent 60%, rgba(251,191,36,0.35) 80%, transparent)`
                      : `conic-gradient(from 0deg, ${theme.color1}35, transparent 20%, ${theme.color2}35 40%, transparent 60%, ${theme.color1}35 80%, transparent)`,
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <div
                className="relative rounded-2xl overflow-hidden z-10"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(32px) saturate(1.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: `0 30px 70px rgba(0,0,0,0.55), 0 0 50px ${
                    scorePercent >= 80
                      ? 'rgba(251,191,36,0.12)'
                      : theme.glow.replace('0.4', '0.1')
                  }, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)`,
                }}
              >
                {/* Top accent bar */}
                <div
                  className="h-1.5"
                  style={{
                    background:
                      scorePercent >= 80
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)"
                        : `linear-gradient(90deg, ${theme.color1}, ${theme.color2}, ${theme.color1})`,
                    boxShadow:
                      scorePercent >= 80
                        ? "0 3px 20px rgba(245,158,11,0.5)"
                        : `0 3px 20px ${theme.glow}`,
                  }}
                />
                <div className="p-5 text-center">
                  {/* Rank badge */}
                  <motion.div
                    className="mb-3"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <RankBadge
                      scorePercent={scorePercent}
                      delay={0.25}
                    />
                  </motion.div>

                  {/* Score circle with animated arc */}
                  <motion.div
                    className="relative w-24 h-24 mx-auto mb-4"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.3,
                      type: "spring",
                      stiffness: 130,
                    }}
                  >
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 96 96"
                    >
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="rgba(30,41,59,0.6)"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke={`url(#scoreGradPT)`}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{
                          strokeDashoffset: 2 * Math.PI * 40,
                        }}
                        animate={{
                          strokeDashoffset:
                            2 * Math.PI * 40 * (1 - scorePercent / 100),
                        }}
                        transition={{
                          duration: 1.4,
                          delay: 0.5,
                          ease: "easeOut",
                        }}
                        style={{
                          filter: `drop-shadow(0 0 10px ${theme.glow})`,
                        }}
                      />
                      <defs>
                        <linearGradient
                          id="scoreGradPT"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor={theme.color1}
                          />
                          <stop
                            offset="100%"
                            stopColor={theme.color2}
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <AnimatedCounter
                        value={score}
                        className="text-2xl font-black text-white"
                      />
                      <span
                        className="text-[7px] text-slate-500 font-bold uppercase"
                        style={{ letterSpacing: "0.15em" }}
                      >
                        /{maxScore}
                      </span>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-black uppercase mb-1"
                    style={{
                      letterSpacing: "0.15em",
                      background:
                        scorePercent >= 80
                          ? "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)"
                          : scorePercent >= 60
                          ? `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`
                          : undefined,
                      WebkitBackgroundClip:
                        scorePercent >= 60 ? "text" : undefined,
                      WebkitTextFillColor:
                        scorePercent >= 60 ? "transparent" : undefined,
                      color: scorePercent < 60 ? "#e2e8f0" : undefined,
                      textShadow:
                        scorePercent >= 80
                          ? "0 0 20px rgba(251,191,36,0.3)"
                          : undefined,
                    }}
                  >
                    {scorePercent >= 80
                      ? "Sharpshooter!"
                      : scorePercent >= 60
                      ? "Sharp Eye!"
                      : scorePercent >= 40
                      ? "Getting Closer!"
                      : "Keep Practicing!"}
                  </motion.h2>
                  <p
                    className={`text-[10px] font-bold uppercase mb-4 ${
                      scorePercent >= 80
                        ? "text-amber-400"
                        : scorePercent >= 60
                        ? theme.text
                        : "text-slate-400"
                    }`}
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {scorePercent >= 80
                      ? "Incredible precision!"
                      : scorePercent >= 60
                      ? "Great timing skills"
                      : scorePercent >= 40
                      ? "Room for improvement"
                      : "Timing is everything"}
                  </p>

                  {/* Round-by-round radar recap */}
                  <div className="flex items-center justify-center gap-0 mb-4">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: 0.6 + i * 0.1,
                            type: "spring",
                          }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span
                            className="text-[7px] text-slate-500 font-black"
                            style={{ letterSpacing: "0.1em" }}
                          >
                            R{i + 1}
                          </span>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{
                              background: `${ratingColor(
                                r.rating
                              )}15`,
                              border: `1.5px solid ${ratingColor(
                                r.rating
                              )}60`,
                              boxShadow: `0 0 10px ${ratingColor(
                                r.rating
                              )}20`,
                            }}
                          >
                            <span
                              className="text-[9px] font-black"
                              style={{
                                color: ratingColor(r.rating),
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {r.points}
                            </span>
                          </div>
                          <span
                            className="text-[6px] font-black uppercase"
                            style={{
                              color: ratingColor(r.rating),
                              letterSpacing: "0.1em",
                            }}
                          >
                            {r.rating}
                          </span>
                        </motion.div>
                        {i < results.length - 1 && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              delay: 0.7 + i * 0.1,
                            }}
                            className="w-3 h-[1.5px] mx-0.5"
                            style={{
                              background: `linear-gradient(90deg, ${ratingColor(
                                r.rating
                              )}40, ${ratingColor(
                                results[i + 1].rating
                              )}40)`,
                              transformOrigin: "left",
                              marginBottom: 14,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stats grid with glassmorphic cards */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      {
                        label: "Perfect",
                        value: perfectCount,
                        color: "#34d399",
                        icon: "✦",
                      },
                      {
                        label: "Great",
                        value: greatCount,
                        color: "#3b82f6",
                        icon: "★",
                      },
                      {
                        label: "Good",
                        value: goodCount,
                        color: "#fbbf24",
                        icon: "●",
                      },
                      {
                        label: "Miss",
                        value: missCount,
                        color: "#ef4444",
                        icon: "✕",
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ y: 18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 + i * 0.08 }}
                        className="text-center py-2 rounded-lg"
                        style={{
                          background: `${stat.color}0a`,
                          border: `1px solid ${stat.color}20`,
                          backdropFilter: 'blur(12px) saturate(1.2)',
                          boxShadow: `0 2px 8px ${stat.color}08, inset 0 1px 0 rgba(255,255,255,0.04)`,
                        }}
                      >
                        <p
                          className="text-sm font-black"
                          style={{
                            color: stat.color,
                            fontVariantNumeric: "tabular-nums",
                            textShadow: `0 0 6px ${stat.color}30`,
                          }}
                        >
                          <AnimatedCounter value={stat.value} />
                        </p>
                        <p
                          className="text-[6px] text-slate-500 uppercase font-bold"
                          style={{ letterSpacing: "0.15em" }}
                        >
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Accuracy summary */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="rounded-xl p-3 mb-4"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(16px) saturate(1.2)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crosshair
                          className="w-3.5 h-3.5"
                          style={{
                            color: theme.color1,
                            filter: `drop-shadow(0 0 4px ${theme.glow})`,
                          }}
                        />
                        <span
                          className="text-[8px] font-black uppercase"
                          style={{
                            letterSpacing: "0.15em",
                            background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Accuracy
                        </span>
                      </div>
                      <span
                        className="text-lg font-black"
                        style={{
                          background: `linear-gradient(90deg, ${theme.color1}, ${theme.color2})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          fontVariantNumeric: "tabular-nums",
                          filter:
                            scorePercent >= 80
                              ? `drop-shadow(0 0 6px ${theme.glow})`
                              : "none",
                        }}
                      >
                        {scorePercent}%
                      </span>
                    </div>
                  </motion.div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {/* Play Again button - gradient with shimmer */}
                    <motion.button
                      onClick={handlePlayAgain}
                      whileTap={{
                        scale: 0.93,
                        background: `linear-gradient(135deg, ${theme.color2}, ${theme.color1})`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="relative w-full py-3 rounded-2xl text-white font-black text-xs uppercase flex items-center justify-center gap-2 overflow-hidden"
                      style={{
                        letterSpacing: "0.15em",
                        background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                        boxShadow: `0 5px 25px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15)`,
                        textShadow:
                          "0 1px 3px rgba(0,0,0,0.4)",
                      }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                          width: "35%",
                        }}
                        animate={{ x: ["-120%", "380%"] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <RefreshCcw className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">
                        Play Again
                      </span>
                    </motion.button>

                    {/* Done button - glassmorphic */}
                    <motion.button
                      onClick={onComplete}
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ scale: 1.01 }}
                      className="w-full py-2.5 rounded-xl text-slate-300 text-xs font-bold uppercase"
                      style={{
                        letterSpacing: '0.1em',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(16px) saturate(1.2)',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 10px rgba(0,0,0,0.2)',
                        textShadow:
                          '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                    >
                      Done
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
