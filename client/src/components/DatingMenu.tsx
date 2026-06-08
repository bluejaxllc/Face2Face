import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CalendarPlus,
  Search,
  XCircle,
  Sparkles,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";

/* ═══════ Romantic quotes ═══════ */
const romanticQuotes = [
  "Love is composed of a single soul inhabiting two bodies.",
  "The best thing to hold onto in life is each other.",
  "You know you're in love when you can't fall asleep.",
  "Every love story is beautiful, but ours is my favorite.",
  "In all the world, there is no heart for me like yours.",
  "Love recognizes no barriers.",
  "Two souls with but a single thought.",
  "Wherever you go, go with all your heart.",
  "Love is the whole thing. We are only pieces.",
  "The heart wants what it wants.",
  "To love is to be vulnerable.",
  "Where there is love there is life.",
];

/* ═══════ Placeholder date appointments ═══════ */
const placeholderDates: Record<string, { time: string; label: string; color: string }[]> = {
  // keyed by "YYYY-MM-DD"
};

// Generate some placeholder dates for the current month
function getPlaceholderDates() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dates: Record<string, { time: string; label: string; color: string }[]> = {};
  
  // Add a few sample dates
  const day1 = new Date(y, m, Math.min(12, 28));
  const day2 = new Date(y, m, Math.min(18, 28));
  const day3 = new Date(y, m, Math.min(24, 28));
  const day4 = new Date(y, m, Math.min(8, 28));
  
  const key1 = day1.toISOString().split("T")[0];
  const key2 = day2.toISOString().split("T")[0];
  const key3 = day3.toISOString().split("T")[0];
  const key4 = day4.toISOString().split("T")[0];
  
  dates[key1] = [{ time: "2:30 PM", label: "Park Walk", color: "bg-rose-500" }];
  dates[key2] = [
    { time: "2:00 PM", label: "Coffee", color: "bg-amber-500" },
    { time: "9:30 PM", label: "Dinner", color: "bg-violet-500" },
  ];
  dates[key3] = [{ time: "7:00 PM", label: "Movie Night", color: "bg-sky-500" }];
  dates[key4] = [{ time: "11:00 AM", label: "Brunch", color: "bg-emerald-500" }];
  
  return dates;
}

/* ═══════ Calendar helpers ═══════ */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

/* ═══════ Menu Items ═══════ */
const menuItems = [
  { id: "datemap", label: "Date Map", icon: MapPin, description: "View dates on the map" },
  { id: "schedule", label: "Schedule Dates", icon: CalendarPlus, description: "Plan a new date" },
  { id: "search", label: "Search Dates", icon: Search, description: "Find available dates", hasSearch: true },
  { id: "review", label: "Review / Cancel Dates", icon: XCircle, description: "Manage your upcoming dates" },
  { id: "suggestions", label: "Dating Suggestions / Matchmaking", icon: Sparkles, description: "AI-powered recommendations" },
  { id: "tips", label: "Dating Tips / Support", icon: HelpCircle, description: "Advice and help" },
];

/* ═══════ COMPONENT ═══════ */
export default function DatingMenu() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const dates = useMemo(() => getPlaceholderDates(), []);

  const quote = useMemo(() => {
    return romanticQuotes[(month + year) % romanticQuotes.length];
  }, [month, year]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getDateKey = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split("T")[0];
  };

  const getDayDates = (day: number) => dates[getDateKey(day)] || [];

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-slate-950/95 backdrop-blur-xl">
      <div className="flex flex-col min-h-full pb-8">
        {/* ═══════ Header ═══════ */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-center">
          <Heart className="w-5 h-5 text-rose-400 mr-2" fill="currentColor" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dates</h1>
        </div>

        {/* ═══════ Calendar Card ═══════ */}
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(244, 63, 94, 0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(244,63,94,0.08)",
        }}>
          {/* Month header + quote */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </motion.button>
              <div className="text-center">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  {MONTHS[month]} {year}
                </h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>
            {/* Romantic quote */}
            <p className="text-[10px] text-rose-400/70 italic text-center leading-tight px-4 mb-2">
              "{quote}"
            </p>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {calendarCells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              
              const dayDates = getDayDates(day);
              const hasDates = dayDates.length > 0;
              const isTodayDay = isToday(day);
              const isSelected = selectedDay === day;
              
              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative flex flex-col items-center py-1 rounded-lg transition-all ${
                    isSelected
                      ? "bg-rose-500/20 ring-1 ring-rose-500/40"
                      : isTodayDay
                        ? "bg-slate-800/50"
                        : "hover:bg-slate-800/30"
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${
                    isSelected ? "text-rose-400" : isTodayDay ? "text-white font-bold" : "text-slate-400"
                  }`}>
                    {day}
                  </span>
                  {/* Date appointment dots */}
                  {hasDates && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayDates.slice(0, 3).map((d, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selected day details */}
          <AnimatePresence>
            {selectedDay && getDayDates(selectedDay).length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-800/50"
              >
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {MONTHS[month]} {selectedDay} — Dates
                  </p>
                  {getDayDates(selectedDay).map((d, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-1.5">
                      <div className={`w-2 h-2 rounded-full ${d.color} flex-shrink-0`} />
                      <span className="text-xs font-bold text-white">{d.time}</span>
                      <span className="text-xs text-slate-400">{d.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════ Menu Items ═══════ */}
        <div className="flex flex-col gap-2 px-4">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isExpanded = expandedItem === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
                  style={{
                    background: isExpanded ? "rgba(244, 63, 94, 0.06)" : "rgba(15, 23, 42, 0.5)",
                    border: `1px solid ${isExpanded ? "rgba(244, 63, 94, 0.2)" : "rgba(51, 65, 85, 0.3)"}`,
                  }}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isExpanded ? "bg-rose-500/20" : "bg-slate-800/60"
                  }`}>
                    <Icon className={`w-4.5 h-4.5 ${isExpanded ? "text-rose-400" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold tracking-wide ${isExpanded ? "text-rose-300" : "text-slate-200"}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </motion.button>

                {/* Search input for Search Dates */}
                <AnimatePresence>
                  {isExpanded && item.hasSearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pt-2 pb-1">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50">
                          <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search dates by keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 text-xs font-medium"
                            autoFocus
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
