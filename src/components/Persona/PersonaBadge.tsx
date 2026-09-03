import React from 'react';
import { usePersona } from '../../context/PersonaContext';
import { Satellite, ShieldAlert, GraduationCap } from 'lucide-react';

interface Props {
  className?: string;
  showIcon?: boolean;
}

export const PersonaBadge: React.FC<Props> = ({ className = '', showIcon = true }) => {
  const { persona, config } = usePersona();

  const getIcon = () => {
    switch (persona) {
      case 'ISRO_ANALYST':
        return <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />;
      case 'NDRF_OFFICER':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'PUBLIC_RESEARCHER':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border backdrop-blur-md transition-all duration-300 ${config.badgeColor} ${className}`}
    >
      {showIcon && getIcon()}
      <span>{config.name}</span>
    </div>
  );
};
