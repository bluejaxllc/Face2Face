import { useState, useEffect, useCallback } from "react";
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ArrowRight, Send, X, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motionService, MotionDirection } from "@/services/motion-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  category: string;
  selfRating: number;
}

interface ConnectInteractionProps {
  open: boolean;
  user: User | null;
  distance: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectInteraction({ open, user, distance, onClose, onSuccess }: ConnectInteractionProps) {
  const { toast } = useToast();
  // Added "direct_message" stage to allow direct messaging without motion
  const [stage, setStage] = useState<"initializing" | "moving" | "message" | "direct_message" | "complete">("initializing");
  const [motionProgress, setMotionProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [motionPermissionError, setMotionPermissionError] = useState(false);
  const [movementDirection, setMovementDirection] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);

  // Initialize motion detection when the dialog opens
  useEffect(() => {
    if (open && user) {
      initializeMotionDetection();
    }

    return () => {
      // Clean up motion detection on unmount
      if (motionService) {
        motionService.stopListening();
      }
    };
  }, [open, user]);

  // Initialize the interaction - determine if we should use motion detection or direct messaging
  const initializeMotionDetection = async () => {
    // If this is a direct message (user has bumped before), skip motion detection
    if (distance && distance <= 3) {
      // Skip motion detection and go straight to message
      setStage("direct_message");
      return;
    }

    if (!window.DeviceMotionEvent) {
      toast({
        title: "Device not supported",
        description: "Your device does not support motion detection.",
        variant: "destructive",
      });
      setMotionPermissionError(true);
      return;
    }

    try {
      await motionService.startListening();
      setStage("moving");

      // Add motion listener
      motionService.addMotionListener(handleMotion);

      // Set random target direction
      const directions = [
        MotionDirection.FORWARD,
        MotionDirection.RIGHT,
        MotionDirection.LEFT,
      ];
      setMovementDirection(directions[Math.floor(Math.random() * directions.length)]);

    } catch (error) {
      console.error("Failed to initialize motion detection:", error);
      setMotionPermissionError(true);
      toast({
        title: "Permission denied",
        description: "Please allow motion sensor access to use this feature.",
        variant: "destructive",
      });
    }
  };

  // Handle motion detection
  const handleMotion = useCallback((direction: MotionDirection, intensity: number) => {
    if (stage !== "moving" || !movementDirection) return;

    console.log(`Motion detected: ${direction}, intensity: ${intensity}`);

    // Check if motion is in the target direction
    if (direction === movementDirection) {
      // Increase progress
      setMotionProgress(prev => {
        const newProgress = Math.min(prev + (intensity / 2), 100);

        // If we hit 100%, trigger success
        if (newProgress >= 100 && prev < 100) {
          vibrate();
          setStage("message");
          motionService.stopListening();
        }

        return newProgress;
      });
    }
  }, [stage, movementDirection]);

  // Vibrate the phone on success — uses native haptics on Capacitor, falls back to web
  const vibrate = async () => {
    setIsVibrating(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // Rich native haptic pattern
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.notification({ type: NotificationType.Success });
      } else if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    } catch (e) {
      console.warn('[Haptics] Vibration failed:', e);
    }
    setTimeout(() => setIsVibrating(false), 500);
  };

  // Send bump request with message
  const sendConnect = async () => {
    if (!user) return;

    try {
      const res = await apiRequest("POST", "/api/bumps", {
        bumpedUserId: user.id,
        status: "initiated",
        message: message.trim() || undefined,
      });

      if (!res.ok) {
        throw new Error("Failed to send bump request");
      }

      toast({
        title: "Connect sent!",
        description: `You've connected with ${user.firstName}!`,
      });

      setStage("complete");
      onSuccess();

      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Failed to send bump:", error);
      toast({
        title: "Connect failed",
        description: "Unable to send bump request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const renderStageContent = () => {
    switch (stage) {
      case "initializing":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Preparing to Connect</DialogTitle>
              <DialogDescription>
                Hold on while we initialize motion detection...
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center my-6">
              <Smartphone className="h-16 w-16 text-secondary animate-pulse" />
            </div>
            {motionPermissionError && (
              <div className="text-center text-red-500 mt-2">
                <p>Motion detection permission denied. Please enable it in your device settings.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => initializeMotionDetection()}
                >
                  Try Again
                </Button>
              </div>
            )}
          </>
        );

      case "moving":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Move Your Phone {getDirectionText(movementDirection)}</DialogTitle>
              <DialogDescription>
                To bump with {user?.firstName}, move your device in the indicated direction.
              </DialogDescription>
            </DialogHeader>

            <div className={`flex flex-col items-center justify-center py-6 ${isVibrating ? 'animate-wiggle' : ''}`}>
              {renderDirectionIcon(movementDirection)}
              <Progress value={motionProgress} className="w-full mt-4" />
              <p className="text-sm text-gray-500 mt-2">
                Progress: {Math.round(motionProgress)}%
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogFooter>
          </>
        );

      case "direct_message":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Send a Message</DialogTitle>
              <DialogDescription>
                Since you're within range of {user?.firstName}, you can send a message directly!
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 bg-secondary">
                  <AvatarFallback>
                    {user ? getInitials(user.firstName, user.lastName) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.category === "casual" ? "Looking to hang out" : "Looking for more"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bump-message">Your message</Label>
                <Textarea
                  id="bump-message"
                  placeholder="Hey, want to meet up?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={sendConnect}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </>
        );

      case "message":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Send a Message with your Connect</DialogTitle>
              <DialogDescription>
                Add a message to your bump request to {user?.firstName}. This helps break the ice!
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 bg-secondary">
                  <AvatarFallback>
                    {user ? getInitials(user.firstName, user.lastName) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.category === "casual" ? "Looking to hang out" : "Looking for more"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bump-message">Your message</Label>
                <Textarea
                  id="bump-message"
                  placeholder="Hey, want to meet up?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStage("moving")}>Back</Button>
              <Button onClick={sendConnect}>
                <Send className="h-4 w-4 mr-2" />
                Send Connect
              </Button>
            </DialogFooter>
          </>
        );

      case "complete":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connect Sent!</DialogTitle>
              <DialogDescription>
                Your bump request has been sent to {user?.firstName}. You'll get a notification when they respond.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center my-8">
              <div className="rounded-full bg-green-100 p-3">
                <div className="rounded-full bg-green-200 p-2">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  // Helper function to get direction text
  const getDirectionText = (direction: string | null): string => {
    switch (direction) {
      case MotionDirection.FORWARD:
        return "Forward";
      case MotionDirection.BACKWARD:
        return "Backward";
      case MotionDirection.LEFT:
        return "Left";
      case MotionDirection.RIGHT:
        return "Right";
      case MotionDirection.UP:
        return "Up";
      case MotionDirection.DOWN:
        return "Down";
      default:
        return "";
    }
  };

  // Helper function to render direction icon
  const renderDirectionIcon = (direction: string | null) => {
    const iconSize = "h-16 w-16 text-primary animate-pulse";

    switch (direction) {
      case MotionDirection.FORWARD:
        return <ArrowRight className={iconSize} />;
      case MotionDirection.BACKWARD:
        // Rotate arrow 180 degrees
        return <ArrowRight className={`${iconSize} transform rotate-180`} />;
      case MotionDirection.LEFT:
        // Rotate arrow 270 degrees
        return <ArrowRight className={`${iconSize} transform -rotate-90`} />;
      case MotionDirection.RIGHT:
        // Rotate arrow 90 degrees
        return <ArrowRight className={`${iconSize} transform rotate-90`} />;
      case MotionDirection.UP:
        // Rotate arrow 270 degrees
        return <ArrowRight className={`${iconSize} transform -rotate-90`} />;
      case MotionDirection.DOWN:
        // Rotate arrow 90 degrees
        return <ArrowRight className={`${iconSize} transform rotate-90`} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {renderStageContent()}
      </DialogContent>
    </Dialog>
  );
}

export default ConnectInteraction;