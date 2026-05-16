import { useState } from "react";
import FilterDrawer from "@/components/FilterDrawer";
import SettingsModal from "@/components/SettingsModal";
import NotificationsModal from "@/components/NotificationsModal";
import WelcomeModal from "@/components/WelcomeModal";
import SafetyModal from "@/components/SafetyModal";
import ConnectOverlay from "@/components/ConnectOverlay";
import ReceivedBumpsSheet from "@/components/ReceivedBumpsSheet";
import { Button } from "@/components/ui/button";

export default function DebugLayouts() {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showBumps, setShowBumps] = useState(false);

  // Mock data
  const mockOptions = {
    datingPreference: 'any' as const,
    showDating: true,
    showBusiness: true,
    showFriendships: true,
    showMen: true,
    showWomen: true,
    ageRange: [18, 50] as [number, number],
    radius: 10,
    minRating: 1
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    displayName: 'Test User',
    avatar: 'https://i.pravatar.cc/150?u=test'
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">Debug Layouts</h1>
      <p>Click to open each layout to see which one you are looking for.</p>

      <div className="flex flex-col gap-4 w-full max-w-sm mt-8">
        <div className="w-full text-center mb-4">
          <FilterDrawer options={mockOptions} onChange={() => {}} /> 
          <p className="mt-2 text-sm text-slate-400">^ Filter Drawer Trigger</p>
        </div>
        
        <Button onClick={() => setShowSettings(true)}>Open Settings Modal</Button>
        <Button onClick={() => setShowNotifications(true)}>Open Notifications Modal</Button>
        <Button onClick={() => setShowWelcome(true)}>Open Welcome Modal</Button>
        <Button onClick={() => setShowSafety(true)}>Open Safety Modal</Button>
        <Button onClick={() => setShowConnect(true)}>Open Connect Overlay</Button>
        <Button onClick={() => setShowBumps(true)}>Open Received Bumps Sheet</Button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      <SafetyModal isOpen={showSafety} onAccept={() => setShowSafety(false)} isUpdating={false} />
      {showConnect && (
        <ConnectOverlay 
          onSuccess={() => setShowConnect(false)} 
          onCancel={() => setShowConnect(false)} 
          targetUser={mockUser as any}
          currentLocation={{ latitude: 0, longitude: 0 }}
        />
      )}
      <ReceivedBumpsSheet open={showBumps} onOpenChange={setShowBumps} onBumpBack={() => {}} />
    </div>
  );
}
