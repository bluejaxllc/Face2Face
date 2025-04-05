import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Send, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

interface BumpedUser {
  id: number;
  firstName: string;
  lastName: string;
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Get users that the current user has bumped with
  const { data: bumpedUsers = [] } = useQuery<BumpedUser[]>({
    queryKey: ["/api/bumps/users"],
    enabled: !!user,
  });

  // Get messages between current user and selected user
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!selectedUserId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
    },
  });

  const handleSendMessage = () => {
    if (!selectedUserId || !messageText.trim()) return;

    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageText.trim(),
    });
  };

  const filteredUsers = bumpedUsers.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* User list sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto pb-24 md:pb-4 h-[calc(100vh-13rem)]">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              filteredUsers.map((bumpedUser) => (
                <div
                  key={bumpedUser.id}
                  className={`p-4 cursor-pointer hover:bg-gray-100 ${
                    selectedUserId === bumpedUser.id ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedUserId(bumpedUser.id)}
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>
                        {getInitials(bumpedUser.firstName, bumpedUser.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">
                        {bumpedUser.firstName} {bumpedUser.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bumped recently
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Message area */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Selected user header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback>
                    {getInitials(
                      filteredUsers.find(u => u.id === selectedUserId)?.firstName || "U",
                      filteredUsers.find(u => u.id === selectedUserId)?.lastName || "U"
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {filteredUsers.find(u => u.id === selectedUserId)?.firstName}{" "}
                  {filteredUsers.find(u => u.id === selectedUserId)?.lastName}
                </span>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.senderId === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <Card className={`max-w-[70%] ${
                        message.senderId === user?.id ? "bg-secondary text-white" : ""
                      }`}>
                        <CardContent className="p-3">
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user?.id ? "text-white/70" : "text-gray-500"
                          }`}>
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1 mr-2"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <p className="mb-2">Select a conversation to start messaging</p>
                <p className="text-sm">You can only message people you've bumped with</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
