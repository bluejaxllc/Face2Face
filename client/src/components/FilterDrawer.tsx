import { useState, useEffect, useMemo } from "react";
import { Filter, Sliders, Heart, Briefcase, Users, Building, Sparkles, RotateCcw, Check, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// ─── Filter Options & Types ──────────────────────────────────────────
export interface FilterOptions {
  datingPreference: 'any' | 'men' | 'women' | 'everyone';
  showDating: boolean;
  showBusiness: boolean;
  showFriendships: boolean;
  showGroups?: boolean;
  showMen: boolean;
  showWomen: boolean;
  ageRange: [number, number];
  radius: number;
  distanceUnit?: 'mi' | 'km';
}

interface FilterDrawerProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
}

// ─── Category Accent Themes ──────────────────────────────────────────
type CategoryTheme = {
  primary: string;
  glow: string;
  gradient: string;
  ring: string;
  bg: string;
  text: string;
};

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  dating: {
    primary: "rgb(244,63,94)",
    glow: "rgba(244,63,94,0.4)",
    gradient: "from-rose-500 to-pink-500",
    ring: "ring-rose-500/40",
    bg: "bg-rose-500",
    text: "text-rose-400",
  },
  friends: {
    primary: "rgb(16,185,129)",
    glow: "rgba(16,185,129,0.4)",
    gradient: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500",
    text: "text-emerald-400",
  },
  business: {
    primary: "rgb(99,102,241)",
    glow: "rgba(99,102,241,0.4)",
    gradient: "from-blue-500 to-indigo-500",
    ring: "ring-blue-500/40",
    bg: "bg-blue-500",
    text: "text-blue-400",
  },
};

function getActiveTheme(): CategoryTheme {
  try {
    const cat = localStorage.getItem("f2f_activeCategory") || "dating";
    return CATEGORY_THEMES[cat] || CATEGORY_THEMES.dating;
  } catch {
    return CATEGORY_THEMES.dating;
  }
}

// ─── SVG Noise Overlay ───────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.03]" aria-hidden>
      <filter id="filterNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#filterNoise)" />
    </svg>
  );
}

// ─── Floating Background Orb ─────────────────────────────────────────
function FloatingOrb({ color, size, x, y, delay }: { color: string; size: number; x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full blur-3xl opacity-20"
      style={{ width: size, height: size, background: color, left: x, top: y }}
      animate={{
        y: [0, -18, 0, 14, 0],
        x: [0, 10, -8, 6, 0],
        scale: [1, 1.12, 0.95, 1.05, 1],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ─── Section Header ──────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, delay = 0 }: { icon: React.ElementType; label: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, type: "spring", stiffness: 140 }}
      className="flex items-center gap-2 mb-1"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 backdrop-blur-sm">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</Label>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function FilterDrawer({ options, onChange }: FilterDrawerProps) {
  const [localOptions, setLocalOptions] = useState<FilterOptions>(options);
  const [isOpen, setIsOpen] = useState(false);
  const theme = useMemo(() => getActiveTheme(), [isOpen]);

  useEffect(() => {
    if (isOpen) setLocalOptions(options);
  }, [isOpen]);

  const updateOption = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setLocalOptions(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onChange(localOptions);
  };

  // ─── User Type Card Config ───────────────────────────────────────
  const userTypes = [
    { key: "showDating" as const, label: "Dating", icon: Heart, accent: "rose", color: "rgb(244,63,94)" },
    { key: "showBusiness" as const, label: "Business", icon: Briefcase, accent: "blue", color: "rgb(59,130,246)" },
    { key: "showFriendships" as const, label: "Friends", icon: Users, accent: "emerald", color: "rgb(16,185,129)" },
    { key: "showGroups" as const, label: "Groups", icon: Building, accent: "purple", color: "rgb(168,85,247)" },
  ];

  // Stagger offsets for sections
  const stagger = (i: number) => 0.08 + i * 0.07;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full bg-slate-900/80 border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          aria-label="Filter"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] sm:w-[400px] overflow-y-auto overflow-x-hidden border-l border-slate-700/30 text-white p-0"
        style={{ background: "rgba(2,6,23,0.96)" }}
      >
        {/* Glassmorphic backdrop layers */}
        <div className="pointer-events-none absolute inset-0 backdrop-blur-xl" />
        <NoiseOverlay />

        {/* Floating orbs */}
        <FloatingOrb color={theme.primary} size={120} x="70%" y="8%" delay={0} />
        <FloatingOrb color="rgba(99,102,241,0.5)" size={90} x="10%" y="55%" delay={2.5} />
        <FloatingOrb color="rgba(236,72,153,0.35)" size={70} x="60%" y="80%" delay={5} />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-5 pt-5 pb-6">
          {/* ─── Header ───────────────────────────────────────── */}
          <SheetHeader className="mb-6 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <SheetTitle className="flex items-center gap-3 text-white font-heading">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} shadow-lg`}
                  style={{ boxShadow: `0 4px 24px ${theme.glow}` }}
                >
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent text-lg font-extrabold tracking-tight`}>
                    Filter Discovery
                  </span>
                  <p className="text-[10px] font-medium text-slate-500 tracking-widest uppercase mt-0.5">
                    Refine your search
                  </p>
                </div>
              </SheetTitle>
            </motion.div>
          </SheetHeader>

          <div className="space-y-5 flex-1 overflow-y-auto pb-24 pr-1 -mr-1">
            {/* ─── Seeking (Gender Toggles) ────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stagger(0), duration: 0.5, type: "spring", stiffness: 120 }}
            >
              <SectionHeader icon={Search} label="Seeking" delay={stagger(0)} />
              <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-3">
                <div className="flex gap-3">
                  {/* Triangle = Men */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const next = !localOptions.showMen;
                      const pref = next && localOptions.showWomen ? 'any' : next ? 'men' : localOptions.showWomen ? 'women' : 'any';
                      setLocalOptions(prev => ({ ...prev, showMen: next, datingPreference: pref }));
                    }}
                    className={`relative flex-1 flex flex-col items-center justify-center rounded-xl p-4 border-2 transition-all duration-300 ${localOptions.showMen
                      ? 'bg-blue-500/15 border-blue-500/70'
                      : 'bg-slate-800/30 border-slate-700/20 opacity-40 hover:opacity-60'
                    }`}
                    style={localOptions.showMen ? { boxShadow: '0 0 24px rgba(59,130,246,0.3), inset 0 0 16px rgba(59,130,246,0.08)' } : {}}
                  >
                    {/* Glow ring */}
                    {localOptions.showMen && (
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-blue-400/50"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-lg relative z-10">
                      <polygon
                        points="50,8 94,92 6,92"
                        fill={localOptions.showMen ? '#4285F4' : '#475569'}
                        stroke={localOptions.showMen ? '#1a73e8' : '#334155'}
                        strokeWidth="4"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={`mt-2 text-[10px] font-bold uppercase tracking-widest relative z-10 ${localOptions.showMen ? 'text-blue-300' : 'text-slate-500'}`}>
                      Men
                    </span>
                  </motion.button>

                  {/* Circle = Women */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const next = !localOptions.showWomen;
                      const pref = localOptions.showMen && next ? 'any' : !localOptions.showMen && next ? 'women' : localOptions.showMen ? 'men' : 'any';
                      setLocalOptions(prev => ({ ...prev, showWomen: next, datingPreference: pref }));
                    }}
                    className={`relative flex-1 flex flex-col items-center justify-center rounded-xl p-4 border-2 transition-all duration-300 ${localOptions.showWomen
                      ? 'bg-pink-500/15 border-pink-500/70'
                      : 'bg-slate-800/30 border-slate-700/20 opacity-40 hover:opacity-60'
                    }`}
                    style={localOptions.showWomen ? { boxShadow: '0 0 24px rgba(236,72,153,0.3), inset 0 0 16px rgba(236,72,153,0.08)' } : {}}
                  >
                    {/* Glow ring */}
                    {localOptions.showWomen && (
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-pink-400/50"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-lg relative z-10">
                      <circle
                        cx="50" cy="50" r="38"
                        fill={localOptions.showWomen ? '#EA4335' : '#475569'}
                        stroke={localOptions.showWomen ? '#c5221f' : '#334155'}
                        strokeWidth="4"
                      />
                    </svg>
                    <span className={`mt-2 text-[10px] font-bold uppercase tracking-widest relative z-10 ${localOptions.showWomen ? 'text-pink-300' : 'text-slate-500'}`}>
                      Women
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* ─── User Types ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stagger(1), duration: 0.5, type: "spring", stiffness: 120 }}
            >
              <SectionHeader icon={Sparkles} label="User Types" delay={stagger(1)} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {userTypes.map(({ key, label, icon: TypeIcon, accent, color }, i) => {
                  const isActive = key === "showGroups" ? (localOptions.showGroups || false) : localOptions[key];
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stagger(1) + i * 0.06, type: "spring", stiffness: 140 }}
                      onClick={() => updateOption(key, !isActive as any)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 border transition-all duration-300 ${
                        isActive
                          ? `bg-${accent}-500/10 border-${accent}-500/50`
                          : 'bg-white/[0.02] border-white/[0.06] opacity-50 hover:opacity-70'
                      }`}
                      style={isActive ? {
                        boxShadow: `0 0 20px ${color}25, inset 0 0 12px ${color}08`,
                        borderColor: `${color}50`,
                        background: `${color}10`,
                      } : {}}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{ border: `1.5px solid ${color}40` }}
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-300"
                        style={{ background: isActive ? `${color}20` : 'rgba(255,255,255,0.04)' }}
                      >
                        <TypeIcon
                          className="h-4 w-4 transition-colors duration-300"
                          style={{ color: isActive ? color : '#64748b' }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                        style={{ color: isActive ? color : '#64748b' }}
                      >
                        {label}
                      </span>
                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.div
                          className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                          style={{ background: color }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ─── Age Range ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stagger(2), duration: 0.5, type: "spring", stiffness: 120 }}
            >
              <SectionHeader icon={Users} label="Age Range" delay={stagger(2)} />
              <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4">
                {/* Large gradient display */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <motion.span
                    key={localOptions.ageRange[0]}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-3xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                  >
                    {localOptions.ageRange[0]}
                  </motion.span>
                  <span className="text-slate-600 text-lg font-light">—</span>
                  <motion.span
                    key={localOptions.ageRange[1]}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-3xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                  >
                    {localOptions.ageRange[1]}
                  </motion.span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1 self-end mb-1">yrs</span>
                </div>
                {/* Slider */}
                <Slider
                  defaultValue={localOptions.ageRange}
                  min={18}
                  max={80}
                  step={1}
                  onValueChange={(value) => updateOption('ageRange', value as [number, number])}
                  className="w-full"
                />
                {/* Min / Max labels */}
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-slate-600 font-semibold">18</span>
                  <span className="text-[9px] text-slate-600 font-semibold">80</span>
                </div>
              </div>
            </motion.div>

            {/* ─── Search Radius ───────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stagger(3), duration: 0.5, type: "spring", stiffness: 120 }}
            >
              <SectionHeader icon={Target} label="Search Radius" delay={stagger(3)} />
              <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4">
                {/* Animated radius display */}
                <div className="flex items-center justify-center mb-4">
                  <AnimatePresence mode="wait">
                    {localOptions.radius >= 25000 ? (
                      <motion.span
                        key="unlimited"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`text-2xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                      >
                        ∞ Unlimited
                      </motion.span>
                    ) : (
                      <motion.div
                        key="limited"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-baseline gap-1"
                      >
                        <span className={`text-3xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                          {localOptions.radius}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">miles</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={localOptions.radius >= 25000 ? "" : localOptions.radius}
                    placeholder="∞"
                    min={1}
                    max={25000}
                    aria-label="Search radius in miles"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === "0") {
                        updateOption('radius', 25000);
                      } else {
                        updateOption('radius', Math.min(25000, Math.max(1, parseInt(val) || 1)));
                      }
                    }}
                    className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-bold text-center text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-300 backdrop-blur-sm"
                    style={{ MozAppearance: "textfield", WebkitAppearance: "none" } as any}
                  />
                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">MI</span>

                  {/* Infinity button */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateOption('radius', 25000)}
                    className={`relative rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      localOptions.radius >= 25000
                        ? 'text-white'
                        : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.06]'
                    }`}
                    style={{
                      height: 42, width: 42,
                      ...(localOptions.radius >= 25000 ? {
                        background: `linear-gradient(135deg, ${theme.primary}, rgba(99,102,241,0.8))`,
                        boxShadow: `0 0 20px ${theme.glow}`,
                      } : {}),
                    }}
                    title="Unlimited radius"
                    aria-label="Unlimited radius"
                  >
                    {localOptions.radius >= 25000 && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ border: `2px solid ${theme.primary}` }}
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    ∞
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Action Buttons ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stagger(4), duration: 0.5, type: "spring" }}
            className="flex-shrink-0 flex gap-3 pt-4 border-t border-white/[0.06]"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                variant="outline"
                onClick={() => setLocalOptions(options)}
                className="w-full border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-all duration-300 rounded-xl h-11 font-bold text-xs uppercase tracking-widest"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Reset
              </Button>
            </motion.div>
            <SheetClose asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={applyFilters}
                  className={`w-full bg-gradient-to-r ${theme.gradient} hover:brightness-110 text-white font-bold text-xs uppercase tracking-widest rounded-xl h-11 border-0 transition-all duration-300`}
                  style={{ boxShadow: `0 4px 24px ${theme.glow}` }}
                >
                  <Check className="h-3.5 w-3.5 mr-2" />
                  Apply Filters
                </Button>
              </motion.div>
            </SheetClose>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}