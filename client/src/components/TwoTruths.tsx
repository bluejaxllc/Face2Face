import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Eye,
  Timer,
  Zap,
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  Flame,
  Sparkles,
  Heart,
  UserPlus,
  Briefcase,
  RotateCcw,
  Award,
  ThumbsDown,
  ThumbsUp,
  MessageCircle,
  Shield,
} from "lucide-react";

type Category = "dating" | "friends" | "business";

interface TwoTruthsProps {
  onBack: () => void;
  category?: Category;
}

interface Statement {
  text: string;
  isLie: boolean;
}

interface Round {
  person: {
    name: string;
    age: number;
    photo: string;
    emoji: string;
    tagline: string;
  };
  statements: Statement[];
}

const ROUNDS_DATA: Record<Category, Round[]> = {
  dating: [
    {
      person: { name: "Sophia", age: 26, photo: "https://i.pravatar.cc/120?img=5", emoji: "🌸", tagline: "Hopeless romantic & bookworm" },
      statements: [
        { text: "I've read over 200 romance novels", isLie: false },
        { text: "I once got proposed to on a hot air balloon", isLie: false },
        { text: "I've never been on a blind date", isLie: true },
      ],
    },
    {
      person: { name: "Marcus", age: 29, photo: "https://i.pravatar.cc/120?img=11", emoji: "🔥", tagline: "Chef by day, dancer by night" },
      statements: [
        { text: "I can cook a 5-course French meal", isLie: false },
        { text: "I've won a salsa dancing competition", isLie: false },
        { text: "I've never watched a romantic comedy", isLie: true },
      ],
    },
    {
      person: { name: "Luna", age: 24, photo: "https://i.pravatar.cc/120?img=16", emoji: "🌙", tagline: "Stargazer & adventure seeker" },
      statements: [
        { text: "I've seen the Northern Lights twice", isLie: false },
        { text: "My first kiss was at a planetarium", isLie: false },
        { text: "I've never used a dating app before", isLie: true },
      ],
    },
    {
      person: { name: "Jake", age: 27, photo: "https://i.pravatar.cc/120?img=12", emoji: "🎸", tagline: "Musician with a heart of gold" },
      statements: [
        { text: "I wrote a love song that went viral on TikTok", isLie: false },
        { text: "I once serenaded someone on a subway", isLie: false },
        { text: "I've been in a relationship for 10 years", isLie: true },
      ],
    },
    {
      person: { name: "Aria", age: 25, photo: "https://i.pravatar.cc/120?img=9", emoji: "💎", tagline: "Travel lover & foodie" },
      statements: [
        { text: "I've visited 30 countries before turning 25", isLie: false },
        { text: "I once had a dinner date inside a volcano", isLie: true },
        { text: "My favorite cuisine is Ethiopian", isLie: false },
      ],
    },
    {
      person: { name: "Ethan", age: 31, photo: "https://i.pravatar.cc/120?img=7", emoji: "🏔️", tagline: "Mountain climber & poet" },
      statements: [
        { text: "I proposed to my ex on top of Mt. Fuji", isLie: true },
        { text: "I've summited 5 of the Seven Summits", isLie: false },
        { text: "I write a love poem every Valentine's Day", isLie: false },
      ],
    },
    {
      person: { name: "Mia", age: 23, photo: "https://i.pravatar.cc/120?img=20", emoji: "🎨", tagline: "Artist & coffee addict" },
      statements: [
        { text: "I painted a mural in downtown LA", isLie: false },
        { text: "I drink 6 cups of coffee a day", isLie: false },
        { text: "I've never had my heart broken", isLie: true },
      ],
    },
    {
      person: { name: "Noah", age: 28, photo: "https://i.pravatar.cc/120?img=33", emoji: "🐕", tagline: "Dog dad & fitness enthusiast" },
      statements: [
        { text: "I have 3 rescue dogs named after Greek gods", isLie: false },
        { text: "I ran a marathon with one of my dogs", isLie: false },
        { text: "I've never cried during a movie", isLie: true },
      ],
    },
    {
      person: { name: "Zara", age: 26, photo: "https://i.pravatar.cc/120?img=25", emoji: "✨", tagline: "Fashion designer & yogi" },
      statements: [
        { text: "My dress was featured in Vogue magazine", isLie: true },
        { text: "I can hold a headstand for 10 minutes", isLie: false },
        { text: "I've designed costumes for a Broadway show", isLie: false },
      ],
    },
    {
      person: { name: "Leo", age: 30, photo: "https://i.pravatar.cc/120?img=3", emoji: "🎭", tagline: "Actor & amateur magician" },
      statements: [
        { text: "I once performed magic on live television", isLie: false },
        { text: "I've appeared in a Marvel movie as an extra", isLie: false },
        { text: "I've never been nervous on a first date", isLie: true },
      ],
    },
  ],
  friends: [
    {
      person: { name: "Tyler", age: 25, photo: "https://i.pravatar.cc/120?img=12", emoji: "🎮", tagline: "Pro gamer & meme lord" },
      statements: [
        { text: "I once stayed awake for 48 hours gaming", isLie: false },
        { text: "I have a meme account with 500k followers", isLie: true },
        { text: "I've been to 12 gaming conventions", isLie: false },
      ],
    },
    {
      person: { name: "Mika", age: 22, photo: "https://i.pravatar.cc/120?img=20", emoji: "🎵", tagline: "DJ & vinyl collector" },
      statements: [
        { text: "I own over 2,000 vinyl records", isLie: false },
        { text: "I DJ'd at Coachella's after-party", isLie: true },
        { text: "I can beatbox in three different styles", isLie: false },
      ],
    },
    {
      person: { name: "Kai", age: 27, photo: "https://i.pravatar.cc/120?img=33", emoji: "🏄", tagline: "Surfer & marine biologist" },
      statements: [
        { text: "I've surfed in every ocean on Earth", isLie: false },
        { text: "I once swam with a whale shark", isLie: false },
        { text: "I've never been stung by a jellyfish", isLie: true },
      ],
    },
    {
      person: { name: "Zoe", age: 24, photo: "https://i.pravatar.cc/120?img=25", emoji: "⚡", tagline: "Rock climber & thrill-seeker" },
      statements: [
        { text: "I've bungee jumped off the Bloukrans Bridge", isLie: false },
        { text: "I free-climbed El Capitan in under a day", isLie: true },
        { text: "I have a fear of spiders despite loving heights", isLie: false },
      ],
    },
    {
      person: { name: "Dex", age: 26, photo: "https://i.pravatar.cc/120?img=7", emoji: "🍕", tagline: "Pizza fanatic & trivia nerd" },
      statements: [
        { text: "I've eaten pizza in 15 different countries", isLie: false },
        { text: "I won a national trivia championship", isLie: false },
        { text: "I've never eaten pineapple on pizza", isLie: true },
      ],
    },
    {
      person: { name: "Riley", age: 23, photo: "https://i.pravatar.cc/120?img=9", emoji: "📸", tagline: "Photographer & urban explorer" },
      statements: [
        { text: "I've been inside 50 abandoned buildings", isLie: false },
        { text: "My photo was used as a phone wallpaper by Samsung", isLie: true },
        { text: "I once got locked inside a cemetery overnight", isLie: false },
      ],
    },
    {
      person: { name: "Ash", age: 28, photo: "https://i.pravatar.cc/120?img=3", emoji: "🎲", tagline: "Board game designer & cat person" },
      statements: [
        { text: "I've designed a board game that sold 10k copies", isLie: false },
        { text: "I have 4 cats all named after board games", isLie: false },
        { text: "I've never lost at Monopoly", isLie: true },
      ],
    },
    {
      person: { name: "Sam", age: 29, photo: "https://i.pravatar.cc/120?img=11", emoji: "🏕️", tagline: "Wilderness guide & storyteller" },
      statements: [
        { text: "I once lived off-grid for 3 months", isLie: false },
        { text: "I've encountered a bear in the wild 4 times", isLie: false },
        { text: "I've never used a GPS while hiking", isLie: true },
      ],
    },
    {
      person: { name: "Noa", age: 21, photo: "https://i.pravatar.cc/120?img=16", emoji: "🎤", tagline: "Stand-up comic & podcast host" },
      statements: [
        { text: "I bombed on stage so hard, I got a standing ovation", isLie: false },
        { text: "My podcast has over 1 million downloads", isLie: true },
        { text: "I've opened for a famous comedian at a comedy club", isLie: false },
      ],
    },
    {
      person: { name: "Jess", age: 25, photo: "https://i.pravatar.cc/120?img=5", emoji: "🧁", tagline: "Baker & marathon runner" },
      statements: [
        { text: "I bake a different cake every week for strangers", isLie: false },
        { text: "I've run 7 marathons on 7 continents", isLie: true },
        { text: "I once made a wedding cake for 500 guests", isLie: false },
      ],
    },
  ],
  business: [
    {
      person: { name: "Alex", age: 32, photo: "https://i.pravatar.cc/120?img=3", emoji: "📊", tagline: "Data scientist & angel investor" },
      statements: [
        { text: "I've invested in 15 startups, 3 became unicorns", isLie: true },
        { text: "I built an ML model that predicted stock trends", isLie: false },
        { text: "I dropped out of an MBA program to start coding", isLie: false },
      ],
    },
    {
      person: { name: "Nina", age: 28, photo: "https://i.pravatar.cc/120?img=23", emoji: "🚀", tagline: "Startup founder & TEDx speaker" },
      statements: [
        { text: "My startup was acquired for $10M at age 25", isLie: true },
        { text: "I've given a TEDx talk on imposter syndrome", isLie: false },
        { text: "I was rejected by 50 investors before getting funded", isLie: false },
      ],
    },
    {
      person: { name: "Derek", age: 35, photo: "https://i.pravatar.cc/120?img=7", emoji: "💼", tagline: "Corporate strategist & author" },
      statements: [
        { text: "I wrote a business book that hit the NYT list", isLie: false },
        { text: "I've consulted for 3 Fortune 500 companies", isLie: false },
        { text: "I've never been fired from a job", isLie: true },
      ],
    },
    {
      person: { name: "Priya", age: 27, photo: "https://i.pravatar.cc/120?img=26", emoji: "💡", tagline: "UX designer & accessibility advocate" },
      statements: [
        { text: "I redesigned a government website used by millions", isLie: false },
        { text: "I hold a patent for a haptic feedback interface", isLie: true },
        { text: "I taught UX design at a bootcamp for 2 years", isLie: false },
      ],
    },
    {
      person: { name: "Omar", age: 30, photo: "https://i.pravatar.cc/120?img=11", emoji: "🌐", tagline: "Web3 builder & community leader" },
      statements: [
        { text: "I launched a DAO with 5,000 members", isLie: false },
        { text: "I've minted an NFT collection that sold out in minutes", isLie: false },
        { text: "I predicted Bitcoin would hit $100k in 2021", isLie: true },
      ],
    },
    {
      person: { name: "Lena", age: 29, photo: "https://i.pravatar.cc/120?img=9", emoji: "📱", tagline: "Product manager & side hustler" },
      statements: [
        { text: "I've launched 4 apps, 2 hit #1 in the App Store", isLie: true },
        { text: "My side hustle makes more than my day job", isLie: false },
        { text: "I've managed a product with 10M daily active users", isLie: false },
      ],
    },
    {
      person: { name: "Ryan", age: 33, photo: "https://i.pravatar.cc/120?img=12", emoji: "🎯", tagline: "Sales director & mentor" },
      statements: [
        { text: "I closed a $5M deal on my first day as director", isLie: true },
        { text: "I mentor 12 junior salespeople every quarter", isLie: false },
        { text: "I once cold-called 200 prospects in a single day", isLie: false },
      ],
    },
    {
      person: { name: "Tara", age: 26, photo: "https://i.pravatar.cc/120?img=16", emoji: "🧬", tagline: "Biotech researcher & entrepreneur" },
      statements: [
        { text: "I co-authored a paper published in Nature", isLie: false },
        { text: "I founded a biotech startup valued at $50M", isLie: true },
        { text: "I've worked in labs on 3 different continents", isLie: false },
      ],
    },
    {
      person: { name: "Victor", age: 31, photo: "https://i.pravatar.cc/120?img=33", emoji: "🏗️", tagline: "Civil engineer & sustainability advocate" },
      statements: [
        { text: "I've designed bridges in 4 countries", isLie: false },
        { text: "I hold 2 patents for green building materials", isLie: false },
        { text: "I've never visited a construction site", isLie: true },
      ],
    },
    {
      person: { name: "Clara", age: 28, photo: "https://i.pravatar.cc/120?img=5", emoji: "📝", tagline: "Content strategist & newsletter guru" },
      statements: [
        { text: "My newsletter has 100k subscribers", isLie: false },
        { text: "I ghost-wrote a bestselling CEO's autobiography", isLie: true },
        { text: "I've worked with brands like Nike and Airbnb", isLie: false },
      ],
    },
  ],
};

const TOTAL_ROUNDS = 7;
const TIME_PER_ROUND = 20;

const themes: Record<Category, { gradient: string; text: string; accent: string; bg: string; glow: string }> = {
  dating: { gradient: "from-pink-500 via-rose-500 to-red-500", text: "text-pink-400", accent: "border-pink-500/30", bg: "bg-pink-500/10", glow: "shadow-pink-500/20" },
  friends: { gradient: "from-emerald-500 via-teal-500 to-cyan-500", text: "text-emerald-400", accent: "border-emerald-500/30", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" },
  business: { gradient: "from-blue-500 via-indigo-500 to-purple-500", text: "text-blue-400", accent: "border-blue-500/30", bg: "bg-blue-500/10", glow: "shadow-blue-500/20" },
};

export default function TwoTruths({ onBack, category = "dating" }: TwoTruthsProps) {
  const theme = themes[category];
  const [phase, setPhase] = useState<"intro" | "countdown" | "playing" | "review" | "results">("intro");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [playerResults, setPlayerResults] = useState<boolean[]>([]);
  const [countdown, setCountdown] = useState(3);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const currentRoundRef = useRef(0);
  const showResultRef = useRef(false);

  const r = rounds[currentRound];

  // Init rounds
  useEffect(() => {
    if (phase !== "intro") return;
    const pool = [...ROUNDS_DATA[category]];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    // Shuffle statement order within each round
    const prepared = shuffled.map(round => ({
      ...round,
      statements: [...round.statements].sort(() => Math.random() - 0.5),
    }));
    setRounds(prepared);
  }, [phase, category]);

  // Countdown
  useEffect(() => {
    if (phase === "countdown") {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase("playing");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Round timer - keyed off currentRound and phase
  useEffect(() => {
    if (phase !== "playing") return;
    // Only start timer for fresh rounds (not review)
    if (showResultRef.current) return;

    setTimeLeft(TIME_PER_ROUND);
    setSelectedIdx(null);
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!answeredRef.current) {
            answeredRef.current = true;
            showResultRef.current = true;
            setPlayerResults(pr => [...pr, false]);
            setStreak(0);
            setShowResult(true);
            setPhase("review");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentRound]);

  const handleSelect = useCallback((idx: number) => {
    if (answeredRef.current || !r) return;
    answeredRef.current = true;
    showResultRef.current = true;
    setSelectedIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = r.statements[idx].isLie;
    setPlayerResults(prev => [...prev, isCorrect]);

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 5);
      const streakBonus = streak * 15;
      setPlayerScore(prev => prev + 100 + timeBonus + streakBonus);
      setStreak(prev => {
        const ns = prev + 1;
        setBestStreak(bs => Math.max(bs, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }

    setShowResult(true);
    setPhase("review");
  }, [r, timeLeft, streak]);

  const handleNext = useCallback(() => {
    if (currentRoundRef.current + 1 >= TOTAL_ROUNDS) {
      setPhase("results");
    } else {
      // Reset state refs BEFORE updating state to prevent race conditions
      showResultRef.current = false;
      answeredRef.current = false;
      setShowResult(false);
      setCurrentRound(prev => {
        const next = prev + 1;
        currentRoundRef.current = next;
        return next;
      });
      setPhase("playing");
    }
  }, []);

  const handleRestart = () => {
    setPhase("intro");
    setRounds([]);
    setCurrentRound(0);
    currentRoundRef.current = 0;
    showResultRef.current = false;
    answeredRef.current = false;
    setTimeLeft(TIME_PER_ROUND);
    setSelectedIdx(null);
    setShowResult(false);
    setPlayerScore(0);
    setStreak(0);
    setBestStreak(0);
    setPlayerResults([]);
  };

  const timerColor = timeLeft <= 5 ? "text-red-400" : timeLeft <= 10 ? "text-amber-400" : "text-emerald-400";
  const timerBg = timeLeft <= 5 ? "bg-red-500/20 border-red-500/40" : timeLeft <= 10 ? "bg-amber-500/20 border-amber-500/40" : "bg-emerald-500/20 border-emerald-500/40";
  const correctCount = playerResults.filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-[60]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Two Truths & a Lie
            </span>
          </div>
          {(phase === "playing" || phase === "review") ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-[10px] font-black text-slate-400">{currentRound + 1}/{TOTAL_ROUNDS}</span>
            </div>
          ) : (
            <div style={{ width: "60px" }} />
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center"
            >
              <span className="text-4xl">🤥</span>
            </motion.div>
            <div className="text-center max-w-xs">
              <h2 className="text-xl font-black text-slate-100 mb-2">Two Truths & a Lie</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Meet new people! Read 3 statements about someone — two are true, one is a lie. Can you spot the faker?
              </p>
            </div>

            {/* How to play */}
            <div className="w-full max-w-xs space-y-3">
              {[
                { icon: "👤", text: "Meet a new person each round" },
                { icon: "📖", text: "Read their 3 statements carefully" },
                { icon: "🔍", text: "Tap the one you think is the LIE" },
                { icon: "⚡", text: "Faster = more points!" },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 bg-slate-900/50 rounded-xl px-4 py-2.5 border border-slate-800/50"
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-xs text-slate-300 font-medium">{step.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPhase("countdown")}
              className={`mt-4 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-violet-500/20 active:scale-95 transition-transform`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Playing
              </span>
            </motion.button>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase === "countdown" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-8xl font-black text-violet-400"
              >
                {countdown}
              </motion.div>
            </AnimatePresence>
            <p className="text-xs text-slate-500 font-bold mt-8">Get ready to spot the lies!</p>
          </div>
        )}

        {/* ── PLAYING / REVIEW ── */}
        {(phase === "playing" || phase === "review") && r && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Top bar: score, timer, progress */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Trophy className={`w-4 h-4 ${theme.text}`} />
                  <span className={`text-sm font-black ${theme.text}`}>{playerScore}</span>
                  {streak > 1 && (
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                      🔥 {streak}x
                    </span>
                  )}
                </div>

                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${timerBg} ${showResult ? "opacity-50" : ""}`}>
                  <Timer className={`w-3.5 h-3.5 ${timerColor}`} />
                  <span className={`text-sm font-black tabular-nums ${timerColor}`}>
                    {showResult ? "—" : timeLeft}
                  </span>
                </div>

                <div className="flex gap-1 flex-1 justify-end">
                  {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < playerResults.length
                          ? playerResults[i] ? "bg-emerald-400" : "bg-red-400"
                          : i === currentRound ? "bg-violet-400 animate-pulse" : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Person card + statements */}
            <div className="flex flex-col items-center px-4 py-2 my-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRound}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md"
                >
                  {/* Person header */}
                  <div className="flex items-center gap-4 mb-5 bg-slate-900/60 rounded-2xl p-4 border border-slate-800/50">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-violet-500/40 shadow-lg shadow-violet-500/10 shrink-0">
                      <img src={r.person.photo} alt={r.person.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{r.person.name}</h3>
                        <span className="text-sm">{r.person.emoji}</span>
                        <span className="text-xs text-slate-500">{r.person.age}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{r.person.tagline}</p>
                    </div>
                  </div>

                  {/* Instruction */}
                  {!showResult && (
                    <p className="text-center text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                      Tap the statement you think is the <span className="text-red-400">LIE</span>
                    </p>
                  )}

                  {/* Statements */}
                  <div className="space-y-3">
                    {r.statements.map((stmt, idx) => {
                      const isSelected = selectedIdx === idx;
                      const isLie = stmt.isLie;

                      let cardClasses = "bg-slate-900/60 border-slate-700/40 hover:border-violet-500/50 hover:bg-slate-800/60 cursor-pointer";
                      let labelText = "";
                      let labelIcon = null;

                      if (showResult) {
                        if (isLie) {
                          cardClasses = "bg-red-500/10 border-red-500/40";
                          labelText = "THE LIE";
                          labelIcon = <ThumbsDown className="w-4 h-4 text-red-400" />;
                        } else {
                          cardClasses = "bg-emerald-500/5 border-emerald-500/20";
                          labelText = "TRUTH";
                          labelIcon = <ThumbsUp className="w-4 h-4 text-emerald-400" />;
                        }
                        if (isSelected) {
                          if (isLie) {
                            cardClasses = "bg-emerald-500/15 border-emerald-500/50 ring-2 ring-emerald-500/30";
                          } else {
                            cardClasses = "bg-red-500/15 border-red-500/50 ring-2 ring-red-500/30";
                          }
                        }
                      }

                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => !showResult && handleSelect(idx)}
                          disabled={showResult}
                          className={`w-full text-left rounded-2xl p-4 border transition-all ${cardClasses}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                              showResult
                                ? isLie ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {showResult ? (labelIcon || (idx + 1)) : (idx + 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-relaxed ${showResult ? (isLie ? "text-red-300" : "text-emerald-300/80") : "text-slate-200"}`}>
                                "{stmt.text}"
                              </p>
                              {showResult && (
                                <p className={`text-[10px] font-black uppercase tracking-wider mt-1.5 ${isLie ? "text-red-400" : "text-emerald-500"}`}>
                                  {labelText}
                                  {isSelected && (
                                    <span className={`ml-2 ${isLie ? "text-emerald-400" : "text-red-400"}`}>
                                      ← Your pick {isLie ? "✓ Correct!" : "✗ Wrong"}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Result feedback */}
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      {selectedIdx !== null ? (
                        r.statements[selectedIdx].isLie ? (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-sm font-black text-emerald-400">Nice catch! 🎯</p>
                              <p className="text-[10px] text-emerald-400/60">+{100 + Math.round(timeLeft * 5) + streak * 15} points</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
                            <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                            <div>
                              <p className="text-sm font-black text-red-400">Fooled! 😅</p>
                              <p className="text-[10px] text-red-400/60">That was actually true</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                          <Timer className="w-6 h-6 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-sm font-black text-amber-400">Time's up! ⏰</p>
                            <p className="text-[10px] text-amber-400/60">The lie is highlighted in red</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── REVIEW FOOTER ── */}
        {showResult && r && phase === "review" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[61] px-6 pb-6 pt-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
          >
            <button
              onClick={handleNext}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg`}
            >
              {currentRound + 1 >= TOTAL_ROUNDS ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>See Results</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Next Person</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full max-w-sm bg-slate-900/80 rounded-3xl border border-slate-800/50 p-6 space-y-5"
            >
              {/* Result header */}
              <div className="-mt-6 -mx-6 px-6 py-4 rounded-t-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl mb-1"
                >
                  {correctCount >= 5 ? "🕵️" : correctCount >= 3 ? "🤔" : "🤥"}
                </motion.div>
                <h2 className="text-xl font-black text-white uppercase tracking-wide">
                  {correctCount >= 5 ? "Lie Detector!" : correctCount >= 3 ? "Not Bad!" : "Easily Fooled!"}
                </h2>
                <p className="text-xs text-white/70 font-bold mt-0.5">
                  {correctCount >= 5
                    ? "You can see through anyone!"
                    : correctCount >= 3
                    ? "You've got some good instincts"
                    : "Better luck next time!"}
                </p>
              </div>

              {/* Score */}
              <div className="text-center">
                <p className="text-4xl font-black text-white">{playerScore}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Points</p>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 text-center">
                <div>
                  <p className={`text-lg font-black ${theme.text}`}>{correctCount}/{TOTAL_ROUNDS}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Detected</p>
                </div>
                <div>
                  <p className={`text-lg font-black ${theme.text}`}>{bestStreak}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Best Streak</p>
                </div>
                <div>
                  <p className={`text-lg font-black ${theme.text}`}>{Math.round((correctCount / TOTAL_ROUNDS) * 100)}%</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Accuracy</p>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {playerResults.map((correct, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${correct ? "bg-emerald-400" : "bg-red-400"}`} />
                ))}
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleRestart}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-3 rounded-2xl bg-slate-800/50 border border-slate-700/30 text-slate-400 font-bold text-sm hover:bg-slate-700/50 transition-colors"
                >
                  Exit to Games
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
