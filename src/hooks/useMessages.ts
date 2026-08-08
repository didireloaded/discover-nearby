import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageService, ConversationItem } from "@/services/messages";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "voice" | null;
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export function useConversations() {
  const { session, profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeUserId = session?.user?.id || profile?.id || "";

  const fetchConversations = useCallback(async () => {
    if (!activeUserId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await MessageService.getUserConversations(activeUserId);
      setConversations(data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, isLoading, refreshConversations: fetchConversations };
}

export function useMessages(conversationId?: string) {
  const { session, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeUserId = session?.user?.id || profile?.id || "";

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !activeUserId) return;
    setIsLoading(true);

    try {
      const data = await MessageService.getMessages(conversationId);
      setMessages(data as any as Message[]);

      // Mark conversation read
      MessageService.markConversationRead(conversationId, activeUserId);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, activeUserId]);

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Real-time subscription to new messages
    const channel = MessageService.subscribeToMessages(conversationId, (newMsg: any) => {
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg as Message];
        });
      }
    });

    return () => {
      MessageService.unsubscribe(channel);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (
    content: string | null,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "voice",
  ) => {
    if (!conversationId) return;

    try {
      if (mediaUrl && (mediaType === "voice" || mediaType === "image")) {
        // Direct media insertion
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: activeUserId,
          content: content || (mediaType === "voice" ? "🎤 Voice message" : "Sent an image"),
          media_url: mediaUrl,
          media_type: mediaType,
        });
        if (error) throw error;
      } else if (content) {
        await MessageService.sendTextMessage(conversationId, activeUserId, content);
      }

      // Optimistic append if realtime takes a moment
      const tempId = `msg-local-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          conversation_id: conversationId,
          sender_id: activeUserId,
          content: content || (mediaType === "voice" ? "🎤 Voice message" : "Attachment"),
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  const sendMediaMessage = async (file: File, type: "image" | "voice") => {
    if (!conversationId || !activeUserId) return false;
    try {
      await MessageService.sendMediaMessage(conversationId, activeUserId, file, type);
      await fetchMessages();
      return true;
    } catch (err) {
      console.error("Error sending media message:", err);
      return false;
    }
  };

  return { messages, isLoading, sendMessage, sendMediaMessage, refreshMessages: fetchMessages };
}
