import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation as useRouteLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import Header from "@/components/Header";
import Map from "@/components/Map";
import BottomNavigation from "@/components/BottomNavigation";
import WelcomeModal from "@/components/WelcomeModal";
import SafetyModal from "@/components/SafetyModal";
import { PageTransition } from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";

const TurfWars = lazy(() => import("@/components/TurfWars"));

export default function MapView() {
  const [, setLocation] = useRouteLocation();
  const { user, updateProfile } = useAuth();
  const { currentLocation, updateServerLocation } = useLocation();
  const { toast } = useToast();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [isUpdatingSafety, setIsUpdatingSafety] = useState(false);
  const [hasCheckedModals, setHasCheckedModals] = useState(false);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    // Only check modal conditions once per component mount after user is loaded
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

  // Note: LocationService implicitly updates the server location internally
  // when a location change is detected, using debounced syncing.

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // If they close the welcome modal and haven't accepted safety, show it next
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
    <PageTransition className="h-screen w-full page-dark map-view">
      <Header />
      <div className="fixed left-0 right-0 flex flex-col" style={{ top: "40px", bottom: "64px" }}>
        <div className="flex-1 relative overflow-hidden">
          <Map />
          
          {/* Turf Wars Game Overlay */}
          {showGame && (
            <Suspense fallback={null}>
              <div className="absolute inset-0 z-[500] pointer-events-none">
                <div className="pointer-events-auto w-full h-full">
                  <TurfWars />
                </div>
              </div>
            </Suspense>
          )}

          {/* Turf Wars FAB */}
          <button
            onClick={() => setShowGame(!showGame)}
            className={`absolute bottom-6 right-4 z-[600] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 transform active:scale-90 border border-white/20 hover:scale-105 group overflow-hidden ${
              showGame 
                ? "bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 shadow-rose-500/30 rotate-12" 
                : "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 shadow-indigo-500/30"
            }`}
            style={{ 
              boxShadow: showGame ? "0 15px 35px -5px rgba(244, 63, 94, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)" : "0 15px 35px -5px rgba(99, 102, 241, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)"
            }}
            aria-label={showGame ? "Close Turf Wars" : "Play Turf Wars"}
          >
            <span className={`text-2xl transition-transform duration-300 ${showGame ? "scale-110" : "group-hover:scale-125"}`}>
              {showGame ? "✕" : "🏴"}
            </span>
          </button>
        </div>
      </div>
      <BottomNavigation />
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <SafetyModal isOpen={showSafety} onAccept={handleAcceptSafety} isUpdating={isUpdatingSafety} />
    </PageTransition>
  );
}
