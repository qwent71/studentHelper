export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface StreamingState {
  isStreaming: boolean;
  streamingContent: string;
  error?: string | null;
}
