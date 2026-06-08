import { useState, useEffect, useMemo, useRef } from "react";
import { useScrollSave } from "@/hooks/use-scroll-save";
import { PageTransition } from "@/components/PageTransition";
import BottomNavigation from "@/components/BottomNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
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
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type PrimaryMode = "bumps" | "messages";
type BumpSubTab = "sent" | "received" | "auto" | "settings";
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
  { id: 17, name: "Daniel K.", initials: "DK", message: "Mutual bump! Add to contacts", time: "1m", sex: "male" },
  { id: 18, name: "Chloe L.", initials: "CL", message: "Mutual bump! Add to contacts", time: "12m", sex: "female" },
];

const placeholderBumpsReceived = [
  { id: 1, name: "Sarah M.", initials: "SM", message: "Bumped you from 0.3 mi away!", time: "2m", sex: "female" },
  { id: 2, name: "Jake R.", initials: "JR", message: "Hey! Bumped you 👋", time: "15m", sex: "male" },
  { id: 3, name: "Mia L.", initials: "ML", message: "Wants to meet up!", time: "1h", sex: "female" },
  { id: 4, name: "Carlos D.", initials: "CD", message: "Bumped you twice!", time: "3h", sex: "male" },
  { id: 5, name: "Priya K.", initials: "PK", message: "Nearby bump!", time: "5h", sex: "female" },
];

const placeholderBumpsSent = [
  { id: 6, name: "Olivia T.", initials: "OT", message: "You bumped from 0.2 mi", time: "5m", sex: "female" },
  { id: 7, name: "Marcus W.", initials: "MW", message: "You bumped from 0.5 mi", time: "30m", sex: "male" },
  { id: 8, name: "Emma S.", initials: "ES", message: "You bumped from 1.0 mi", time: "2h", sex: "female" },
];

const placeholderAutoBumps = [
  { id: 9, name: "Lily C.", initials: "LC", message: "Auto-bumped 0.1 mi away", time: "10m", sex: "female" },
  { id: 10, name: "Noah B.", initials: "NB", message: "Auto-bumped 0.4 mi away", time: "25m", sex: "male" },
  { id: 11, name: "Ava R.", initials: "AR", message: "Auto-bumped 0.2 mi away", time: "1h", sex: "female" },
  { id: 12, name: "Ethan P.", initials: "EP", message: "Auto-bumped 0.3 mi away", time: "2h", sex: "male" },
];

const placeholderBumpsPassed = [
  { id: 13, name: "Sophia V.", initials: "SV", message: "Passed each other at 12th St", time: "4h", sex: "female" },
  { id: 14, name: "Liam N.", initials: "LN", message: "Passed each other near Cafe", time: "6h", sex: "male" },
  { id: 15, name: "Chloe A.", initials: "CA", message: "Passed each other at the park", time: "1d", sex: "female" },
  { id: 16, name: "Jackson K.", initials: "JK", message: "Passed each other yesterday", time: "1d", sex: "male" },
];

/* ═══════ Placeholder messages ═══════ */
const placeholderMessages = [
  { id: 1, name: "Sarah M.", initials: "SM", lastMsg: "Hey! Are you nearby?", time: "2m", unread: true, unreadCount: 3 },
  { id: 2, name: "Jake R.", initials: "JR", lastMsg: "See you at the spot 🍕", time: "15m", unread: true, unreadCount: 1 },
  { id: 3, name: "Mia L.", initials: "ML", lastMsg: "Let's meet up!", time: "1h", unread: false, unreadCount: 0 },
  { id: 4, name: "Carlos D.", initials: "CD", lastMsg: "Thanks for connecting", time: "3h", unread: false, unreadCount: 0 },
];

/* ═══════ Helper: relative time ═══════ */
function formatRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
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

  /* ─── Category from localStorage ─── */
  const category = useMemo<CategoryKey>(() => {
    return (localStorage.getItem("f2f_activeCategory") as CategoryKey) || "dating";
  }, []);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>(category);
  const [activeBumpCategory, setActiveBumpCategory] = useState<{
    title: string;
    bumps: typeof placeholderBumpsReceived;
    actionLabel: string;
  } | null>(null);

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

  useEffect(() => {
    localStorage.setItem("f2f_messages_primaryMode", primaryMode);
    localStorage.setItem("f2f_messages_bumpTab", bumpTab);
  }, [primaryMode, bumpTab]);

  /* ─── Scroll save hooks ─── */
  const bumpsScroll = useScrollSave("f2f_msgs_scroll_bumps");
  const settingsScroll = useScrollSave("f2f_msgs_scroll_settings");
  const messagesScroll = useScrollSave("f2f_msgs_scroll_messages");

  /* ─── Settings State ─── */
  const [pushNotifs, setPushNotifs] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showOnMap, setShowOnMap] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

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
      }));
    }
    // Fallback to placeholders
    return placeholderMessages;
  }, [apiConversations]);

  /* ─── Unread counts ─── */
  const unreadMessageCount = messageList.filter((m) => m.unread).length;
  const totalUnreadBadge = messageList.reduce((sum, m) => sum + m.unreadCount, 0);

  /* ─── Search state ─── */
  const [searchQuery, setSearchQuery] = useState("");
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
          <div className={`p-1.5 rounded-lg ${accent.bg}`}>
            <Zap className={accent.primary} style={{ width: 14, height: 14 }} />
          </div>
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
                {/* Bump icon */}
                <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${accent.badge} flex items-center justify-center shadow-lg`}>
                  <Zap style={{ width: 12, height: 12 }} className="text-white" />
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
    const sections = [
      {
        title: "Notifications",
        icon: <Bell className="w-4 h-4" />,
        items: [
          { label: "Push Notifications", subtitle: "Receive bump and message alerts", icon: <Bell className="w-4 h-4" />, state: pushNotifs, setter: setPushNotifs },
          { label: "Sound Effects", subtitle: "Play sounds on new bumps", icon: <Volume2 className="w-4 h-4" />, state: soundEffects, setter: setSoundEffects },
          { label: "Haptic Feedback", subtitle: "Vibrate on interactions", icon: <Vibrate className="w-4 h-4" />, state: haptic, setter: setHaptic },
        ],
      },
      {
        title: "Appearance",
        icon: <Palette className="w-4 h-4" />,
        items: [
          { label: "Dark Mode", subtitle: "Use dark theme across the app", icon: <Moon className="w-4 h-4" />, state: darkMode, setter: setDarkMode },
        ],
      },
      {
        title: "Privacy",
        icon: <Shield className="w-4 h-4" />,
        items: [
          { label: "Show on Map", subtitle: "Let others see your location", icon: <Eye className="w-4 h-4" />, state: showOnMap, setter: setShowOnMap },
        ],
      },
    ];

    return (
      <div ref={settingsScroll.ref} onScroll={settingsScroll.onScroll} className="flex-1 overflow-y-auto w-full text-slate-300">
        <div className="flex flex-col w-full pb-6">
          {sections.map((section, sIdx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.08, duration: 0.35 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
                <div className={`p-1.5 rounded-lg ${accent.bg} ${accent.primary}`}>
                  {section.icon}
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.15em] ${accent.primary}`}>
                  {section.title}
                </span>
              </div>

              {/* Section items */}
              <div className="mx-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 overflow-hidden">
                {section.items.map((item, iIdx) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-4 py-3.5 ${iIdx < section.items.length - 1 ? "border-b border-slate-800/40" : ""}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-slate-500 flex-shrink-0">{item.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 tracking-wide">{item.label}</p>
                        <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <ToggleSwitch on={item.state} onToggle={() => item.setter(!item.state)} accentClass={accent.toggleOn} />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
          >
            <div className="flex items-center gap-2.5 px-5 pt-6 pb-2">
              <div className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Account
              </span>
            </div>

            <div className="mx-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 overflow-hidden">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/40 cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-200 tracking-wide">Edit Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/40 cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-200 tracking-wide">Privacy & Safety</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-rose-500/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-semibold text-rose-500 tracking-wide">Log Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-500/40" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
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
          <h2 className={`text-[20px] font-bold text-white tracking-tight`}>{activeBumpCategory.title}</h2>
        </div>
        <div className="flex flex-col w-full divide-y divide-slate-800/60 pb-24">
          {activeBumpCategory.bumps.map((bump, i) => (
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
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  activeBumpCategory.actionLabel === "BUMP" ? `${accent.badge} text-white` : "bg-slate-800 text-slate-300"
                } shadow-md`}
              >
                {activeBumpCategory.actionLabel}
              </button>
            </div>
          ))}
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
  const renderMessages = () => (
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
        /* ─── Message Cards ─── */
        <div className="flex flex-col">
          {filteredMessages.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
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
                  transition={{ type: "spring", stiffness: 500, damping: 25, delay: index * 0.05 + 0.2 }}
                  className={`min-w-[22px] h-[22px] rounded-full ${accent.badge} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white text-[10px] font-bold px-1.5">
                    {contact.unreadCount}
                  </span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

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
                }}
                className="px-2 relative group pb-1 ml-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[22px] font-extrabold tracking-tight transition-colors ${primaryMode === "messages" ? "text-white" : "text-slate-500"}`}>Contacts</span>
                  {unreadMessageCount > 0 && (
                    <div className="relative">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${accent.badge} text-white min-w-[20px] text-center leading-none`}>
                        {totalUnreadBadge}
                      </span>
                      <motion.div
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${accent.badge}`}
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  )}
                </div>
                {primaryMode === "messages" && (
                  <div className={`absolute -bottom-1 left-0 right-0 h-[2px] ${accent.indicator} rounded-full translate-y-1 mx-2`} />
                )}
              </button>

              {/* Settings Gear Button on the right */}
              {primaryMode === "bumps" && !activeBumpCategory && (
                <button
                  onClick={() => {
                    setBumpTab(bumpTab === "settings" ? "sent" : "settings");
                  }}
                  className={`absolute right-4 p-2 rounded-xl transition-all ${
                    bumpTab === "settings"
                      ? `${accent.bg} ${accent.primary}`
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  aria-label="Settings"
                >
                  <Settings className="w-5.5 h-5.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Main Content Area ═══════ */}
      <div
        className="fixed left-0 right-0 overflow-hidden z-[2]"
        style={{
          top: activeConversation ? "0px" : "64px",
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
                      {/* ── Mutual Bumps Section ── */}
                      <div className="mb-6 pt-2">
                        <div className="flex justify-between items-end mb-3 px-4">
                          <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Mutual Bumps</h2>
                          <button 
                            onClick={() => setActiveBumpCategory({
                              title: "Mutual Bumps",
                              bumps: placeholderBumpsMutual,
                              actionLabel: "ADD"
                            })}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                            <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                          </button>
                        </div>
                        {placeholderBumpsMutual.length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                            {placeholderBumpsMutual.map((bump) => (
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
                                <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${accent.badge} flex items-center justify-center shadow-lg`}>
                                  <Zap style={{ width: 12, height: 12 }} className="text-white" />
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

                      {/* ── Received Bumps Section ── */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-3 px-4">
                          <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Received</h2>
                          <button 
                            onClick={() => setActiveBumpCategory({
                              title: "Received Bumps",
                              bumps: placeholderBumpsReceived,
                              actionLabel: "BUMP"
                            })}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                            <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                          </button>
                        </div>
                        {placeholderBumpsReceived.length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                            {placeholderBumpsReceived.map((bump) => (
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
                                <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${accent.badge} flex items-center justify-center shadow-lg`}>
                                  <Zap style={{ width: 12, height: 12 }} className="text-white" />
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

                      {/* ── Sent Bumps Section ── */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-3 px-4">
                          <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Sent</h2>
                          <button 
                            onClick={() => setActiveBumpCategory({
                              title: "Sent Bumps",
                              bumps: placeholderBumpsSent,
                              actionLabel: "VIEW"
                            })}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                            <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                          </button>
                        </div>
                        {placeholderBumpsSent.length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                            {placeholderBumpsSent.map((bump) => (
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
                                <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${accent.badge} flex items-center justify-center shadow-lg`}>
                                  <Zap style={{ width: 12, height: 12 }} className="text-white" />
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

                      {/* ── Auto Bumps Section ── */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-3 px-4">
                          <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Auto Bumps</h2>
                          <button 
                            onClick={() => setActiveBumpCategory({
                              title: "Auto Bumps",
                              bumps: placeholderAutoBumps,
                              actionLabel: "VIEW"
                            })}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                            <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                          </button>
                        </div>
                        {placeholderAutoBumps.length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                            {placeholderAutoBumps.map((bump) => (
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
                                <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${accent.badge} flex items-center justify-center shadow-lg`}>
                                  <Zap style={{ width: 12, height: 12 }} className="text-white" />
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
                          <p className="px-4 text-slate-600 text-sm italic">No auto bumps yet</p>
                        )}
                      </div>

                      {/* ── Passed Bumps Section ── */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-3 px-4">
                          <h2 className={`text-[26px] font-bold ${accent.primary} tracking-tight`}>Passed</h2>
                          <button 
                            onClick={() => setActiveBumpCategory({
                              title: "Passed Bumps",
                              bumps: placeholderBumpsPassed,
                              actionLabel: "VIEW"
                            })}
                            className="flex flex-col items-center cursor-pointer group"
                          >
                            <span className={`text-[11px] font-extrabold ${accent.primary} lowercase tracking-wider mb-0 hover:opacity-80 transition-colors`}>all</span>
                            <ChevronDown className={`w-5 h-5 ${accent.primary} group-hover:opacity-80 transition-colors translate-y-[-4px]`} strokeWidth={3} />
                          </button>
                        </div>
                        {placeholderBumpsPassed.length > 0 ? (
                          <div className="flex gap-4 overflow-x-auto pl-4 pr-4 snap-x pb-4 [&::-webkit-scrollbar]:hidden relative after:content-[''] after:w-4 after:shrink-0">
                            {placeholderBumpsPassed.map((bump) => (
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
                                <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${accent.badge} flex items-center justify-center shadow-lg`}>
                                  <Zap style={{ width: 12, height: 12 }} className="text-white" />
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
                          <p className="px-4 text-slate-600 text-sm italic">No passed bumps yet</p>
                        )}
                      </div>
                    </div>
                  )
                )
              ) : (
                renderMessages()
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hide bottom nav when in conversation */}
      {!activeConversation && <BottomNavigation />}
    </PageTransition>
  );
}
