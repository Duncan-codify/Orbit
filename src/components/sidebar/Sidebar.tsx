import { useState, useEffect, useCallback } from 'react';
import { PanelLeftClose, PanelLeftOpen, Plus, Menu } from 'lucide-react';
import type { Block, Workspace } from '../../lib/supabase';
import { useSidebarStore } from './useSidebarStore';
import { applyTheme } from './ThemeToggle';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SearchBar } from './SearchBar';
import { SidebarSectionWithAction } from './SidebarSection';
import { TreeNode } from './TreeNode';
import { PageContextMenu } from './PageContextMenu';
import { AddMenu } from './AddMenu';
import { ResizeHandle } from './ResizeHandle';
import { SidebarFooter } from './SidebarFooter';

interface SidebarProps {
  workspaces: Workspace[];
  blocks: Record<string, Block>;
  activeWorkspaceId: string;
  activePageId: string | null;
  onSwitchWorkspace: (id: string) => void;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId: string | null, workspaceId?: string) => Promise<string>;
  onUpdateBlock: (id: string, updates: Partial<Block>) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onRefetch: () => Promise<void>;
}

export function Sidebar({
  workspaces,
  blocks,
  activeWorkspaceId,
  activePageId,
  onSwitchWorkspace,
  onSelectPage,
  onCreatePage,
  onUpdateBlock,
  onDeleteBlock,
  onRefetch,
}: SidebarProps) {
  const { state, setWidth, toggleCollapsed, setCollapsed, toggleSection, togglePageExpand, setTheme, addRecent, toggleFavorite } = useSidebarStore();
  const [contextMenu, setContextMenu] = useState<{ pageId: string; pos: { top: number; left: number } } | null>(null);
  const [addMenu, setAddMenu] = useState<{ pos: { top: number; left: number } } | null>(null);
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const effectiveCollapsed = state.collapsed && !hovered;

  useEffect(() => {
    if (!state.collapsed) setHovered(false);
  }, [state.collapsed]);

  // DnD state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<'before' | 'after' | 'inside' | null>(null);

  // Theme
  useEffect(() => { applyTheme(state.theme); }, [state.theme]);
  useEffect(() => {
    if (state.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [state.theme]);

  // Track recents on page open
  useEffect(() => {
    if (activePageId) addRecent(activePageId);
  }, [activePageId, addRecent]);

  // Ctrl+N new page
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onCreatePage(null, activeWorkspaceId);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCreatePage, activeWorkspaceId]);

  const rootPages = Object.values(blocks).filter(
    (b) => b.type === 'page' && b.parent_id === null && b.workspace_id === activeWorkspaceId
  );

  // Favorites: pages whose properties.favorite is true, or in store favorites
  const favoritePages = rootPages.filter(
    (p) => !!(p.properties?.favorite) || state.favorites.includes(p.id)
  );

  // Recents: map IDs to blocks that still exist
  const recentPages = state.recents
    .map((id) => blocks[id])
    .filter((b): b is Block => !!b && b.type === 'page')
    .slice(0, 10);

  // ---- DnD handlers ----
  const handleDragStart = useCallback((e: React.DragEvent, pageId: string) => {
    setDraggedId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
    setDragPos(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedId || draggedId === pageId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    if (y < h * 0.25) { setDragOverId(pageId); setDragPos('before'); }
    else if (y > h * 0.75) { setDragOverId(pageId); setDragPos('after'); }
    else { setDragOverId(pageId); setDragPos('inside'); }
  }, [draggedId]);

  const movePage = async (draggedId: string, targetId: string, pos: 'before' | 'after' | 'inside') => {
    const dragged = blocks[draggedId];
    const target = blocks[targetId];
    if (!dragged || !target) return;

    // Prevent dropping a parent into its own descendant
    let check: string | null = target.parent_id;
    while (check) {
      if (check === draggedId) return; // would create cycle
      const ancestor = blocks[check];
      if (!ancestor) break;
      check = ancestor.parent_id;
    }

    // Remove from old parent's children
    if (dragged.parent_id) {
      const oldParent = blocks[dragged.parent_id];
      if (oldParent) {
        const newChildren = (oldParent.children || []).filter((id) => id !== draggedId);
        await onUpdateBlock(oldParent.id, { children: newChildren });
      }
    }

    if (pos === 'inside') {
      // Add as child of target
      const targetChildren = [...(target.children || []), draggedId];
      await onUpdateBlock(targetId, { children: targetChildren });
      await onUpdateBlock(draggedId, { parent_id: targetId });
    } else {
      // Insert before/after target in target's parent's children
      const targetParentId = target.parent_id;
      const siblings = targetParentId
        ? [...(blocks[targetParentId]?.children || [])]
        : rootPages.map((p) => p.id);

      const filtered = siblings.filter((id) => id !== draggedId);
      const targetIdx = filtered.indexOf(targetId);
      const insertIdx = pos === 'before' ? targetIdx : targetIdx + 1;
      filtered.splice(insertIdx, 0, draggedId);

      if (targetParentId) {
        await onUpdateBlock(targetParentId, { children: filtered });
      }
      await onUpdateBlock(draggedId, { parent_id: targetParentId });
    }

    await onRefetch();
  };

  const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }
    if (dragPos) await movePage(draggedId, targetId, dragPos);
    handleDragEnd();
  }, [draggedId, dragPos, handleDragEnd, movePage]);

  // ---- Context menu actions ----
  const handleRename = (pageId: string) => {
    onSelectPage(pageId);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Untitled"]');
      if (input) { input.focus(); input.select(); }
    }, 100);
  };

  const handleDuplicate = async (pageId: string) => {
    const page = blocks[pageId];
    if (!page) return;
    const newId = await onCreatePage(page.parent_id, page.workspace_id);
    await onUpdateBlock(newId, { content: `${page.content} (copy)`, properties: { ...page.properties } });
  };

  const handleCopyLink = (pageId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${pageId}`);
  };

  const handleOpenInNewTab = (pageId: string) => {
    window.open(`${window.location.origin}${window.location.pathname}#${pageId}`, '_blank');
  };

  const handleMoveTo = async (pageId: string) => {
    await onUpdateBlock(pageId, { parent_id: null });
    await onRefetch();
  };

  const handleToggleFavorite = async (pageId: string) => {
    const page = blocks[pageId];
    if (!page) return;
    const isFav = !!(page.properties?.favorite);
    await onUpdateBlock(pageId, { properties: { ...page.properties, favorite: !isFav } });
    toggleFavorite(pageId);
  };

  const contextPage = contextMenu ? blocks[contextMenu.pageId] : null;

  const ICON_OPTIONS = ['📄','📊','🗂️','📋','📈','💡','🎯','✅','🔔','📦','🏷️','🧩','⚙️','🚀','🔥','⭐','💎','🎨','📝','🗓️','📁','📌','🔍','💬'];

  const sidebarContent = (
    <div
      className={`relative flex flex-col h-full bg-white dark:bg-stone-900 transition-all duration-200 ${effectiveCollapsed ? 'w-14' : ''}`}
      style={{ width: effectiveCollapsed ? 56 : state.width }}
    >
      {/* Workspace switcher */}
      <WorkspaceSwitcher
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onSelect={onSwitchWorkspace}
        collapsed={effectiveCollapsed}
      />

      {/* Search */}
      <SearchBar
        blocks={blocks}
        onSelect={onSelectPage}
        collapsed={effectiveCollapsed}
      />

      {/* Collapse toggle (top-right) */}
      <button
        onClick={toggleCollapsed}
        className="absolute top-2.5 right-2 p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 transition-colors"
        title={effectiveCollapsed ? 'Expand' : 'Collapse'}
      >
        {effectiveCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>

      {/* Scrollable tree area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 pb-2 sidebar-scroll">
        {/* Favorites section */}
        {!effectiveCollapsed && favoritePages.length > 0 && (
          <SidebarSectionWithAction
            name="Favorites"
            expanded={!!state.expandedSections.Favorites}
            onToggle={() => toggleSection('Favorites')}
          >
            {favoritePages.map((page) => (
              <TreeNode
                key={page.id}
                page={page}
                blocks={blocks}
                depth={0}
                activePageId={activePageId}
                expandedPages={state.expandedPages}
                onToggleExpand={togglePageExpand}
                onSelect={onSelectPage}
                onAddChild={(pid) => onCreatePage(pid, activeWorkspaceId)}
                onContextMenu={(pid, pos) => setContextMenu({ pageId: pid, pos })}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggedId={draggedId}
                dragOverId={dragOverId}
                dragPos={dragPos}
                collapsed={false}
                isFavorite
              />
            ))}
          </SidebarSectionWithAction>
        )}

        {/* Private / root pages */}
        <SidebarSectionWithAction
          name="Private"
          expanded={!!state.expandedSections.Private}
          onToggle={() => toggleSection('Private')}
          actionButton={
            <button
              onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setAddMenu({ pos: { top: r.bottom + 4, left: r.left } }); }}
              className="p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          }
        >
          {rootPages.length === 0 ? (
            <button
              onClick={() => onCreatePage(null, activeWorkspaceId)}
              className="w-full text-left px-2 py-1.5 text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md transition-colors"
            >
              {effectiveCollapsed ? '' : '+ New page'}
            </button>
          ) : (
            rootPages.map((page) => (
              <TreeNode
                key={page.id}
                page={page}
                blocks={blocks}
                depth={0}
                activePageId={activePageId}
                expandedPages={state.expandedPages}
                onToggleExpand={togglePageExpand}
                onSelect={onSelectPage}
                onAddChild={(pid) => onCreatePage(pid, activeWorkspaceId)}
                onContextMenu={(pid, pos) => setContextMenu({ pageId: pid, pos })}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggedId={draggedId}
                dragOverId={dragOverId}
                dragPos={dragPos}
                collapsed={false}
              />
            ))
          )}
        </SidebarSectionWithAction>

        {/* Shared section (placeholder empty) */}
        <SidebarSectionWithAction
          name="Shared"
          expanded={!!state.expandedSections.Shared}
          onToggle={() => toggleSection('Shared')}
        >
          <div className="px-2 py-1.5 text-xs text-stone-400">No shared pages</div>
        </SidebarSectionWithAction>

        {/* Recent section */}
        {!effectiveCollapsed && recentPages.length > 0 && (
          <SidebarSectionWithAction
            name="Recent"
            expanded={state.expandedSections.Recent ?? true}
            onToggle={() => toggleSection('Recent')}
          >
            {recentPages.map((page) => (
              <TreeNode
                key={page.id}
                page={page}
                blocks={blocks}
                depth={0}
                activePageId={activePageId}
                expandedPages={state.expandedPages}
                onToggleExpand={togglePageExpand}
                onSelect={onSelectPage}
                onAddChild={(pid) => onCreatePage(pid, activeWorkspaceId)}
                onContextMenu={(pid, pos) => setContextMenu({ pageId: pid, pos })}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggedId={draggedId}
                dragOverId={dragOverId}
                dragPos={dragPos}
                collapsed={false}
              />
            ))}
          </SidebarSectionWithAction>
        )}
      </div>

      {/* Footer */}
      <SidebarFooter collapsed={effectiveCollapsed} theme={state.theme} onThemeChange={setTheme} />

      {/* Resize handle */}
      {!effectiveCollapsed && (
        <ResizeHandle width={state.width} onResize={setWidth} onToggleCollapse={toggleCollapsed} />
      )}

      {/* Context menu */}
      {contextMenu && contextPage && (
        <PageContextMenu
          page={contextPage}
          position={contextMenu.pos}
          onClose={() => setContextMenu(null)}
          onRename={() => handleRename(contextMenu.pageId)}
          onDuplicate={() => handleDuplicate(contextMenu.pageId)}
          onDelete={() => onDeleteBlock(contextMenu.pageId)}
          onToggleFavorite={() => handleToggleFavorite(contextMenu.pageId)}
          onMoveTo={() => handleMoveTo(contextMenu.pageId)}
          onCopyLink={() => handleCopyLink(contextMenu.pageId)}
          onOpenInNewTab={() => handleOpenInNewTab(contextMenu.pageId)}
          onChangeIcon={() => setIconPickerFor(contextMenu.pageId)}
        />
      )}

      {/* Add menu */}
      {addMenu && (
        <AddMenu
          position={addMenu.pos}
          onClose={() => setAddMenu(null)}
          onNewPage={() => onCreatePage(null, activeWorkspaceId)}
          onNewDatabase={() => onCreatePage(null, activeWorkspaceId)}
        />
      )}

      {/* Icon picker popover */}
      {iconPickerFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/30 backdrop-blur-sm" onClick={() => setIconPickerFor(null)}>
          <div className="w-80 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Choose an icon</h3>
            <div className="grid grid-cols-8 gap-1">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={async () => {
                    const page = blocks[iconPickerFor];
                    if (page) await onUpdateBlock(iconPickerFor, { properties: { ...page.properties, icon: ic } });
                    setIconPickerFor(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {state.collapsed ? (
        <div
          className="hidden md:block shrink-0"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={() => { setCollapsed(false); setHovered(false); }}
            className="p-2 m-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Open sidebar"
          >
            <Menu className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
          <div
            className={`fixed top-12 left-0 bottom-0 z-40 shadow-2xl transition-transform duration-200 ${
              hovered ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex shrink-0 border-r border-stone-200/60 dark:border-stone-700/60">
          {sidebarContent}
        </div>
      )}

      {/* Mobile: hamburger + drawer */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-white dark:bg-stone-800 shadow-md border border-stone-200 dark:border-stone-700"
        >
          <PanelLeftOpen className="w-5 h-5 text-stone-600 dark:text-stone-300" />
        </button>
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[80vw] shadow-2xl">
              {sidebarContent}
            </div>
          </>
        )}
      </div>
    </>
  );
}
