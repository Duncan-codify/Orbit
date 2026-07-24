import {
  ChevronDown, ChevronRight, MoreHorizontal, Plus, Star,
} from 'lucide-react';
import type { Block } from '../../lib/supabase';
import { Tooltip } from './Tooltip';

interface TreeNodeProps {
  page: Block;
  blocks: Record<string, Block>;
  depth: number;
  activePageId: string | null;
  expandedPages: string[];
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onContextMenu: (pageId: string, pos: { top: number; left: number }) => void;
  onDragStart: (e: React.DragEvent, pageId: string) => void;
  onDragOver: (e: React.DragEvent, pageId: string) => void;
  onDrop: (e: React.DragEvent, pageId: string) => void;
  onDragEnd: () => void;
  draggedId: string | null;
  dragOverId: string | null;
  dragPos: 'before' | 'after' | 'inside' | null;
  collapsed: boolean;
  isFavorite?: boolean;
}

export function TreeNode({
  page,
  blocks,
  depth,
  activePageId,
  expandedPages,
  onToggleExpand,
  onSelect,
  onAddChild,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedId,
  dragOverId,
  dragPos,
  collapsed,
  isFavorite,
}: TreeNodeProps) {
  const isExpanded = expandedPages.includes(page.id);
  const isActive = activePageId === page.id;
  const isDragged = draggedId === page.id;
  const isDragOver = dragOverId === page.id;

  const children = (page.children || [])
    .map((id) => blocks[id])
    .filter((b): b is Block => !!b && b.type === 'page');

  const icon = (page.properties?.icon as string) || '📄';

  if (collapsed) {
    return (
      <>
        <div className="flex justify-center py-0.5">
          <Tooltip label={page.content || 'Untitled'}>
            <button
              onClick={() => onSelect(page.id)}
              onContextMenu={(e) => { e.preventDefault(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onContextMenu(page.id, { top: r.bottom + 4, left: r.right + 4 }); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                isActive ? 'bg-stone-200 dark:bg-stone-600' : 'hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
              }`}
            >
              {icon}
            </button>
          </Tooltip>
        </div>
        {isExpanded && children.map((c) => (
          <TreeNode key={c.id} page={c} blocks={blocks} depth={0} activePageId={activePageId} expandedPages={expandedPages}
            onToggleExpand={onToggleExpand} onSelect={onSelect} onAddChild={onAddChild} onContextMenu={onContextMenu}
            onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
            draggedId={draggedId} dragOverId={dragOverId} dragPos={dragPos} collapsed />
        ))}
      </>
    );
  }

  const indent = depth * 14 + 8;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, page.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, page.id)}
        onDrop={(e) => onDrop(e, page.id)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(page.id, { top: e.clientY, left: e.clientX }); }}
        className={`group relative flex items-center gap-1 py-1 pr-1 rounded-md cursor-pointer transition-all duration-200 ${
          isDragged ? 'opacity-30' : ''
        } ${
          isDragOver && dragPos === 'inside' ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300' : ''
        } ${
          isActive ? 'bg-stone-200/70 dark:bg-stone-600/70 text-stone-900 dark:text-stone-100' : 'hover:bg-stone-200/50 dark:hover:bg-stone-700/50 text-stone-700 dark:text-stone-300'
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => onSelect(page.id)}
      >
        {/* Drop indicators */}
        {isDragOver && dragPos === 'before' && <div className="absolute left-0 right-0 top-0 h-0.5 bg-blue-500 rounded-full" />}
        {isDragOver && dragPos === 'after' && <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 rounded-full" />}

        {/* Expand/collapse */}
        {children.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(page.id); }}
            className="p-0.5 rounded hover:bg-stone-300/50 dark:hover:bg-stone-600/50 shrink-0"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3 text-stone-400" /> : <ChevronRight className="w-3 h-3 text-stone-400" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Icon */}
        <span className="text-base shrink-0 leading-none">{icon}</span>

        {/* Title */}
        <span className="flex-1 text-sm truncate min-w-0">{page.content || 'Untitled'}</span>

        {isFavorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />}

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            title="Delete, duplicate, and more"
            onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onContextMenu(page.id, { top: r.bottom + 4, left: r.left - 200 }); }}
            className="p-1 rounded hover:bg-stone-300/50 dark:hover:bg-stone-600/50 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            title="Add a page inside"
            onClick={(e) => { e.stopPropagation(); onAddChild(page.id); }}
            className="p-1 rounded hover:bg-stone-300/50 dark:hover:bg-stone-600/50 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && children.map((child) => (
        <TreeNode
          key={child.id}
          page={child}
          blocks={blocks}
          depth={depth + 1}
          activePageId={activePageId}
          expandedPages={expandedPages}
          onToggleExpand={onToggleExpand}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onContextMenu={onContextMenu}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          draggedId={draggedId}
          dragOverId={dragOverId}
          dragPos={dragPos}
          collapsed={false}
        />
      ))}
    </div>
  );
}
