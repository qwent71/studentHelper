import { z } from "zod";

export const TokenEventSchema = z.object({
  type: z.literal("token"),
  v: z.literal(1),
  text: z.string(),
});
export type TokenEvent = z.infer<typeof TokenEventSchema>;

export const ThinkingEventSchema = z.object({
  type: z.literal("thinking"),
  v: z.literal(1),
  text: z.string(),
});
export type ThinkingEvent = z.infer<typeof ThinkingEventSchema>;

export const ToolCallEventSchema = z.object({
  type: z.literal("tool_call"),
  v: z.literal(1),
  toolName: z.string(),
  args: z.unknown(),
  callId: z.string(),
});
export type ToolCallEvent = z.infer<typeof ToolCallEventSchema>;

export const ToolResultEventSchema = z.object({
  type: z.literal("tool_result"),
  v: z.literal(1),
  callId: z.string(),
  result: z.unknown(),
  isError: z.boolean(),
});
export type ToolResultEvent = z.infer<typeof ToolResultEventSchema>;

export const DoneEventSchema = z.object({
  type: z.literal("done"),
  v: z.literal(1),
  usage: z
    .object({
      inputTokens: z.number(),
      outputTokens: z.number(),
    })
    .optional(),
});
export type DoneEvent = z.infer<typeof DoneEventSchema>;

export const ErrorEventSchema = z.object({
  type: z.literal("error"),
  v: z.literal(1),
  code: z.string(),
  message: z.string(),
});
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

export const StreamEventSchema = z.discriminatedUnion("type", [
  TokenEventSchema,
  ThinkingEventSchema,
  ToolCallEventSchema,
  ToolResultEventSchema,
  DoneEventSchema,
  ErrorEventSchema,
]);
export type StreamEvent = z.infer<typeof StreamEventSchema>;

export function parseStreamEvent(raw: unknown): StreamEvent {
  return StreamEventSchema.parse(raw);
}

export function safeParseStreamEvent(raw: unknown) {
  return StreamEventSchema.safeParse(raw);
}
