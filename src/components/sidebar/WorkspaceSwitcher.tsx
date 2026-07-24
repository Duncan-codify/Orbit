import { useState, useRef, useEffect } from 'react';
import type { Workspace } from '../../lib/supabase';
import { ChevronDown, ChevronUp, Check, Plus } from 'lucide-react';

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  collapsed,
}: {
  workspaces: Workspace[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = workspaces.find((ws) => ws.id === activeId);

  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
        >
          {active?.icon || '🏠'}
        </button>
        {open && (
          <div ref={ref} className="fixed top-14 left-14 w-56 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-50">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { onSelect(ws.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <span className="text-lg">{ws.icon}</span>
                <span className="text-sm text-stone-700 dark:text-stone-300">{ws.name}</span>
                {ws.id === activeId && <Check className="w-4 h-4 ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative px-2 pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors"
      >
        <span className="text-xl shrink-0">{active?.icon || '🏠'}</span>
        <span className="text-left text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">
          {active?.name || 'Workspace'}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0 ml-1" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 ml-1" />}
      </button>

      {open && (
        <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-50">
          <div className="px-3 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">Workspaces</div>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { onSelect(ws.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <span className="text-lg">{ws.icon}</span>
              <span className="flex-1 text-left text-sm text-stone-700 dark:text-stone-300">{ws.name}</span>
              {ws.id === activeId && <Check className="w-4 h-4 text-blue-500" />}
            </button>
          ))}
          <div className="border-t border-stone-100 dark:border-stone-700 my-1" />
          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-sm text-stone-600 dark:text-stone-400">
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-sm text-stone-600 dark:text-stone-400">
            <Check className="w-4 h-4 opacity-0" />
            Manage Workspaces
          </button>
        </div>
      )}
    </div>
  );
}
