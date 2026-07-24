import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, ReactNode } from 'react';

export function SidebarSection({
  name,
  expanded,
  onToggle,
  children,
  collapsed,
}: {
  name: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  collapsed: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  if (collapsed) return null;

  return (
    <div className="mt-1">
      <div
        className="flex items-center gap-1 px-2 py-1 group/section"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          onClick={onToggle}
          className="flex items-center gap-1 flex-1 min-w-0"
        >
          {expanded ? <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" /> : <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />}
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">
            {name}
          </span>
        </button>
        {hovered && expanded && (
          <div className="flex items-center">{children && <span className="block">{/* slot for actions */}</span>}</div>
        )}
      </div>
      {expanded && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

export function SidebarSectionWithAction({
  name,
  expanded,
  onToggle,
  actionButton,
  children,
}: {
  name: string;
  expanded: boolean;
  onToggle: () => void;
  actionButton?: ReactNode;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="mt-1">
      <div
        className="flex items-center gap-1 px-2 py-1"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button onClick={onToggle} className="flex items-center gap-1 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" /> : <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />}
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">{name}</span>
        </button>
        {hovered && actionButton}
      </div>
      {expanded && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}
