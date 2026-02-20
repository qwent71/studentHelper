import { AIService } from "./ai-service";

export { AIService, AIServiceError } from "./ai-service";
export type {
  ChatMessage,
  CompletionOptions,
  CompletionResult,
} from "./ai-service";

let _aiService: AIService | undefined;

export function getAIService(): AIService {
  if (!_aiService) {
    _aiService = new AIService();
  }
  return _aiService;
}
