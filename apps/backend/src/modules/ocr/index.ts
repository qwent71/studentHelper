import { env } from "@student-helper/config";
import type { OCRProvider } from "./providers/types";
import { GoogleVisionProvider } from "./providers/google-vision";
import { TesseractProvider } from "./providers/tesseract";
import { NoneProvider } from "./providers/none";
import { OCRService } from "./ocr-service";

export type { OCRProvider, OCRResult } from "./providers/types";
export { OCRService, OCRError } from "./ocr-service";
export type { ProviderAttempt, OCRServiceOptions } from "./ocr-service";
export { GoogleVisionProvider } from "./providers/google-vision";
export { TesseractProvider } from "./providers/tesseract";
export { NoneProvider } from "./providers/none";

type ProviderName = "google-vision" | "tesseract" | "none";

function createProvider(name: ProviderName): OCRProvider {
  switch (name) {
    case "google-vision": {
      const apiKey = env.GOOGLE_VISION_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GOOGLE_VISION_API_KEY is required for google-vision OCR provider",
        );
      }
      return new GoogleVisionProvider(apiKey);
    }
    case "tesseract":
      return new TesseractProvider();
    case "none":
      return new NoneProvider();
  }
}

export function createOCRService(): OCRService {
  const providers: OCRProvider[] = [createProvider(env.OCR_PROVIDER)];

  if (env.OCR_FALLBACK_PROVIDER !== "none") {
    providers.push(createProvider(env.OCR_FALLBACK_PROVIDER));
  }

  return new OCRService({
    providers,
    confidenceThreshold: env.OCR_CONFIDENCE_THRESHOLD,
    onFallback(attempt, nextProvider) {
      const reason = attempt.error
        ? `error: ${attempt.error}`
        : `low confidence`;
      console.log(
        `[ocr] Fallback from ${attempt.provider} to ${nextProvider} (${reason}, ${attempt.durationMs}ms)`,
      );
    },
  });
}
