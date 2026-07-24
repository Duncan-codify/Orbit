import { useState, ReactNode } from 'react';

export function Tooltip({ label, children, side = 'right' }: { label: string; children: ReactNode; side?: 'right' | 'left' | 'top' | 'bottom' }) {
  const [show, setShow] = useState(false);

  const pos: Record<string, string> = {
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`fixed z-[100] pointer-events-none px-2 py-1 text-xs font-medium text-white bg-stone-800 rounded-md shadow-lg whitespace-nowrap ${pos[side]}`}>
          {label}
        </div>
      )}
    </div>
  );
}
