import type { OCRProvider, OCRResult } from "./types";

export class TesseractProvider implements OCRProvider {
  readonly name = "tesseract";

  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("rus+eng");
    try {
      const {
        data: { text, confidence },
      } = await worker.recognize(imageBuffer);

      return {
        text: text.trim(),
        confidence: confidence / 100,
        provider: this.name,
      };
    } finally {
      await worker.terminate();
    }
  }
}
