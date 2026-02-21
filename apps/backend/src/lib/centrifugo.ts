import { env } from "@student-helper/config";
import type { StreamEvent } from "@student-helper/contracts/stream";

const CENTRIFUGO_PUBLISH_URL = `${env.CENTRIFUGO_URL}/api/publish`;

export async function publishToChannel(channel: string, data: StreamEvent): Promise<void> {
  const response = await fetch(CENTRIFUGO_PUBLISH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.CENTRIFUGO_API_KEY,
    },
    body: JSON.stringify({ channel, data }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`Centrifugo publish failed (${response.status}): ${text}`);
  }
}

export function getChatChannel(chatId: string): string {
  return `chat:${chatId}`;
}
