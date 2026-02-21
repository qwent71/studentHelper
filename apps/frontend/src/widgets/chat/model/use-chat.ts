import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamEvent } from "@student-helper/contracts/stream";
import { api } from "@/shared/api/eden";
import { useCentrifugoSubscription } from "@/shared/centrifugo/use-centrifugo-subscription";
import type { Chat, Message, StreamingState } from "@/entities/chat";

interface UseChatOptions {
  chatId: string;
}

interface UseChatReturn {
  chat: Chat | null;
  messages: Message[];
  streaming: StreamingState;
  error: string | null;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export function useChat({ chatId }: UseChatOptions): UseChatReturn {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<StreamingState>({
    isStreaming: false,
    streamingContent: "",
    error: null,
  });

  const streamingContentRef = useRef("");

  // Fetch initial chat + messages
  useEffect(() => {
    let cancelled = false;

    async function fetchChat() {
      setIsLoading(true);
      setError(null);

      const { data, error: apiError } = await api.chat({ chatId }).get();

      if (cancelled) return;

      if (apiError) {
        setError("Failed to load chat");
        setIsLoading(false);
        return;
      }

      if (data) {
        setChat({
          id: data.id,
          userId: data.userId,
          title: data.title,
          createdAt: String(data.createdAt),
          updatedAt: String(data.updatedAt),
          archivedAt: data.archivedAt ? String(data.archivedAt) : null,
        });
        setMessages(
          (data.messages ?? []).map((m) => ({
            id: m.id,
            chatId: m.chatId,
            role: m.role as Message["role"],
            content: m.content,
            createdAt: String(m.createdAt),
          })),
        );
      }

      setIsLoading(false);
    }

    void fetchChat();

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Handle streaming events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case "token": {
        streamingContentRef.current += event.text;
        setStreaming({
          isStreaming: true,
          streamingContent: streamingContentRef.current,
          error: null,
        });
        break;
      }
      case "done": {
        const finalContent = streamingContentRef.current;
        if (finalContent) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              chatId: "",
              role: "assistant",
              content: finalContent,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        streamingContentRef.current = "";
        setStreaming({
          isStreaming: false,
          streamingContent: "",
          error: null,
        });
        break;
      }
      case "error": {
        streamingContentRef.current = "";
        setStreaming({
          isStreaming: false,
          streamingContent: "",
          error: event.message,
        });
        setError(event.message);
        break;
      }
    }
  }, []);

  // Subscribe to Centrifugo channel
  useCentrifugoSubscription({
    channel: chatId ? `chat:${chatId}` : null,
    onEvent: handleStreamEvent,
  });

  // Send a user message
  const sendMessage = useCallback(
    async (content: string) => {
      // Optimistic update
      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        chatId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setError(null);

      // Reset streaming state for incoming response
      streamingContentRef.current = "";
      setStreaming({
        isStreaming: true,
        streamingContent: "",
        error: null,
      });

      const { error: apiError } = await api.chat({ chatId }).messages.post({
        content,
      });

      if (apiError) {
        setStreaming({
          isStreaming: false,
          streamingContent: "",
          error: null,
        });
        setError("Failed to send message");
      }
    },
    [chatId],
  );

  return {
    chat,
    messages,
    streaming,
    error,
    isLoading,
    sendMessage,
  };
}
