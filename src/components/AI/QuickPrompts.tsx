import React from 'react';
import { usePersona } from '../../context/PersonaContext';
import { Sparkles } from 'lucide-react';

interface Props {
  onSelectPrompt: (prompt: string) => void;
}

export const QuickPrompts: React.FC<Props> = ({ onSelectPrompt }) => {
  const { config } = usePersona();

  return (
    <div className="space-y-1.5 font-mono text-xs">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Mission Quick Workflows</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {config.quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left px-2.5 py-1 rounded-lg bg-space-900/80 hover:bg-space-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-[11px] transition-all duration-150 shadow-sm"
          >
            &rarr; {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
