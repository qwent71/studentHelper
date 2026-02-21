import { Centrifuge } from "centrifuge";
import { api } from "@/shared/api/eden";

const DEFAULT_CENTRIFUGO_WS_URL = "ws://localhost:8800/connection/websocket";

function getCentrifugoWsUrl(): string {
  return process.env.NEXT_PUBLIC_CENTRIFUGO_WS_URL ?? DEFAULT_CENTRIFUGO_WS_URL;
}

async function getToken(): Promise<string> {
  const { data, error } = await api.centrifugo.token.get();

  if (error) {
    throw new Error("Failed to fetch Centrifugo token");
  }

  return data.token;
}

let instance: Centrifuge | null = null;

export function getCentrifugoClient(): Centrifuge {
  if (instance) return instance;

  instance = new Centrifuge(getCentrifugoWsUrl(), {
    getToken,
  });

  return instance;
}
