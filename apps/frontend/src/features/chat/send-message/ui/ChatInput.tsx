"use client";

import { useCallback, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@student-helper/ui/ai/prompt-input";
import type { PromptInputMessage } from "@student-helper/ui/ai/prompt-input";

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isStreaming,
  placeholder = "Напишите сообщение...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text || isStreaming) return;
      onSend(text);
      setValue("");
    },
    [onSend, isStreaming],
  );

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isStreaming}
      />
      <PromptInputFooter>
        <div />
        <PromptInputSubmit disabled={isStreaming || !value.trim()}>
          {isStreaming ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </PromptInputSubmit>
      </PromptInputFooter>
    </PromptInput>
  );
}
