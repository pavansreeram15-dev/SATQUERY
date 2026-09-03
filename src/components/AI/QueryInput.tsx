import React, { useState } from 'react';
import { useMapContext } from '../../context/MapContext';
import { Send, MapPin, Eraser, Sparkles } from 'lucide-react';

interface Props {
  onSendQuery: (prompt: string) => void;
  isLoading: boolean;
}

export const QueryInput: React.FC<Props> = ({ onSendQuery, isLoading }) => {
  const [prompt, setPrompt] = useState<string>('');
  const { activeRegion, drawnBBox } = useMapContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSendQuery(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 font-mono text-xs">
      {/* Context Badge */}
      <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <span>Active Context:</span>
          <span className="font-semibold text-slate-200 truncate">{activeRegion.name}</span>
          {drawnBBox && <span className="text-cyan-400 font-bold">(Custom BBOX)</span>}
        </div>
        {prompt && (
          <button
            type="button"
            onClick={() => setPrompt('')}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <Eraser className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Textarea Box */}
      <div className="relative rounded-xl bg-space-900/90 border border-slate-700/80 focus-within:border-cyan-500/80 shadow-2xl backdrop-blur-md transition-all">
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this satellite region... (e.g. Count cargo ships, Highlight flooded areas)"
          disabled={isLoading}
          className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-800/60">
          <span className="text-[10px] text-slate-500">Press Enter ↵ to run query</span>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-space-800 text-black disabled:text-slate-500 font-bold transition-all shadow-md shadow-cyan-500/20 disabled:shadow-none"
          >
            <span>Run Pipeline</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </form>
  );
};
