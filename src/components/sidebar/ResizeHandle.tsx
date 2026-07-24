import { useRef, useCallback } from 'react';

export function ResizeHandle({
  width,
  onResize,
  onToggleCollapse,
  minWidth = 56,
  maxWidth = 480,
}: {
  width: number;
  onResize: (w: number) => void;
  onToggleCollapse: () => void;
  minWidth?: number;
  maxWidth?: number;
}) {
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = width;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = startWidth + (ev.clientX - startX);
      if (newWidth < minWidth - 10) {
        // Below threshold - will collapse
      }
      onResize(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width, onResize, minWidth, maxWidth]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onToggleCollapse}
      className="absolute top-0 right-0 w-1 h-full cursor-col-resize group/resizer hover:bg-blue-400/40 active:bg-blue-500 transition-colors"
      style={{ marginRight: '-2px' }}
    >
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 rounded-full bg-stone-300 dark:bg-stone-600 opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
    </div>
  );
}
