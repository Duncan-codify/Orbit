import { useRef, useEffect } from 'react';
import {
  Star, Link as LinkIcon, Copy, PenLine, ArrowRight, Trash2,
  BookOpen, ExternalLink, PanelRight, MoreHorizontal, Smile,
} from 'lucide-react';
import type { Block } from '../../lib/supabase';

interface PageContextMenuProps {
  page: Block;
  position: { top: number; left: number };
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onMoveTo: () => void;
  onCopyLink: () => void;
  onOpenInNewTab: () => void;
  onChangeIcon: () => void;
}

export function PageContextMenu({
  page,
  position,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onMoveTo,
  onCopyLink,
  onOpenInNewTab,
  onChangeIcon,
}: PageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFavorite = !!(page.properties?.favorite);

  useEffect(() => {
    const click = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key); };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(position.top, window.innerHeight - 380),
    left: Math.min(position.left, window.innerWidth - 240),
    zIndex: 9999,
  };

  const Item = ({ icon: Icon, label, onClick, danger, shortcut }: { icon: typeof Star; label: string; onClick: () => void; danger?: boolean; shortcut?: string }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-sm ${danger ? 'text-red-600 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-xs text-stone-400">{shortcut}</span>}
    </button>
  );

  const lastEdited = page.updated_at ? new Date(page.updated_at).toLocaleString() : null;

  return (
    <div ref={ref} style={style} className="w-56 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 py-1.5">
      <div className="px-3 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">Page</div>
      <div className="border-b border-stone-100 dark:border-stone-700 mb-1" />
      <Item icon={Smile} label="Change icon" onClick={() => { onChangeIcon(); onClose(); }} />
      <Item icon={Star} label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} onClick={() => { onToggleFavorite(); onClose(); }} />
      <Item icon={LinkIcon} label="Copy link" onClick={() => { onCopyLink(); onClose(); }} />
      <div className="border-b border-stone-100 dark:border-stone-700 my-1" />
      <Item icon={Copy} label="Duplicate" onClick={() => { onDuplicate(); onClose(); }} shortcut="Ctrl+D" />
      <Item icon={PenLine} label="Rename" onClick={() => { onRename(); onClose(); }} shortcut="Ctrl+⇧+R" />
      <Item icon={ArrowRight} label="Move to" onClick={() => { onMoveTo(); onClose(); }} />
      <Item icon={Trash2} label="Move to Trash" onClick={() => { onDelete(); onClose(); }} danger />
      <div className="border-b border-stone-100 dark:border-stone-700 my-1" />
      <Item icon={BookOpen} label="Turn into wiki" onClick={onClose} />
      <Item icon={ExternalLink} label="Open in new tab" onClick={() => { onOpenInNewTab(); onClose(); }} />
      <Item icon={PanelRight} label="Open in side peek" onClick={onClose} />
      {lastEdited && (
        <>
          <div className="border-b border-stone-100 dark:border-stone-700 my-1" />
          <div className="px-3 py-1.5 text-xs text-stone-400">
            <div>Last edited by you</div>
            <div>{lastEdited}</div>
          </div>
        </>
      )}
    </div>
  );
}

export { MoreHorizontal };
