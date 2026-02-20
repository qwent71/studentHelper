import { describe, it, expect } from "bun:test";
import { buildSystemPrompt } from "../../src/modules/chat/services";

describe("buildSystemPrompt", () => {
  it("returns default prompt when no template provided", () => {
    const prompt = buildSystemPrompt("fast");
    expect(prompt).toContain("StudentHelper");
    expect(prompt).toContain("русском языке");
    expect(prompt).toContain("OCR");
    // Should NOT have mode-specific or template-specific text
    expect(prompt).not.toContain("Режим:");
  });

  it("returns default prompt when template is null", () => {
    const prompt = buildSystemPrompt("fast", null);
    expect(prompt).toContain("StudentHelper");
    expect(prompt).not.toContain("Режим:");
  });

  it("includes friendly tone instruction", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("дружелюбный");
  });

  it("includes formal tone instruction", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "formal",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("формальный");
  });

  it("falls back to raw tone value for unknown tones", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "sarcastic",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("Тон общения: sarcastic.");
  });

  it("includes knowledge level instructions", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "advanced",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("продвинутую терминологию");
  });

  it("includes output format instructions", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "concise",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("краткие ответы");
  });

  it("includes step-by-step format instructions", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "step-by-step",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("пошаговые решения");
  });

  it("includes response length instructions", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "short",
    });
    expect(prompt).toContain("короткими");
  });

  it("includes Russian language by default", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("русском языке");
  });

  it("includes custom language when not Russian", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "en",
      responseLength: "medium",
    });
    expect(prompt).toContain("Отвечай на языке: en.");
    expect(prompt).not.toContain("русском языке");
  });

  it("includes fast mode instruction", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("быстрый ответ");
  });

  it("includes learning mode instruction", () => {
    const prompt = buildSystemPrompt("learning", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("обучение");
    expect(prompt).toContain("понять, как решать");
  });

  it("always includes OCR caveat when template is provided", () => {
    const prompt = buildSystemPrompt("fast", {
      tone: "friendly",
      knowledgeLevel: "basic",
      outputFormat: "full",
      outputLanguage: "ru",
      responseLength: "medium",
    });
    expect(prompt).toContain("OCR");
    expect(prompt).toContain("неточности распознавания");
  });

  it("always includes StudentHelper identity", () => {
    const prompt = buildSystemPrompt("learning", {
      tone: "formal",
      knowledgeLevel: "advanced",
      outputFormat: "concise",
      outputLanguage: "en",
      responseLength: "long",
    });
    expect(prompt).toContain("StudentHelper");
  });
});
