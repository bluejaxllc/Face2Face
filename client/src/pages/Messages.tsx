import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Send, Search, ArrowLeft, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

interface ConnectedUser {
  id: number;
  firstName: string;
  lastName: string;
  profilePhoto?: string | null;
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: bumpedUsers = [] } = useQuery<ConnectedUser[]>({
    queryKey: ["/api/bumps/users"],
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!selectedUserId,
  });

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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedUserId || !messageText.trim()) return;
    sendMessageMutation.mutate({ receiverId: selectedUserId, content: messageText.trim() });
  };

  const filteredUsers = bumpedUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => `${firstName[0]}${lastName[0]}`;
  const selectedUser = filteredUsers.find(u => u.id === selectedUserId);

  // Mobile: show contacts list or chat, not both
  const showChat = selectedUserId !== null;

  return (
    <div className="min-h-screen flex flex-col page-dark">
      <Header />

      <div className="flex-1 overflow-hidden flex" style={{ marginTop: "44px", marginBottom: "48px" }}>
        {/* Contacts sidebar */}
        <motion.div
          className={`w-full md:w-80 lg:w-96 md:border-r border-slate-800 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
              <Input
                placeholder="Search conversations"
                className="pl-10 message-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No conversations yet</p>
                <p className="text-slate-500 text-sm mt-1">Connect with someone to start chatting!</p>
              </div>
            ) : (
              filteredUsers.map((bumpedUser) => (
                <motion.div
                  variants={itemVariants}
                  key={bumpedUser.id}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:bg-slate-800/50 hover:pl-4 ${selectedUserId === bumpedUser.id ? "bg-slate-800/70 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                    }`}
                  onClick={() => setSelectedUserId(bumpedUser.id)}
                >
                  <div className="flex items-center">
                    <div className="avatar-ring mr-3">
                      <Avatar className="h-10 w-10">
                        {bumpedUser.profilePhoto && (
                          <AvatarImage src={bumpedUser.profilePhoto} alt={bumpedUser.firstName} />
                        )}
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-sm">
                          {getInitials(bumpedUser.firstName, bumpedUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 text-sm">
                        {bumpedUser.firstName} {bumpedUser.lastName}
                      </p>
                      <p className="text-xs text-slate-500">Connected recently</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${showChat ? 'flex' : 'hidden md:flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="avatar-ring">
                  <Avatar className="h-8 w-8">
                    {selectedUser.profilePhoto && (
                      <AvatarImage src={selectedUser.profilePhoto} alt={selectedUser.firstName} />
                    )}
                    <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <span className="font-medium text-slate-200 text-sm">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </span>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Start a conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] ${message.senderId === user?.id ? "message-bubble-sent" : "message-bubble-received"
                        }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-[10px] mt-1 ${message.senderId === user?.id ? "text-white/80" : "text-slate-400"
                          }`}>
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message compose */}
              <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1 message-input"
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
                    className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 p-0 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">Select a conversation</p>
                <p className="text-sm text-slate-500 mt-1">Choose someone to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
