import { db } from "../../db";
import { safetyEvent } from "../../db/schema";

export interface CreateSafetyEventInput {
  userId: string;
  sessionId?: string | null;
  eventType: "blocked_prompt" | "unsafe_response_filtered" | "warning_shown" | "access_violation";
  severity: "low" | "medium" | "high";
  details?: string | null;
}

export const safetyRepo = {
  async logEvent(input: CreateSafetyEventInput) {
    const [row] = await db
      .insert(safetyEvent)
      .values({
        userId: input.userId,
        sessionId: input.sessionId ?? null,
        eventType: input.eventType,
        severity: input.severity,
        details: input.details ?? null,
      })
      .returning();
    return row;
  },
};
