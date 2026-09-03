export interface AIBriefRequest {
  query: string;
  region_name?: string;
  intent?: string;
  metrics?: Record<string, any>;
  weather_context?: Record<string, any>;
  wiki_context?: Record<string, any>;
}

export interface AIBriefResponse {
  query: string;
  region_name: string;
  brief: string;
}

export interface WikiKnowledgeResponse {
  query: string;
  knowledge: {
    place_name?: string;
    summary?: string;
    url?: string;
    coordinates?: { lat: number; lon: number };
  };
}

export interface ExecutionTraceStep {
  step_number: number;
  description: string;
  timestamp: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}
