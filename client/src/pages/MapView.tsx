import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import Header from "@/components/Header";
import Map from "@/components/Map";
import BottomNavigation from "@/components/BottomNavigation";
import WelcomeModal from "@/components/WelcomeModal";
import SafetyModal from "@/components/SafetyModal";
import { PageTransition } from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";

export default function MapView() {
  const { user, updateProfile } = useAuth();
  const { currentLocation, updateServerLocation } = useLocation();
  const { toast } = useToast();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [isUpdatingSafety, setIsUpdatingSafety] = useState(false);

  useEffect(() => {
    // Show welcome modal to new users or if profile is not completed
    if (user && !user.profileCompleted) {
      setShowWelcome(true);
    } else if (user && user.profileCompleted && !user.safetyAcknowledged) {
      // If profile is completed but safety wasn't acknowledged, show safety modal
      setShowSafety(true);
    }
  }, [user]);

  // When we have both a user and a location, update the server
  useEffect(() => {
    if (user && currentLocation) {
      updateServerLocation(currentLocation);

      // Set up interval to update server location while on map page
      const intervalId = setInterval(() => {
        if (currentLocation) {
          updateServerLocation(currentLocation);
        }
      }, 60000); // Update every minute

      return () => clearInterval(intervalId);
    }
  }, [user, currentLocation, updateServerLocation]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // If they close the welcome modal and haven't accepted safety, show it next
    if (user && !user.safetyAcknowledged) {
      setShowSafety(true);
    }
  };

  const handleAcceptSafety = async () => {
    setIsUpdatingSafety(true);
    try {
      await updateProfile({ safetyAcknowledged: true });
      setShowSafety(false);
      toast({ title: "Safety Guidelines Accepted", description: "You are ready to start connecting!" });
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
      </div>
      <BottomNavigation />
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <SafetyModal isOpen={showSafety} onAccept={handleAcceptSafety} isUpdating={isUpdatingSafety} />
    </PageTransition>
  );
}
