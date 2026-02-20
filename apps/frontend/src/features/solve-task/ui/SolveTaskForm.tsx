"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, Send, X, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@student-helper/ui/web/primitives/button";
import { Textarea } from "@student-helper/ui/web/primitives/textarea";
import { getApiBaseUrl } from "@/shared/api";

interface ChatSession {
  id: string;
}

interface MessageResult {
  userMessage: { id: string; content: string; role: string };
  assistantMessage: { id: string; content: string; role: string };
}

type SolveState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "done"; response: string }
  | { step: "error"; message: string };

async function createSession(): Promise<ChatSession> {
  const res = await fetch(`${getApiBaseUrl()}/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mode: "fast" }),
  });
  if (!res.ok) throw new Error(`Session creation failed: ${res.status}`);
  return res.json() as Promise<ChatSession>;
}

async function sendTextMessage(
  sessionId: string,
  content: string,
): Promise<MessageResult> {
  const res = await fetch(
    `${getApiBaseUrl()}/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content, sourceType: "text" }),
    },
  );
  if (!res.ok) throw new Error(`Message send failed: ${res.status}`);
  return res.json() as Promise<MessageResult>;
}

async function sendImageMessage(
  sessionId: string,
  image: File,
  content?: string,
): Promise<MessageResult> {
  const form = new FormData();
  form.append("image", image);
  if (content) form.append("content", content);

  const res = await fetch(
    `${getApiBaseUrl()}/chat/sessions/${sessionId}/messages/image`,
    {
      method: "POST",
      credentials: "include",
      body: form,
    },
  );
  if (!res.ok) throw new Error(`Image message send failed: ${res.status}`);
  return res.json() as Promise<MessageResult>;
}

export function SolveTaskForm() {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [state, setState] = useState<SolveState>({ step: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInput = text.trim().length > 0 || imageFile !== null;

  const handleImageSelect = useCallback((file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/bmp"];
    if (!validTypes.includes(file.type)) return;
    if (file.size > 10 * 1024 * 1024) return;

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleSubmit = async () => {
    if (!hasInput) return;

    setState({ step: "loading" });

    try {
      const session = await createSession();
      const result = imageFile
        ? await sendImageMessage(session.id, imageFile, text || undefined)
        : await sendTextMessage(session.id, text);

      setState({ step: "done", response: result.assistantMessage.content });
    } catch {
      setState({
        step: "error",
        message: "Не удалось получить ответ. Попробуйте ещё раз.",
      });
    }
  };

  const handleReset = () => {
    setText("");
    removeImage();
    setState({ step: "idle" });
  };

  const isLoading = state.step === "loading";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Решить задачу</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Введите текст задачи или загрузите фото — получите решение за минуту
        </p>
      </div>

      {/* Input area */}
      {state.step !== "done" && (
        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="Введите текст задачи..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            rows={4}
            className="resize-none"
          />

          {/* Image upload / preview */}
          {imageFile && imagePreview ? (
            <div className="relative inline-block w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Загруженное изображение"
                className="max-h-48 rounded-md border object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                disabled={isLoading}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
            >
              <ImagePlus className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Перетащите фото задачи или нажмите для выбора
              </p>
              <p className="text-xs text-muted-foreground/60">
                PNG, JPG, WebP, BMP — до 10 МБ
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Error message */}
          {state.step === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {/* CTA */}
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!hasInput || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Решаем...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Решить задачу
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {state.step === "loading" && (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-6">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Анализируем задачу и готовим решение...
          </p>
        </div>
      )}

      {/* Response */}
      {state.step === "done" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Решение
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {state.response}
            </div>
          </div>

          <Button variant="outline" onClick={handleReset} className="w-full">
            <RotateCcw className="size-4" />
            Решить другую задачу
          </Button>
        </div>
      )}
    </div>
  );
}
