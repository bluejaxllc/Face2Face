import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Send, Search, ArrowLeft, MessageSquare, Smile, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
          {/* Search with icon */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 rounded-xl h-10 focus:border-blue-500/50"
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
                <p className="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">Connect with people on the map to start chatting</p>
              </div>
            ) : (
              filteredUsers.map((bumpedUser) => (
                <motion.div
                  variants={itemVariants}
                  key={bumpedUser.id}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:bg-slate-800/50 group ${selectedUserId === bumpedUser.id
                      ? "bg-slate-800/70 border-l-2 border-blue-500"
                      : "border-l-2 border-transparent hover:border-slate-600"
                    }`}
                  onClick={() => setSelectedUserId(bumpedUser.id)}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 text-sm font-bold">
                          {getInitials(bumpedUser.firstName, bumpedUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">
                        {bumpedUser.firstName} {bumpedUser.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">Tap to chat</p>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-3">
                        <Smile className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-slate-300 font-medium text-sm">Say something!</p>
                      <p className="text-xs text-slate-500 mt-1">Break the ice with {selectedUser.firstName}</p>
                    </div>
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
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${message.senderId === user?.id
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/15"
                            : "bg-slate-800 border border-slate-700/50 text-slate-200 rounded-bl-md"
                          }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-[10px] mt-1.5 ${message.senderId === user?.id ? "text-blue-200/70" : "text-slate-500"
                            }`}>
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl h-11 focus:border-blue-500/50"
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
                    className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 p-0 flex-shrink-0 disabled:opacity-30"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-300 font-semibold">Select a conversation</p>
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
