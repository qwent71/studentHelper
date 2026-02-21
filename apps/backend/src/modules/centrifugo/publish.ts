import { env } from "@student-helper/config";
import type { StreamEvent } from "@student-helper/contracts/stream";

export async function publishToChannel(channel: string, data: StreamEvent): Promise<void> {
  const response = await fetch(`${env.CENTRIFUGO_URL}/api/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `apikey ${env.CENTRIFUGO_API_KEY}`,
    },
    body: JSON.stringify({ channel, data }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`Centrifugo publish failed (${response.status}): ${text}`);
  }
}
