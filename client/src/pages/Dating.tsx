import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import TopToolbar from "@/components/TopToolbar";
import Map from "@/components/Map";
import BottomNavigation from "@/components/BottomNavigation";
import { PageTransition } from "@/components/PageTransition";
import { FilterOptions } from "@/components/FilterDrawer";

type CategoryKey = "dating" | "friends" | "business";

const categoryColors: Record<CategoryKey, string> = {
  dating: "text-rose-400",
  friends: "text-emerald-400",
  business: "text-blue-400",
};

const categoryBgs: Record<CategoryKey, string> = {
  dating: "bg-rose-500 hover:bg-rose-600",
  friends: "bg-emerald-500 hover:bg-emerald-600",
  business: "bg-blue-500 hover:bg-blue-600",
};

export default function Dating() {
  const { user, updateProfile } = useAuth();
  const { currentLocation } = useLocationContext();

  // Listen for category changes from the bottom nav
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(() => {
    return (localStorage.getItem("f2f_activeCategory") as CategoryKey) || "dating";
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const cat = (e as CustomEvent).detail as CategoryKey;
      setActiveCategory(cat);
    };
    window.addEventListener("f2f:categoryChange", handler);
    return () => window.removeEventListener("f2f:categoryChange", handler);
  }, []);

  // TopToolbar state
  const isActive = user?.isActive ?? true;
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('face2face_filterOptions');
    if (saved) { try { return JSON.parse(saved); } catch (e) { } }
    return {
      datingPreference: 'any',
      showDating: true,
      showBusiness: true,
      showFriendships: true,
      showMen: true,
      showWomen: true,
      ageRange: [18, 50],
      radius: 25000,
      minRating: 1
    };
  });

  // Override filter options based on active category
  const categoryFilterOptions: FilterOptions = {
    ...filterOptions,
    showDating: activeCategory === "dating",
    showBusiness: activeCategory === "business",
    showFriendships: activeCategory === "friends",
  };

  const handleToggleActive = useCallback(async (active: boolean) => {
    try { await updateProfile?.({ isActive: active }); } catch (e) { }
  }, [updateProfile]);

  const handleFilterChange = useCallback((options: FilterOptions) => {
    setFilterOptions(options);
    localStorage.setItem('face2face_filterOptions', JSON.stringify(options));
  }, []);

  // Map style toggle
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const handleToggleMapStyle = useCallback(() => {
    setMapStyle(prev => {
      const next = prev === 'street' ? 'satellite' : 'street';
      window.dispatchEvent(new CustomEvent('f2f:mapStyleChange', { detail: next }));
      return next;
    });
  }, []);

  return (
    <PageTransition className="h-screen w-full page-dark">
      <TopToolbar
        isActive={isActive}
        onToggleActive={handleToggleActive}
        filterOptions={categoryFilterOptions}
        onFilterChange={handleFilterChange}
        accentColor={categoryColors[activeCategory]}
        accentBg={categoryBgs[activeCategory]}
        category={activeCategory}
        mapStyle={mapStyle}
        onToggleMapStyle={handleToggleMapStyle}
      />
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "48px", bottom: "60px" }}>
        <div className="flex-1 relative overflow-hidden">
          <Map />
        </div>
      </div>
      <BottomNavigation />
    </PageTransition>
  );
}
