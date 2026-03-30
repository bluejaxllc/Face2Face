import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Send, Search, ArrowLeft, MessageSquare, Smile, Sparkles, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
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
  lastMessage?: { content: string; timestamp: string; senderId: number } | null;
  unreadCount?: number;
  hasPendingReceivedBump?: boolean;
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select user from URL query param (e.g. /messages?userId=5)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    if (userId) {
      setSelectedUserId(parseInt(userId));
      // Clean up the URL without reloading
      window.history.replaceState({}, "", "/messages");
    }
  }, []);

  const { data: connectedUsers = [] } = useQuery<ConnectedUser[]>({
    queryKey: ["/api/bumps/users"],
    enabled: !!user,
    refetchInterval: 10000, // Refresh contacts every 10 seconds for new bumps/badges
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedUserId}`],
    enabled: !!selectedUserId,
    refetchInterval: 3000, // Pull new chat messages every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedUserId}`] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedUserId || !messageText.trim()) return;
    sendMessageMutation.mutate({ receiverId: selectedUserId, content: messageText.trim() });
  };

  const filteredUsers = connectedUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => `${firstName[0]}${lastName[0]}`;
  const selectedUser = filteredUsers.find(u => u.id === selectedUserId);

  const showChat = selectedUserId !== null;

  return (
    <PageTransition className="h-screen page-dark">
      <Header />

      <div className="fixed left-0 right-0 flex overflow-hidden lg:bottom-0" style={{ top: "48px", bottom: "96px" }}>
        {/* Contacts sidebar */}
        <motion.div
          className={`w-full md:w-80 lg:w-96 md:border-r border-slate-800 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Search with icon */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 rounded-xl h-10 focus:border-blue-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-300 font-semibold">No conversations yet</p>
                <p className="text-slate-400 text-sm mt-1 max-w-[200px] mx-auto">Connect with people on the map to start chatting</p>
              </div>
            ) : (
              filteredUsers.map((connectedUser) => (
                <motion.div
                  variants={itemVariants}
                  key={connectedUser.id}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:bg-slate-800/50 group ${selectedUserId === connectedUser.id
                    ? "bg-slate-800/70 border-l-2 border-blue-500"
                    : "border-l-2 border-transparent hover:border-slate-600"
                    }`}
                  onClick={() => setSelectedUserId(connectedUser.id)}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <Avatar className="h-11 w-11">
                        {connectedUser.profilePhoto && (
                          <AvatarImage src={connectedUser.profilePhoto} alt={connectedUser.firstName} />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 text-sm font-bold">
                          {getInitials(connectedUser.firstName, connectedUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">
                          {connectedUser.firstName} {connectedUser.lastName}
                        </p>
                        {connectedUser.lastMessage && (
                          <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">
                            {formatDistanceToNow(new Date(connectedUser.lastMessage.timestamp), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 truncate">
                          {connectedUser.lastMessage
                            ? (connectedUser.lastMessage.senderId === user?.id ? 'You: ' : '') + connectedUser.lastMessage.content
                            : connectedUser.hasPendingReceivedBump
                              ? <span className="text-pink-400 font-medium">👋 Bumped you! Tap to reply</span>
                              : 'Tap to start chatting'}
                        </p>
                        {(connectedUser.unreadCount ?? 0) > 0 && (
                          <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {connectedUser.unreadCount}
                          </span>
                        )}
                      </div>
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
              <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    {selectedUser.profilePhoto && (
                      <AvatarImage src={selectedUser.profilePhoto} alt={selectedUser.firstName} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 text-xs font-bold">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <span className="font-semibold text-white text-sm">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </span>
                  <p className="text-[10px] text-emerald-400 font-medium">Online</p>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-center mb-6 mt-2">
                  <div className="bg-slate-800/60 border border-slate-700/50 backdrop-blur-md px-4 py-2 rounded-full inline-flex items-center gap-2 max-w-xs md:max-w-sm text-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-[10px] text-slate-300 font-medium">
                      Messages are private. You are chatting with a <span className="text-emerald-400 font-bold">verified real person</span>.
                    </p>
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center animate-in fade-in duration-700 mt-10">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-full blur-xl opacity-20 animate-pulse" />
                      <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center relative shadow-xl backdrop-blur-sm">
                        <Smile className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-white font-medium text-lg tracking-wide">Say something!</p>
                    <p className="text-sm text-slate-400 mt-1.5 font-medium">Break the ice with {selectedUser.firstName}</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-[20px] shadow-sm relative group ${message.senderId === user?.id
                          ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-br-[4px] shadow-pink-500/20"
                          : "bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-[4px] backdrop-blur-md shadow-black/20"
                          }`}>
                          <p className="text-[15px] leading-relaxed tracking-wide">{message.content}</p>
                          <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${message.senderId === user?.id ? "text-white/70" : "text-slate-400"
                            }`}>
                            <p className="text-[10px] uppercase font-semibold tracking-wider">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                            {message.senderId === user?.id && (
                              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 opacity-80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose bar */}
              <div className="p-3 border-t border-slate-800/60 bg-slate-900/95 backdrop-blur-xl">
                <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-pink-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <Input
                      placeholder="Type a message..."
                      className="relative bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 rounded-full h-12 px-5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 shadow-inner"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 hover:opacity-90 shadow-lg shadow-indigo-500/25 p-0 flex-shrink-0 disabled:opacity-30 disabled:shadow-none transition-all duration-300 transform active:scale-95"
                  >
                    <Send className="h-5 w-5 translate-x-px -translate-y-px" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900/40">
              <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto relative shadow-2xl backdrop-blur-sm">
                    <MessageSquare className="w-10 h-10 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">Your Messages</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-[240px] mx-auto leading-relaxed">
                  Select a connected user from the left to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </PageTransition>
  );
}
