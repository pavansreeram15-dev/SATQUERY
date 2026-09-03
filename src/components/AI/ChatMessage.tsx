import React from 'react';
import { UserPersona } from '../../types/persona';
import { ResultCard } from './ResultCard';
import { QueryResponse } from '../../types/query';
import { Bot, User, Satellite, ShieldAlert, GraduationCap, AlertTriangle, ShieldX } from 'lucide-react';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  persona: UserPersona;
  text?: string;
  result?: QueryResponse;
  timestamp: string;
  isError?: boolean;
  permissionDenied?: boolean;
  requiredPermission?: string;
}

export const ChatMessage: React.FC<{ message: ChatMessageItem }> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
        {isUser ? (
          <>
            <span>{message.timestamp}</span>
            <span className="font-semibold text-slate-300">YOU</span>
            <div className="w-5 h-5 rounded-full bg-space-800 flex items-center justify-center border border-slate-700">
              <User className="w-3 h-3 text-cyan-400" />
            </div>
          </>
        ) : (
          <>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
              message.permissionDenied
                ? 'bg-rose-950/80 border-rose-500/50'
                : message.isError
                ? 'bg-amber-950/80 border-amber-500/50'
                : 'bg-cyan-950/80 border-cyan-500/40'
            }`}>
              {message.permissionDenied ? (
                <ShieldX className="w-3 h-3 text-rose-400" />
              ) : message.isError ? (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              ) : (
                <Bot className="w-3 h-3 text-cyan-400" />
              )}
            </div>
            <span className={`font-semibold ${
              message.permissionDenied
                ? 'text-rose-400'
                : message.isError
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}>
              {message.permissionDenied ? 'SECURITY CLEARANCE DENIED' : 'SATQUERY AI'}
            </span>
            <span>{message.timestamp}</span>
          </>
        )}
      </div>

      {message.text && (
        <div
          className={`max-w-[90%] p-3 rounded-xl text-xs font-sans leading-relaxed ${
            isUser
              ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-100 rounded-tr-none'
              : message.permissionDenied
              ? 'bg-rose-950/40 border border-rose-500/60 text-rose-200 rounded-tl-none shadow-lg'
              : message.isError
              ? 'bg-amber-950/40 border border-amber-500/60 text-amber-200 rounded-tl-none shadow-lg'
              : 'bg-space-900/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-lg'
          }`}
        >
          {message.permissionDenied && (
            <div className="font-mono text-[10px] font-bold text-rose-400 mb-1 flex items-center gap-1">
              <ShieldX className="w-3 h-3" />
              <span>HTTP 403 — ACCESS RESTRICTED</span>
            </div>
          )}
          {message.text}
          {message.requiredPermission && (
            <div className="mt-2 pt-2 border-t border-rose-500/30 font-mono text-[10px] text-rose-300/80">
              Required Permission: <span className="font-bold text-rose-200">{message.requiredPermission}</span>
            </div>
          )}
        </div>
      )}

      {message.result && (
        <div className="w-full mt-1">
          <ResultCard result={message.result} />
        </div>
      )}
    </div>
  );
};

