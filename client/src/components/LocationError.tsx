import { useState } from "react";
import { MapPin, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      resetError();
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
    <Card className="w-full max-w-md mx-auto shadow-2xl border border-slate-700/50 bg-slate-900 text-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-blue-600/20 via-pink-500/10 to-slate-900 pb-6">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-blue-400" />
          </div>
          <span className="font-heading font-black text-white tracking-tight">Location Required</span>
        </CardTitle>
        <CardDescription className="text-slate-300 text-sm mt-2">
          We need your location to connect you with people nearby
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-300 text-sm">Location access required</p>
            <p className="text-xs text-red-300/70 mt-0.5">To find matches near you, we need permission to access your location.</p>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
            <Info className="h-4 w-4 text-blue-400" />
            Enable location access
          </h4>
          <p className="text-xs text-slate-400">
            Select your device type and follow the instructions:
          </p>
        </div>

        <Tabs defaultValue="desktop" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-slate-800 border border-slate-700/50">
            <TabsTrigger value="desktop" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-xs">Desktop Browser</TabsTrigger>
            <TabsTrigger value="mobile" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-xs">Mobile Device</TabsTrigger>
          </TabsList>

          <TabsContent value="desktop">
            <Tabs defaultValue="Chrome" className="w-full mt-2">
              <TabsList className="grid grid-cols-3 w-full bg-slate-800 border border-slate-700/50">
                {browsers.map(browser => (
                  <TabsTrigger key={browser.name} value={browser.name} className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-xs">
                    {browser.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {browsers.map(browser => (
                <TabsContent key={browser.name} value={browser.name} className="mt-3">
                  <ol className="space-y-2 pl-0">
                    {browser.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="flex-shrink-0 bg-blue-500/15 text-blue-400 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm text-slate-300">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="mobile">
            <Tabs defaultValue="iPhone" className="w-full mt-2">
              <TabsList className="grid grid-cols-2 w-full bg-slate-800 border border-slate-700/50">
                {devices.map(device => (
                  <TabsTrigger key={device.name} value={device.name} className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-xs">
                    {device.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {devices.map(device => (
                <TabsContent key={device.name} value={device.name} className="mt-3">
                  <ol className="space-y-2 pl-0">
                    {device.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="flex-shrink-0 bg-blue-500/15 text-blue-400 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm text-slate-300">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex-col gap-3 pt-4 pb-6">
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-blue-500/25 rounded-xl h-12"
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
        <p className="text-xs text-center text-slate-400">
          After enabling location, click the button above to retry
        </p>
      </CardFooter>
    </Card>
  );
}