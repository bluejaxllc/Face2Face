import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Map from "@/components/Map";
import BottomNavigation from "@/components/BottomNavigation";
import WelcomeModal from "@/components/WelcomeModal";

export default function MapView() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Show welcome modal to new users or if profile is not completed
    if (user && !user.profileCompleted) {
      setShowWelcome(true);
    }
  }, [user]);
  
  const handleCloseWelcome = () => {
    setShowWelcome(false);
  };

  return (
    <>
      <Header />
      <Map />
      <BottomNavigation />
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
    </>
  );
}
