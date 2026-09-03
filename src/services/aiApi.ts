import { knowledgeService } from './knowledgeService';
import { AIBriefRequest, AIBriefResponse, WikiKnowledgeResponse } from '../types/ai';

export const aiApi = {
  /**
   * Fetch Wikipedia factual knowledge.
   */
  async getWikiKnowledge(query: string): Promise<WikiKnowledgeResponse> {
    return knowledgeService.getWikiKnowledge(query);
  },

  /**
   * Synthesize multi-paragraph scientific intelligence brief via Gemini or local engine.
   */
  async getAIBrief(req: AIBriefRequest): Promise<AIBriefResponse> {
    return knowledgeService.getAIBrief(req);
  }
};
