import React, { useState, useRef, useEffect } from 'react';
import { usePersona } from '../../context/PersonaContext';
import { UserPersona } from '../../types/persona';
import { PERSONA_CONFIGS } from '../../config/personaConfig';
import { Satellite, ShieldAlert, GraduationCap, ChevronDown, Check, ShieldCheck } from 'lucide-react';

export const PersonaSwitcher: React.FC = () => {
  const { persona, setPersona, config } = usePersona();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const personasList: UserPersona[] = ['ISRO_ANALYST', 'NDRF_OFFICER', 'PUBLIC_RESEARCHER'];

  const getPersonaIcon = (p: UserPersona) => {
    switch (p) {
      case 'ISRO_ANALYST':
        return <Satellite className="w-4 h-4 text-cyan-400" />;
      case 'NDRF_OFFICER':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'PUBLIC_RESEARCHER':
        return <GraduationCap className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-space-900/90 hover:bg-space-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-200 text-xs font-mono transition-all duration-200 shadow-sm"
        title="Switch Operational Persona"
      >
        <div className="flex items-center gap-2">
          {getPersonaIcon(persona)}
          <span className="font-semibold text-slate-100">{config.name}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-space-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2.5 border-b border-slate-800 bg-space-950/60 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Operational Clearance Engine
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">RBAC Active</span>
          </div>

          <div className="p-1.5 space-y-1">
            {personasList.map((p) => {
              const pConf = PERSONA_CONFIGS[p];
              const isSelected = persona === p;

              return (
                <button
                  key={p}
                  onClick={() => {
                    setPersona(p);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-space-800/90 border-cyan-500/40 shadow-inner'
                      : 'border-transparent hover:bg-space-850 hover:border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPersonaIcon(p)}
                      <span className={`text-xs font-bold font-mono ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {pConf.name}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 pl-6">
                    {pConf.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pl-6 pt-1">
                    {pConf.capabilities.slice(0, 2).map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-space-950/80 text-slate-400 font-mono border border-slate-800"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
