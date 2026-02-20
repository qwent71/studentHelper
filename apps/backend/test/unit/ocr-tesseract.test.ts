import { describe, it, expect } from "bun:test";
import { TesseractProvider } from "../../src/modules/ocr/providers/tesseract";
import { OCRService } from "../../src/modules/ocr/ocr-service";
import { NoneProvider } from "../../src/modules/ocr/providers/none";
import type { OCRProvider, OCRResult } from "../../src/modules/ocr/providers/types";
import type { ProviderAttempt } from "../../src/modules/ocr/ocr-service";

// Generate a simple BMP image with known text pattern (white bg, black text "TEST")
// This is a minimal test to verify TesseractProvider works with real image data.
// We use a programmatically created image to avoid external file dependencies.

function createSimpleTestImage(): Buffer {
  // Create a minimal 100x30 BMP with "AB" text-like pixels.
  // Rather than complex image generation, we test that tesseract
  // handles a buffer without crashing and returns a result shape.
  const width = 100;
  const height = 30;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buf = Buffer.alloc(fileSize);

  // BMP header
  buf.write("BM", 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10); // pixel data offset
  buf.writeUInt32LE(40, 14); // DIB header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26); // color planes
  buf.writeUInt16LE(24, 28); // bits per pixel
  buf.writeUInt32LE(pixelDataSize, 34);

  // Fill white background
  for (let i = 54; i < fileSize; i++) {
    buf[i] = 255;
  }

  return buf;
}

describe("TesseractProvider — real OCR", () => {
  it("should process an image buffer and return OCRResult shape", async () => {
    const provider = new TesseractProvider();
    const image = createSimpleTestImage();

    const result = await provider.extractText(image);

    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("provider");
    expect(result.provider).toBe("tesseract");
    expect(typeof result.text).toBe("string");
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  }, 30_000);
});

describe("OCRService — full fallback chain with real+mock providers", () => {
  it("should use fallback when primary fails, logging the event", async () => {
    const logged: Array<{ attempt: ProviderAttempt; nextProvider: string }> = [];

    // Primary = a provider that always fails
    const failingPrimary: OCRProvider = {
      name: "broken-google-vision",
      async extractText(): Promise<OCRResult> {
        throw new Error("GOOGLE_VISION_API_KEY not configured");
      },
    };

    // Fallback = real Tesseract
    const tesseract = new TesseractProvider();
    const image = createSimpleTestImage();

    const service = new OCRService({
      providers: [failingPrimary, tesseract],
      confidenceThreshold: 0,
      timeoutMs: 30_000,
      onFallback(attempt, nextProvider) {
        logged.push({ attempt, nextProvider });
      },
    });

    const result = await service.extractText(image);

    // Fallback happened
    expect(logged).toHaveLength(1);
    expect(logged[0]!.attempt.provider).toBe("broken-google-vision");
    expect(logged[0]!.attempt.error).toContain("GOOGLE_VISION_API_KEY");
    expect(logged[0]!.nextProvider).toBe("tesseract");

    // Result came from tesseract
    expect(result.provider).toBe("tesseract");
  }, 30_000);

  it("NoneProvider works as final fallback in chain", async () => {
    const logged: ProviderAttempt[] = [];

    const failing: OCRProvider = {
      name: "failing",
      async extractText(): Promise<OCRResult> {
        throw new Error("fail");
      },
    };

    const service = new OCRService({
      providers: [failing, new NoneProvider()],
      confidenceThreshold: 0,
      onFallback(attempt) {
        logged.push(attempt);
      },
    });

    const result = await service.extractText(Buffer.from(""));

    expect(result.provider).toBe("none");
    expect(result.text).toBe("");
    expect(logged).toHaveLength(1);
  });
});
