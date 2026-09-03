import { useState, useCallback } from 'react';
import { aiApi } from '../services/aiApi';
import { AIBriefRequest, AIBriefResponse, WikiKnowledgeResponse } from '../types/ai';

export function useAI() {
  const [brief, setBrief] = useState<string | null>(null);
  const [wiki, setWiki] = useState<WikiKnowledgeResponse['knowledge'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBrief = useCallback(async (req: AIBriefRequest): Promise<AIBriefResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.getAIBrief(req);
      setBrief(res.brief);
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize AI brief');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWikiKnowledge = useCallback(async (query: string) => {
    try {
      const res = await aiApi.getWikiKnowledge(query);
      setWiki(res.knowledge);
      return res.knowledge;
    } catch {
      return null;
    }
  }, []);

  return {
    brief,
    wiki,
    loading,
    error,
    generateBrief,
    fetchWikiKnowledge,
  };
}
