import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldBan, Flag, X, Ban, AlertTriangle, UserX, MessageSquareOff, Baby, Bot, HelpCircle, CheckCircle2 } from "lucide-react";

interface BlockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

const REPORT_REASONS = [
  { key: "harassment", label: "Harassment", icon: AlertTriangle },
  { key: "fake_profile", label: "Fake Profile", icon: UserX },
  { key: "inappropriate", label: "Inappropriate Content", icon: MessageSquareOff },
  { key: "spam", label: "Spam", icon: Bot },
  { key: "underage", label: "Underage", icon: Baby },
  { key: "other", label: "Other", icon: HelpCircle },
] as const;

function getCategoryColors(): { accent: string; accentGlow: string; gradientFrom: string; gradientTo: string } {
  try {
    const category = localStorage.getItem("f2f_category") || "friendships";
    switch (category) {
      case "dating":
        return {
          accent: "text-rose-400",
          accentGlow: "rgba(244,63,94,0.25)",
          gradientFrom: "from-rose-500",
          gradientTo: "to-fuchsia-600",
        };
      case "business":
        return {
          accent: "text-blue-400",
          accentGlow: "rgba(59,130,246,0.25)",
          gradientFrom: "from-blue-500",
          gradientTo: "to-indigo-600",
        };
      default:
        return {
          accent: "text-emerald-400",
          accentGlow: "rgba(52,211,153,0.25)",
          gradientFrom: "from-emerald-500",
          gradientTo: "to-teal-600",
        };
    }
  } catch {
    return {
      accent: "text-emerald-400",
      accentGlow: "rgba(52,211,153,0.25)",
      gradientFrom: "from-emerald-500",
      gradientTo: "to-teal-600",
    };
  }
}

export default function BlockReportModal({ isOpen, onClose, userId, userName }: BlockReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const colors = getCategoryColors();

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        showToast(`${userName} has been blocked`, "success");
        setTimeout(onClose, 1500);
      } else {
        showToast(data.message || "Failed to block user", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!selectedReason) return;
    setIsReporting(true);
    try {
      const res = await fetch(`/api/users/${userId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: selectedReason, details: details.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Report submitted. Thank you for keeping our community safe.", "success");
        setSelectedReason(null);
        setDetails("");
        setTimeout(onClose, 2000);
      } else {
        showToast(data.message || "Failed to submit report", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsReporting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedReason(null);
    setDetails("");
    setToast(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={resetAndClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* SVG noise overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <filter id="block-noise">
                <feTurbulence baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#block-noise)" />
            </svg>

            {/* Floating orb decorations */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Header */}
            <div className="relative bg-gradient-to-br from-red-600/20 via-orange-500/10 to-slate-900 p-6 pb-4 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.12),transparent_70%)]" />
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative z-10 flex justify-center mb-3"
              >
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <ShieldBan className="w-7 h-7 text-red-400" />
                </div>
              </motion.div>
              <h2 className="text-xl font-black text-white tracking-tight relative z-10">
                Block & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Report</span>
              </h2>
              <p className="text-slate-400 mt-1 text-xs tracking-wide relative z-10">
                Take action against <span className="text-slate-200 font-medium">{userName}</span>
              </p>
            </div>

            <div className="p-5 space-y-5 relative z-10">
              {/* ── Block Section ── */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
                className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/5 p-2 border border-slate-700/50 shrink-0">
                    <Ban className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">Block User</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      They won't be able to see you on the map, send you bumps, or message you. Existing conversations will be removed.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBlock}
                  disabled={isBlocking}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBlocking ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  {isBlocking ? "Blocking..." : `Block ${userName}`}
                </button>
              </motion.div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              </div>

              {/* ── Report Section ── */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 24 }}
                className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`rounded-lg bg-gradient-to-br ${colors.gradientFrom}/20 to-transparent p-2 border border-slate-700/50 shrink-0`}>
                    <Flag className={`h-4 w-4 ${colors.accent}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">Report User</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Help us keep Face 2 Face safe. Select a reason below.
                    </p>
                  </div>
                </div>

                {/* Reason chips */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {REPORT_REASONS.map((reason, i) => {
                    const isSelected = selectedReason === reason.key;
                    return (
                      <motion.button
                        key={reason.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                        onClick={() => setSelectedReason(isSelected ? null : reason.key)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all
                          ${isSelected
                            ? `border-red-500/60 bg-red-500/15 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.15)]`
                            : "border-slate-700/50 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                          }
                        `}
                      >
                        <reason.icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-red-400" : "text-slate-500"}`} />
                        {reason.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Details textarea */}
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Additional details <span className="text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe what happened..."
                    maxLength={1000}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40 resize-none transition-all"
                  />
                  <p className="text-[10px] text-slate-600 mt-1 text-right">{details.length}/1000</p>
                </div>

                <button
                  onClick={handleReport}
                  disabled={!selectedReason || isReporting}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} hover:brightness-110 text-white text-sm font-bold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  style={{ boxShadow: selectedReason ? `0 8px 20px ${colors.accentGlow}` : undefined }}
                >
                  {isReporting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  {isReporting ? "Submitting..." : "Submit Report"}
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Toast notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-2.5 ${
                  toast.type === "success"
                    ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                    : "bg-red-950/90 border-red-500/30 text-red-300"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${toast.type === "success" ? "text-emerald-400" : "text-red-400"}`} />
                <span className="text-xs font-medium">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
