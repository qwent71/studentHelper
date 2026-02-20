import type { OCRProvider, OCRResult } from "./providers/types";

export class OCRError extends Error {
  constructor(
    message: string,
    public readonly attempts: ProviderAttempt[],
  ) {
    super(message);
    this.name = "OCRError";
  }
}

export interface ProviderAttempt {
  provider: string;
  error?: string;
  lowConfidence?: boolean;
  durationMs: number;
}

export interface OCRServiceOptions {
  providers: OCRProvider[];
  confidenceThreshold: number;
  timeoutMs?: number;
  onFallback?: (attempt: ProviderAttempt, nextProvider: string) => void;
}

export class OCRService {
  private providers: OCRProvider[];
  private confidenceThreshold: number;
  private timeoutMs: number;
  private onFallback?: (attempt: ProviderAttempt, nextProvider: string) => void;

  constructor(options: OCRServiceOptions) {
    if (options.providers.length === 0) {
      throw new Error("OCRService requires at least one provider");
    }
    this.providers = options.providers;
    this.confidenceThreshold = options.confidenceThreshold;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.onFallback = options.onFallback;
  }

  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    const attempts: ProviderAttempt[] = [];

    for (const [i, provider] of this.providers.entries()) {
      const nextProvider = this.providers[i + 1];
      const start = Date.now();

      try {
        const result = await this.withTimeout(
          provider.extractText(imageBuffer),
          this.timeoutMs,
          provider.name,
        );

        const durationMs = Date.now() - start;

        if (result.confidence < this.confidenceThreshold) {
          const attempt: ProviderAttempt = {
            provider: provider.name,
            lowConfidence: true,
            durationMs,
          };
          attempts.push(attempt);

          if (nextProvider) {
            this.onFallback?.(attempt, nextProvider.name);
            continue;
          }

          // Last provider — return low-confidence result rather than failing
          return result;
        }

        return result;
      } catch (error) {
        const durationMs = Date.now() - start;
        const attempt: ProviderAttempt = {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
          durationMs,
        };
        attempts.push(attempt);

        if (nextProvider) {
          this.onFallback?.(attempt, nextProvider.name);
          continue;
        }
      }
    }

    throw new OCRError("All OCR providers failed", attempts);
  }

  private withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    providerName: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${providerName} timed out after ${ms}ms`)),
        ms,
      );

      promise
        .then((val) => {
          clearTimeout(timer);
          resolve(val);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
