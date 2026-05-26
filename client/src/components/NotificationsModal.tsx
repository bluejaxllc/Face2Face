import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Bell, Zap, Heart, ChevronRight, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProfileCard from "./ProfileCard";
import { useLocation } from "@/contexts/LocationContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── Interfaces (preserved) ───────────────────────────────────────────────────
interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  sex: string;
  age: number;
  selfRating: number;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  profilePhoto?: string | null;
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  relatedId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsModalProps {
  onClose: () => void;
}

// ─── Category accent helper ──────────────────────────────────────────────────
function getCategoryAccent() {
  const cat = typeof window !== "undefined"
    ? localStorage.getItem("f2f_activeCategory") ?? "dating"
    : "dating";
  switch (cat) {
    case "friends":
      return {
        ring: "from-emerald-400 to-teal-500",
        glow: "shadow-emerald-500/40",
        badge: "from-emerald-500 to-teal-600",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        bgHover: "hover:bg-emerald-500/15",
        border: "border-emerald-500/30",
        emptyHint: "Bump someone nearby to start connecting!",
      };
    case "business":
      return {
        ring: "from-blue-400 to-indigo-500",
        glow: "shadow-blue-500/40",
        badge: "from-blue-500 to-indigo-600",
        text: "text-blue-400",
        bg: "bg-blue-500/10",
        bgHover: "hover:bg-blue-500/15",
        border: "border-blue-500/30",
        emptyHint: "Network with professionals around you!",
      };
    default:
      return {
        ring: "from-pink-400 to-rose-500",
        glow: "shadow-pink-500/40",
        badge: "from-pink-500 to-rose-600",
        text: "text-pink-400",
        bg: "bg-pink-500/10",
        bgHover: "hover:bg-pink-500/15",
        border: "border-pink-500/30",
        emptyHint: "Connect with someone to get started!",
      };
  }
}

// ─── Notification type styling helper ────────────────────────────────────────
function getTypeStyle(type: string) {
  switch (type) {
    case "bump":
      return {
        accent: "border-l-pink-500",
        icon: <Zap className="w-3.5 h-3.5 text-pink-400" />,
        avatarGrad: "from-pink-600 to-rose-700",
        dotColor: "from-pink-400 to-rose-500",
        unreadBg: "bg-pink-500/10",
        unreadHover: "hover:bg-pink-500/15",
      };
    case "match":
      return {
        accent: "border-l-emerald-500",
        icon: <Heart className="w-3.5 h-3.5 text-emerald-400" />,
        avatarGrad: "from-emerald-600 to-teal-700",
        dotColor: "from-emerald-400 to-teal-500",
        unreadBg: "bg-emerald-500/10",
        unreadHover: "hover:bg-emerald-500/15",
      };
    default:
      return {
        accent: "border-l-blue-500",
        icon: <Bell className="w-3.5 h-3.5 text-blue-400" />,
        avatarGrad: "from-slate-700 to-slate-800",
        dotColor: "from-blue-400 to-indigo-500",
        unreadBg: "bg-blue-500/10",
        unreadHover: "hover:bg-blue-500/15",
      };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const queryClient = useQueryClient();
  const { currentLocation } = useLocation();
  const [selectedConnectNotification, setSelectedConnectNotification] = useState<Notification | null>(null);

  const accent = useMemo(() => getCategoryAccent(), []);

  // ── Queries & Mutations (all preserved) ──────────────────────────────────
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/read/${notificationId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const { data: senderUser } = useQuery<User>({
    queryKey: ["/api/users", selectedConnectNotification?.relatedId],
    enabled: !!selectedConnectNotification?.relatedId,
  });

  // ── Handlers (all preserved) ─────────────────────────────────────────────
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.type === "bump") {
      setSelectedConnectNotification(notification);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleConnectBack = async () => {
    if (!senderUser) return;
    setSelectedConnectNotification(null);

    try {
      await apiRequest("POST", "/api/bumps", {
        bumpedUserId: senderUser.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Failed to connect back:", error);
    }
  };

  // ── Helpers (preserved) ──────────────────────────────────────────────────
  const getInitialsFromContent = (content: string) => {
    const matches = content.match(/by ([A-Za-z]+)/);
    if (matches && matches[1]) {
      return matches[1].charAt(0);
    }
    return "U";
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── ProfileCard overlay (preserved) ──────────────────────────────────────
  if (selectedConnectNotification && senderUser) {
    return (
      <div className="fixed inset-0 z-[2500] bg-black/60  flex justify-center items-center">
        <ProfileCard
          user={senderUser}
          onClose={() => setSelectedConnectNotification(null)}
          onConnect={handleConnectBack}
          distance={null}
        />
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md !rounded-t-3xl !rounded-b-2xl border border-white/[0.06] text-white p-0 overflow-hidden bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/50"
      >
        {/* ── SVG noise texture overlay ─────────────────────────────────── */}
        <svg className="pointer-events-none absolute inset-0 w-full h-full z-0 opacity-[0.03]">
          <filter id="notifNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#notifNoise)" />
        </svg>

        {/* ── Content wrapper above noise ───────────────────────────────── */}
        <div className="relative z-10">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <DialogHeader className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated bell with glow ring */}
                <motion.div
                  className="relative"
                  animate={{ rotate: [0, 6, -6, 4, -4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                >
                  <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-br ${accent.ring} opacity-20 blur-md animate-pulse`} />
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${accent.ring} shadow-lg ${accent.glow}`}>
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                </motion.div>

                <div>
                  <DialogTitle className="text-lg font-bold font-heading bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                    Notifications
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 tracking-wide mt-0.5">
                    Recent activity & interactions
                  </DialogDescription>
                </div>
              </div>

              {/* Unread badge + Mark all read */}
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className={`inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-gradient-to-r ${accent.badge} text-[11px] font-bold text-white shadow-lg ${accent.glow}`}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAllAsRead}
                  disabled={notifications.length === 0 || !notifications.some(n => !n.read)}
                  className={`flex items-center gap-1 text-xs ${accent.text} disabled:text-slate-700 disabled:cursor-not-allowed transition-colors font-medium px-2 py-1 rounded-lg hover:bg-white/5`}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Read all</span>
                </motion.button>
              </div>
            </div>
          </DialogHeader>

          {/* ── Separator ───────────────────────────────────────────────── */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* ── Notification list ────────────────────────────────────────── */}
          <div className="max-h-[380px] overflow-y-auto hide-scrollbar px-3 py-2">
            {notifications.length === 0 ? (
              /* ── Empty State ──────────────────────────────────────────── */
              <div className="py-12 flex flex-col items-center justify-center text-center">
                {/* Radar ring behind the bell */}
                <div className="relative mb-5">
                  <motion.div
                    className={`absolute -inset-4 rounded-full border ${accent.border}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className={`absolute -inset-8 rounded-full border ${accent.border}`}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${accent.ring} shadow-lg ${accent.glow}`}
                  >
                    <Bell className="w-7 h-7 text-white" />
                  </motion.div>
                </div>

                <p className="text-white font-semibold text-sm tracking-tight">
                  All caught up!
                </p>
                <p className="text-slate-500 text-xs mt-1.5 max-w-[200px] leading-relaxed">
                  {accent.emptyHint}
                </p>
              </div>
            ) : (
              /* ── Notification cards ───────────────────────────────────── */
              <AnimatePresence mode="popLayout">
                {notifications.map((notification, i) => {
                  const style = getTypeStyle(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.95 }}
                      transition={{
                        delay: i * 0.04,
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        group relative mb-1.5 p-3.5 rounded-xl cursor-pointer transition-all duration-200
                        border-l-2 ${style.accent}
                        border border-white/[0.04]
                        ${!notification.read
                          ? `${style.unreadBg} ${style.unreadHover} backdrop-blur-sm`
                          : "bg-white/[0.02] hover:bg-white/[0.05]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar — 44px with gradient ring for bump type */}
                        <div className="relative flex-shrink-0">
                          {notification.type === "bump" && !notification.read && (
                            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 opacity-50 blur-[2px]" />
                          )}
                          <div className="relative h-11 w-11 rounded-full overflow-hidden">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className={`text-white text-sm font-bold bg-gradient-to-br ${style.avatarGrad}`}>
                                {getInitialsFromContent(notification.content)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          {/* Type icon badge */}
                          <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 border border-white/10">
                            {style.icon}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!notification.read ? "font-semibold text-white" : "text-slate-300"}`}>
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="h-3 w-3 text-slate-600" />
                            <span className="text-[11px] text-slate-500 tracking-wide">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Right side: unread dot + chevron */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <AnimatePresence>
                            {!notification.read && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="relative"
                              >
                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${style.dotColor} shadow-md shadow-blue-500/30`} />
                                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${style.dotColor} animate-ping opacity-40`} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* ── Footer separator ─────────────────────────────────────────── */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <DialogFooter className="px-4 py-3">
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white transition-all text-xs tracking-wide font-medium"
              >
                Close
              </Button>
            </motion.div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
