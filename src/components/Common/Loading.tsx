import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ message = 'Loading Earth Observation Data...', size = 'md' }: LoadingProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 text-slate-300">
      <Loader2 className={`${sizeMap[size]} animate-spin text-emerald-400`} />
      {message && <p className="text-xs font-mono tracking-wider text-slate-400 uppercase">{message}</p>}
    </div>
  );
}
