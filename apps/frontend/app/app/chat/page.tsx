"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import {
  Card,
  CardContent,
} from "@student-helper/ui/web/primitives/card";
import { api } from "@/shared/api/eden";
import type { Chat } from "@/entities/chat";

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChats() {
      const { data, error: apiError } = await api.chat.get();

      if (apiError) {
        setError("Не удалось загрузить чаты");
        setLoading(false);
        return;
      }

      setChats(
        (data ?? []).map((c) => ({
          ...c,
          createdAt: String(c.createdAt),
          updatedAt: String(c.updatedAt),
          archivedAt: c.archivedAt ? String(c.archivedAt) : null,
        })),
      );
      setLoading(false);
    }

    void fetchChats();
  }, []);

  const handleNewChat = useCallback(async () => {
    setCreating(true);

    const { data, error: apiError } = await api.chat.post({
      title: "Новый чат",
    });

    if (apiError || !data) {
      setError("Не удалось создать чат");
      setCreating(false);
      return;
    }

    router.push(`/app/chat/${data.id}`);
  }, [router]);

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Загрузка чатов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Чаты</h1>
        <Button onClick={handleNewChat} disabled={creating}>
          <Plus className="size-4" />
          {creating ? "Создание..." : "Новый чат"}
        </Button>
      </div>

      {chats.length === 0 ? (
        <Card className="dark:shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">Пока нет чатов</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Создайте новый чат, чтобы начать общение с ИИ-репетитором
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleNewChat}
              disabled={creating}
            >
              <Plus className="size-4" />
              Начать чат
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className="cursor-pointer gap-0 py-0 transition-colors hover:bg-accent/50 dark:shadow-none"
              onClick={() => router.push(`/app/chat/${chat.id}`)}
            >
              <CardContent className="flex items-center gap-3 py-3">
                <MessageSquare className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{chat.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(chat.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
