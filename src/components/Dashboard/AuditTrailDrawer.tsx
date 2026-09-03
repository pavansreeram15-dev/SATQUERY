import React, { useEffect, useState } from 'react';
import { queryService } from '../../services/queryService';
import { AuditLogItem } from '../../types/audit';
import { usePersona } from '../../context/PersonaContext';
import { Activity, X, RefreshCw, Database, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { persona } = usePersona();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await queryService.getAuditTrail();
      setLogs(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, persona]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-space-950/98 border-l border-slate-700/80 shadow-2xl backdrop-blur-2xl z-50 flex flex-col font-mono text-xs text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-space-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            IMMUTABLE AUDIT TRAIL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-1.5 rounded bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-800/80 bg-space-950 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Verified Identity & Telemetry</span>
        <span className="text-emerald-400 font-bold">100% AUDITABLE</span>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No audit events recorded yet.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-space-900/80 border border-slate-800/80 space-y-1.5 hover:border-cyan-500/40 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {log.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-cyan-300 truncate max-w-[180px]">{log.action}</span>
                <span className="text-slate-400">{log.user_persona}</span>
              </div>

              <div className="text-slate-300 text-[11px] font-sans line-clamp-2">
                "{log.user_prompt}"
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>Source: {log.data_source}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{log.execution_time_ms}ms</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
