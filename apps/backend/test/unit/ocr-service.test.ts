import { describe, it, expect } from "bun:test";
import { OCRService, OCRError } from "../../src/modules/ocr/ocr-service";
import { NoneProvider } from "../../src/modules/ocr/providers/none";
import type { OCRProvider, OCRResult } from "../../src/modules/ocr/providers/types";
import type { ProviderAttempt } from "../../src/modules/ocr/ocr-service";

// ── Mock providers ──────────────────────────────────────────────────

class MockProvider implements OCRProvider {
  readonly name: string;
  private result: OCRResult;
  callCount = 0;

  constructor(name: string, result: OCRResult) {
    this.name = name;
    this.result = result;
  }

  async extractText(): Promise<OCRResult> {
    this.callCount++;
    return this.result;
  }
}

class FailingProvider implements OCRProvider {
  readonly name: string;
  private errorMessage: string;
  callCount = 0;

  constructor(name: string, errorMessage = "Provider failed") {
    this.name = name;
    this.errorMessage = errorMessage;
  }

  async extractText(): Promise<OCRResult> {
    this.callCount++;
    throw new Error(this.errorMessage);
  }
}

class SlowProvider implements OCRProvider {
  readonly name: string;
  private delayMs: number;
  callCount = 0;

  constructor(name: string, delayMs: number) {
    this.name = name;
    this.delayMs = delayMs;
  }

  async extractText(): Promise<OCRResult> {
    this.callCount++;
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return { text: "slow result", confidence: 0.9, provider: this.name };
  }
}

const dummyImage = Buffer.from("fake-image-data");

// ── Test Step 1: Call OCR through primary provider on a valid image ──

describe("OCRService — primary provider", () => {
  it("should return result from primary provider when confidence is above threshold", async () => {
    const primary = new MockProvider("primary", {
      text: "2x + 3 = 7",
      confidence: 0.95,
      provider: "primary",
    });

    const service = new OCRService({
      providers: [primary],
      confidenceThreshold: 0.7,
    });

    const result = await service.extractText(dummyImage);

    expect(result.text).toBe("2x + 3 = 7");
    expect(result.confidence).toBe(0.95);
    expect(result.provider).toBe("primary");
    expect(primary.callCount).toBe(1);
  });

  it("should use primary and skip fallback when primary succeeds", async () => {
    const primary = new MockProvider("primary", {
      text: "hello",
      confidence: 0.9,
      provider: "primary",
    });
    const fallback = new MockProvider("fallback", {
      text: "fallback result",
      confidence: 0.8,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
    });

    const result = await service.extractText(dummyImage);

    expect(result.provider).toBe("primary");
    expect(primary.callCount).toBe(1);
    expect(fallback.callCount).toBe(0);
  });
});

// ── Test Step 2: Simulate primary provider failure ──

describe("OCRService — fallback on error", () => {
  it("should fall back to next provider when primary throws", async () => {
    const primary = new FailingProvider("primary", "API key invalid");
    const fallback = new MockProvider("fallback", {
      text: "fallback result",
      confidence: 0.85,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
    });

    const result = await service.extractText(dummyImage);

    expect(result.text).toBe("fallback result");
    expect(result.provider).toBe("fallback");
    expect(primary.callCount).toBe(1);
    expect(fallback.callCount).toBe(1);
  });

  it("should fall back on timeout", async () => {
    const primary = new SlowProvider("slow-primary", 500);
    const fallback = new MockProvider("fallback", {
      text: "fast fallback",
      confidence: 0.8,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
      timeoutMs: 100,
    });

    const result = await service.extractText(dummyImage);

    expect(result.provider).toBe("fallback");
    expect(result.text).toBe("fast fallback");
  });

  it("should fall back on low confidence", async () => {
    const primary = new MockProvider("primary", {
      text: "blurry text",
      confidence: 0.3,
      provider: "primary",
    });
    const fallback = new MockProvider("fallback", {
      text: "better text",
      confidence: 0.85,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
    });

    const result = await service.extractText(dummyImage);

    expect(result.provider).toBe("fallback");
    expect(result.text).toBe("better text");
  });

  it("should throw OCRError when all providers fail", async () => {
    const primary = new FailingProvider("primary", "network error");
    const fallback = new FailingProvider("fallback", "also failed");

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
    });

    try {
      await service.extractText(dummyImage);
      expect(true).toBe(false); // should not reach
    } catch (err) {
      expect(err).toBeInstanceOf(OCRError);
      const ocrErr = err as OCRError;
      expect(ocrErr.attempts).toHaveLength(2);
      expect(ocrErr.attempts[0]!.provider).toBe("primary");
      expect(ocrErr.attempts[0]!.error).toBe("network error");
      expect(ocrErr.attempts[1]!.provider).toBe("fallback");
      expect(ocrErr.attempts[1]!.error).toBe("also failed");
    }
  });

  it("should return low-confidence result from last provider instead of throwing", async () => {
    const primary = new FailingProvider("primary", "error");
    const fallback = new MockProvider("fallback", {
      text: "low confidence text",
      confidence: 0.2,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
    });

    const result = await service.extractText(dummyImage);
    expect(result.confidence).toBe(0.2);
    expect(result.text).toBe("low confidence text");
  });
});

// ── Test Step 3: Verify fallback logging/events ──

describe("OCRService — fallback event logging", () => {
  it("should call onFallback with attempt details on error fallback", async () => {
    const logged: Array<{ attempt: ProviderAttempt; nextProvider: string }> = [];
    const primary = new FailingProvider("primary", "connection refused");
    const fallback = new MockProvider("fallback", {
      text: "result",
      confidence: 0.9,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
      onFallback(attempt, nextProvider) {
        logged.push({ attempt, nextProvider });
      },
    });

    await service.extractText(dummyImage);

    expect(logged).toHaveLength(1);
    expect(logged[0]!.attempt.provider).toBe("primary");
    expect(logged[0]!.attempt.error).toBe("connection refused");
    expect(logged[0]!.attempt.durationMs).toBeTypeOf("number");
    expect(logged[0]!.nextProvider).toBe("fallback");
  });

  it("should call onFallback with lowConfidence flag", async () => {
    const logged: Array<{ attempt: ProviderAttempt; nextProvider: string }> = [];
    const primary = new MockProvider("primary", {
      text: "bad text",
      confidence: 0.1,
      provider: "primary",
    });
    const fallback = new MockProvider("fallback", {
      text: "good text",
      confidence: 0.9,
      provider: "fallback",
    });

    const service = new OCRService({
      providers: [primary, fallback],
      confidenceThreshold: 0.7,
      onFallback(attempt, nextProvider) {
        logged.push({ attempt, nextProvider });
      },
    });

    await service.extractText(dummyImage);

    expect(logged).toHaveLength(1);
    expect(logged[0]!.attempt.lowConfidence).toBe(true);
    expect(logged[0]!.attempt.error).toBeUndefined();
    expect(logged[0]!.nextProvider).toBe("fallback");
  });

  it("should log multiple fallback events in a chain of 3 providers", async () => {
    const logged: Array<{ attempt: ProviderAttempt; nextProvider: string }> = [];
    const p1 = new FailingProvider("p1", "error1");
    const p2 = new FailingProvider("p2", "error2");
    const p3 = new MockProvider("p3", {
      text: "final",
      confidence: 0.9,
      provider: "p3",
    });

    const service = new OCRService({
      providers: [p1, p2, p3],
      confidenceThreshold: 0.7,
      onFallback(attempt, nextProvider) {
        logged.push({ attempt, nextProvider });
      },
    });

    const result = await service.extractText(dummyImage);

    expect(result.provider).toBe("p3");
    expect(logged).toHaveLength(2);
    expect(logged[0]!.attempt.provider).toBe("p1");
    expect(logged[0]!.nextProvider).toBe("p2");
    expect(logged[1]!.attempt.provider).toBe("p2");
    expect(logged[1]!.nextProvider).toBe("p3");
  });
});

// ── Edge cases ──

describe("OCRService — edge cases", () => {
  it("should throw when constructed with empty providers", () => {
    expect(
      () =>
        new OCRService({
          providers: [],
          confidenceThreshold: 0.7,
        }),
    ).toThrow("OCRService requires at least one provider");
  });

  it("NoneProvider should return empty text with zero confidence", async () => {
    const none = new NoneProvider();
    const result = await none.extractText(dummyImage);
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
    expect(result.provider).toBe("none");
  });
});
