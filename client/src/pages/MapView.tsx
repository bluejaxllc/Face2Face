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
      <div className="fixed left-0 right-0" style={{ top: "48px", bottom: "52px" }}>
        <Map />
        {/* Turf Wars Game Overlay */}
        {showGame && (
          <Suspense fallback={null}>
            <TurfWars />
          </Suspense>
        )}
      </div>
      {/* Turf Wars Toggle FAB */}
      <button
        onClick={() => setShowGame(g => !g)}
        className="fixed z-[9998] flex items-center gap-2 shadow-2xl transition-all duration-300"
        style={{
          bottom: "90px",
          right: "16px",
          padding: showGame ? "8px 16px" : "10px 18px",
          borderRadius: "24px",
          background: showGame
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "13px",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: showGame
            ? "0 4px 20px rgba(239,68,68,0.4)"
            : "0 4px 20px rgba(139,92,246,0.4)",
        }}
      >
        <span style={{ fontSize: "16px" }}>{showGame ? "✕" : "🏴"}</span>
        {showGame ? "Exit Game" : "Turf Wars"}
      </button>
      <BottomNavigation />
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <SafetyModal isOpen={showSafety} onAccept={handleAcceptSafety} isUpdating={isUpdatingSafety} />
    </PageTransition>
  );
}
