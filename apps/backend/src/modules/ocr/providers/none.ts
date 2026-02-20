import type { OCRProvider, OCRResult } from "./types";

export class NoneProvider implements OCRProvider {
  readonly name = "none";

  async extractText(): Promise<OCRResult> {
    return { text: "", confidence: 0, provider: this.name };
  }
}
