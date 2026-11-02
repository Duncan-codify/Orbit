import { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  FileText,
  Star,
  Database as DatabaseIcon,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Check,
  Loader2,
  StickyNote,
} from 'lucide-react';
import type { Block } from '../lib/supabase';
import { useSidebarStore } from './sidebar/useSidebarStore';
import { TemplateGallery } from './TemplateGallery';
import { TEMPLATES } from '../lib/templates';

interface DashboardProps {
  blocks: Record<string, Block>;
  activeWorkspaceId: string;
  workspaces: { id: string; name: string; icon: string }[];
  onCreatePage: (parentId: string | null, workspaceId?: string) => Promise<string>;
  onUpdateBlock: (id: string, updates: Partial<Block>) => Promise<void>;
  onSelectPage: (id: string) => void;
  onRefetch: () => Promise<void>;
}

export function Dashboard({
  blocks,
  activeWorkspaceId,
  workspaces,
  onCreatePage,
  onUpdateBlock,
  onSelectPage,
  onRefetch,
}: DashboardProps) {
  const { state } = useSidebarStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [togglingTodo, setTogglingTodo] = useState<string | null>(null);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const allBlocks = Object.values(blocks);
  const wsBlocks = allBlocks.filter((b) => b.workspace_id === activeWorkspaceId);

  // Stats
  const stats = useMemo(() => {
    const pages = wsBlocks.filter((b) => b.type === 'page');
    const todos = wsBlocks.filter((b) => b.type === 'todo');
    const doneTodos = todos.filter((b) => !!(b.properties as Record<string, unknown>)?.checked);
    const favorites = pages.filter((b) => !!(b.properties as Record<string, unknown>)?.favorite);
    const databases = wsBlocks.filter((b) => b.type === 'database');
    return {
      totalPages: pages.length,
      totalTodos: todos.length,
      doneTodos: doneTodos.length,
      favorites: favorites.length,
      databases: databases.length,
    };
  }, [wsBlocks]);

  // Today's tasks — todo blocks, incomplete first, limited to 8
  const tasks = useMemo(() => {
    return wsBlocks
      .filter((b) => b.type === 'todo')
      .sort((a, b) => {
        const aDone = !!(a.properties as Record<string, unknown>)?.checked ? 1 : 0;
        const bDone = !!(b.properties as Record<string, unknown>)?.checked ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (b.updated_at || '').localeCompare(a.updated_at || '');
      })
      .slice(0, 8);
  }, [wsBlocks]);

  // Recent pages — from sidebar store recents + by updated_at
  const recentPages = useMemo(() => {
    const recentsFromStore = state.recents
      .map((id) => blocks[id])
      .filter((b): b is Block => !!b && b.type === 'page' && b.workspace_id === activeWorkspaceId);
    if (recentsFromStore.length >= 5) return recentsFromStore.slice(0, 6);
    // fill with most recently updated pages
    const byDate = wsBlocks
      .filter((b) => b.type === 'page')
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    const seen = new Set(recentsFromStore.map((p) => p.id));
    const fill = byDate.filter((p) => !seen.has(p.id)).slice(0, 6 - recentsFromStore.length);
    return [...recentsFromStore, ...fill].slice(0, 6);
  }, [state.recents, blocks, wsBlocks, activeWorkspaceId]);

  // Favorite/pinned pages
  const favoritePages = useMemo(() => {
    return wsBlocks
      .filter((b) => b.type === 'page' && !!(b.properties as Record<string, unknown>)?.favorite)
      .slice(0, 6);
  }, [wsBlocks]);

  const toggleTodo = async (todoBlock: Block) => {
    const isChecked = !!(todoBlock.properties as Record<string, unknown>)?.checked;
    setTogglingTodo(todoBlock.id);
    await onUpdateBlock(todoBlock.id, {
      properties: { ...todoBlock.properties, checked: !isChecked },
    });
    setTogglingTodo(null);
  };

  const handleQuickNote = async () => {
    const text = quickNote.trim();
    if (!text) return;
    setCreatingNote(true);
    const pageId = await onCreatePage(null, activeWorkspaceId);
    await onUpdateBlock(pageId, {
      content: text,
      properties: { icon: '📝', description: 'Quick note' },
    });
    await onRefetch();
    setQuickNote('');
    setCreatingNote(false);
    onSelectPage(pageId);
  };

  const workspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const completionRate = stats.totalTodos > 0 ? Math.round((stats.doneTodos / stats.totalTodos) * 100) : 0;

  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-950">
      {/* Hero gradient banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-stone-50 to-teal-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">
                {dayName}, {dateStr}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {greeting}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm md:text-base">
                {workspace ? `${workspace.icon} ${workspace.name}` : 'Your workspace'} —{' '}
                {stats.totalTodos > 0
                  ? `${stats.doneTodos}/${stats.totalTodos} tasks done today`
                  : 'Ready to build something great'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onCreatePage(null, activeWorkspaceId)}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-sm font-medium hover:scale-[1.02] hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                New Page
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl text-sm font-medium border border-stone-200 dark:border-stone-700 hover:scale-[1.02] hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 pb-16 -mt-2">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Pages"
            value={stats.totalPages}
            accent="blue"
          />
          <StatCard
            icon={<CheckSquare className="w-5 h-5" />}
            label="Tasks Done"
            value={`${stats.doneTodos}/${stats.totalTodos}`}
            accent="green"
            progress={completionRate}
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Favorites"
            value={stats.favorites}
            accent="amber"
          />
          <StatCard
            icon={<DatabaseIcon className="w-5 h-5" />}
            label="Databases"
            value={stats.databases}
            accent="teal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column — Tasks + Quick Capture */}
          <div className="lg:col-span-2 space-y-5">
            {/* Today's Tasks */}
            <Card>
              <CardHeader
                icon={<CheckSquare className="w-4 h-4" />}
                title="Today's Tasks"
                count={stats.totalTodos}
              />
              {tasks.length === 0 ? (
                <EmptyState
                  icon={<CheckSquare className="w-8 h-8" />}
                  text="No tasks yet. Add a to-do block to any page to see it here."
                />
              ) : (
                <div className="space-y-1">
                  {tasks.map((task) => {
                    const isChecked = !!(task.properties as Record<string, unknown>)?.checked;
                    const isLoading = togglingTodo === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => toggleTodo(task)}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group text-left"
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-stone-300 dark:border-stone-600 group-hover:border-emerald-400'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          ) : isChecked ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : null}
                        </span>
                        <span
                          className={`flex-1 text-sm truncate ${
                            isChecked
                              ? 'text-stone-400 dark:text-stone-600 line-through'
                              : 'text-stone-700 dark:text-stone-200'
                          }`}
                        >
                          {task.content || 'Untitled task'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Quick Capture */}
            <Card>
              <CardHeader icon={<StickyNote className="w-4 h-4" />} title="Quick Capture" />
              <div className="px-3 pb-3">
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleQuickNote();
                    }
                  }}
                  placeholder="Jot down a thought... (Cmd+Enter to save as page)"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/50 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none placeholder-stone-400 dark:placeholder-stone-600 transition-all"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-stone-400 dark:text-stone-600">
                    {quickNote.trim() ? 'Creates a new page' : 'Type something to capture'}
                  </span>
                  <button
                    onClick={handleQuickNote}
                    disabled={!quickNote.trim() || creatingNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg disabled:opacity-30 hover:scale-[1.02] transition-all"
                  >
                    {creatingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column — Favorites + Recent + Templates */}
          <div className="space-y-5">
            {/* Favorites */}
            <Card>
              <CardHeader icon={<Star className="w-4 h-4" />} title="Pinned" count={favoritePages.length} />
              {favoritePages.length === 0 ? (
                <EmptyState
                  icon={<Star className="w-7 h-7" />}
                  text="Star pages from the sidebar to pin them here."
                />
              ) : (
                <div className="space-y-0.5">
                  {favoritePages.map((page) => (
                    <PageRow key={page.id} page={page} onClick={() => onSelectPage(page.id)} />
                  ))}
                </div>
              )}
            </Card>

            {/* Recent */}
            <Card>
              <CardHeader icon={<Clock className="w-4 h-4" />} title="Recent" count={recentPages.length} />
              {recentPages.length === 0 ? (
                <EmptyState
                  icon={<FileText className="w-7 h-7" />}
                  text="Pages you open will appear here."
                />
              ) : (
                <div className="space-y-0.5">
                  {recentPages.map((page) => (
                    <PageRow key={page.id} page={page} onClick={() => onSelectPage(page.id)} showDate />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Template shortcuts */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-stone-400" />
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">Quick Start Templates</h3>
            </div>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TEMPLATES.slice(0, 8).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setShowTemplates(true)}
                className="group flex items-center gap-3 p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all text-left"
              >
                <span className="text-2xl shrink-0">{tpl.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tpl.name}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Summary bar */}
        {stats.totalTodos > 0 && (
          <div className="mt-8 flex items-center gap-4 p-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Task Progress</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                {completionRate === 100
                  ? 'All tasks complete — great work!'
                  : `${stats.totalTodos - stats.doneTodos} task${stats.totalTodos - stats.doneTodos !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
            <div className="w-32 md:w-48">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span>{completionRate}%</span>
                <span>{stats.doneTodos}/{stats.totalTodos}</span>
              </div>
              <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showTemplates && (
        <TemplateGallery
          workspaceId={activeWorkspaceId}
          onClose={() => setShowTemplates(false)}
          onInstalled={async (pageId) => {
            await onRefetch();
            onSelectPage(pageId);
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

const ACCENT_MAP: Record<string, { bg: string; icon: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', icon: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500' },
};

function StatCard({
  icon,
  label,
  value,
  accent,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: keyof typeof ACCENT_MAP;
  progress?: number;
}) {
  const c = ACCENT_MAP[accent];
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mt-2">
          <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
      {children}
    </div>
  );
}

function CardHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-700/60">
      <div className="flex items-center gap-2">
        <span className="text-stone-400 dark:text-stone-500">{icon}</span>
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">{title}</h3>
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-xs font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function PageRow({ page, onClick, showDate }: { page: Block; onClick: () => void; showDate?: boolean }) {
  const icon = (page.properties as Record<string, unknown>)?.icon as string | undefined;
  const desc = (page.properties as Record<string, unknown>)?.description as string | undefined;
  const updated = page.updated_at ? new Date(page.updated_at) : null;
  const relTime = updated ? relativeTime(updated) : '';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group text-left"
    >
      <span className="text-lg shrink-0">{icon || '📄'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {page.content || 'Untitled'}
        </p>
        {desc && (
          <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{desc}</p>
        )}
      </div>
      {showDate && relTime && (
        <span className="text-xs text-stone-400 dark:text-stone-600 shrink-0">{relTime}</span>
      )}
      <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="text-stone-300 dark:text-stone-700 mb-2">{icon}</div>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs">{text}</p>
    </div>
  );
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
