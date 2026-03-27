import { useState } from "react";
import { MapPin, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "@/contexts/LocationContext";

interface LocationErrorProps {
  onEnableLocation: () => Promise<void>;
}

export default function LocationError({ onEnableLocation }: LocationErrorProps) {
  const [isAttempting, setIsAttempting] = useState(false);
  const { resetError } = useLocation();

  const handleEnableLocation = async () => {
    setIsAttempting(true);
    try {
      // First reset the error state so we can try again
      resetError();
      // Then try to get location
      await onEnableLocation();
    } catch (error) {
      // Error is already handled by the location context
    } finally {
      setIsAttempting(false);
    }
  };

  const browsers = [
    {
      name: "Chrome",
      instructions: [
        "Click the lock icon in the address bar",
        "Select 'Site settings'",
        "Set 'Location' to 'Allow'",
        "Reload the page"
      ]
    },
    {
      name: "Safari",
      instructions: [
        "Go to Safari Preferences",
        "Select 'Websites' tab and then 'Location'",
        "Find this website and set to 'Allow'",
        "Reload the page"
      ]
    },
    {
      name: "Firefox",
      instructions: [
        "Click the shield icon in the address bar",
        "Click 'Site Information' panel",
        "Go to Permissions and enable Location access",
        "Reload the page"
      ]
    }
  ];

  const devices = [
    {
      name: "iPhone",
      instructions: [
        "Open Settings app",
        "Scroll down and tap Safari (or your browser)",
        "Tap 'Location'",
        "Select 'While Using the App' or 'Ask Next Time'",
        "Return to the app and refresh"
      ]
    },
    {
      name: "Android",
      instructions: [
        "Open Settings app",
        "Tap 'Apps' or 'Applications'",
        "Find and tap your browser",
        "Tap 'Permissions'",
        "Tap 'Location'",
        "Select 'Allow only while using the app'",
        "Return to the app and refresh"
      ]
    }
  ];

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="logo-text">
            <span className="bump">Casual</span>
            <span className="casual">Casual</span> and
            <span className="intimate">Intimate</span> connections.
          </span>
        </CardTitle>
        <CardDescription className="text-lg">
          We need your location to connect you with people nearby
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        <Alert variant="destructive" className="border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Location access required</AlertTitle>
          <AlertDescription>
            To find matches near you, we need permission to access your location.
          </AlertDescription>
        </Alert>

        <div className="space-y-1">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Enable location access
          </h4>
          <p className="text-sm text-muted-foreground">
            Select your device type and follow the instructions:
          </p>
        </div>

        <Tabs defaultValue="desktop" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="desktop">Desktop Browser</TabsTrigger>
            <TabsTrigger value="mobile">Mobile Device</TabsTrigger>
          </TabsList>

          <TabsContent value="desktop">
            <Tabs defaultValue="Chrome" className="w-full mt-2">
              <TabsList className="grid grid-cols-3 w-full">
                {browsers.map(browser => (
                  <TabsTrigger key={browser.name} value={browser.name}>
                    {browser.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {browsers.map(browser => (
                <TabsContent key={browser.name} value={browser.name} className="mt-2">
                  <ol className="space-y-2 pl-0">
                    {browser.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full h-6 w-6 flex items-center justify-center mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="mobile">
            <Tabs defaultValue="iPhone" className="w-full mt-2">
              <TabsList className="grid grid-cols-2 w-full">
                {devices.map(device => (
                  <TabsTrigger key={device.name} value={device.name}>
                    {device.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {devices.map(device => (
                <TabsContent key={device.name} value={device.name} className="mt-2">
                  <ol className="space-y-2 pl-0">
                    {device.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full h-6 w-6 flex items-center justify-center mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          onClick={handleEnableLocation}
          disabled={isAttempting}
          size="lg"
        >
          {isAttempting ? (
            <>
              <MapPin className="mr-2 h-5 w-5 animate-pulse" />
              Requesting location...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-5 w-5" />
              Try Again
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          After enabling location, click the button above to retry
        </p>
      </CardFooter>
    </Card>
  );
}