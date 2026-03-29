import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MapView from "@/pages/MapView";
import Explore from "@/pages/Explore";
import Register from "@/pages/Register";

import Profile from "@/pages/Profile";
import { useLocation } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { Loader2 } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Import the auth context hook but don't use it in App component
import { useAuth } from "./contexts/AuthContext";

// Create a separate AppRouter component that uses the auth context
function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-950">
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/">
          {isAuthenticated ? <MapView /> : <Register />}
        </Route>
        <Route path="/register" component={Register} />
        <Route path="/auth" component={Register} />
        <Route path="/map">
          <MapView />
        </Route>
        <Route path="/explore">
          <ProtectedRoute component={Explore} />
        </Route>

        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Use useEffect to navigate after render
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading spinner or render the component
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-950">
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return <Component />;
}

// Inner component that has access to AuthContext
function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();
  return (
    <LocationProvider enabled={isAuthenticated}>
      <div className="app-container">
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
        <Toaster />
      </div>
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
