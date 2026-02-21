import { useEffect, useRef } from "react";
import type { Subscription } from "centrifuge";
import { safeParseStreamEvent, type StreamEvent } from "@student-helper/contracts/stream";
import { getCentrifugoClient } from "./centrifugo-client";

interface UseCentrifugoSubscriptionOptions {
  channel: string | null;
  onEvent: (event: StreamEvent) => void;
}

export function useCentrifugoSubscription({
  channel,
  onEvent,
}: UseCentrifugoSubscriptionOptions): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!channel) return;

    const client = getCentrifugoClient();
    client.connect();

    const sub: Subscription = client.newSubscription(channel);

    sub.on("publication", (ctx) => {
      const result = safeParseStreamEvent(ctx.data);
      if (result.success) {
        onEventRef.current(result.data);
      }
    });

    sub.subscribe();

    return () => {
      sub.unsubscribe();
      sub.removeAllListeners();
    };
  }, [channel]);
}
