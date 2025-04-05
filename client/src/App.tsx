import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MapView from "@/pages/MapView";
import Register from "@/pages/Register";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import { useLocation } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { Loader2 } from "lucide-react";

// Import the auth context hook but don't use it in App component
import { useAuth } from "./contexts/AuthContext";

// Create a separate AppRouter component that uses the auth context
function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen full-height">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <MapView /> : <Register />}
      </Route>
      <Route path="/register" component={Register} />
      <Route path="/map">
        <ProtectedRoute component={MapView} />
      </Route>
      <Route path="/explore">
        <ProtectedRoute component={MapView} />
      </Route>
      <Route path="/messages">
        <ProtectedRoute component={Messages} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  
  // Use useEffect to navigate after render
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/register");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading spinner or render the component
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen full-height">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return <Component />;
}

// Separate the providers to avoid dependency issues
function AppWithProviders() {
  return (
    <AuthProvider>
      <LocationProvider>
        <div className="app-container">
          <AppRouter />
          <Toaster />
        </div>
      </LocationProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithProviders />
    </QueryClientProvider>
  );
}

export default App;
