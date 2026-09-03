import React from 'react';
import { usePersona } from '../../context/PersonaContext';
import { PersonaPermissions } from '../../types/persona';
import { Lock } from 'lucide-react';

interface Props {
  permissionKey?: keyof PersonaPermissions;
  allowedPersonas?: Array<'ISRO_ANALYST' | 'NDRF_OFFICER' | 'PUBLIC_RESEARCHER'>;
  fallbackText?: string;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<Props> = ({
  permissionKey,
  allowedPersonas,
  fallbackText = 'This module requires elevated operational clearance.',
  children,
}) => {
  const { persona, hasPermission } = usePersona();

  let isAllowed = true;

  if (permissionKey && !hasPermission(permissionKey)) {
    isAllowed = false;
  }

  if (allowedPersonas && !allowedPersonas.includes(persona)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    return (
      <div className="p-3 rounded-lg border border-dashed border-slate-700/80 bg-space-950/60 text-slate-400 text-xs font-mono flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
        <span>{fallbackText}</span>
      </div>
    );
  }

  return <>{children}</>;
};
