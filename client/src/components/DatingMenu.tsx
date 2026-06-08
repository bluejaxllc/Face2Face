import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CalendarPlus,
  Search,
  XCircle,
  HeartHandshake,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Clock,
  User,
  MapPinned,
  Calendar,
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

/* ═══════ Richer placeholder date appointments ═══════ */
interface DateAppointment {
  time: string;
  label: string;
  color: string;
  person: string;
  personAvatar: string;
  profileId?: number;
  location: string;
  venueImage: string;
  notes?: string;
}

function getPlaceholderDates() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dates: Record<string, DateAppointment[]> = {};

  const key = (d: number) => new Date(y, m, Math.min(d, 28)).toISOString().split("T")[0];

  dates[key(8)] = [
    { time: "11:00 AM", label: "Brunch", color: "bg-emerald-500", person: "Sophia M.", personAvatar: "https://i.pravatar.cc/80?img=1", profileId: 201, location: "The Garden Café", venueImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=200&fit=crop", notes: "Outdoor patio reserved" },
  ];
  dates[key(12)] = [
    { time: "2:30 PM", label: "Park Walk", color: "bg-rose-500", person: "Jessica L.", personAvatar: "https://i.pravatar.cc/80?img=5", profileId: 202, location: "Riverside Park", venueImage: "https://images.unsplash.com/photo-1585938389612-a552a28d6914?w=400&h=200&fit=crop", notes: "Meet at the fountain" },
  ];
  dates[key(18)] = [
    { time: "2:00 PM", label: "Coffee", color: "bg-amber-500", person: "Mia R.", personAvatar: "https://i.pravatar.cc/80?img=9", profileId: 203, location: "Blue Bottle Coffee", venueImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop" },
    { time: "9:30 PM", label: "Dinner", color: "bg-violet-500", person: "Olivia K.", personAvatar: "https://i.pravatar.cc/80?img=16", profileId: 204, location: "Nobu Downtown", venueImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop", notes: "Reservation confirmed" },
  ];
  dates[key(24)] = [
    { time: "7:00 PM", label: "Movie Night", color: "bg-sky-500", person: "Emma C.", personAvatar: "https://i.pravatar.cc/80?img=20", profileId: 205, location: "AMC Theater", venueImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=200&fit=crop", notes: "Action film — she picks" },
  ];

  return dates;
}

/* ═══════ Calendar helpers ═══════ */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

/* ═══════ COMPONENT ═══════ */
export default function DatingMenu() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDayFilter, setSearchDayFilter] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Schedule form state
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedPerson, setSchedPerson] = useState("");
  const [schedLocation, setSchedLocation] = useState("");
  const [schedNotes, setSchedNotes] = useState("");

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

  // Get all dates for review/search
  const allDatesFlat = useMemo(() => {
    const result: (DateAppointment & { dateKey: string; dayOfWeek: string })[] = [];
    Object.entries(dates).forEach(([key, appts]) => {
      const d = new Date(key + "T12:00:00");
      const dow = DAY_NAMES[d.getDay()];
      appts.forEach(a => result.push({ ...a, dateKey: key, dayOfWeek: dow }));
    });
    return result.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [dates]);

  // Filtered search results
  const searchResults = useMemo(() => {
    return allDatesFlat.filter(d => {
      if (searchDayFilter && !d.dayOfWeek.toLowerCase().includes(searchDayFilter.toLowerCase())) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return d.label.toLowerCase().includes(q) || d.person.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || (d.notes?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [allDatesFlat, searchDayFilter, searchQuery]);

  const handleMenuClick = (id: string) => {
    if (id === "datemap") {
      // Navigate to map with date filter
      navigate("/map");
      return;
    }
    setExpandedItem(expandedItem === id ? null : id);
  };

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

          {/* ═══════ Selected day detail panel ═══════ */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-800/50"
              >
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {DAY_NAMES[new Date(year, month, selectedDay).getDay()]}, {MONTHS[month]} {selectedDay}
                  </p>
                  {getDayDates(selectedDay).length > 0 ? (
                    <div className="space-y-3">
                      {getDayDates(selectedDay).map((d, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden" style={{
                          background: "rgba(30, 41, 59, 0.6)",
                          border: "1px solid rgba(51, 65, 85, 0.4)",
                        }}>
                          {/* Venue image */}
                          <div className="relative h-[100px] overflow-hidden">
                            <img
                              src={d.venueImage}
                              alt={d.location}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                              <div>
                                <span className="text-sm font-bold text-white drop-shadow-lg">{d.label}</span>
                                <p className="text-[10px] text-slate-300/90 drop-shadow">{d.location}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${d.color}`}>{d.time}</span>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="p-3 space-y-2.5">
                            {/* Person row — clickable */}
                            <button
                              onClick={() => d.profileId && navigate(`/profile/${d.profileId}`)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
                            >
                              <img
                                src={d.personAvatar}
                                alt={d.person}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-500/30"
                              />
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold text-white truncate">{d.person}</p>
                                <p className="text-[9px] text-rose-400/80">View Profile →</p>
                              </div>
                            </button>

                            {/* Venue row — clickable */}
                            <button
                              onClick={() => navigate("/map")}
                              className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                                <MapPinned className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold text-white truncate">{d.location}</p>
                                <p className="text-[9px] text-sky-400/80">View on Map →</p>
                              </div>
                            </button>

                            {/* Notes */}
                            {d.notes && (
                              <p className="text-[10px] text-slate-500 italic px-1">{d.notes}</p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-1">
                              <button className="flex-1 py-2 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500/25 transition-colors">
                                Message
                              </button>
                              <button className="flex-1 py-2 rounded-lg bg-sky-500/15 text-sky-400 text-[10px] font-bold uppercase tracking-wider hover:bg-sky-500/25 transition-colors">
                                Directions
                              </button>
                              <button className="flex-1 py-2 rounded-lg bg-slate-700/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700/60 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500">No dates scheduled</p>
                      <button
                        onClick={() => { setExpandedItem("schedule"); setSelectedDay(null); }}
                        className="mt-2 text-[10px] font-bold text-rose-400 uppercase tracking-wider hover:text-rose-300 transition-colors"
                      >
                        + Schedule a Date
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════ Menu Items ═══════ */}
        <div className="flex flex-col gap-2 px-4">

          {/* Date Map */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/map")}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
            style={{
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(51, 65, 85, 0.3)",
            }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800/60">
              <MapPin className="w-4.5 h-4.5 text-slate-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold tracking-wide text-slate-200">Date Map</p>
              <p className="text-[10px] text-slate-500">View dates on the map</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </motion.button>

          {/* Schedule Dates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMenuClick("schedule")}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
              style={{
                background: expandedItem === "schedule" ? "rgba(244, 63, 94, 0.06)" : "rgba(15, 23, 42, 0.5)",
                border: `1px solid ${expandedItem === "schedule" ? "rgba(244, 63, 94, 0.2)" : "rgba(51, 65, 85, 0.3)"}`,
              }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${expandedItem === "schedule" ? "bg-rose-500/20" : "bg-slate-800/60"}`}>
                <CalendarPlus className={`w-4.5 h-4.5 ${expandedItem === "schedule" ? "text-rose-400" : "text-slate-400"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-semibold tracking-wide ${expandedItem === "schedule" ? "text-rose-300" : "text-slate-200"}`}>Schedule Dates</p>
                <p className="text-[10px] text-slate-500">Plan a new date</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedItem === "schedule" ? "rotate-90" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {expandedItem === "schedule" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1 space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-transparent w-full outline-none text-white text-xs font-medium" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-transparent w-full outline-none text-white text-xs font-medium" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                      <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input type="text" placeholder="Who's the date with?" value={schedPerson} onChange={e => setSchedPerson(e.target.value)} className="bg-transparent w-full outline-none text-white placeholder:text-slate-600 text-xs font-medium" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                      <MapPinned className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input type="text" placeholder="Location (e.g. Blue Bottle Coffee)" value={schedLocation} onChange={e => setSchedLocation(e.target.value)} className="bg-transparent w-full outline-none text-white placeholder:text-slate-600 text-xs font-medium" />
                    </div>
                    <input type="text" placeholder="Notes (optional)" value={schedNotes} onChange={e => setSchedNotes(e.target.value)} className="w-full rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5 outline-none text-white placeholder:text-slate-600 text-xs font-medium" />
                    <button className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-colors">
                      Schedule Date
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Search Dates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMenuClick("search")}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
              style={{
                background: expandedItem === "search" ? "rgba(244, 63, 94, 0.06)" : "rgba(15, 23, 42, 0.5)",
                border: `1px solid ${expandedItem === "search" ? "rgba(244, 63, 94, 0.2)" : "rgba(51, 65, 85, 0.3)"}`,
              }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${expandedItem === "search" ? "bg-rose-500/20" : "bg-slate-800/60"}`}>
                <Search className={`w-4.5 h-4.5 ${expandedItem === "search" ? "text-rose-400" : "text-slate-400"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-semibold tracking-wide ${expandedItem === "search" ? "text-rose-300" : "text-slate-200"}`}>Search Dates</p>
                <p className="text-[10px] text-slate-500">By day of week or keyword</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedItem === "search" ? "rotate-90" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {expandedItem === "search" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1 space-y-2">
                    {/* Day of week filter */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Date (e.g. June 12, Friday)"
                        value={searchDayFilter}
                        onChange={(e) => setSearchDayFilter(e.target.value)}
                        className="bg-transparent w-full outline-none text-white placeholder:text-slate-600 text-xs font-medium"
                      />
                    </div>
                    {/* Keyword search */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                      <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Keyword (e.g. Coffee, Dinner)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent w-full outline-none text-white placeholder:text-slate-600 text-xs font-medium"
                      />
                    </div>
                    {/* Search results */}
                    {searchResults.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{searchResults.length} result{searchResults.length > 1 ? "s" : ""}</p>
                        {searchResults.map((d, idx) => (
                          <div key={idx} className="rounded-xl p-3" style={{
                            background: "rgba(30, 41, 59, 0.6)",
                            border: "1px solid rgba(51, 65, 85, 0.4)",
                          }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white">{d.label}</span>
                              <span className="text-[10px] text-rose-400 font-semibold">{d.dayOfWeek}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span>{d.time}</span>
                              <span>• {d.person}</span>
                              <span>• {d.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (searchDayFilter || searchQuery) ? (
                      <p className="text-xs text-slate-500 text-center py-3">No dates found</p>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Review / Cancel Dates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMenuClick("review")}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
              style={{
                background: expandedItem === "review" ? "rgba(244, 63, 94, 0.06)" : "rgba(15, 23, 42, 0.5)",
                border: `1px solid ${expandedItem === "review" ? "rgba(244, 63, 94, 0.2)" : "rgba(51, 65, 85, 0.3)"}`,
              }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${expandedItem === "review" ? "bg-rose-500/20" : "bg-slate-800/60"}`}>
                <XCircle className={`w-4.5 h-4.5 ${expandedItem === "review" ? "text-rose-400" : "text-slate-400"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-semibold tracking-wide ${expandedItem === "review" ? "text-rose-300" : "text-slate-200"}`}>Review / Cancel Dates</p>
                <p className="text-[10px] text-slate-500">Manage your upcoming dates</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedItem === "review" ? "rotate-90" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {expandedItem === "review" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1 space-y-2">
                    {allDatesFlat.length > 0 ? allDatesFlat.map((d, idx) => (
                      <div key={idx} className="rounded-xl p-3 flex items-center gap-3" style={{
                        background: "rgba(30, 41, 59, 0.6)",
                        border: "1px solid rgba(51, 65, 85, 0.4)",
                      }}>
                        <div className={`w-2.5 h-2.5 rounded-full ${d.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{d.label} — {d.person}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{d.dayOfWeek} • {d.time} • {d.location}</p>
                        </div>
                        <button className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider hover:bg-red-500/30 transition-colors flex-shrink-0">
                          Cancel
                        </button>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-500 text-center py-3">No upcoming dates</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dating Suggestions / Matchmaking */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMenuClick("suggestions")}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
            style={{
              background: expandedItem === "suggestions" ? "rgba(244, 63, 94, 0.06)" : "rgba(15, 23, 42, 0.5)",
              border: `1px solid ${expandedItem === "suggestions" ? "rgba(244, 63, 94, 0.2)" : "rgba(51, 65, 85, 0.3)"}`,
            }}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${expandedItem === "suggestions" ? "bg-rose-500/20" : "bg-slate-800/60"}`}>
              <HeartHandshake className={`w-4.5 h-4.5 ${expandedItem === "suggestions" ? "text-rose-400" : "text-slate-400"}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-semibold tracking-wide ${expandedItem === "suggestions" ? "text-rose-300" : "text-slate-200"}`}>Dating Suggestions / Matchmaking</p>
              <p className="text-[10px] text-slate-500">Set up friends & get matched</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedItem === "suggestions" ? "rotate-90" : ""}`} />
          </motion.button>

          {/* Dating Tips / Support */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMenuClick("tips")}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-800/40"
            style={{
              background: expandedItem === "tips" ? "rgba(244, 63, 94, 0.06)" : "rgba(15, 23, 42, 0.5)",
              border: `1px solid ${expandedItem === "tips" ? "rgba(244, 63, 94, 0.2)" : "rgba(51, 65, 85, 0.3)"}`,
            }}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${expandedItem === "tips" ? "bg-rose-500/20" : "bg-slate-800/60"}`}>
              <HelpCircle className={`w-4.5 h-4.5 ${expandedItem === "tips" ? "text-rose-400" : "text-slate-400"}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-semibold tracking-wide ${expandedItem === "tips" ? "text-rose-300" : "text-slate-200"}`}>Dating Tips / Support</p>
              <p className="text-[10px] text-slate-500">Advice and help</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedItem === "tips" ? "rotate-90" : ""}`} />
          </motion.button>

        </div>
      </div>
    </div>
  );
}
