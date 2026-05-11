/**
 * Messages Screen — Chat list + individual chats
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { triggerLightTap } from '@/services/haptics';

interface ChatUser {
  id: number;
  firstName: string;
  lastName: string;
  profilePhoto?: string | null;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: number;
  } | null;
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchChatUsers = useCallback(async () => {
    try {
      const data = await api.get<ChatUser[]>('/api/bumps/users');
      setChatUsers(data);
    } catch (error) {
      console.warn('[Messages] Failed to fetch users:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: number) => {
    try {
      const data = await api.get<Message[]>(`/api/messages/${userId}`);
      setMessages(data);
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error) {
      console.warn('[Messages] Failed to fetch messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchChatUsers();
    const interval = setInterval(fetchChatUsers, 10000);
    return () => clearInterval(interval);
  }, [fetchChatUsers]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    triggerLightTap();

    try {
      await api.post('/api/messages', {
        receiverId: selectedChat.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.warn('[Messages] Failed to send:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChatUsers();
    setRefreshing(false);
  };

  // ─── Chat list view ───
  if (!selectedChat) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>

        <FlatList
          data={chatUsers}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => {
                triggerLightTap();
                setSelectedChat(item);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>
                  {item.firstName[0]}{item.lastName[0]}
                </Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.firstName} {item.lastName}</Text>
                {item.lastMessage && (
                  <Text style={styles.chatPreview} numberOfLines={1}>
                    {item.lastMessage.senderId === user?.id ? 'You: ' : ''}
                    {item.lastMessage.content}
                  </Text>
                )}
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Bump someone on the map to start chatting!</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // ─── Individual chat view ───
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => {
              triggerLightTap();
              setSelectedChat(null);
              fetchChatUsers();
            }}
            style={styles.chatBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatHeaderAvatarText}>
              {selectedChat.firstName[0]}{selectedChat.lastName[0]}
            </Text>
          </View>
          <Text style={styles.chatHeaderName}>
            {selectedChat.firstName} {selectedChat.lastName}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#475569"
            value={newMessage}
            onChangeText={setNewMessage}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 4,
  },

  // Chat list
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  chatAvatarText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  chatPreview: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Chat view
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  chatBackButton: {
    padding: 4,
    marginRight: 12,
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatHeaderAvatarText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  chatHeaderName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#e2e8f0',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.3)',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
