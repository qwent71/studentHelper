"use client";

import { AlertCircle, Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@student-helper/ui/ai/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@student-helper/ui/ai/message";
import { ChatInput } from "@/features/chat/send-message";
import type { Message as ChatMessage, StreamingState } from "@/entities/chat";

interface ChatViewProps {
  messages: ChatMessage[];
  streaming: StreamingState;
  isLoading: boolean;
  onSend: (content: string) => void;
  onRetry?: () => void;
}

export function ChatView({
  messages,
  streaming,
  isLoading,
  onSend,
  onRetry,
}: ChatViewProps) {
  const hasMessages = messages.length > 0 || streaming.isStreaming;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <Conversation className="flex-1">
        {hasMessages ? (
          <ConversationContent>
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <MessageResponse>{message.content}</MessageResponse>
                  )}
                </MessageContent>
              </Message>
            ))}

            {streaming.isStreaming && (
              <Message from="assistant">
                <MessageContent>
                  {streaming.streamingContent ? (
                    <MessageResponse>
                      {streaming.streamingContent}
                    </MessageResponse>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-muted-foreground text-sm">
                        Думаю...
                      </span>
                    </div>
                  )}
                </MessageContent>
              </Message>
            )}

            {streaming.error && !streaming.isStreaming && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
                <AlertCircle className="text-destructive size-5 shrink-0" />
                <span className="text-destructive text-sm">
                  {streaming.error}
                </span>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="ml-auto shrink-0"
                  >
                    <RotateCcw className="size-3.5" />
                    Повторить
                  </Button>
                )}
              </div>
            )}
          </ConversationContent>
        ) : (
          <ConversationEmptyState
            title="Начните диалог"
            description="Напишите сообщение, чтобы начать общение с ассистентом"
            icon={<MessageSquare className="size-8" />}
          />
        )}
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-2 sm:p-4">
        <ChatInput onSend={onSend} isStreaming={streaming.isStreaming} />
      </div>
    </div>
  );
}
