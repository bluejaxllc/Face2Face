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

// Import the auth context hook but don't use it in App component
import { useAuth } from "./contexts/AuthContext";

// Create a separate AppRouter component that uses the auth context
function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <Switch>
      <Route path="/" component={() => (
        isAuthenticated ? <MapView /> : <Register />
      )} />
      <Route path="/register" component={Register} />
      <Route path="/map" component={() => <ProtectedRoute component={MapView} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  if (!isAuthenticated) {
    navigate("/register");
    return null;
  }

  return <Component />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <div className="h-screen flex flex-col bg-white">
            <AppRouter />
            <Toaster />
          </div>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
