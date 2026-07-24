import { useState, useRef, useEffect } from 'react';
import { Search, FileText, Database as DatabaseIcon, Hash } from 'lucide-react';
import type { Block } from '../../lib/supabase';

export function SearchBar({
  blocks,
  onSelect,
  collapsed,
}: {
  blocks: Record<string, Block>;
  onSelect: (pageId: string) => void;
  collapsed: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = query.trim()
    ? Object.values(blocks)
        .filter((b) => b.type === 'page' || b.type === 'database')
        .filter((b) => (b.content || 'Untitled').toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : [];

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <button
          onClick={() => {
            const el = document.querySelector<HTMLInputElement>('input[data-sidebar-search]');
            el?.focus();
          }}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-2 pt-1">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-100 dark:bg-stone-700/50 rounded-md text-stone-400 dark:text-stone-500 focus-within:ring-2 focus-within:ring-blue-400/40 transition-all">
        <Search className="w-4 h-4 shrink-0" />
        <input
          ref={inputRef}
          data-sidebar-search
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelectedIndex(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter' && results[selectedIndex]) { onSelect(results[selectedIndex].id); setQuery(''); setOpen(false); }
            else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
          }}
          placeholder="Search..."
          className="flex-1 bg-transparent text-sm text-stone-700 dark:text-stone-300 placeholder-stone-400 outline-none min-w-0"
        />
        <kbd className="text-[10px] font-medium text-stone-400 bg-stone-200 dark:bg-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded shrink-0">⌘K</kbd>
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-50 max-h-72 overflow-y-auto">
          {results.map((block, i) => {
            const Icon = block.type === 'database' ? DatabaseIcon : FileText;
            return (
              <button
                key={block.id}
                onClick={() => { onSelect(block.id); setQuery(''); setOpen(false); }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  i === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-60" />
                <span className="truncate">{block.content || 'Untitled'}</span>
                {block.type === 'database' && <Hash className="w-3 h-3 opacity-40 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
