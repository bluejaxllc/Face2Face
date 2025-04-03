import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // In a real app, you would navigate to the relevant section based on notification type
    if (notification.type === "bump") {
      // Navigate to the map or open profile card
    } else if (notification.type === "message") {
      // Navigate to messages
    }
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // Helper function to get initials from notification content
  const getInitialsFromContent = (content: string) => {
    // Extract name from content (e.g., "You've been bumped by John!" -> "J")
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Notifications</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                    <Avatar>
                      <AvatarFallback>
                        {getInitialsFromContent(notification.content)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div>
                      <span className="inline-flex h-2 w-2 rounded-full bg-status-alert"></span>
                    </div>
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
