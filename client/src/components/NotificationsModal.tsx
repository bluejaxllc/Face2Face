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
import { Clock, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProfileCard from "./ProfileCard";
import { useLocation } from "@/contexts/LocationContext";
import { motion } from "framer-motion";

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
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  connectMessage?: string | null;
  profilePhoto?: string | null;
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

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/read/${notificationId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

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
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleConnectBack = async () => {
    if (!senderUser) return;
    setSelectedConnectNotification(null);

    try {
      await apiRequest("POST", "/api/bumps", {
        bumpedUserId: senderUser.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Failed to connect back:", error);
    }
  };

  const getInitialsFromContent = (content: string) => {
    const matches = content.match(/by ([A-Za-z]+)/);
    if (matches && matches[1]) {
      return matches[1].charAt(0);
    }
    return "U";
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  if (selectedConnectNotification && senderUser) {
    return (
      <div className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex justify-center items-center">
        <ProfileCard
          user={senderUser}
          onClose={() => setSelectedConnectNotification(null)}
          onConnect={handleConnectBack}
          distance={null}
        />
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Notifications
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Recent activity and interactions
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No notifications yet</p>
              <p className="text-slate-500 text-sm mt-1">Connect with someone to get started!</p>
            </div>
          ) : (
            notifications.map((notification, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={notification.id}
                className={`p-4 border-b border-slate-800 cursor-pointer transition-all duration-200 ${!notification.read
                    ? 'bg-blue-500/10 hover:bg-blue-500/15'
                    : 'hover:bg-slate-800/50'
                  } ${notification.type === 'bump' ? 'border-l-2 border-l-pink-500/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full mr-3 overflow-hidden flex-shrink-0">
                    <Avatar>
                      <AvatarFallback className={`text-slate-200 font-bold ${notification.type === 'bump'
                          ? 'bg-gradient-to-br from-pink-600 to-rose-700'
                          : 'bg-gradient-to-br from-slate-700 to-slate-800'
                        }`}>
                        {getInitialsFromContent(notification.content)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-white' : 'text-slate-300'}`}>
                      {notification.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="ml-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md shadow-blue-500/50"></div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="w-full rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            disabled={notifications.length === 0 || !notifications.some(n => !n.read)}
          >
            Mark All as Read
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
