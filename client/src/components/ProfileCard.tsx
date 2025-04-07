import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/distance";
import { MessageSquare, Lock, X } from "lucide-react";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  height: string | null;
  weight: string | null;
  selfRating: number;
  isActive: boolean;
}

interface ProfileCardProps {
  user: User;
  onClose: () => void;
  onBump: () => void;
  distance: number | null;
}

export default function ProfileCard({ user, onClose, onBump, distance }: ProfileCardProps) {
  // State for bump count to determine profile reveal level
  const [profileRevealLevel, setProfileRevealLevel] = useState(1);
  
  // Get bump count to determine profile reveal level
  const { data: bumps = [] } = useQuery({
    queryKey: ["/api/bumps", user.id],
    onSuccess: (data) => {
      // Set profile reveal level based on bump count
      setProfileRevealLevel(Math.min(3, data.length + 1));
    },
  });
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };
  
  const getAge = () => {
    // For MVP, we'll just use a random age between 20-40
    // In a real app, this would come from the user's profile
    return Math.floor(Math.random() * 20) + 20;
  };

  return (
    <Card className="fixed left-1/2 transform -translate-x-1/2 bottom-20 w-11/12 max-w-sm bg-white rounded-lg shadow-lg overflow-hidden z-20">
      <div className="relative">
        <div className="h-40 bg-gray-200"></div>
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100">
          <Avatar className="h-full w-full">
            <AvatarFallback className="text-4xl">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <div className="pt-20 pb-4 px-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800">
            {user.firstName} {user.lastName.charAt(0)}, {getAge()}
          </h3>
          <div className="flex justify-center items-center mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.category === "bump" ? "bg-secondary" : "bg-primary"
            } text-white`}>
              {user.category === "bump" ? "Bump" : "Grind"}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-active text-white ml-2">
              {user.isActive ? "Active now" : "Inactive"}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Height</p>
            <p className="font-medium">{user.height || (profileRevealLevel > 1 ? "5'9\"" : "??")}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Rating</p>
            <p className="font-medium">{user.selfRating}/10</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Distance</p>
            <p className="font-medium">{distance ? formatDistance(distance) : "Unknown"}</p>
          </div>
        </div>
        
        {profileRevealLevel < 3 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 text-center">
              <Lock className="inline h-4 w-4 mr-1" />
              Bump into {user.firstName} {3 - profileRevealLevel} more times to see full profile
            </p>
          </div>
        )}
        
        <div className="mt-4 flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          
          {distance && distance <= 3 ? (
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={onBump}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Send Message
            </Button>
          ) : (
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={onBump}
              disabled={distance && distance > 3}
            >
              Bump & Message
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
