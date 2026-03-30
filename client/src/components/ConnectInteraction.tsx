import { useState, useEffect, useCallback } from "react";
import { triggerHaptic, triggerBumpHaptic, triggerLightTap } from "@/services/haptics-service";
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
import { ArrowRight, Send, X, Smartphone, Check, Zap } from "lucide-react";
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
  const [stage, setStage] = useState<"initializing" | "moving" | "message" | "direct_message" | "complete">("initializing");
  const [motionProgress, setMotionProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [motionPermissionError, setMotionPermissionError] = useState(false);
  const [movementDirection, setMovementDirection] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);

  useEffect(() => {
    if (open && user) {
      initializeMotionDetection();
    }

    return () => {
      if (motionService) {
        motionService.stopListening();
      }
    };
  }, [open, user]);

  const initializeMotionDetection = async () => {
    if (distance && distance <= 3) {
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
      motionService.addMotionListener(handleMotion);

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

  const handleMotion = useCallback((direction: MotionDirection, intensity: number) => {
    if (stage !== "moving" || !movementDirection) return;

    if (direction === movementDirection) {
      setMotionProgress(prev => {
        const newProgress = Math.min(prev + (intensity / 2), 100);

        if (newProgress >= 100 && prev < 100) {
          vibrate();
          setStage("message");
          motionService.stopListening();
        }

        return newProgress;
      });
    }
  }, [stage, movementDirection]);

  const vibrate = async () => {
    setIsVibrating(true);
    try {
      // Use the universal haptics service (works on Android + iOS 17.4+)
      triggerBumpHaptic();
    } catch (e) {
      console.warn('[Haptics] Vibration failed:', e);
    }
    setTimeout(() => setIsVibrating(false), 500);
  };

  const sendConnect = async () => {
    if (!user) return;

    try {
      const res = await apiRequest("POST", "/api/bumps", {
        bumpedUserId: user.id,
        status: "initiated",
        message: message.trim() || undefined,
      });

      if (!res.ok) {
        throw new Error("Failed to send bump");
      }

      toast({
        title: "Bump sent!",
        description: `You bumped ${user.firstName}!`,
      });

      setStage("complete");
      onSuccess();

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Failed to send bump:", error);
      toast({
        title: "Bump failed",
        description: "Unable to send bump. Please try again.",
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
              <DialogTitle className="text-white font-heading text-xl">Preparing to Bump</DialogTitle>
              <DialogDescription className="text-slate-400">
                Hold on while we initialize motion detection...
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center my-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-pink-500/20 border border-slate-700/50 flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-blue-400 animate-pulse" />
              </div>
            </div>
            {motionPermissionError && (
              <div className="text-center mt-2">
                <p className="text-red-400 text-sm">Motion detection permission denied. Please enable it in your device settings.</p>
                <Button
                  variant="outline"
                  className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
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
              <DialogTitle className="text-white font-heading text-xl">
                Move Your Phone {getDirectionText(movementDirection)}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                To bump {user?.firstName}, move your device in the indicated direction.
              </DialogDescription>
            </DialogHeader>

            <div className={`flex flex-col items-center justify-center py-8 ${isVibrating ? 'animate-wiggle' : ''}`}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/15 to-pink-500/15 border border-slate-700/50 flex items-center justify-center mb-6">
                {renderDirectionIcon(movementDirection)}
              </div>
              <Progress value={motionProgress} className="w-full" />
              <p className="text-sm text-slate-400 mt-3 font-medium">
                {Math.round(motionProgress)}% complete
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Cancel
              </Button>
            </DialogFooter>
          </>
        );

      case "direct_message":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-white font-heading text-xl">Bump {user?.firstName}</DialogTitle>
              <DialogDescription className="text-slate-400">
                You're within range — add a message to your bump!
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 font-bold">
                    {user ? getInitials(user.firstName, user.lastName) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-400">
                    {user?.category ? user.category.charAt(0).toUpperCase() + user.category.slice(1) : 'Friendships'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bump-message" className="text-slate-300 text-sm font-medium">Your message</Label>
                <Textarea
                  id="connect-message"
                  placeholder="Hey, want to meet up?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 resize-none"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={sendConnect}
                className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-blue-500/25"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </DialogFooter>
          </>
        );

      case "message":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-white font-heading text-xl">Bump {user?.firstName}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a personal message to your bump
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 font-bold">
                    {user ? getInitials(user.firstName, user.lastName) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-400">
                    {user?.category ? user.category.charAt(0).toUpperCase() + user.category.slice(1) : 'Friendships'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bump-message" className="text-slate-300 text-sm font-medium">Your message</Label>
                <Textarea
                  id="connect-message"
                  placeholder="Hey, want to meet up?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStage("moving")}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={sendConnect}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold shadow-lg shadow-fuchsia-500/25"
              >
                <Zap className="h-4 w-4 mr-2" />
                Send Bump
              </Button>
            </DialogFooter>
          </>
        );

      case "complete":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-white font-heading text-xl">Bump Sent! ⚡</DialogTitle>
              <DialogDescription className="text-slate-400">
                Your bump has been sent to {user?.firstName}. You'll get a notification when they respond.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center my-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <Check className="h-10 w-10 text-emerald-400" />
              </div>
            </div>
          </>
        );
    }
  };

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

  const renderDirectionIcon = (direction: string | null) => {
    const iconSize = "h-12 w-12 text-blue-400 animate-pulse";

    switch (direction) {
      case MotionDirection.FORWARD:
        return <ArrowRight className={iconSize} />;
      case MotionDirection.BACKWARD:
        return <ArrowRight className={`${iconSize} transform rotate-180`} />;
      case MotionDirection.LEFT:
        return <ArrowRight className={`${iconSize} transform -rotate-90`} />;
      case MotionDirection.RIGHT:
        return <ArrowRight className={`${iconSize} transform rotate-90`} />;
      case MotionDirection.UP:
        return <ArrowRight className={`${iconSize} transform -rotate-90`} />;
      case MotionDirection.DOWN:
        return <ArrowRight className={`${iconSize} transform rotate-90`} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-white">
        {renderStageContent()}
      </DialogContent>
    </Dialog>
  );
}

export default ConnectInteraction;