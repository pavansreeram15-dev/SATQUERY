import React from 'react';
import { ResizeDirection } from '../../hooks/useResizable';

export interface ResizeHandlesProps {
  onStartResize: (direction: ResizeDirection, e: React.PointerEvent | React.MouseEvent, containerEl?: HTMLElement | null) => void;
  onReset?: () => void;
  containerRef?: React.RefObject<HTMLElement>;
  directions?: ResizeDirection[];
  className?: string;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  onStartResize,
  onReset,
  containerRef,
  directions = ['se', 'sw', 's', 'e', 'w'],
  className = '',
}) => {
  const getContainer = () => containerRef?.current;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-visible select-none z-50 ${className}`}>
      {/* Right Edge Handle */}
      {directions.includes('e') && (
        <div
          onPointerDown={(e) => onStartResize('e', e, getContainer())}
          className="pointer-events-auto absolute top-4 -right-1 bottom-4 w-2 cursor-e-resize hover:bg-cyan-400/20 active:bg-cyan-400/40 transition-colors rounded-r"
          title="Drag to resize width"
        />
      )}

      {/* Left Edge Handle */}
      {directions.includes('w') && (
        <div
          onPointerDown={(e) => onStartResize('w', e, getContainer())}
          className="pointer-events-auto absolute top-4 -left-1 bottom-4 w-2 cursor-w-resize hover:bg-cyan-400/20 active:bg-cyan-400/40 transition-colors rounded-l"
          title="Drag to resize width"
        />
      )}

      {/* Bottom Edge Handle */}
      {directions.includes('s') && (
        <div
          onPointerDown={(e) => onStartResize('s', e, getContainer())}
          className="pointer-events-auto absolute -bottom-1 left-4 right-4 h-2 cursor-s-resize hover:bg-cyan-400/20 active:bg-cyan-400/40 transition-colors rounded-b"
          title="Drag to resize height"
        />
      )}

      {/* Bottom-Right Corner Handle (Primary HUD Grip) */}
      {directions.includes('se') && (
        <div
          onPointerDown={(e) => onStartResize('se', e, getContainer())}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onReset) onReset();
          }}
          className="pointer-events-auto group/handle absolute -bottom-1 -right-1 w-5 h-5 cursor-se-resize flex items-end justify-end p-0.5 rounded-br-2xl hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-all"
          title="Drag to resize window (Double-click to reset size)"
        >
          <svg
            className="w-3.5 h-3.5 text-cyan-400/70 group-hover/handle:text-cyan-300 group-hover/handle:scale-110 transition-all drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M14 4 L4 14 M14 8 L8 14 M14 12 L12 14" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Bottom-Left Corner Handle */}
      {directions.includes('sw') && (
        <div
          onPointerDown={(e) => onStartResize('sw', e, getContainer())}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onReset) onReset();
          }}
          className="pointer-events-auto group/handle absolute -bottom-1 -left-1 w-5 h-5 cursor-sw-resize flex items-end justify-start p-0.5 rounded-bl-2xl hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-all"
          title="Drag to resize window (Double-click to reset size)"
        >
          <svg
            className="w-3.5 h-3.5 text-cyan-400/70 group-hover/handle:text-cyan-300 group-hover/handle:scale-110 transition-all drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M2 4 L12 14 M2 8 L8 14 M2 12 L4 14" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};
