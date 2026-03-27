import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, RotateCw, Heart } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="sr-only">
          <DialogTitle>Welcome to Face2Face</DialogTitle>
          <DialogDescription>Meet people in real life, your way</DialogDescription>
        </div>
        <div className="bg-gradient-to-r from-secondary to-primary p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Welcome to Face2Face</h2>
          <p className="text-white text-opacity-90 mt-2">Meet people in real life, your way</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center">
            <div className="rounded-full bg-secondary bg-opacity-10 p-3 mr-4">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Location-Based Discovery</h3>
              <p className="text-sm text-gray-500 mt-1">Find people near you on the live map</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="rounded-full bg-primary bg-opacity-10 p-3 mr-4">
              <RotateCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Real-Life Connects</h3>
              <p className="text-sm text-gray-500 mt-1">Come within 3 miles to "connect" and start talking</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="rounded-full bg-secondary bg-opacity-10 p-3 mr-4">
              <Heart className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Choose Your Style</h3>
              <p className="text-sm text-gray-500 mt-1">Select "Casual" for hanging out or "Intimate" for more</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-700 text-center italic">
              "We prioritize real connections that start with real-life proximity"
            </p>
          </div>

          <Button
            className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold"
            onClick={onClose}
          >
            Get Started
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
