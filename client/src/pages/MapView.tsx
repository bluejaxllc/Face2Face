import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import Header from "@/components/Header";
import Map from "@/components/Map";
import BottomNavigation from "@/components/BottomNavigation";
import WelcomeModal from "@/components/WelcomeModal";

export default function MapView() {
  const { user } = useAuth();
  const { currentLocation, updateServerLocation } = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Show welcome modal to new users or if profile is not completed
    if (user && !user.profileCompleted) {
      setShowWelcome(true);
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
  };

  return (
    <div className="min-h-screen w-full flex flex-col map-view">
      <Header />
      <div className="flex-1 relative w-full" style={{marginTop: "40px", marginBottom: "40px", height: "calc(100vh - 80px)"}}>
        <Map />
      </div>
      <BottomNavigation />
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
    </div>
  );
}
