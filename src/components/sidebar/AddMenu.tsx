import { useRef, useEffect } from 'react';
import { FileText, Database as DatabaseIcon, FolderClosed, Download, LayoutTemplate, Plus } from 'lucide-react';

export function AddMenu({
  onNewPage,
  onNewDatabase,
  position,
  onClose,
}: {
  onNewPage: () => void;
  onNewDatabase: () => void;
  position: { top: number; left: number };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key); };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(position.top, window.innerHeight - 280),
    left: Math.min(position.left, window.innerWidth - 220),
    zIndex: 9999,
  };

  const Item = ({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-sm text-stone-700 dark:text-stone-300"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={ref} style={style} className="w-52 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 py-1.5">
      <Item icon={FileText} label="New Page" onClick={onNewPage} />
      <Item icon={DatabaseIcon} label="New Database" onClick={onNewDatabase} />
      <Item icon={FolderClosed} label="New Folder" onClick={() => {}} />
      <div className="border-b border-stone-100 dark:border-stone-700 my-1" />
      <Item icon={Download} label="Import" onClick={() => {}} />
      <Item icon={LayoutTemplate} label="Template" onClick={() => {}} />
    </div>
  );
}

export function AddButton({ onClick, collapsed }: { onClick: (pos: { top: number; left: number }) => void; collapsed: boolean }) {
  return (
    <button
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onClick({ top: rect.bottom + 4, left: rect.left });
      }}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 ${
        collapsed ? 'justify-center' : ''
      }`}
      title="Add"
    >
      <Plus className="w-4 h-4" />
      {!collapsed && <span className="text-xs font-medium">Add</span>}
    </button>
  );
}
