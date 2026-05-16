import { PageTransition } from "@/components/PageTransition";
import TopToolbar from "@/components/TopToolbar";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Flame, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { FilterOptions } from "@/components/FilterDrawer";

export default function Bumps() {
  const { user, updateProfile } = useAuth();
  const isActive = user?.isActive ?? true;
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('face2face_filterOptions');
    if (saved) { try { return JSON.parse(saved); } catch (e) { } }
    return { datingPreference: 'any', showDating: true, showBusiness: true, showFriendships: true, showMen: true, showWomen: true, ageRange: [18, 50], radius: 25000, minRating: 1 };
  });

  const { data: bumps = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/bumps/received"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const handleToggleActive = useCallback(async (active: boolean) => {
    try { await updateProfile({ isActive: active }); } catch (e) { }
  }, [updateProfile]);

  const handleFilterChange = useCallback((options: FilterOptions) => {
    setFilterOptions(options);
    localStorage.setItem('face2face_filterOptions', JSON.stringify(options));
  }, []);

  return (
    <PageTransition className="h-screen w-full page-dark">
      <TopToolbar
        isActive={isActive}
        onToggleActive={handleToggleActive}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        mapStyle={mapStyle}
        onToggleMapStyle={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
      />
      <div className="fixed left-0 right-0 overflow-y-auto px-4" style={{ top: "44px", bottom: "56px" }}>
        <div className="w-full max-w-md mx-auto pt-4">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-orange-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400">Bumps</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center mt-10">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : bumps.length === 0 ? (
            <div className="text-center mt-10 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h2 className="font-bold text-slate-300">No bumps yet</h2>
              <p className="text-sm text-slate-400 mt-1">When someone bumps you, they'll appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-4">
              {bumps.map((bump: any) => (
                <div key={bump.id} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {bump.senderFirstName?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{bump.senderFirstName || "Someone"} bumped you!</p>
                    {bump.message && <p className="text-slate-400 text-xs mt-0.5">{bump.message}</p>}
                  </div>
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
    </PageTransition>
  );
}
