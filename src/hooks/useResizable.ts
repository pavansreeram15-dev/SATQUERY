import { useState, useCallback, useRef, useEffect } from 'react';

export type ResizeDirection = 'se' | 'sw' | 'ne' | 'nw' | 's' | 'e' | 'w' | 'n';

export interface UseResizableOptions {
  initialWidth: number;
  initialHeight?: number | 'auto';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  storageKey?: string;
}

export interface UseResizableReturn {
  width: number;
  height: number | 'auto';
  isResizing: boolean;
  resizeDirection: ResizeDirection | null;
  startResize: (direction: ResizeDirection, e: React.PointerEvent | React.MouseEvent, containerEl?: HTMLElement | null) => void;
  resetSize: () => void;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  setHeight: React.Dispatch<React.SetStateAction<number | 'auto'>>;
}

export function useResizable({
  initialWidth,
  initialHeight = 'auto',
  minWidth = 260,
  maxWidth = 900,
  minHeight = 160,
  maxHeight = 850,
  storageKey,
}: UseResizableOptions): UseResizableReturn {
  // Read persisted size if available
  const [size, setSize] = useState<{ width: number; height: number | 'auto' }>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed?.width === 'number') {
            const w = Math.max(minWidth, Math.min(maxWidth, parsed.width));
            const h =
              parsed.height === 'auto' || typeof parsed.height !== 'number'
                ? initialHeight
                : Math.max(minHeight, Math.min(maxHeight, parsed.height));
            return { width: w, height: h };
          }
        }
      } catch {
        // ignore parse error
      }
    }
    return { width: initialWidth, height: initialHeight };
  });

  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);

  const resizeStateRef = useRef<{
    isResizing: boolean;
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const startResize = useCallback(
    (direction: ResizeDirection, e: React.PointerEvent | React.MouseEvent, containerEl?: HTMLElement | null) => {
      e.preventDefault();
      e.stopPropagation();

      let measuredWidth = size.width;
      let measuredHeight = typeof size.height === 'number' ? size.height : 350;

      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        measuredWidth = rect.width;
        measuredHeight = rect.height;
      }

      setIsResizing(true);
      setResizeDirection(direction);

      resizeStateRef.current = {
        isResizing: true,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: measuredWidth,
        startHeight: measuredHeight,
      };

      const cursorMap: Record<ResizeDirection, string> = {
        se: 'se-resize',
        sw: 'sw-resize',
        ne: 'ne-resize',
        nw: 'nw-resize',
        s: 's-resize',
        e: 'e-resize',
        w: 'w-resize',
        n: 'n-resize',
      };

      document.body.style.cursor = cursorMap[direction] || 'nwse-resize';
      document.body.style.userSelect = 'none';
    },
    [size.width, size.height]
  );

  const resetSize = useCallback(() => {
    setSize({ width: initialWidth, height: initialHeight });
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [initialWidth, initialHeight, storageKey]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (!resizeStateRef.current?.isResizing) return;
      e.preventDefault();
      e.stopPropagation();

      const { direction, startX, startY, startWidth, startHeight } = resizeStateRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const dynamicMaxWidth = Math.min(maxWidth, window.innerWidth * 0.95);
      const dynamicMaxHeight = Math.min(maxHeight, window.innerHeight * 0.90);

      let nextWidth = startWidth;
      let nextHeight = startHeight;

      if (direction.includes('e')) {
        nextWidth = Math.max(minWidth, Math.min(dynamicMaxWidth, startWidth + dx));
      } else if (direction.includes('w')) {
        nextWidth = Math.max(minWidth, Math.min(dynamicMaxWidth, startWidth - dx));
      }

      if (direction.includes('s')) {
        nextHeight = Math.max(minHeight, Math.min(dynamicMaxHeight, startHeight + dy));
      } else if (direction.includes('n')) {
        nextHeight = Math.max(minHeight, Math.min(dynamicMaxHeight, startHeight - dy));
      }

      setSize({
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      });
    };

    const handlePointerUp = (e: PointerEvent | MouseEvent) => {
      if (!resizeStateRef.current?.isResizing) return;
      e.preventDefault();
      e.stopPropagation();

      resizeStateRef.current = null;
      setIsResizing(false);
      setResizeDirection(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      if (storageKey) {
        try {
          setSize((current) => {
            localStorage.setItem(storageKey, JSON.stringify(current));
            return current;
          });
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp, { passive: false });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [minWidth, maxWidth, minHeight, maxHeight, storageKey]);

  const setWidth = useCallback((updater: React.SetStateAction<number>) => {
    setSize((prev) => ({
      ...prev,
      width: typeof updater === 'function' ? updater(prev.width) : updater,
    }));
  }, []);

  const setHeight = useCallback((updater: React.SetStateAction<number | 'auto'>) => {
    setSize((prev) => ({
      ...prev,
      height: typeof updater === 'function' ? updater(prev.height) : updater,
    }));
  }, []);

  return {
    width: size.width,
    height: size.height,
    isResizing,
    resizeDirection,
    startResize,
    resetSize,
    setWidth,
    setHeight,
  };
}
