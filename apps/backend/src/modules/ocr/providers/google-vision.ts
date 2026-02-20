import type { OCRProvider, OCRResult } from "./types";

export class GoogleVisionProvider implements OCRProvider {
  readonly name = "google-vision";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    const base64Image = imageBuffer.toString("base64");

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google Vision API error (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as GoogleVisionResponse;
    const annotation = data.responses?.[0]?.fullTextAnnotation;

    if (!annotation) {
      return { text: "", confidence: 0, provider: this.name };
    }

    const pages = annotation.pages ?? [];
    const totalConfidence =
      pages.length > 0
        ? pages.reduce((sum, p) => {
            const blockConfidences =
              p.blocks?.map((b) => b.confidence ?? 0) ?? [];
            return blockConfidences.length > 0
              ? sum +
                  blockConfidences.reduce((a, c) => a + c, 0) /
                    blockConfidences.length
              : sum;
          }, 0) / pages.length
        : 0;

    return {
      text: annotation.text,
      confidence: totalConfidence,
      provider: this.name,
    };
  }
}

interface GoogleVisionResponse {
  responses?: Array<{
    fullTextAnnotation?: {
      text: string;
      pages?: Array<{
        blocks?: Array<{
          confidence?: number;
        }>;
      }>;
    };
  }>;
}
