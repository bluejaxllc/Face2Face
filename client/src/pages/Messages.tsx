import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Clock,
  Bell,
  Palette,
  Shield,
  MapPin,
  Volume2,
  Vibrate,
  Moon,
  Eye,
  MessageCircle,
  Radar,
  Settings,
  User,
  LogOut,
  Send,
  ArrowLeft, // back button
  Power,
  Tag,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type PrimaryMode = "bumps" | "messages";
type BumpSubTab = "sent" | "received" | "auto" | "settings";
type MessageSubTab = "contacts" | "all" | "settings";
type CategoryKey = "dating" | "friends" | "business";

/* ═══════ API response types ═══════ */
interface ConversationPartner {
  id: number;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: number;
  } | null;
  unreadCount: number;
  hasPendingReceivedBump: boolean;
  isRevealed?: boolean;
  category?: string;
}

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

/* ═══════ Category-responsive accent config ═══════ */
const accentConfig: Record<CategoryKey, {
  primary: string;
  primaryHex: string;
  glow: string;
  bg: string;
  ring: string;
  badge: string;
  badgeText: string;
  indicator: string;
  orbFrom: string;
  orbTo: string;
  toggleOn: string;
}> = {
  dating: {
    primary: "text-rose-400",
    primaryHex: "#fb7185",
    glow: "shadow-rose-500/30",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/40",
    badge: "bg-rose-500",
    badgeText: "text-rose-400",
    indicator: "bg-rose-500",
    orbFrom: "from-rose-500/8",
    orbTo: "to-pink-500/4",
    toggleOn: "bg-rose-500",
  },
  friends: {
    primary: "text-emerald-400",
    primaryHex: "#34d399",
    glow: "shadow-emerald-500/30",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/40",
    badge: "bg-emerald-500",
    badgeText: "text-emerald-400",
    indicator: "bg-emerald-500",
    orbFrom: "from-emerald-500/8",
    orbTo: "to-teal-500/4",
    toggleOn: "bg-emerald-500",
  },
  business: {
    primary: "text-blue-400",
    primaryHex: "#60a5fa",
    glow: "shadow-blue-500/30",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/40",
    badge: "bg-blue-500",
    badgeText: "text-blue-400",
    indicator: "bg-blue-500",
    orbFrom: "from-blue-500/8",
    orbTo: "to-indigo-500/4",
    toggleOn: "bg-blue-500",
  },
};

/* ═══════ Placeholder bumps ═══════ */
const placeholderBumpsMutual = [
  { id: 17, name: "Daniel K.", initials: "DK", message: "Mutual bump! Add to contacts", time: "Today • 6:31 PM", sex: "male" },
  { id: 18, name: "Chloe L.", initials: "CL", message: "Mutual bump! Add to contacts", time: "Today • 6:20 PM", sex: "female" },
];

const placeholderBumpsReceived = [
  { id: 1, name: "Sarah M.", initials: "SM", message: "Bumped you from 0.3 mi away!", time: "Today • 6:30 PM", sex: "female" },
  { id: 2, name: "Jake R.", initials: "JR", message: "Hey! Bumped you 👋", time: "Today • 6:15 PM", sex: "male" },
  { id: 3, name: "Mia L.", initials: "ML", message: "Wants to meet up!", time: "Today • 5:30 PM", sex: "female" },
  { id: 4, name: "Carlos D.", initials: "CD", message: "Bumped you twice!", time: "Today • 3:30 PM", sex: "male" },
  { id: 5, name: "Priya K.", initials: "PK", message: "Nearby bump!", time: "Yesterday • 1:30 PM", sex: "female" },
];

const placeholderBumpsSent = [
  { id: 6, name: "Olivia T.", initials: "OT", message: "You bumped from 0.2 mi", time: "Today • 6:27 PM", sex: "female" },
  { id: 7, name: "Marcus W.", initials: "MW", message: "You bumped from 0.5 mi", time: "Today • 6:00 PM", sex: "male" },
  { id: 8, name: "Emma S.", initials: "ES", message: "You bumped from 1.0 mi", time: "Today • 4:30 PM", sex: "female" },
];

const placeholderAutoBumps = [
  { id: 9, name: "Lily C.", initials: "LC", message: "Auto-bumped 0.1 mi away", time: "Today • 6:22 PM", sex: "female" },
  { id: 10, name: "Noah B.", initials: "NB", message: "Auto-bumped 0.4 mi away", time: "Today • 6:07 PM", sex: "male" },
  { id: 11, name: "Ava R.", initials: "AR", message: "Auto-bumped 0.2 mi away", time: "Today • 5:30 PM", sex: "female" },
  { id: 12, name: "Ethan P.", initials: "EP", message: "Auto-bumped 0.3 mi away", time: "Today • 4:30 PM", sex: "male" },
];

const placeholderBumpsPassed = [
  { id: 13, name: "Sophia V.", initials: "SV", message: "Passed each other at 12th St", time: "Today • 2:30 PM", sex: "female" },
  { id: 14, name: "Liam N.", initials: "LN", message: "Passed each other near Cafe", time: "Today • 12:30 PM", sex: "male" },
  { id: 15, name: "Chloe A.", initials: "CA", message: "Passed each other at the park", time: "Yesterday • 6:30 PM", sex: "female" },
  { id: 16, name: "Jackson K.", initials: "JK", message: "Passed each other yesterday", time: "Yesterday • 4:30 PM", sex: "male" },
];

/* ═══════ Placeholder messages ═══════ */
const placeholderMessages = [
  // New contacts (unrevealed)
  { id: 1, name: "Sarah M.", initials: "SM", lastMsg: "Hey! Are you nearby?", time: "Today • 6:30 PM", unread: true, unreadCount: 3, isRevealed: false, category: "friends" as string },
  { id: 3, name: "Mia L.", initials: "ML", lastMsg: "Let's meet up!", time: "Today • 5:30 PM", unread: false, unreadCount: 0, isRevealed: false, category: "friends" as string },
  { id: 5, name: "Jordan T.", initials: "JT", lastMsg: "What's good?", time: "Today • 4:00 PM", unread: true, unreadCount: 2, isRevealed: false, category: "friends" as string },
  { id: 7, name: "Priya K.", initials: "PK", lastMsg: "Nice to meet you!", time: "Today • 2:15 PM", unread: false, unreadCount: 0, isRevealed: false, category: "friends" as string },
  { id: 9, name: "Alex W.", initials: "AW", lastMsg: "Just bumped into you 👋", time: "Yesterday • 8:00 PM", unread: true, unreadCount: 1, isRevealed: false, category: "friends" as string },
  { id: 11, name: "Nina F.", initials: "NF", lastMsg: "Hey there!", time: "Yesterday • 6:45 PM", unread: false, unreadCount: 0, isRevealed: false, category: "friends" as string },
  // Revealed contacts (non-dating)
  { id: 4, name: "Carlos D.", initials: "CD", lastMsg: "Thanks for connecting", time: "Today • 3:30 PM", unread: false, unreadCount: 0, isRevealed: true, category: "friends" as string },
  { id: 6, name: "Kenji H.", initials: "KH", lastMsg: "Let's grab coffee ☕", time: "Today • 1:00 PM", unread: true, unreadCount: 1, isRevealed: true, category: "friends" as string },
  { id: 8, name: "Olivia R.", initials: "OR", lastMsg: "That was fun!", time: "Today • 11:30 AM", unread: false, unreadCount: 0, isRevealed: true, category: "friends" as string },
  { id: 10, name: "Marcus B.", initials: "MB", lastMsg: "See you next week", time: "Yesterday • 9:15 PM", unread: false, unreadCount: 0, isRevealed: true, category: "friends" as string },
  { id: 13, name: "Tanya S.", initials: "TS", lastMsg: "Great meeting you!", time: "Yesterday • 4:30 PM", unread: false, unreadCount: 0, isRevealed: true, category: "friends" as string },
  { id: 15, name: "Leo G.", initials: "LG", lastMsg: "Down for Saturday?", time: "2 days ago", unread: true, unreadCount: 2, isRevealed: true, category: "friends" as string },
  // Dates (revealed + dating)
  { id: 2, name: "Jake R.", initials: "JR", lastMsg: "See you at the spot 🍕", time: "Today • 6:15 PM", unread: true, unreadCount: 1, isRevealed: true, category: "dating" as string },
  { id: 12, name: "Emma C.", initials: "EC", lastMsg: "Can't wait for tonight 💃", time: "Today • 10:00 AM", unread: true, unreadCount: 4, isRevealed: true, category: "dating" as string },
  { id: 14, name: "Dante V.", initials: "DV", lastMsg: "That restaurant was amazing", time: "Yesterday • 7:00 PM", unread: false, unreadCount: 0, isRevealed: true, category: "dating" as string },
  { id: 16, name: "Sofia P.", initials: "SP", lastMsg: "You're sweet 😊", time: "Yesterday • 3:00 PM", unread: false, unreadCount: 0, isRevealed: true, category: "dating" as string },
  { id: 17, name: "Ryan M.", initials: "RM", lastMsg: "Loved our walk in the park", time: "2 days ago", unread: false, unreadCount: 0, isRevealed: true, category: "dating" as string },
  { id: 18, name: "Zoe A.", initials: "ZA", lastMsg: "When can I see you again?", time: "3 days ago", unread: true, unreadCount: 1, isRevealed: true, category: "dating" as string },
];

/* ═══════ Helper: relative time ═══════ */
function formatRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  
  const dToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const dCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  
  if (dCompare.getTime() === dToday.getTime()) {
    return `Today • ${timeStr}`;
  } else if (dCompare.getTime() === dYesterday.getTime()) {
    return `Yesterday • ${timeStr}`;
  } else {
    const monthStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${monthStr} • ${timeStr}`;
  }
}

/* ═══════ Helper: initials from name ═══════ */
function getInitials(firstName: string, lastName: string): string {
  return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase();
}

/* ═══════ Floating Orb Component ═══════ */
function FloatingOrb({ delay, size, x, y, accent }: { delay: number; size: number; x: string; y: string; accent: { orbFrom: string; orbTo: string } }) {
  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-to-br ${accent.orbFrom} ${accent.orbTo} blur-3xl pointer-events-none`}
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 15, -10, 0],
        scale: [1, 1.15, 0.9, 1.05, 1],
        opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
      }}
      transition={{
        duration: 18 + delay * 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* ═══════ SVG Noise Overlay ═══════ */
function NoiseOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[1] w-full h-full opacity-[0.03]" aria-hidden>
      <filter id="msgs-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#msgs-noise)" />
    </svg>
  );
}

/* ═══════ Toggle Switch Component ═══════ */
function ToggleSwitch({ on, onToggle, accentClass }: { on: boolean; onToggle: () => void; accentClass: string }) {
  return (
    <motion.button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${on ? accentClass : "bg-slate-700"}`}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle"
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

/* ═══════ Animated Radar Ping (Empty state) ═══════ */
function RadarPing({ accent }: { accent: string }) {
  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute inset-0 rounded-full border-2 ${accent === "rose" ? "border-rose-500/30" : accent === "emerald" ? "border-emerald-500/30" : "border-blue-500/30"}`}
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <Radar className="w-8 h-8 text-slate-400" />
      </div>
    </div>
  );
}

/* ═══════ Animated Chat Bubble (Empty state) ═══════ */
function ChatBubble({ primaryHex }: { primaryHex: string }) {
  return (
    <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <MessageCircle className="w-12 h-12" style={{ color: primaryHex }} strokeWidth={1.5} />
      </motion.div>
      {/* Typing dots */}
      <div className="absolute bottom-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-500"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════ MAIN COMPONENT ═══════ */
export default function Messages() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  /* ─── Category from localStorage ─── */
  const category = useMemo<CategoryKey>(() => {
    return (localStorage.getItem("f2f_activeCategory") as CategoryKey) || "dating";
  }, []);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>(category);
  const [activeBumpCategory, setActiveBumpCategory] = useState<{
    title: string;
    categoryKey: "mutual" | "received" | "sent" | "auto" | "passed";
    actionLabel: string;
  } | null>(null);

  const [bumpsSearchQuery, setBumpsSearchQuery] = useState("");
  const [showAutoBumpsMenu, setShowAutoBumpsMenu] = useState(false);

  const closeAutoBumpsMenu = () => {
    setShowAutoBumpsMenu(false);
  };
  const [autoBumpsEnabled, setAutoBumpsEnabled] = useState(() => {
    const stored = localStorage.getItem("f2f_settings_autoBumpsEnabled");
    return stored === null ? true : stored === "true";
  });
  const [scanFrequency, setScanFrequency] = useState(() => {
    return localStorage.getItem("f2f_settings_scanFrequency") || "5";
  });
  const [selectedRadius, setSelectedRadius] = useState(() => {
    return localStorage.getItem("f2f_settings_selectedRadius") || "0.25";
  });
  const [autoBumpMessage, setAutoBumpMessage] = useState(() => {
    return localStorage.getItem("f2f_settings_autoBumpMessage") || "Hey! Bumped you from auto-bump!";
  });

  useEffect(() => {
    localStorage.setItem("f2f_settings_autoBumpsEnabled", String(autoBumpsEnabled));
  }, [autoBumpsEnabled]);

  useEffect(() => {
    localStorage.setItem("f2f_settings_scanFrequency", scanFrequency);
  }, [scanFrequency]);

  useEffect(() => {
    localStorage.setItem("f2f_settings_selectedRadius", selectedRadius);
  }, [selectedRadius]);

  useEffect(() => {
    localStorage.setItem("f2f_settings_autoBumpMessage", autoBumpMessage);
  }, [autoBumpMessage]);

  const filteredMutualBumps = useMemo(() => {
    if (!bumpsSearchQuery.trim()) return placeholderBumpsMutual;
    const q = bumpsSearchQuery.toLowerCase();
    return placeholderBumpsMutual.filter(b => b.name.toLowerCase().includes(q) || b.message.toLowerCase().includes(q));
  }, [bumpsSearchQuery]);

  const filteredReceivedBumps = useMemo(() => {
    if (!bumpsSearchQuery.trim()) return placeholderBumpsReceived;
    const q = bumpsSearchQuery.toLowerCase();
    return placeholderBumpsReceived.filter(b => b.name.toLowerCase().includes(q) || b.message.toLowerCase().includes(q));
  }, [bumpsSearchQuery]);

  const filteredSentBumps = useMemo(() => {
    if (!bumpsSearchQuery.trim()) return placeholderBumpsSent;
    const q = bumpsSearchQuery.toLowerCase();
    return placeholderBumpsSent.filter(b => b.name.toLowerCase().includes(q) || b.message.toLowerCase().includes(q));
  }, [bumpsSearchQuery]);

  const filteredAutoBumps = useMemo(() => {
    if (!bumpsSearchQuery.trim()) return placeholderAutoBumps;
    const q = bumpsSearchQuery.toLowerCase();
    return placeholderAutoBumps.filter(b => b.name.toLowerCase().includes(q) || b.message.toLowerCase().includes(q));
  }, [bumpsSearchQuery]);

  const filteredPassedBumps = useMemo(() => {
    if (!bumpsSearchQuery.trim()) return placeholderBumpsPassed;
    const q = bumpsSearchQuery.toLowerCase();
    return placeholderBumpsPassed.filter(b => b.name.toLowerCase().includes(q) || b.message.toLowerCase().includes(q));
  }, [bumpsSearchQuery]);

  const currentCategoryBumps = useMemo(() => {
    if (!activeBumpCategory) return [];
    switch (activeBumpCategory.categoryKey) {
      case "mutual": return filteredMutualBumps;
      case "received": return filteredReceivedBumps;
      case "sent": return filteredSentBumps;
      case "auto": return filteredAutoBumps;
      case "passed": return filteredPassedBumps;
      default: return [];
    }
  }, [activeBumpCategory, filteredMutualBumps, filteredReceivedBumps, filteredSentBumps, filteredAutoBumps, filteredPassedBumps]);

  useEffect(() => {
    const handler = (e: Event) => {
      const cat = (e as CustomEvent).detail as CategoryKey;
      setActiveCategory(cat);
    };
    window.addEventListener("f2f:categoryChange", handler);
    return () => window.removeEventListener("f2f:categoryChange", handler);
  }, []);

  const accent = accentConfig[activeCategory];
  const accentName = activeCategory === "dating" ? "rose" : activeCategory === "friends" ? "emerald" : "blue";

  /* ─── Primary mode & bump sub-tab (persisted) ─── */
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>(() =>
    (localStorage.getItem("f2f_messages_primaryMode") as PrimaryMode) || "bumps"
  );
  const [bumpTab, setBumpTab] = useState<BumpSubTab>(() => {
    const stored = localStorage.getItem("f2f_messages_bumpTab") as string;
    const validTabs: BumpSubTab[] = ["sent", "received", "auto", "settings"];
    return validTabs.includes(stored as BumpSubTab) ? (stored as BumpSubTab) : "sent";
  });
  const [messageTab, setMessageTab] = useState<MessageSubTab>(() => {
    const stored = localStorage.getItem("f2f_messages_messageTab") as MessageSubTab;
    return stored === "settings" ? "settings" : stored === "all" ? "all" : "contacts";
  });

  // Expand/collapse state for contact sections
  const [expandedSections, setExpandedSections] = useState({
    newContacts: false,
    revealedContacts: false,
    dates: false,
  });

  const handleMessageTabChange = (tab: MessageSubTab) => {
    setMessageTab(tab);
  };

  useEffect(() => {
    localStorage.setItem("f2f_messages_primaryMode", primaryMode);
    localStorage.setItem("f2f_messages_bumpTab", bumpTab);
    localStorage.setItem("f2f_messages_messageTab", messageTab);
  }, [primaryMode, bumpTab, messageTab]);

  // Handle URL query parameters to auto-navigate to settings and auto bump menu
  // Uses a ref guard to run exactly once on mount, preventing re-trigger loops
  const deepLinkProcessed = useRef(false);
  useEffect(() => {
    if (deepLinkProcessed.current) return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");

    if (tab === "settings" || tab === "privacy") {
      deepLinkProcessed.current = true;
      // Capture autobump param before cleaning URL
      const openAutoBump = params.get("autobump") === "open";
      // Clean URL params using wouter's routing (ref guard prevents re-trigger)
      setLocation("/messages", { replace: true });
      // Batch state updates
      setPrimaryMode("messages");
      setMessageTab("settings");
      if (openAutoBump) {
        setShowAutoBumpsMenu(true);
      }
    }
  }, []);

  // Local list-matching filter settings (matching Explore.tsx)
  const [listDistance, setListDistance] = useState("25");
  const [distanceUnit, setDistanceUnit] = useState<"mi" | "km">("mi");
  const [listSex, setListSex] = useState<"male" | "female" | "custom">("male");
  const [listTags, setListTags] = useState("");
  const [listAgeMin, setListAgeMin] = useState("18");
  const [listAgeMax, setListAgeMax] = useState("35");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('f2f_selectedTags') || '[]'); } catch { return []; }
  });
  const [customTags, setCustomTags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('f2f_customTags') || '[]'); } catch { return []; }
  });
  const [tagCloudOpen, setTagCloudOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    localStorage.setItem('f2f_customTags', JSON.stringify(customTags));
  }, [customTags]);

  useEffect(() => {
    localStorage.setItem('f2f_selectedTags', JSON.stringify(selectedTags));
  }, [selectedTags]);

  useEffect(() => {
    setListTags(selectedTags.join(', '));
  }, [selectedTags]);

  const MASTER_TAGS = [
    // Popular (will also appear at top)
    'hiking', 'fitness', 'coffee', 'music', 'tech', 'art', 'reading', 'travel',
    'foodie', 'gaming', 'photography', 'yoga', 'running', 'dancing', 'cooking',
    // A
    'adventure', 'anime', 'archery', 'astrology',
    // B
    'basketball', 'biking', 'board games', 'book club', 'bowling', 'brunch',
    // C
    'camping', 'cars', 'chess', 'climbing', 'comedy', 'concerts', 'crafts', 'cycling',
    // D
    'denver', 'diy', 'dogs', 'drawing',
    // E
    'entrepreneur', 'esports', 'exploring',
    // F
    'fashion', 'film', 'fishing', 'football',
    // G
    'gardening', 'golf', 'guitar',
    // H
    'happy hour', 'hunting',
    // I-J
    'investing', 'jazz',
    // K
    'karaoke', 'kayaking', 'kickboxing',
    // L
    'languages', 'lgbtq+', 'live music',
    // M
    'martial arts', 'meditation', 'movies', 'motorcycles',
    // N
    'nature', 'networking', 'nightlife',
    // O
    'outdoors', 'off-road',
    // P
    'painting', 'pets', 'pickleball', 'poetry', 'potluck', 'puzzles',
    // R
    'real estate', 'rock climbing', 'roller skating',
    // S
    'sailing', 'salsa', 'singing', 'skateboarding', 'skiing', 'snowboarding', 'soccer', 'spirituality', 'surfing', 'swimming',
    // T
    'tennis', 'theater', 'thrifting', 'trivia',
    // V-W
    'veganism', 'vinyl', 'volleyball', 'volunteering', 'wine', 'writing', 'woodworking',
    // X-Z
    'xbox', 'zumba'
  ];

  const POPULAR_TAGS = MASTER_TAGS.slice(0, 15);
  const allTags = [...new Set([...MASTER_TAGS, ...customTags])].sort();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !allTags.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
      setSelectedTags(prev => [...prev, tag]);
      toast({ title: "Tag created! 🏷️", description: `#${tag} added.` });
    } else if (allTags.includes(tag)) {
      if (!selectedTags.includes(tag)) toggleTag(tag);
      toast({ title: "Tag selected", description: `#${tag} is now active.` });
    }
    setNewTagInput("");
  };

  /* ─── Scroll save hooks ─── */
  const bumpsScroll = useScrollSave("f2f_msgs_scroll_bumps");
  const settingsScroll = useScrollSave("f2f_msgs_scroll_settings");
  const messagesScroll = useScrollSave("f2f_msgs_scroll_messages");



  /* ═══════ API: Fetch conversation partners ═══════ */
  const { data: apiConversations } = useQuery<ConversationPartner[]>({
    queryKey: ["/api/bumps/users"],
    enabled: !!user,
    refetchInterval: 15000,
    staleTime: 5000,
  });

  /* ─── Transform API data to message list format (with fallback) ─── */
  const messageList = useMemo(() => {
    if (apiConversations && apiConversations.length > 0) {
      return apiConversations.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName.charAt(0)}.`,
        firstName: c.firstName,
        lastName: c.lastName,
        initials: getInitials(c.firstName, c.lastName),
        lastMsg: c.lastMessage?.content || "No messages yet",
        time: formatRelativeTime(c.lastMessage?.timestamp),
        unread: c.unreadCount > 0,
        unreadCount: c.unreadCount,
        profilePhoto: c.profilePhoto,
        isRevealed: c.isRevealed ?? false,
        category: c.category || "friends",
      }));
    }
    // Fallback to placeholders (already typed with isRevealed and category)
    return placeholderMessages.map((m) => ({
      ...m,
      profilePhoto: null as string | null,
    }));
  }, [apiConversations]);

  /* ─── Unread counts ─── */
  const unreadMessageCount = messageList.filter((m) => m.unread).length;
  const totalUnreadBadge = messageList.reduce((sum, m) => sum + m.unreadCount, 0);

  /* ─── Search state ─── */
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const filteredMessages = messageList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ═══════ Conversation view state ═══════ */
  const [activeConversation, setActiveConversation] = useState<{
    userId: number;
    name: string;
    initials: string;
    profilePhoto?: string | null;
  } | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  /* ─── API: Fetch chat history ─── */
  const { data: chatMessages, isLoading: isChatLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/messages", activeConversation?.userId],
    queryFn: async () => {
      if (!activeConversation) return [];
      const res = await apiRequest("GET", `/api/messages/${activeConversation.userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeConversation && !!user,
    refetchInterval: 5000,
    staleTime: 2000,
  });

  /* ─── API: Send message mutation ─── */
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", { receiverId, content });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate chat history and conversation list
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation.userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/bumps/users"] });
    },
  });

  /* ─── Auto-scroll to bottom on new messages ─── */
  useEffect(() => {
    if (chatMessages && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  /* ─── Handle send message ─── */
  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content || !activeConversation) return;
    setMessageInput("");
    sendMessageMutation.mutate({
      receiverId: activeConversation.userId,
      content,
    });
  };

  /* ─── Handle opening a conversation ─── */
  const openConversation = (contact: {
    id: number;
    name: string;
    initials: string;
    profilePhoto?: string | null;
  }) => {
    setActiveConversation({
      userId: contact.id,
      name: contact.name,
      initials: contact.initials,
      profilePhoto: contact.profilePhoto,
    });
  };

  /* ─── Handle back to list ─── */
  const closeConversation = () => {
    setActiveConversation(null);
    setMessageInput("");
    // Refresh conversation list to update unread counts
    queryClient.invalidateQueries({ queryKey: ["/api/bumps/users"] });
  };

  /* ═══════ Render: Generic Bumps List ═══════ */
  const renderBumpCards = (bumps: typeof placeholderBumpsReceived, sectionLabel: string, emptyText: string, actionLabel?: string) => (
    <div ref={bumpsScroll.ref} onScroll={bumpsScroll.onScroll} className="flex-1 overflow-y-auto w-full">
      {/* Section header with count + all button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-5 pb-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-[0.15em]">
            {bumps.length} {sectionLabel}
          </span>
        </div>
        {bumps.length > 0 && (
          <button className="flex flex-col items-center cursor-pointer group">
            <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
            <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
          </button>
        )}
      </motion.div>

      {bumps.length === 0 ? (
        /* ─── Empty State ─── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center pt-20 px-8"
        >
          <RadarPing accent={accentName} />
          <h3 className="text-white font-bold text-lg mb-1">{emptyText}</h3>
          <p className="text-slate-500 text-sm text-center mb-6">
            Head to the map and get close to people to start bumping!
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2.5 rounded-xl ${accent.badge} text-white font-semibold text-sm shadow-lg ${accent.glow}`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Go to Map
            </div>
          </motion.button>
        </motion.div>
      ) : (
        /* ─── Tile Carousel (matches SuggestedGroups layout) ─── */
        <div className="mb-6">
          <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
            {bumps.map((bump, index) => (
              <motion.button
                key={bump.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer"
              >
                {/* Background gradient (will be profile photo when real) */}
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${bump.sex === "female" ? "#ec4899, #f472b6" : "#3b82f6, #60a5fa"})` 
                  }}
                >
                  <span className="text-5xl font-extrabold text-white/30">{bump.initials}</span>
                </div>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                {/* Time badge */}
                <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <span className="text-[10px] text-white/80 font-bold">{bump.time}</span>
                </div>
                {/* Name + message centered */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none text-center">
                  <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{bump.name}</h3>
                  <p className="text-[11px] text-white/60 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">{bump.message}</p>
                </div>
                {/* Action label at bottom */}
                {actionLabel && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${accent.badge} text-white shadow-lg`}>
                      {actionLabel}
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ═══════ Render: Settings Panel ═══════ */
  const renderSettings = () => {
    const themeText = activeCategory === "dating" ? "text-rose-500" : activeCategory === "friends" ? "text-emerald-500" : "text-blue-500";
    const themeBg = activeCategory === "dating" ? "bg-rose-500" : activeCategory === "friends" ? "bg-emerald-500" : "bg-blue-500";
    const themeBorder = activeCategory === "dating" ? "border-rose-500" : activeCategory === "friends" ? "border-emerald-500" : "border-blue-500";

    return (
      <div ref={settingsScroll.ref} onScroll={settingsScroll.onScroll} className="flex-1 overflow-y-auto w-full text-slate-300 pb-20 bg-slate-950">
        <div className="flex flex-col w-full pb-24">
          {/* distance */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <span className="lowercase font-bold tracking-wide">distance</span>
            <div className="flex items-center">
              <span className="text-slate-500 mr-2 text-sm">[</span>
              <input 
                type="text" 
                value={listDistance}
                onChange={(e) => setListDistance(e.target.value)}
                className={`bg-transparent w-8 text-center outline-none text-white font-medium focus:ring-1 ${themeBorder} rounded px-1`}
              />
              <span className="text-slate-500 text-sm ml-1 mr-4">]</span>
              <div className="flex items-center space-x-2 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800/50">
                <button onClick={() => { if (distanceUnit === 'km') { setListDistance(String(Math.round(parseFloat(listDistance) * 0.621371) || 25)); } setDistanceUnit("mi"); }} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'mi' ? themeText : 'text-slate-500'}`}>MI</button>
                <span className="text-slate-700 text-[10px]">|</span>
                <button onClick={() => { if (distanceUnit === 'mi') { setListDistance(String(Math.round(parseFloat(listDistance) * 1.60934) || 40)); } setDistanceUnit("km"); }} className={`text-[12px] font-bold tracking-wider uppercase transition-colors ${distanceUnit === 'km' ? themeText : 'text-slate-500'}`}>KM</button>
              </div>
            </div>
          </div>

          {/* sex */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <span className="lowercase font-bold tracking-wide">sex</span>
            <div className="flex items-center space-x-4">
               <button onClick={() => setListSex("male")} className={`text-sm lowercase font-medium transition-colors ${listSex === 'male' ? themeText : 'text-slate-600'}`}>male</button>
               <button onClick={() => setListSex("female")} className={`text-sm lowercase font-medium transition-colors ${listSex === 'female' ? themeText : 'text-slate-600'}`}>female</button>
               <button onClick={() => setListSex("custom")} className={`text-sm lowercase font-medium transition-colors ${listSex === 'custom' ? themeText : 'text-slate-600'}`}>custom</button>
            </div>
          </div>

          {/* Age */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <span className="font-bold tracking-wide text-slate-300">Age</span>
            <div className="flex items-center">
              <span className="text-slate-500 mr-2 text-sm">[</span>
              <input 
                type="text" 
                value={listAgeMin}
                onChange={(e) => setListAgeMin(e.target.value)}
                className="bg-transparent w-6 text-center outline-none text-white font-medium"
              />
              <span className="text-slate-500 mx-1">-</span>
              <input 
                type="text" 
                value={listAgeMax}
                onChange={(e) => setListAgeMax(e.target.value)}
                className="bg-transparent w-6 text-center outline-none text-white font-medium"
              />
              <span className="text-slate-500 ml-2 text-sm">]</span>
            </div>
          </div>

          {/* tags */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <span className="lowercase font-bold tracking-wide">tags</span>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setTagCloudOpen(true)}
                 className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${themeBg} hover:opacity-85 transition-colors text-white`}
               >
                 <Tag className="w-3 h-3" />
                 <span className="text-[10px] font-bold tracking-wider uppercase">Browse Tags</span>
               </button>
               <span className="text-slate-500 text-sm">[</span>
               <input 
                 type="text" 
                 placeholder="Search"
                 value={listTags}
                 onChange={(e) => setListTags(e.target.value)}
                 className="bg-transparent w-16 text-right outline-none text-white placeholder:text-slate-500 text-sm"
               />
               <span className="text-slate-500 text-sm">]</span>
            </div>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-800/80">
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${themeBg} text-white hover:opacity-80 transition-opacity active:scale-95`}
                  >
                    #{tag}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auto Bump Settings Row */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <span className="lowercase font-bold tracking-wide">auto bump</span>
            <button
              onClick={() => setShowAutoBumpsMenu(true)}
              className={`px-4 py-1.5 rounded-md ${themeBg} hover:opacity-85 transition-colors text-white text-xs font-bold uppercase tracking-wider`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════ Render: Auto Bump Modal Overlay ═══════ */
  const renderAutoBumpsMenu = () => {
    const themeBg = activeCategory === "dating" ? "bg-rose-500" : activeCategory === "friends" ? "bg-emerald-500" : "bg-blue-500";

    const sections = [
      {
        title: "Status",
        icon: <Shield className="w-4 h-4" />,
        content: (
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Radar className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 tracking-wide">Enable Auto Bumps</p>
                <p className="text-xs text-slate-500">Automatically bump matched users in proximity</p>
              </div>
            </div>
            <ToggleSwitch 
              on={autoBumpsEnabled} 
              onToggle={() => setAutoBumpsEnabled(!autoBumpsEnabled)} 
              accentClass={accent.toggleOn} 
            />
          </div>
        )
      },
      {
        title: "Parameters",
        icon: <Radar className="w-4 h-4" />,
        content: (
          <div className="divide-y divide-slate-800/40">
            {/* Scan Frequency */}
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-slate-200 tracking-wide">Scan Frequency</p>
              </div>
              <p className="text-xs text-slate-500 pl-7">Choose how often the app scans for nearby users</p>
              <div className="grid grid-cols-4 gap-2 pl-7">
                {[
                  { label: "1 min", value: "1" },
                  { label: "5 mins", value: "5" },
                  { label: "15 mins", value: "15" },
                  { label: "30 mins", value: "30" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScanFrequency(opt.value)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      scanFrequency === opt.value
                        ? `${themeBg} text-white border-transparent shadow-md`
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Distance Radius */}
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-slate-200 tracking-wide">Proximity Radius</p>
              </div>
              <p className="text-xs text-slate-500 pl-7">Distance range to trigger auto-bumps</p>
              <div className="grid grid-cols-4 gap-2 pl-7">
                {[
                  { label: "0.1 mi", value: "0.1" },
                  { label: "0.25 mi", value: "0.25" },
                  { label: "0.5 mi", value: "0.5" },
                  { label: "1.0 mi", value: "1.0" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedRadius(opt.value)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedRadius === opt.value
                        ? `${themeBg} text-white border-transparent shadow-md`
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Greeting",
        icon: <MessageCircle className="w-4 h-4" />,
        content: (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-200 tracking-wide">Auto-Bump Message</p>
            </div>
            <p className="text-xs text-slate-500 pl-7">The message sent automatically when a bump occurs</p>
            <div className="pl-7">
              <textarea
                value={autoBumpMessage}
                onChange={(e) => setAutoBumpMessage(e.target.value)}
                placeholder="Hey! Bumped you..."
                className="w-full h-24 rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-200 placeholder:text-slate-600 text-sm outline-none focus:border-slate-700 transition-colors resize-none"
              />
            </div>
          </div>
        )
      }
    ];

    return (
      <AnimatePresence>
        {showAutoBumpsMenu && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col pb-[env(safe-area-inset-bottom,20px)]"
          >
            {/* Header */}
            <div 
              className="w-full h-[64px] flex items-center px-4 border-b border-slate-800/80 bg-slate-900/40 sticky top-0 z-20 backdrop-blur-xl shrink-0"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              <button 
                onClick={closeAutoBumpsMenu} 
                className="mr-3 p-1 rounded-full hover:bg-slate-800/50 transition-colors"
              >
                <ArrowLeft className={`w-6 h-6 text-slate-300 hover:${accent.primary} transition-colors`} />
              </button>
              <div className="flex items-center gap-2">
                <Radar className={`w-5 h-5 ${accent.primary}`} />
                <h2 className="text-[20px] font-bold text-white tracking-tight">Auto Bump Settings</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-8">
              {sections.map((section) => (
                <div key={section.title} className="flex flex-col">
                  {/* Section header */}
                  <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
                    <div className={`p-1.5 rounded-lg ${accent.bg} ${accent.primary}`}>
                      {section.icon}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-[0.15em] ${accent.primary}`}>
                      {section.title}
                    </span>
                  </div>

                  {/* Section content card */}
                  <div className="mx-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 overflow-hidden">
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Premium Upgrade Callout Banner */}
              <div className="mx-4 mt-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 p-5 relative overflow-hidden flex flex-col justify-between space-y-4 mb-8">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">Premium Feature</span>
                  </div>
                  <h4 className="text-[17px] font-extrabold text-white tracking-tight leading-snug">Unlock Unlimited Auto Bumps</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Set up automatic proximity nets, custom Greetings, and scan without limits. Never miss a connection.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeAutoBumpsMenu();
                    setLocation("/store");
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-98 duration-100"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  /* ═══════ Render: Bump Category List (See All) ═══════ */
  const renderBumpCategoryList = () => {
    if (!activeBumpCategory) return null;

    return (
      <div className="flex-1 overflow-y-auto w-full h-full text-slate-300 relative bg-slate-950 pb-20">
        <div className="w-full h-[64px] flex items-center px-4 border-b border-slate-800/80 bg-slate-900/40 sticky top-0 z-20 backdrop-blur-xl">
          <button onClick={() => setActiveBumpCategory(null)} className="mr-3 p-1 rounded-full hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className={`w-6 h-6 text-slate-300 hover:${accent.primary} transition-colors`} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className={`text-[20px] font-bold text-white tracking-tight`}>{activeBumpCategory.title}</h2>
          </div>
        </div>

        {/* List View Search input */}
        <div className="px-4 pt-4 pb-2 bg-slate-950/80 backdrop-blur-sm sticky top-[64px] z-10">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/50">
            <Search className="text-slate-500 w-4 h-4 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search ${activeBumpCategory.title.toLowerCase()}...`}
              value={bumpsSearchQuery}
              onChange={(e) => setBumpsSearchQuery(e.target.value)}
              className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col w-full divide-y divide-slate-800/60 pb-24">
          {currentCategoryBumps.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm italic">
              No matching bumps found
            </div>
          ) : (
            currentCategoryBumps.map((bump, i) => (
              <div key={i} className="flex items-center px-5 py-4 hover:bg-slate-800/20 cursor-pointer transition-colors group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/50 shadow-sm relative flex items-center justify-center">
                  <img 
                    src={`https://picsum.photos/seed/bump-${bump.id}/200/200`} 
                    alt={bump.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col flex-1 pl-4 pr-3 overflow-hidden">
                  <h3 className="text-white text-[16px] font-semibold tracking-tight leading-snug">{bump.name}</h3>
                  <p className="text-slate-400 text-[12px] leading-snug mt-1 truncate">
                    {bump.message} • {bump.time}
                  </p>
                </div>

                <button 
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    activeBumpCategory.actionLabel === "BUMP" || activeBumpCategory.actionLabel === "ADD"
                      ? `${accent.badge} text-white`
                      : "bg-slate-800 text-slate-300"
                  } shadow-md`}
                >
                  {activeBumpCategory.actionLabel}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  /* ═══════ Render: Conversation View (Chat) ═══════ */
  const renderConversation = () => {
    if (!activeConversation) return null;

    const currentUserId = user?.id;

    return (
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full flex flex-col"
      >
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 bg-slate-950/60 backdrop-blur-sm"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={closeConversation}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </motion.button>

          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 border border-slate-700/50 overflow-hidden">
              <img 
                src={activeConversation.profilePhoto || `https://picsum.photos/seed/bump-${activeConversation.userId}/200/200`} 
                alt={activeConversation.name} 
                className="w-full h-full object-cover"
              />
            </Avatar>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white tracking-wide truncate">{activeConversation.name}</p>
            <p className="text-[11px] text-emerald-400">Online</p>
          </div>
        </motion.div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {isChatLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-8 h-8 border-2 border-slate-700 border-t-current rounded-full ${accent.primary}`}
              />
              <p className="text-slate-500 text-xs mt-3">Loading messages...</p>
            </div>
          ) : chatMessages && chatMessages.length > 0 ? (
            chatMessages.map((msg, index) => {
              const isMine = msg.senderId === currentUserId;
              const showTimestamp = index === 0 ||
                (new Date(msg.timestamp).getTime() - new Date(chatMessages[index - 1].timestamp).getTime()) > 300000; // 5min gap

              return (
                <div key={msg.id}>
                  {/* Timestamp divider */}
                  {showTimestamp && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center py-2"
                    >
                      <span className="text-[10px] text-slate-600 bg-slate-900/80 px-3 py-1 rounded-full">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </motion.div>
                  )}

                  {/* Message bubble */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl ${
                        isMine
                          ? `${accent.badge} text-white rounded-br-md`
                          : "bg-slate-800/80 text-slate-100 border border-slate-700/40 rounded-bl-md"
                      }`}
                      style={isMine ? { boxShadow: `0 2px 12px ${accent.primaryHex}25` } : undefined}
                    >
                      <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[9px] ${isMine ? "text-white/50" : "text-slate-500"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && msg.read && (
                          <span className="text-[9px] text-white/50">✓✓</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <ChatBubble primaryHex={accent.primaryHex} />
              <p className="text-slate-500 text-sm text-center">
                No messages yet. Say hi! 👋
              </p>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-4 py-3 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/50 focus-within:border-slate-600/60 transition-colors">
              <input
                ref={chatInputRef}
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-sm font-medium"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessageMutation.isPending}
              className={`p-3 rounded-2xl transition-all ${
                messageInput.trim()
                  ? `${accent.badge} text-white shadow-lg ${accent.glow}`
                  : "bg-slate-800 text-slate-500"
              }`}
              style={messageInput.trim() ? { boxShadow: `0 0 20px ${accent.primaryHex}30` } : undefined}
            >
              {sendMessageMutation.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  /* ═══════ Render: Messages List ═══════ */
  const renderMessages = () => {
    // Group contacts into sections using typed fields from messageList
    const newContacts = filteredMessages.filter(m => !m.isRevealed);
    const revealedContacts = filteredMessages.filter(m => m.isRevealed && m.category !== "dating");
    const dates = filteredMessages.filter(m => m.isRevealed && m.category === "dating");

    // Expand/collapse state per section (default: show 3)
    const PREVIEW_COUNT = 3;

    const renderContactCard = (contact: typeof messageList[0], idx: number) => (
      <motion.div
        key={contact.id}
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          openConversation({
            id: contact.id,
            name: contact.name,
            initials: contact.initials,
            profilePhoto: "profilePhoto" in contact ? (contact as any).profilePhoto : null,
          })
        }
        className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/30"
      >
        {/* Avatar + online indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 border border-slate-700/50 overflow-hidden">
            <img 
              src={contact.profilePhoto || `https://picsum.photos/seed/bump-${contact.id}/200/200`} 
              alt={contact.name} 
              className="w-full h-full object-cover"
            />
          </Avatar>
          {/* Online dot with pulse */}
          <div className="absolute -bottom-0.5 -right-0.5">
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p
              className={`text-sm tracking-wide ${
                contact.unread ? "font-bold text-white" : "font-medium text-slate-300"
              }`}
            >
              {contact.name}
            </p>
            <span
              className={`flex-shrink-0 text-[11px] ${
                contact.unread ? `font-semibold ${accent.badgeText}` : "text-slate-500"
              }`}
            >
              {contact.time}
            </span>
          </div>
          <p
            className={`text-xs truncate ${
              contact.unread ? "text-slate-200 font-medium" : "text-slate-500"
            }`}
          >
            {contact.lastMsg}
          </p>
        </div>

        {/* Unread count badge */}
        {contact.unread && contact.unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, delay: idx * 0.05 + 0.2 }}
            className={`min-w-[22px] h-[22px] rounded-full ${accent.badge} flex items-center justify-center flex-shrink-0`}
          >
            <span className="text-white text-[10px] font-bold px-1.5">
              {contact.unreadCount}
            </span>
          </motion.div>
        )}
      </motion.div>
    );

    const toggleSection = (title: string) => {
      setCollapsedSections(prev => {
        const next = new Set(prev);
        if (next.has(title)) next.delete(title);
        else next.add(title);
        return next;
      });
    };

    const renderSectionHeader = (title: string, count: number) => (
      <button
        onClick={() => toggleSection(title)}
        className="w-full px-5 pt-5 pb-2 border-b border-slate-800/30 bg-slate-950/40 cursor-pointer hover:bg-slate-900/40 transition-colors"
      >
        <h3 className={`text-sm font-bold uppercase tracking-wider ${accent.primary} flex items-center justify-between`}>
          <span className="flex items-center gap-2">
            {title}
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-extrabold">{count}</span>
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsedSections.has(title) ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </h3>
      </button>
    );

    const renderSection = (
      title: string,
      contacts: typeof messageList,
    ) => {
      if (contacts.length === 0) return null;
      const isCollapsed = collapsedSections.has(title);
      // Each row is ~70px tall; show ~5 items = 350px
      const SECTION_HEIGHT = 350;
      const needsScroll = contacts.length > 5;
      return (
        <div className="mb-4">
          {renderSectionHeader(title, contacts.length)}
          {!isCollapsed && (
            <div 
              className="flex flex-col overflow-y-auto"
              style={{ 
                maxHeight: needsScroll ? `${SECTION_HEIGHT}px` : "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {contacts.map((contact, idx) => renderContactCard(contact, idx))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div ref={messagesScroll.ref} onScroll={messagesScroll.onScroll} className="flex-1 overflow-y-auto w-full">
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-3"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm">
            <Search className="text-slate-500 w-4 h-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-sm font-medium"
            />
          </div>
        </motion.div>

        {filteredMessages.length === 0 ? (
          /* ─── Empty State ─── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center pt-16 px-8"
          >
            <ChatBubble primaryHex={accent.primaryHex} />
            <h3 className="text-white font-bold text-lg mb-1">No conversations yet</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              Bump someone nearby to start chatting!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2.5 rounded-xl ${accent.badge} text-white font-semibold text-sm shadow-lg ${accent.glow}`}
            >
              Start a Conversation
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex flex-col pb-12">
            {renderSection("New Contacts", newContacts)}
            {renderSection("Revealed Contacts", revealedContacts)}
            {renderSection("Dates", dates)}
            
            {newContacts.length === 0 && revealedContacts.length === 0 && dates.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm italic">
                No conversations match your search.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ═══════ Render: All Contacts (alphabetical) ═══════ */
  const renderAllContacts = () => {
    const allSorted = [...filteredMessages].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Group by first letter
    const grouped = allSorted.reduce<Record<string, typeof messageList>>((acc, contact) => {
      const letter = contact.name.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(contact);
      return acc;
    }, {});

    return (
      <div ref={messagesScroll.ref} onScroll={messagesScroll.onScroll} className="flex-1 overflow-y-auto w-full">
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-3"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm">
            <Search className="text-slate-500 w-4 h-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search all contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-sm font-medium"
            />
          </div>
        </motion.div>

        {allSorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm italic">
            No contacts found.
          </div>
        ) : (
          <div className="flex flex-col pb-12">
            {Object.entries(grouped).map(([letter, contacts]) => (
              <div key={letter}>
                {/* Letter header */}
                <div className="px-5 pt-4 pb-1.5 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
                  <span className={`text-xs font-extrabold uppercase tracking-widest ${accent.primary}`}>{letter}</span>
                </div>
                {contacts.map((contact, idx) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      openConversation({
                        id: contact.id,
                        name: contact.name,
                        initials: contact.initials,
                        profilePhoto: "profilePhoto" in contact ? (contact as any).profilePhoto : null,
                      })
                    }
                    className="flex items-center gap-3.5 px-5 py-3 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/20"
                  >
                    <Avatar className="h-10 w-10 border border-slate-700/50 overflow-hidden flex-shrink-0">
                      <img 
                        src={contact.profilePhoto || `https://picsum.photos/seed/bump-${contact.id}/200/200`} 
                        alt={contact.name} 
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className={`text-sm tracking-wide truncate ${contact.unread ? "font-bold text-white" : "font-medium text-slate-300"}`}>
                            {contact.name}
                          </p>
                          {/* Category badge */}
                          <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            !contact.isRevealed
                              ? "bg-cyan-400/20 text-cyan-300"
                              : contact.category === "dating"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-white/10 text-slate-300"
                          }`}>
                            {!contact.isRevealed ? "new" : contact.category === "dating" ? "date" : "revealed"}
                          </span>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] ml-2 ${contact.unread ? accent.primary + " font-semibold" : "text-slate-600"}`}>
                          {contact.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{contact.lastMsg}</p>
                    </div>
                    {contact.unread && contact.unreadCount > 0 && (
                      <span className={`min-w-[20px] h-[20px] rounded-full ${accent.badge} flex items-center justify-center text-white text-[10px] font-bold px-1.5 flex-shrink-0`}>
                        {contact.unreadCount}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition className="h-screen w-full page-dark relative overflow-hidden bg-slate-950">
      {/* ═══════ Background Effects ═══════ */}
      <NoiseOverlay />

      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb delay={0} size={200} x="10%" y="20%" accent={accent} />
        <FloatingOrb delay={2} size={150} x="70%" y="15%" accent={accent} />
        <FloatingOrb delay={4} size={180} x="50%" y="60%" accent={accent} />
        <FloatingOrb delay={6} size={120} x="20%" y="75%" accent={accent} />
      </div>

      {/* ═══════ Primary Header: Bumps / Messages ═══════ */}
      <AnimatePresence>
        {!activeConversation && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            {/* Main tab bar — matches Explore layout */}
            <div className="w-full h-[64px] flex items-center justify-center relative px-4">
              <button 
                onClick={() => {
                  setPrimaryMode("bumps");
                  setActiveBumpCategory(null);
                  if (bumpTab === "settings") {
                    setBumpTab("sent");
                  }
                }}
                className="px-2 relative group pb-1 mr-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "bumps" ? "text-white" : "text-slate-500"}`}>Bumps</span>
                  {placeholderBumpsReceived.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${accent.badge} text-white min-w-[20px] text-center leading-none`}>
                      {placeholderBumpsReceived.length}
                    </span>
                  )}
                </div>
                {primaryMode === "bumps" && (
                  <div className={`absolute -bottom-1 left-0 right-0 h-[2px] ${accent.indicator} rounded-full translate-y-1 mx-2`} />
                )}
              </button>
              <span className="text-slate-600 font-light text-[22px]">/</span>
              <button 
                onClick={() => {
                  setPrimaryMode("messages");
                  setActiveBumpCategory(null);
                  if (messageTab === "settings") {
                    handleMessageTabChange("contacts");
                  }
                }}
                className="px-2 relative group pb-1 ml-3"
              >
                <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "messages" ? "text-white" : "text-slate-500"}`}>Contacts</span>
                {primaryMode === "messages" && (
                  <div className={`absolute -bottom-1 left-0 right-0 h-[2px] ${accent.indicator} rounded-full translate-y-1 mx-2`} />
                )}
              </button>
            </div>

            {primaryMode === "bumps" && !activeBumpCategory && (
              <div className="w-full flex border-t border-slate-800/50 h-[44px]">
                <button 
                  onClick={() => setBumpTab("sent")}
                  className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/10 cursor-pointer"
                >
                  <span className={`text-sm font-semibold tracking-wide ${bumpTab !== "settings" ? accent.primary : "text-slate-500 group-hover:text-white"}`}>
                    View Bumps
                  </span>
                  {bumpTab !== "settings" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${accent.indicator} rounded-t-full`} />}
                </button>
                <div className="w-px bg-slate-800 self-center h-5" />
                <button 
                  onClick={() => setBumpTab("settings")}
                  className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/10 cursor-pointer"
                >
                  <span className={`text-sm font-semibold tracking-wide ${bumpTab === "settings" ? accent.primary : "text-slate-500 group-hover:text-white"}`}>
                    Settings
                  </span>
                  {bumpTab === "settings" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${accent.indicator} rounded-t-full`} />}
                </button>
              </div>
            )}

            {primaryMode === "messages" && (
              <div className="w-full flex border-t border-slate-800/50 h-[44px]">
                <button 
                  onClick={() => handleMessageTabChange("all")}
                  className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/10 cursor-pointer"
                >
                  <span className={`text-sm font-semibold tracking-wide ${messageTab === "all" ? accent.primary : "text-slate-500 group-hover:text-white"}`}>
                    All Contacts
                  </span>
                  {messageTab === "all" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${accent.indicator} rounded-t-full`} />}
                </button>
                <div className="w-px bg-slate-800 self-center h-5" />
                <button 
                  onClick={() => handleMessageTabChange("contacts")}
                  className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/10 cursor-pointer"
                >
                  <span className={`text-sm font-semibold tracking-wide ${messageTab === "contacts" ? accent.primary : "text-slate-500 group-hover:text-white"}`}>
                    Messages
                  </span>
                  {messageTab === "contacts" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${accent.indicator} rounded-t-full`} />}
                </button>
                <div className="w-px bg-slate-800 self-center h-5" />
                <button 
                  onClick={() => handleMessageTabChange("settings")}
                  className="flex-1 flex items-center justify-center relative transition-colors group hover:bg-slate-800/10 cursor-pointer"
                >
                  <span className={`text-sm font-semibold tracking-wide ${messageTab === "settings" ? accent.primary : "text-slate-500 group-hover:text-white"}`}>
                    Settings
                  </span>
                  {messageTab === "settings" && <div className={`absolute bottom-0 left-4 right-4 h-[2px] ${accent.indicator} rounded-t-full`} />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="fixed left-0 right-0 overflow-hidden z-[2]"
        style={{
          top: activeConversation 
            ? "0px" 
            : ((primaryMode === "bumps" && !activeBumpCategory) || primaryMode === "messages")
              ? "108px" 
              : "64px",
          bottom: activeConversation ? "0px" : "60px",
        }}
      >
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col"
            >
              {renderConversation()}
            </motion.div>
          ) : (
            <motion.div
              key={primaryMode === "bumps" ? `bumps-${bumpTab}` : "messages"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {primaryMode === "bumps" ? (
                activeBumpCategory ? renderBumpCategoryList() : (
                  bumpTab === "settings" ? renderSettings() : (
                    <div ref={bumpsScroll.ref} onScroll={bumpsScroll.onScroll} className="flex-1 overflow-y-auto w-full pb-8">
                      {/* Search bar for Bumps */}
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 pt-4 pb-2"
                      >
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm">
                          <Search className="text-slate-500 w-4 h-4 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search by keyword..."
                            value={bumpsSearchQuery}
                            onChange={(e) => setBumpsSearchQuery(e.target.value)}
                            className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-sm font-medium"
                          />
                        </div>
                      </motion.div>

                      {bumpsSearchQuery.trim() && 
                       filteredMutualBumps.length === 0 && 
                       filteredReceivedBumps.length === 0 && 
                       filteredSentBumps.length === 0 && 
                       filteredAutoBumps.length === 0 && 
                       filteredPassedBumps.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 text-sm italic">
                          No bumps found matching &ldquo;{bumpsSearchQuery}&rdquo;
                        </div>
                      ) : (
                        <>
                          {/* ── Mutual Bumps Section ── */}
                          {(!bumpsSearchQuery.trim() || filteredMutualBumps.length > 0) && (
                            <div className="mb-6 pt-2">
                              <div className="flex justify-between items-end mb-3 px-4">
                                <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Mutual Bumps</h2>
                                <button 
                                  onClick={() => setActiveBumpCategory({
                                    title: "Mutual Bumps",
                                    categoryKey: "mutual",
                                    actionLabel: "ADD"
                                  })}
                                  className="flex flex-col items-center cursor-pointer group"
                                >
                                  <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                                  <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                                </button>
                              </div>
                              {filteredMutualBumps.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                                  {filteredMutualBumps.map((bump) => (
                                    <div key={bump.id} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
                                      <div className="w-full h-full relative bg-slate-800">
                                        <img 
                                          src={`https://picsum.photos/seed/bump-${bump.id}/400/600`} 
                                          alt={bump.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                                      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        <span className="text-[10px] text-white/80 font-bold">{bump.time}</span>
                                      </div>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none text-center">
                                        <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{bump.name}</h3>
                                        <p className="text-[11px] text-white/60 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{bump.message}</p>
                                      </div>
                                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${accent.badge} text-white shadow-lg`}>ADD</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-4 text-slate-600 text-sm italic">No mutual bumps yet</p>
                              )}
                            </div>
                          )}

                          {/* ── Received Bumps Section ── */}
                          {(!bumpsSearchQuery.trim() || filteredReceivedBumps.length > 0) && (
                            <div className="mb-6">
                              <div className="flex justify-between items-end mb-3 px-4">
                                <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Received</h2>
                                <button 
                                  onClick={() => setActiveBumpCategory({
                                    title: "Received Bumps",
                                    categoryKey: "received",
                                    actionLabel: "BUMP"
                                  })}
                                  className="flex flex-col items-center cursor-pointer group"
                                >
                                  <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                                  <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                                </button>
                              </div>
                              {filteredReceivedBumps.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                                  {filteredReceivedBumps.map((bump) => (
                                    <div key={bump.id} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
                                      <div className="w-full h-full relative bg-slate-800">
                                        <img 
                                          src={`https://picsum.photos/seed/bump-${bump.id}/400/600`} 
                                          alt={bump.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                                      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        <span className="text-[10px] text-white/80 font-bold">{bump.time}</span>
                                      </div>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none text-center">
                                        <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{bump.name}</h3>
                                        <p className="text-[11px] text-white/60 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{bump.message}</p>
                                      </div>
                                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${accent.badge} text-white shadow-lg`}>BUMP</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-4 text-slate-600 text-sm italic">No bumps received yet</p>
                              )}
                            </div>
                          )}

                          {/* ── Sent Bumps Section ── */}
                          {(!bumpsSearchQuery.trim() || filteredSentBumps.length > 0) && (
                            <div className="mb-6">
                              <div className="flex justify-between items-end mb-3 px-4">
                                <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Sent</h2>
                                <button 
                                  onClick={() => setActiveBumpCategory({
                                    title: "Sent Bumps",
                                    categoryKey: "sent",
                                    actionLabel: "VIEW"
                                  })}
                                  className="flex flex-col items-center cursor-pointer group"
                                >
                                  <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                                  <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                                </button>
                              </div>
                              {filteredSentBumps.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                                  {filteredSentBumps.map((bump) => (
                                    <div key={bump.id} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
                                      <div className="w-full h-full relative bg-slate-800">
                                        <img 
                                          src={`https://picsum.photos/seed/bump-${bump.id}/400/600`} 
                                          alt={bump.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                                      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        <span className="text-[10px] text-white/80 font-bold">{bump.time}</span>
                                      </div>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none text-center">
                                        <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{bump.name}</h3>
                                        <p className="text-[11px] text-white/60 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{bump.message}</p>
                                      </div>
                                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/80 text-white shadow-lg`}>VIEW</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-4 text-slate-600 text-sm italic">No bumps sent yet</p>
                              )}
                            </div>
                          )}

                          {/* ── Auto Bumps Section ── */}
                          {(!bumpsSearchQuery.trim() || filteredAutoBumps.length > 0) && (
                            <div className="mb-6">
                              <div className="flex justify-between items-end mb-3 px-4">
                                <div className="flex items-center gap-2">
                                  <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Auto Bumps</h2>
                                  <button
                                    onClick={() => setShowAutoBumpsMenu(true)}
                                    className="px-3 py-1 rounded-full text-xs font-semibold lowercase transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 ml-2"
                                  >
                                    activate
                                  </button>
                                </div>
                                <button 
                                  onClick={() => setActiveBumpCategory({
                                    title: "Auto Bumps",
                                    categoryKey: "auto",
                                    actionLabel: "VIEW"
                                  })}
                                  className="flex flex-col items-center cursor-pointer group"
                                >
                                  <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                                  <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                                </button>
                              </div>
                              {filteredAutoBumps.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                                  {filteredAutoBumps.map((bump) => (
                                    <div key={bump.id} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
                                      <div className="w-full h-full relative bg-slate-800">
                                        <img 
                                          src={`https://picsum.photos/seed/bump-${bump.id}/400/600`} 
                                          alt={bump.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                                      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        <span className="text-[10px] text-white/80 font-bold">{bump.time}</span>
                                      </div>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none text-center">
                                        <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{bump.name}</h3>
                                        <p className="text-[11px] text-white/60 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{bump.message}</p>
                                      </div>
                                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/80 text-white shadow-lg`}>
                                          VIEW
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-4 text-slate-600 text-sm italic">No auto bumps yet</p>
                              )}
                            </div>
                          )}

                          {/* ── Passed Bumps Section ── */}
                          {(!bumpsSearchQuery.trim() || filteredPassedBumps.length > 0) && (
                            <div className="mb-6">
                              <div className="flex justify-between items-end mb-3 px-4">
                                <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Passed by</h2>
                                <button 
                                  onClick={() => setActiveBumpCategory({
                                    title: "Passed by Bumps",
                                    categoryKey: "passed",
                                    actionLabel: "VIEW"
                                  })}
                                  className="flex flex-col items-center cursor-pointer group"
                                >
                                  <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                                  <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                                </button>
                              </div>
                              {filteredPassedBumps.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                                  {filteredPassedBumps.map((bump) => (
                                    <div key={bump.id} className="relative w-36 h-[210px] rounded-[24px] overflow-hidden shrink-0 snap-center shadow-lg border border-slate-800/50 cursor-pointer">
                                      <div className="w-full h-full relative bg-slate-800">
                                        <img 
                                          src={`https://picsum.photos/seed/bump-${bump.id}/400/600`} 
                                          alt={bump.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                                      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        <span className="text-[10px] text-white/80 font-bold">{bump.time}</span>
                                      </div>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none text-center">
                                        <h3 className="font-extrabold text-[16px] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{bump.name}</h3>
                                        <p className="text-[11px] text-white/60 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{bump.message}</p>
                                      </div>
                                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/80 text-white shadow-lg`}>VIEW</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-4 text-slate-600 text-sm italic">No passed by bumps yet</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                )
              ) : (
                messageTab === "settings"
                  ? renderSettings()
                  : messageTab === "all"
                    ? renderAllContacts()
                    : renderMessages()
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hide bottom nav when in conversation */}
      {!activeConversation && <BottomNavigation />}
      {renderAutoBumpsMenu()}
      {tagCloudOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-200">
          {/* Header with inline search */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-800/60" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
            {/* Row 1: Tags label + search input + X close */}
            <div className="flex items-center gap-2">
              <Tag className={`w-5 h-5 ${activeCategory === "dating" ? "text-rose-500" : activeCategory === "friends" ? "text-emerald-500" : "text-blue-500"} shrink-0`} />
              <h2 className="text-white text-lg font-extrabold tracking-tight shrink-0">Tags</h2>
              <input
                type="text"
                placeholder="Search or create..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTagInput.trim()) {
                    handleCreateTag();
                  }
                }}
                className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-opacity-50 min-w-0"
              />
              <button 
                onClick={() => setTagCloudOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tags cloud/scroller */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Popular Tags</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {POPULAR_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected 
                        ? `${activeCategory === "dating" ? "bg-rose-500" : activeCategory === "friends" ? "bg-emerald-500" : "bg-blue-500"} text-white` 
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">All Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected 
                        ? `${activeCategory === "dating" ? "bg-rose-500" : activeCategory === "friends" ? "bg-emerald-500" : "bg-blue-500"} text-white` 
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
