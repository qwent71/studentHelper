"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import { ChatView } from "@/widgets/chat";
import { useChat } from "@/widgets/chat";

interface ChatDetailPageProps {
  params: Promise<{ chatId: string }>;
}

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { chatId } = use(params);
  const { messages, streaming, isLoading, error, sendMessage } = useChat({
    chatId,
  });

  if (error && !isLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <p className="text-sm text-destructive">
          {error === "Failed to load chat"
            ? "Чат не найден или недоступен"
            : error}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/chat">
            <ArrowLeft className="size-4" />
            Вернуться к чатам
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ChatView
      messages={messages}
      streaming={streaming}
      isLoading={isLoading}
      onSend={sendMessage}
    />
  );
}
