import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation as useRouteLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import TopToolbar from "@/components/TopToolbar";
import Map from "@/components/Map";
import BottomNavigation from "@/components/BottomNavigation";
import WelcomeModal from "@/components/WelcomeModal";
import SafetyModal from "@/components/SafetyModal";
import { PageTransition } from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";
import { FilterOptions } from "@/components/FilterDrawer";


export default function MapView() {
  const [, setLocation] = useRouteLocation();
  const { user, updateProfile } = useAuth();
  const { currentLocation, updateServerLocation } = useLocation();
  const { toast } = useToast();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [isUpdatingSafety, setIsUpdatingSafety] = useState(false);
  const [hasCheckedModals, setHasCheckedModals] = useState(false);

  // TopToolbar state
  const isActive = user?.isActive ?? true;
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('face2face_filterOptions');
    if (saved) { try { return JSON.parse(saved); } catch (e) { } }
    return { datingPreference: 'any', showDating: true, showBusiness: true, showFriendships: true, showMen: true, showWomen: true, ageRange: [18, 50], radius: 25000, minRating: 1, showGroups: true };
  });

  const handleToggleActive = useCallback(async (active: boolean) => {
    try { await updateProfile?.({ isActive: active }); } catch (e) { }
  }, [updateProfile]);

  const handleFilterChange = useCallback((options: FilterOptions) => {
    setFilterOptions(options);
    localStorage.setItem('face2face_filterOptions', JSON.stringify(options));
  }, []);

  useEffect(() => {
    if (user && !hasCheckedModals) {
      if (!user.profileCompleted && !sessionStorage.getItem('welcomeShown')) {
        setShowWelcome(true);
        sessionStorage.setItem('welcomeShown', 'true');
      } else if (!user.safetyAcknowledged && !sessionStorage.getItem('safetyShown')) {
        setShowSafety(true);
        sessionStorage.setItem('safetyShown', 'true');
      }
      setHasCheckedModals(true);
    }
  }, [user, hasCheckedModals]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    if (user && !user.safetyAcknowledged) {
      setShowSafety(true);
      sessionStorage.setItem('safetyShown', 'true');
    } else if (!user?.profileCompleted) {
      setLocation("/profile");
    }
  };

  const handleAcceptSafety = async () => {
    setIsUpdatingSafety(true);
    try {
      await updateProfile({ safetyAcknowledged: true });
      setShowSafety(false);
      toast({ title: "Safety Guidelines Accepted", description: "Let's set up your profile!" });
      if (!user?.profileCompleted) {
        setLocation("/profile");
      }
    } catch (error) {
      toast({ title: "Update failed", description: "Failed to save safety acknowledgment.", variant: "destructive" });
    } finally {
      setIsUpdatingSafety(false);
    }
  };

  return (
    <PageTransition className={`h-screen w-full map-view ${
      user?.category === 'business' ? 'bg-mesh-business' : 
      user?.category === 'dating' ? 'bg-mesh-dating' : 
      'bg-mesh-friends'
    }`}>
      <TopToolbar
        isActive={isActive}
        onToggleActive={handleToggleActive}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "48px", bottom: "60px" }}>
        <div className="flex-1 relative overflow-hidden">
          <Map />
          

        </div>
      </div>
      <BottomNavigation />
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <SafetyModal isOpen={showSafety} onAccept={handleAcceptSafety} isUpdating={isUpdatingSafety} />
    </PageTransition>
  );
}
