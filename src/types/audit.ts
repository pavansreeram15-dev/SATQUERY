import { UserPersona } from './persona';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user_persona: UserPersona;
  action: string;
  data_source: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | string;
  user_prompt: string;
  execution_time_ms: number;
  summary?: string;
}
