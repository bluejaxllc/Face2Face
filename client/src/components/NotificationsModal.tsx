import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProfileCard from "./ProfileCard";
import ConnectOverlay from "./ConnectOverlay";
import { useLocation } from "@/contexts/LocationContext";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  gender: string;
  age: number;
  selfRating: number;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  bumpMessage?: string | null;
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  relatedId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsModalProps {
  onClose: () => void;
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const queryClient = useQueryClient();
  const { currentLocation } = useLocation();
  const [selectedConnectNotification, setSelectedConnectNotification] = useState<Notification | null>(null);
  const [isConnectingBack, setIsConnectingBack] = useState(false);

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/read/${notificationId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Fetch the sender user if a bump notification is selected
  const { data: senderUser } = useQuery<User>({
    queryKey: ["/api/users", selectedConnectNotification?.relatedId],
    enabled: !!selectedConnectNotification?.relatedId,
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.type === "bump") {
      setSelectedConnectNotification(notification);
    } else if (notification.type === "message") {
      // In a real app, you would navigate to the relevant section based on notification type
      // navigate('/messages')
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleConnectBackSuccess = async () => {
    if (!senderUser) return;
    setIsConnectingBack(false);
    setSelectedConnectNotification(null);

    try {
      await apiRequest("POST", "/api/bumps", {
        bumpedUserId: senderUser.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      // Would navigate to messages or show a match screen here
    } catch (error) {
      console.error("Failed to connect back:", error);
    }
  };

  // Helper function to get initials from notification content
  const getInitialsFromContent = (content: string) => {
    const matches = content.match(/by ([A-Za-z]+)/);
    if (matches && matches[1]) {
      return matches[1].charAt(0);
    }
    return "U";
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  if (isConnectingBack && senderUser && currentLocation) {
    return (
      <ConnectOverlay
        onSuccess={handleConnectBackSuccess}
        onCancel={() => setIsConnectingBack(false)}
        targetUser={{ ...senderUser, latitude: senderUser.latitude || 0, longitude: senderUser.longitude || 0 }}
        currentLocation={currentLocation}
      />
    );
  }

  if (selectedConnectNotification && senderUser) {
    return (
      <div className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex justify-center items-center">
        <ProfileCard
          user={senderUser}
          onClose={() => setSelectedConnectNotification(null)}
          onConnect={() => setIsConnectingBack(true)}
          distance={null} // distance logic optional here
        />
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">Notifications</DialogTitle>
          <DialogDescription>
            Recent activity and interactions with other users
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-200 mr-3 overflow-hidden flex-shrink-0">
                    <Avatar>
                      <AvatarFallback className="text-slate-600 bg-slate-200 font-bold">
                        {getInitialsFromContent(notification.content)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {notification.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="ml-2 w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="w-full"
            disabled={notifications.length === 0 || !notifications.some(n => !n.read)}
          >
            Mark All as Read
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
