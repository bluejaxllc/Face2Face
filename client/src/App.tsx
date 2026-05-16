import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Register from "@/pages/Register";
import { useLocation } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SensorPermissionGate from "@/components/SensorPermissionGate";

// Lazy-load heavy route components so Leaflet/framer-motion don't block initial paint
const MapView = lazy(() => import("@/pages/MapView"));

// Lazy-load secondary route components so they don't block initial paint
const Explore = lazy(() => import("@/pages/Explore"));
const Dating = lazy(() => import("@/pages/Dating"));
const Profile = lazy(() => import("@/pages/Profile"));
const Messages = lazy(() => import("@/pages/Messages"));
const DevDiagnostics = lazy(() => import("@/pages/DevDiagnostics"));
const Evangelists = lazy(() => import("@/pages/Evangelists"));
const DebugLayouts = lazy(() => import("@/pages/DebugLayouts"));

// Import the auth context hook but don't use it in App component
import { useAuth } from "./contexts/AuthContext";

// Minimal loading fallback — shows instantly while lazy chunks download
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-slate-950">
    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

// Create a separate AppRouter component that uses the auth context
function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Domain-based routing: if someone visits waitlist.face2face.icu (or localhost waitlist.*), 
  // serve only the Evangelists waitlist page, bypassing normal routing.
  if (window.location.hostname.startsWith('waitlist.')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Evangelists />
      </Suspense>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-950">
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch location={location}>
        <Route path="/">
          <MapView />
        </Route>
        <Route path="/register" component={Register} />
        <Route path="/auth" component={Register} />
        <Route path="/map">
          <MapView />
        </Route>
        <Route path="/explore">
          <ProtectedRoute component={Explore} />
        </Route>
        <Route path="/dating">
          <ProtectedRoute component={Dating} />
        </Route>
        <Route path="/messages">
          <ProtectedRoute component={Messages} />
        </Route>

        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>
        <Route path="/dev">
          <ProtectedRoute component={DevDiagnostics} />
        </Route>
        <Route path="/debug-layouts">
          <DebugLayouts />
        </Route>
        <Route path="/evangelists" component={Evangelists} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoading } = useAuth();

  // Show loading spinner or render the component
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-950">
      </div>
    );
  }

  // Bypassed authentication check for local UI testing
  return <Component />;
}

// Inner component that has access to AuthContext
function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  return (
    <LocationProvider enabled={isAuthenticated}>
      <SensorPermissionGate>
        <div className="app-container">
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
          <Toaster />
        </div>
      </SensorPermissionGate>
    </LocationProvider>
  );
}

// Separate the providers to avoid dependency issues
function AppWithProviders() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function App() {
  // Initialize Capacitor plugins on native platforms
  useEffect(() => {
    const initCapacitor = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Configure status bar
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1e293b' });

          // Hide splash screen after app is ready
          await SplashScreen.hide();

          // Add native platform class for CSS targeting
          document.body.classList.add('capacitor-native');
        } catch (error) {
          console.warn('[App] Capacitor plugin init error:', error);
        }
      }
    };
    initCapacitor();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppWithProviders />
    </QueryClientProvider>
  );
}

export default App;
