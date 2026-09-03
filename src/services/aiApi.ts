import { knowledgeService } from './knowledgeService';
import { AIBriefRequest, AIBriefResponse, WikiKnowledgeResponse } from '../types/ai';

export const aiApi = {
  /**
   * Fetch Wikipedia factual knowledge by query string.
   */
  async getWikiKnowledge(query: string): Promise<WikiKnowledgeResponse> {
    const data = await knowledgeService.getWikipediaSummary(query);
    return {
      query,
      knowledge: data
    };
  },

  /**
   * Fetch MediaWiki GeoSearch knowledge by latitude/longitude coordinates.
   */
  async getWikiKnowledgeByCoords(lat: number, lon: number): Promise<WikiKnowledgeResponse> {
    const data = await knowledgeService.getWikipediaGeoSearch(lat, lon);
    return {
      query: `(${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      knowledge: data
    };
  },

  /**
   * Synthesize multi-paragraph scientific intelligence brief via Gemini or local engine.
   */
  async getAIBrief(req: AIBriefRequest): Promise<AIBriefResponse> {
    const briefText = knowledgeService.synthesizeDescriptiveBrief(
      req.query,
      req.region_name,
      req.intent,
      req.metrics,
      req.wiki_context,
      req.weather_context
    );
    return {
      query: req.query,
      region_name: req.region_name,
      brief: briefText
    };
  }
};
