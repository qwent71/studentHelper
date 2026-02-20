export interface OCRResult {
  text: string;
  confidence: number;
  provider: string;
}

export interface OCRProvider {
  readonly name: string;
  extractText(imageBuffer: Buffer): Promise<OCRResult>;
}
