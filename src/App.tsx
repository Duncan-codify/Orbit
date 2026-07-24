import { useState, createContext, useContext, ReactNode, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  Plus,
  GripVertical,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Image,
  Database,
  FileText,
  X,
  Loader2,
  Smile,
  ImagePlus,
} from 'lucide-react';
import { supabase, type Block, type Workspace } from './lib/supabase';
import { DatabaseBlock } from './components/database/DatabaseBlock';
import { Sidebar as NewSidebar } from './components/sidebar/Sidebar';

// ==================== TYPES ====================

type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'page'
  | 'database';

interface DatabaseBlock extends Block {
  properties: {
    database_id?: string;
    columns?: DatabaseColumn[];
    rows?: DatabaseRow[];
  };
}

interface DatabaseColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'url';
  options?: SelectOption[];
}

interface DatabaseRow {
  id: string;
  cells: Record<string, string | number | boolean | null>;
}

interface SelectOption {
  id: string;
  label: string;
  color: string;
}

// ==================== BLOCK CONFIG ====================

const BLOCK_CONFIG: Record<BlockType, { icon: React.ReactNode; label: string }> = {
  paragraph: { icon: <Type className="w-4 h-4" />, label: 'Text' },
  heading1: { icon: <Heading1 className="w-4 h-4" />, label: 'Heading 1' },
  heading2: { icon: <Heading2 className="w-4 h-4" />, label: 'Heading 2' },
  heading3: { icon: <Heading3 className="w-4 h-4" />, label: 'Heading 3' },
  bulletList: { icon: <List className="w-4 h-4" />, label: 'Bullet List' },
  numberedList: { icon: <ListOrdered className="w-4 h-4" />, label: 'Numbered List' },
  todo: { icon: <CheckSquare className="w-4 h-4" />, label: 'To-do' },
  quote: { icon: <Quote className="w-4 h-4" />, label: 'Quote' },
  code: { icon: <Code className="w-4 h-4" />, label: 'Code' },
  divider: { icon: <Minus className="w-4 h-4" />, label: 'Divider' },
  image: { icon: <Image className="w-4 h-4" />, label: 'Image' },
  database: { icon: <Database className="w-4 h-4" />, label: 'Database' },
  page: { icon: <FileText className="w-4 h-4" />, label: 'Page' },
};

// ==================== CONTEXT ====================

interface AppContextType {
  workspaces: Workspace[];
  blocks: Record<string, Block>;
  activeWorkspaceId: string;
  activePageId: string | null;
  loading: boolean;
  setActiveWorkspace: (id: string) => void;
  setActivePage: (id: string | null) => void;
  createPage: (parentId: string | null, workspaceId?: string) => Promise<string>;
  updateBlock: (id: string, updates: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  createBlock: (pageId: string, type: BlockType, afterBlockId?: string) => Promise<string>;
  getPagePath: (pageId: string) => Block[];
  getChildPages: (pageId: string) => Block[];
  refetch: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// ==================== PROVIDER ====================

function AppProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [blocks, setBlocks] = useState<Record<string, Block>>({});
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch workspaces
      const { data: workspacesData } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at');

      if (workspacesData && workspacesData.length > 0) {
        setWorkspaces(workspacesData);

        // Fetch all blocks
        const { data: blocksData } = await supabase
          .from('blocks')
          .select('*');

        if (blocksData) {
          const blocksMap: Record<string, Block> = {};
          blocksData.forEach((block) => {
            blocksMap[block.id] = block;
          });
          setBlocks(blocksMap);

          // Set active workspace and page
          const wsId = workspacesData[0].id;
          setActiveWorkspaceId(activeWorkspaceId || wsId);

          // Find first page in this workspace
          const ws = workspacesData.find((w) => w.id === (activeWorkspaceId || wsId));
          if (ws) {
            const pageBlocks = blocksData.filter(
              (b) => b.type === 'page' && b.parent_id === null
            );
            if (!activePageId && pageBlocks.length > 0) {
              setActivePageId(pageBlocks[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, activePageId]);

  useEffect(() => {
    fetchData();
  }, []);

  const setActiveWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    const pageBlocks = Object.values(blocks).filter(
      (b) => b.type === 'page' && b.parent_id === null
    );
    if (pageBlocks.length > 0) {
      setActivePageId(pageBlocks[0].id);
    }
  };

  const setActivePage = (id: string | null) => {
    setActivePageId(id);
  };

  const createPage = async (parentId: string | null, workspaceId?: string): Promise<string> => {
    const wsId = workspaceId || activeWorkspaceId;
    const id = crypto.randomUUID();

    const newBlock: Partial<Block> = {
      id,
      workspace_id: wsId,
      parent_id: parentId,
      type: 'page',
      content: 'Untitled',
      properties: { icon: '📄' },
      children: [],
    };

    const { error } = await supabase.from('blocks').insert(newBlock);

    if (error) {
      console.error('Failed to create page:', error);
      throw error;
    }

    // If has parent, add to parent's children
    if (parentId) {
      const parent = blocks[parentId];
      if (parent) {
        await supabase
          .from('blocks')
          .update({ children: [...(parent.children || []), id] })
          .eq('id', parentId);
      }
    }

    await fetchData();
    setActivePageId(id);
    return id;
  };

  const updateBlock = async (id: string, updates: Partial<Block>) => {
    // Optimistic update
    setBlocks((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates } as Block,
    }));

    const { error } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Failed to update block:', error);
      await fetchData(); // Revert on error
    }
  };

  const deleteBlock = async (id: string) => {
    const block = blocks[id];
    if (!block) return;

    // Remove from parent's children array
    if (block.parent_id && blocks[block.parent_id]) {
      const parent = blocks[block.parent_id];
      const newChildren = (parent.children || []).filter((cid) => cid !== id);
      await supabase
        .from('blocks')
        .update({ children: newChildren })
        .eq('id', block.parent_id);
    }

    // Delete block
    await supabase.from('blocks').delete().eq('id', id);
    await fetchData();
  };

  const createBlock = async (pageId: string, type: BlockType, afterBlockId?: string): Promise<string> => {
    const id = crypto.randomUUID();
    const page = blocks[pageId];

    let newChildren = [...(page?.children || [])];
    if (afterBlockId) {
      const index = newChildren.indexOf(afterBlockId);
      newChildren.splice(index + 1, 0, id);
    } else {
      newChildren.push(id);
    }

    const newBlock: Partial<Block> = {
      id,
      workspace_id: page?.workspace_id || activeWorkspaceId,
      parent_id: pageId,
      type,
      content: '',
      properties: type === 'todo' ? { checked: false } : {},
      children: [],
    };

    // Insert new block
    await supabase.from('blocks').insert(newBlock);

    // Update parent's children
    await supabase
      .from('blocks')
      .update({ children: newChildren })
      .eq('id', pageId);

    await fetchData();
    return id;
  };

  const getPagePath = (pageId: string): Block[] => {
    const path: Block[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
      const block: Block | undefined = blocks[currentId];
      if (!block) break;
      path.unshift(block);
      currentId = block.parent_id;
    }

    return path;
  };

  const getChildPages = (pageId: string): Block[] => {
    const page = blocks[pageId];
    if (!page?.children) return [];

    return page.children
      .map((id) => blocks[id])
      .filter((block): block is Block => block?.type === 'page');
  };

  return (
    <AppContext.Provider
      value={{
        workspaces,
        blocks,
        activeWorkspaceId,
        activePageId,
        loading,
        setActiveWorkspace,
        setActivePage,
        createPage,
        updateBlock,
        deleteBlock,
        createBlock,
        getPagePath,
        getChildPages,
        refetch: fetchData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ==================== SLASH MENU ====================

function SlashMenu({
  position,
  onSelect,
  onClose,
}: {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const blockTypes = Object.entries(BLOCK_CONFIG).filter(([type]) => type !== 'page');
  const filteredTypes = blockTypes.filter(([, config]) =>
    config.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredTypes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filteredTypes[selectedIndex]) {
        e.preventDefault();
        onSelect(filteredTypes[selectedIndex][0] as BlockType);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredTypes, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-2 w-72 z-50"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
        Basic Blocks
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter..."
        className="mx-3 mb-2 w-[calc(100%-24px)] px-2 py-1.5 text-sm bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <div className="max-h-64 overflow-y-auto">
        {filteredTypes.map(([type, config], index) => (
          <button
            key={type}
            onClick={() => onSelect(type as BlockType)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
              index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <span className="text-stone-400 dark:text-stone-500">{config.icon}</span>
            <span>{config.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== BLOCK EDITOR ====================

function BlockEditor({ pageId }: { pageId: string }) {
  const { blocks, createBlock, updateBlock } = useApp();
  const [slashMenuState, setSlashMenuState] = useState<{
    show: boolean;
    position: { top: number; left: number };
    blockId: string;
  } | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [descEditing, setDescEditing] = useState(false);
  const [descValue, setDescValue] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null);

  const page = blocks[pageId];
  if (!page) return null;

  const childBlocks = (page.children || [])
    .map((id) => blocks[id])
    .filter(Boolean);

  const handleAddBlock = async () => {
    await createBlock(pageId, 'paragraph');
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDragPosition(null);
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedBlockId || draggedBlockId === blockId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDragOverBlockId(blockId);
    setDragPosition(e.clientY < midpoint ? 'before' : 'after');
  };

  const handleDrop = async (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      handleDragEnd();
      return;
    }
    const children = [...(page.children || [])];
    const fromIdx = children.indexOf(draggedBlockId);
    const toIdx = children.indexOf(targetBlockId);
    if (fromIdx === -1 || toIdx === -1) {
      handleDragEnd();
      return;
    }
    children.splice(fromIdx, 1);
    const insertIdx = dragPosition === 'before' ? children.indexOf(targetBlockId) : children.indexOf(targetBlockId) + 1;
    children.splice(insertIdx, 0, draggedBlockId);
    await updateBlock(pageId, { children });
    handleDragEnd();
  };

  const handleSlashSelect = async (type: BlockType) => {
    if (!slashMenuState) return;
    await updateBlock(slashMenuState.blockId, { type, content: '' });
    setSlashMenuState(null);
  };

  const props = page.properties || {};
  const icon = props.icon as string | undefined;
  const cover = props.cover as string | undefined;
  const description = props.description as string | undefined;

  const ICON_OPTIONS = ['📄','📊','🗂️','📋','📈','💡','🎯','✅','🔔','📦','🏷️','🧩','⚙️','🚀','🔥','⭐','💎','🎨','📝','🗓️'];
  const COVER_GRADIENTS = [
    'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)',
    'linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #3b82f6 100%)',
    'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #22c55e 100%)',
    'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #ec4899 100%)',
    'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #6366f1 100%)',
    'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #64748b 100%)',
    'linear-gradient(135deg, #fef2f2 0%, #fca5a5 50%, #ef4444 100%)',
    'linear-gradient(135deg, #ecfdf5 0%, #6ee7b7 50%, #10b981 100%)',
  ];

  return (
    <div className="relative">
      {/* Cover */}
      {cover ? (
        <div
          className="relative h-48 -mx-12 mb-0 group/cover"
          style={{ background: cover }}
        >
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover/cover:opacity-100 transition-opacity">
            <button
              onClick={() => updateBlock(pageId, { properties: { ...props, cover: null } })}
              className="px-2.5 py-1.5 text-xs bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-md"
            >
              Remove
            </button>
            <button
              onClick={() => setCoverPickerOpen(true)}
              className="px-2.5 py-1.5 text-xs bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-md"
            >
              Change cover
            </button>
          </div>
        </div>
      ) : null}

      {/* Icon + Title + Description */}
      <div className={`${cover ? 'pt-6' : 'pt-12'} mb-6 group/header`}>
        {/* Icon */}
        {icon ? (
          <div className="relative inline-block mb-3 group/icon">
            <button
              onClick={() => setIconPickerOpen(true)}
              className="text-[64px] leading-none hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl p-1 -m-1 transition-colors"
            >
              {icon}
            </button>
            <button
              onClick={() => updateBlock(pageId, { properties: { ...props, icon: undefined } })}
              className="absolute -top-1 -right-1 w-5 h-5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-full flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-stone-600 dark:text-stone-300" />
            </button>
          </div>
        ) : null}

        {/* Add icon / cover / description buttons — show on header hover when missing */}
        <div className="flex items-center gap-1 mb-3 -ml-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          {!icon && (
            <button
              onClick={() => setIconPickerOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
              Add icon
            </button>
          )}
          {!cover && (
            <button
              onClick={() => setCoverPickerOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Add cover
            </button>
          )}
          {!description && (
            <button
              onClick={() => setDescEditing(true)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <Type className="w-3.5 h-3.5" />
              Add description
            </button>
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          value={page.content}
          onChange={(e) => updateBlock(pageId, { content: e.target.value })}
          placeholder="Untitled"
          className="text-4xl font-bold text-stone-900 dark:text-stone-100 w-full bg-transparent border-none focus:outline-none placeholder-stone-300 dark:placeholder-stone-600 mb-1"
        />

        {/* Description */}
        {descEditing || description ? (
          <textarea
            value={descValue ?? description ?? ''}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={() => {
              updateBlock(pageId, { properties: { ...props, description: descValue?.trim() || undefined } });
              setDescEditing(false);
              setDescValue(null);
            }}
            autoFocus={descEditing && !description}
            placeholder="Add a description..."
            rows={2}
            className="w-full text-sm text-stone-500 dark:text-stone-400 bg-transparent border-none focus:outline-none resize-none placeholder-stone-300 dark:placeholder-stone-600"
          />
        ) : null}
      </div>

      {/* Icon picker modal */}
      {iconPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm"
          onClick={() => setIconPickerOpen(false)}
        >
          <div className="w-80 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-3">Choose an icon</h3>
            <div className="grid grid-cols-8 gap-1">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => {
                    updateBlock(pageId, { properties: { ...props, icon: ic } });
                    setIconPickerOpen(false);
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

      {/* Cover picker modal */}
      {coverPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm"
          onClick={() => setCoverPickerOpen(false)}
        >
          <div className="w-[420px] bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-3">Choose a cover</h3>
            <div className="grid grid-cols-2 gap-2">
              {COVER_GRADIENTS.map((grad, i) => (
                <button
                  key={i}
                  onClick={() => {
                    updateBlock(pageId, { properties: { ...props, cover: grad } });
                    setCoverPickerOpen(false);
                  }}
                  className="h-20 rounded-lg hover:ring-2 hover:ring-stone-400 transition-all"
                  style={{ background: grad }}
                />
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Block List */}
      <div className="space-y-0.5">
        {childBlocks.map((block) => {
          const isDragged = draggedBlockId === block.id;
          const isDragOver = dragOverBlockId === block.id;
          return (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDrop={(e) => handleDrop(e, block.id)}
              onDragLeave={() => {
                if (dragOverBlockId === block.id) {
                  setDragOverBlockId(null);
                  setDragPosition(null);
                }
              }}
              className={`group relative flex items-start gap-1 -ml-8 pl-8 transition-opacity ${
                isDragged ? 'opacity-30' : ''
              } ${
                isDragOver && dragPosition === 'before'
                  ? 'border-t-2 border-blue-400'
                  : isDragOver && dragPosition === 'after'
                    ? 'border-b-2 border-blue-400'
                    : ''
              }`}
            >
              {/* Block Handle */}
              <div className="absolute left-0 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    await createBlock(pageId, 'paragraph', block.id);
                  }}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 dark:text-stone-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <BlockComponent
                block={block}
                isFocused={focusedBlockId === block.id}
                onFocus={() => setFocusedBlockId(block.id)}
                onSlashTrigger={(position) =>
                  setSlashMenuState({ show: true, position, blockId: block.id })
                }
              />
            </div>
          );
        })}

        {/* Add Block Button */}
        <button
          onClick={handleAddBlock}
          className="w-full text-left px-0 py-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2 ml-[-32px] pl-8"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add a block</span>
        </button>
      </div>

      {/* Slash Menu */}
      {slashMenuState?.show && (
        <SlashMenu
          position={slashMenuState.position}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenuState(null)}
        />
      )}
    </div>
  );
}

interface BlockComponentProps {
  block: Block;
  isFocused: boolean;
  onFocus: () => void;
  onSlashTrigger: (position: { top: number; left: number }) => void;
}

function BlockComponent({ block, onFocus, onSlashTrigger }: BlockComponentProps) {
  const { updateBlock, deleteBlock } = useApp();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.textContent || '';

    // Check for slash command
    if (content === '/') {
      const rect = e.currentTarget.getBoundingClientRect();
      onSlashTrigger({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }

    // Check for markdown shortcuts
    if (content.startsWith('# ')) {
      updateBlock(block.id, { type: 'heading1', content: content.slice(2) });
    } else if (content.startsWith('## ')) {
      updateBlock(block.id, { type: 'heading2', content: content.slice(3) });
    } else if (content.startsWith('### ')) {
      updateBlock(block.id, { type: 'heading3', content: content.slice(4) });
    } else if (content.startsWith('- ') || content.startsWith('* ')) {
      updateBlock(block.id, { type: 'bulletList', content: content.slice(2) });
    } else if (content.startsWith('[] ') || content.startsWith('[ ] ')) {
      updateBlock(block.id, { type: 'todo', content: content.slice(content.startsWith('[] ') ? 3 : 4), properties: { checked: false } });
    } else if (content.startsWith('[x] ')) {
      updateBlock(block.id, { type: 'todo', content: content.slice(4), properties: { checked: true } });
    } else if (content.startsWith('> ')) {
      updateBlock(block.id, { type: 'quote', content: content.slice(2) });
    } else if (content === '---') {
      updateBlock(block.id, { type: 'divider', content: '' });
    } else {
      updateBlock(block.id, { content });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !block.content) {
      e.preventDefault();
      deleteBlock(block.id);
    }
  };

  const props = block.properties || {};

  const renderBlock = () => {
    switch (block.type) {
      case 'heading1':
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            className="text-3xl font-bold text-stone-900 dark:text-stone-100 outline-none py-1 empty:before:content-['Heading_1'] empty:before:text-stone-300 dark:empty:before:text-stone-600"
          >
            {block.content}
          </div>
        );

      case 'heading2':
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            className="text-2xl font-bold text-stone-900 dark:text-stone-100 outline-none py-1 empty:before:content-['Heading_2'] empty:before:text-stone-300 dark:empty:before:text-stone-600"
          >
            {block.content}
          </div>
        );

      case 'heading3':
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            className="text-xl font-bold text-stone-900 dark:text-stone-100 outline-none py-1 empty:before:content-['Heading_3'] empty:before:text-stone-300 dark:empty:before:text-stone-600"
          >
            {block.content}
          </div>
        );

      case 'bulletList':
        return (
          <div className="flex gap-2">
            <span className="text-stone-400 dark:text-stone-500 mt-0.5">•</span>
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className="flex-1 outline-none text-stone-700 dark:text-stone-200 empty:before:content-['List_item'] empty:before:text-stone-300 dark:empty:before:text-stone-600"
            >
              {block.content}
            </div>
          </div>
        );

      case 'numberedList':
        return (
          <div className="flex gap-2">
            <span className="text-stone-400 dark:text-stone-500 mt-0.5 min-w-[20px]">1.</span>
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className="flex-1 outline-none text-stone-700 dark:text-stone-200 empty:before:content-['List_item'] empty:before:text-stone-300 dark:empty:before:text-stone-600"
            >
              {block.content}
            </div>
          </div>
        );

      case 'todo':
        return (
          <div className="flex gap-2.5 items-start">
            <button
              onClick={() =>
                updateBlock(block.id, {
                  properties: { ...props, checked: !props.checked },
                })
              }
              className={`w-4 h-4 mt-1 rounded border-2 flex items-center justify-center transition-all ${
                props.checked
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-stone-300 dark:border-stone-600 hover:border-blue-400'
              }`}
            >
              {(props.checked as boolean) && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className={`flex-1 outline-none ${props.checked ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-200'} empty:before:content-['To-do'] empty:before:text-stone-300 dark:empty:before:text-stone-600`}
            >
              {block.content}
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-stone-300 dark:border-stone-600 pl-4">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className="outline-none text-stone-600 dark:text-stone-300 italic text-lg empty:before:content-['Quote'] empty:before:text-stone-300 dark:empty:before:text-stone-600"
            >
              {block.content}
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="bg-stone-900 dark:bg-black text-stone-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className="outline-none min-h-[24px] empty:before:content-['Code'] empty:before:text-stone-500"
            >
              {block.content}
            </div>
          </div>
        );

      case 'divider':
        return <hr className="border-stone-200 dark:border-stone-700 my-4" />;

      case 'image':
        return (
          <div className="relative">
            {block.content ? (
              <img src={block.content} alt="" className="max-w-full rounded-lg" />
            ) : (
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg p-8 text-center">
                <button className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
                  Click to add image
                </button>
              </div>
            )}
          </div>
        );

      case 'database':
        return (
          <DatabaseBlock
            databaseId={(block as DatabaseBlock).properties?.database_id ?? null}
            onDatabaseCreated={(id) =>
              updateBlock(block.id, {
                properties: { ...block.properties, database_id: id },
              })
            }
          />
        );

      default:
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            className="outline-none text-stone-700 dark:text-stone-200 min-h-[24px] empty:before:content-['Type_\'/\'_for_commands...'] empty:before:text-stone-400 dark:empty:before:text-stone-600"
          >
            {block.content}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 relative group/block">
      {renderBlock()}
    </div>
  );
}

// ==================== BREADCRUMBS ====================

function Breadcrumbs() {
  const { blocks, activePageId, setActivePage } = useApp();

  if (!activePageId) return null;

  const path: Block[] = [];
  let currentId: string | null = activePageId;

  while (currentId) {
    const block: Block | undefined = blocks[currentId];
    if (!block) break;
    path.unshift(block);
    currentId = block.parent_id;
  }

  if (path.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 px-4 py-2 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
      {path.map((block, index) => (
        <div key={block.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          <button
            onClick={() => setActivePage(block.id)}
            className="flex items-center gap-1 hover:bg-stone-200 dark:hover:bg-stone-800 px-1.5 py-0.5 rounded transition-colors"
          >
            <span>{(block.properties?.icon as string) || '📄'}</span>
            <span className="truncate max-w-32">{block.content || 'Untitled'}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// ==================== SIDEBAR (old inline components removed — see src/components/sidebar/) ====================

// ==================== MAIN VIEWPORT ====================

function MainViewport() {
  const { blocks, activePageId, createPage, activeWorkspaceId, loading } = useApp();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  const activePage = activePageId ? blocks[activePageId] : null;

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-center">
          <FileText className="w-16 h-16 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-stone-400 dark:text-stone-500">No page selected</h2>
          <p className="text-stone-400 dark:text-stone-500 mt-2">Select a page from the sidebar or create a new one</p>
          <button
            onClick={async () => {
              await createPage(null, activeWorkspaceId);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-stone-900 overflow-y-auto">
      <Breadcrumbs />
      <div className="max-w-4xl mx-auto px-16 py-8">
        <BlockEditor pageId={activePage.id} />
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

function AppShell() {
  const {
    workspaces,
    blocks,
    activeWorkspaceId,
    activePageId,
    setActiveWorkspace,
    setActivePage,
    createPage,
    updateBlock,
    deleteBlock,
    refetch,
  } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-stone-900">
      <NewSidebar
        workspaces={workspaces}
        blocks={blocks}
        activeWorkspaceId={activeWorkspaceId}
        activePageId={activePageId}
        onSwitchWorkspace={setActiveWorkspace}
        onSelectPage={setActivePage}
        onCreatePage={createPage}
        onUpdateBlock={updateBlock}
        onDeleteBlock={deleteBlock}
        onRefetch={refetch}
      />
      <MainViewport />
    </div>
  );
}

export default App;
