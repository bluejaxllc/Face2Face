import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Map, Gamepad2, MessageSquare, Users, User, Briefcase, Handshake, MapPin, Dice5, Swords, Mail, MessagesSquare, Contact, Building2, UserCheck, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CalendarHeart from "@/components/icons/CalendarHeart";
import { triggerHaptic, triggerHapticPattern } from "@/services/haptics-service";
import { useEffect, useRef, useState } from "react";

export type CategoryKey = "dating" | "friends" | "business";

export const categoryConfig: Record<CategoryKey, { icon: any; label: string; color: string }> = {
  dating:   { icon: CalendarHeart, label: "DATING",   color: "text-rose-400" },
  friends:  { icon: Handshake, label: "FRIENDS",  color: "text-emerald-400" },
  business: { icon: Briefcase, label: "BUSINESS", color: "text-blue-400" },
};

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const calculateAge = (dob: string | Date | number) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Category selector state
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(() => {
    return (localStorage.getItem("f2f_activeCategory") as CategoryKey) || "dating";
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Fetch users with messages/bumps to get accurate unread counts for the Messages tab
  const { data: connectedUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/bumps/users"],
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Calculate total unread messages + pending bumps
  const notifCount = connectedUsers.reduce((total: number, u: any) => {
    let add = 0;
    if (u.unreadCount) add += u.unreadCount;
    if (u.hasPendingReceivedBump) add += 1;
    return total + add;
  }, 0);

  const previousNotifCount = useRef(notifCount);

  useEffect(() => {
    if (notifCount > previousNotifCount.current) {
      triggerHaptic(100);
      setTimeout(() => triggerHapticPattern([50, 100, 50]), 200);
    }
    previousNotifCount.current = notifCount;
  }, [notifCount]);

  const navigateTo = (path: string) => () => {
    navigate(path);
  };

  const handleCategoryTap = () => {
    setShowCategoryPicker(!showCategoryPicker);
  };

  const handleCategorySelect = async (cat: CategoryKey) => {
    // Check age for dating category
    if (cat === "dating" && user?.dateOfBirth) {
      const age = calculateAge(user.dateOfBirth);
      if (age < 18) {
        toast({
          title: "Access Denied",
          description: "You must be 18 or older to use Dating mode.",
          variant: "destructive",
        });
        setShowCategoryPicker(false);
        return;
      }
    }

    // Provide instant UI feedback
    setActiveCategory(cat);
    localStorage.setItem("f2f_activeCategory", cat);
    setShowCategoryPicker(false);
    
    // Dispatch a custom event so the Dating page and other components can pick it up
    window.dispatchEvent(new CustomEvent("f2f:categoryChange", { detail: cat }));

    // Sync with database in the background if authenticated
    if (user && updateProfile) {
      try {
        // Normalize 'friends' to 'friendships' for database consistency
        const dbCategory = cat === 'friends' ? 'friendships' : cat;
        await updateProfile({ category: dbCategory });
      } catch (error) {
        console.error("Failed to sync category to profile:", error);
      }
    }
  };

  // Close picker when navigating away from dating
  useEffect(() => {
    if (location !== "/dating") {
      setShowCategoryPicker(false);
    }
  }, [location]);

  const catCfg = categoryConfig[activeCategory];
  const isCategoryActive = location === "/dating";

  // Category-specific nav items
  const navItemsByCategory: Record<CategoryKey, { path: string; icon: any; label: string; badge?: number }[]> = {
    dating: [
      { path: "/map", icon: MapPin, label: "MAP" },
      { path: "/games", icon: Gamepad2, label: "GAMES" },
      { path: "/messages", icon: MessageSquare, label: "BUMP/CONT" , badge: notifCount },
      { path: "/explore", icon: Users, label: "GROUP/LIST" },
      { path: "/profile", icon: User, label: "PROFILE" },
    ],
    friends: [
      { path: "/map", icon: MapPin, label: "NEARBY" },
      { path: "/games", icon: Dice5, label: "HANGOUT" },
      { path: "/messages", icon: MessagesSquare, label: "CONTACTS", badge: notifCount },
      { path: "/explore", icon: Contact, label: "CIRCLES" },
      { path: "/profile", icon: UserCheck, label: "MY INFO" },
    ],
    business: [
      { path: "/map", icon: Building2, label: "NETWORK" },
      { path: "/games", icon: Swords, label: "COMPETE" },
      { path: "/messages", icon: Mail, label: "CONTACTS", badge: notifCount },
      { path: "/explore", icon: Briefcase, label: "DIRECTORY" },
      { path: "/profile", icon: User, label: "CARD" },
    ],
  };

  const navItems = navItemsByCategory[activeCategory];

  return (
    <>
      {/* Category picker backdrop */}
      {showCategoryPicker && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setShowCategoryPicker(false)}
        />
      )}

      {/* Bottom navigation bar */}
      <div className="fixed left-0 right-0 z-[9999]" style={{ bottom: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)", transform: "translateZ(0)" }}>
        <nav className="bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 w-full" style={{ height: "60px" }}>
          <div className="flex justify-around items-center h-full">
            {/* Category button (Dating/Friends/Business) */}
            <div
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 flex-1 relative"
              style={{ padding: "6px 0" }}
            >
              {/* SLIDING DRAWER AND PULL TAB ASSEMBLY */}
              <div 
                className={`absolute bottom-[100%] left-1 right-1 flex flex-col justify-start overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  showCategoryPicker ? "max-h-[300px] opacity-100" : "max-h-[14px]"
                }`}
              >
                {/* Pull tab indicator */}
                <div 
                  className="h-[14px] bg-slate-900/95 backdrop-blur-md border-t border-l border-r border-slate-700/50 rounded-t-xl shadow-sm z-10 flex flex-shrink-0 items-center justify-center"
                  onClick={handleCategoryTap}
                >
                  <ChevronUp className={`w-3 h-3 -mt-0.5 transition-transform duration-300 ${showCategoryPicker ? 'rotate-180' : ''} ${isCategoryActive ? catCfg.color : "text-slate-500"}`} strokeWidth={4} />
                </div>

                {/* The Category Options */}
                <div className="flex flex-col gap-2 bg-slate-800/95 backdrop-blur-md border-l border-r border-t border-slate-600/50 shadow-2xl p-2 rounded-b-none border-b-0 pb-3 mb-[-4px]">
                  {(Object.entries(categoryConfig) as [CategoryKey, typeof catCfg][]).map(([key, cfg]) => {
                    const isSelected = activeCategory === key;
                    const IconComp = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={(e) => { e.stopPropagation(); handleCategorySelect(key); }}
                        className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 transition-all duration-200 ${
                          isSelected
                            ? "bg-white/10 ring-1 ring-white/20"
                            : "hover:bg-white/5"
                        }`}
                        style={{ minWidth: "60px" }}
                      >
                        <IconComp
                          className={`transition-colors duration-200 ${isSelected ? cfg.color : "text-slate-400"}`}
                          style={{ width: "20px", height: "20px" }}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                        <span
                          className={`font-semibold uppercase tracking-wide transition-colors duration-200 ${
                            isSelected ? cfg.color : "text-slate-400"
                          }`}
                          style={{ fontSize: "8px", marginTop: "4px" }}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex justify-center items-center mt-0.5" onClick={() => navigate("/dating")}>
                <catCfg.icon
                  className={`transition-colors duration-200 ${isCategoryActive ? catCfg.color : "text-slate-500"}`}
                  style={{ width: "22px", height: "22px" }}
                  strokeWidth={isCategoryActive ? 2.5 : 1.5}
                />
              </div>
              <span
                onClick={handleCategoryTap}
                className={`font-semibold uppercase tracking-wide flex items-center justify-center transition-colors duration-200 ${
                  isCategoryActive ? catCfg.color : "text-slate-500"
                }`}
                style={{ fontSize: "8px", marginTop: "4px", whiteSpace: "nowrap" }}
              >
                {catCfg.label}
              </span>
            </div>

            {/* Standard nav items */}
            {navItems.map(({ path, icon: Icon, label, badge }) => {
              const isActive = location === path || (path === "/map" && location === "/");
              return (
                <div
                  key={path}
                  onClick={navigateTo(path)}
                  className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 flex-1"
                  style={{ padding: "6px 0" }}
                >
                  <div className="relative">
                    <Icon
                      className={`transition-colors duration-200 ${isActive ? catCfg.color : "text-slate-500"}`}
                      style={{ width: "22px", height: "22px" }}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    {(badge !== undefined && badge > 0) && (
                      <span className="absolute -top-1 -right-2 bg-pink-500 text-white font-bold rounded-full flex items-center justify-center" style={{ fontSize: "8px", height: "14px", width: "14px" }}>
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-semibold uppercase tracking-wide transition-colors duration-200 ${isActive ? catCfg.color : "text-slate-500"}`}
                    style={{ fontSize: "8px", marginTop: "4px", whiteSpace: "nowrap" }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
