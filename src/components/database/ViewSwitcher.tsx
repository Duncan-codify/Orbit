import { useState, useRef, useEffect } from 'react';
import {
  Plus, MoreHorizontal, Star, Pin, Copy, Trash2, Edit3, Check, X, GripVertical,
  Filter as FilterIcon, ArrowDownUp, Search, Zap, Settings,
} from 'lucide-react';
import { VIEW_TYPES, type ViewType, type DatabaseView } from '../../lib/database';
import { useDatabase } from './DatabaseContext';

const VIEW_ICON_MAP: Partial<Record<ViewType, string>> = Object.fromEntries(
  VIEW_TYPES.map((v) => [v.type, v.icon])
);

export function ViewSwitcher({ onOpenRecord }: { onOpenRecord: (id: string) => void }) {
  void onOpenRecord;
  const {
    data,
    activeViewId,
    setActiveViewId,
    addView,
    addRecord,
    renameView,
    removeView,
    duplicateView,
    toggleFavorite,
    togglePinned,
    setDefaultView,
    reorderViews,
  } = useDatabase();
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuForView, setMenuForView] = useState<string | null>(null);
  const [renamingView, setRenamingView] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuForView(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!data) return null;

  const orderedViews = [...data.views].sort((a, b) => a.position - b.position);

  const renderViewTab = (view: DatabaseView) => {
    const isActive = view.id === activeViewId;
    const isRenaming = renamingView === view.id;
    return (
      <div
        key={view.id}
        draggable
        onDragStart={() => setDraggingId(view.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggingId && draggingId !== view.id) reorderViews(draggingId, view.id);
          setDraggingId(null);
        }}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] cursor-pointer transition-all ${
          isActive
            ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-medium'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
        }`}
        onClick={() => setActiveViewId(view.id)}
      >
        <GripVertical className="w-3 h-3 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 cursor-grab" />
        <span className="text-sm leading-none">{view.icon || VIEW_ICON_MAP[view.type]}</span>
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => {
              if (renameValue.trim()) renameView(view.id, renameValue.trim());
              setRenamingView(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (renameValue.trim()) renameView(view.id, renameValue.trim());
                setRenamingView(null);
              }
              if (e.key === 'Escape') setRenamingView(null);
            }}
            autoFocus
            className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-blue-400 rounded px-1 py-0 text-[13px] outline-none w-24"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate max-w-32">{view.name}</span>
        )}
        {view.is_favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuForView(menuForView === view.id ? null : view.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-400 dark:text-stone-500 transition-all"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        {menuForView === view.id && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem icon={<Edit3 className="w-4 h-4" />} label="Rename" onClick={() => {
              setRenamingView(view.id);
              setRenameValue(view.name);
              setMenuForView(null);
            }} />
            <MenuItem icon={<Copy className="w-4 h-4" />} label="Duplicate" onClick={() => {
              duplicateView(view.id);
              setMenuForView(null);
            }} />
            <MenuItem
              icon={<Star className={`w-4 h-4 ${view.is_favorite ? 'text-amber-400 fill-amber-400' : ''}`} />}
              label={view.is_favorite ? 'Unfavorite' : 'Favorite'}
              onClick={() => { toggleFavorite(view.id); setMenuForView(null); }}
            />
            <MenuItem
              icon={<Pin className={`w-4 h-4 ${view.is_pinned ? 'text-blue-500' : ''}`} />}
              label={view.is_pinned ? 'Unpin' : 'Pin'}
              onClick={() => { togglePinned(view.id); setMenuForView(null); }}
            />
            <MenuItem icon={<Check className="w-4 h-4" />} label="Set as default" onClick={() => {
              setDefaultView(view.id);
              setMenuForView(null);
            }} />
            <div className="my-1 border-t border-stone-100 dark:border-stone-700" />
            <MenuItem
              icon={<Trash2 className="w-4 h-4" />}
              label="Delete"
              danger
              disabled={data.views.length <= 1}
              onClick={() => {
                removeView(view.id);
                setMenuForView(null);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center gap-1 px-12 py-1.5 border-b border-stone-100 dark:border-stone-700">
        {/* Left: view tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
          {orderedViews.map(renderViewTab)}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
            title="Add view"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: toolbar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <ToolbarButton
            icon={<FilterIcon className="w-3.5 h-3.5" />}
            label="Filter"
            active={filterOpen}
            onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); setSearchOpen(false); }}
          />
          <ToolbarButton
            icon={<ArrowDownUp className="w-3.5 h-3.5" />}
            label="Sort"
            active={sortOpen}
            onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); setSearchOpen(false); }}
          />
          <ToolbarButton
            icon={<Search className="w-3.5 h-3.5" />}
            label="Search"
            active={searchOpen}
            onClick={() => { setSearchOpen(!searchOpen); setFilterOpen(false); setSortOpen(false); }}
          />
          <ToolbarButton
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Automation"
            onClick={() => {}}
          />
          <ToolbarButton
            icon={<Settings className="w-3.5 h-3.5" />}
            label="Settings"
            onClick={() => {}}
          />
          <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />
          <button
            onClick={() => addRecord()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Filter dropdown */}
      {filterOpen && (
        <FilterDropdown onClose={() => setFilterOpen(false)} />
      )}
      {sortOpen && (
        <SortDropdown onClose={() => setSortOpen(false)} />
      )}
      {searchOpen && (
        <div className="px-12 py-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search records..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-stone-800 dark:text-stone-100 outline-none placeholder-stone-400 dark:placeholder-stone-500"
            />
            <button onClick={() => { setSearchOpen(false); setSearchValue(''); }} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddViewModal
          onClose={() => setShowAddModal(false)}
          onCreate={async (name, type) => {
            await addView(name, type);
            setShowAddModal(false);
          }}
        />
      )}
    </>
  );
}

function ToolbarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group/tb">
      <button
        onClick={onClick}
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
          active ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
        }`}
      >
        {icon}
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-stone-800 dark:bg-stone-700 rounded-md whitespace-nowrap opacity-0 group-hover/tb:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </div>
  );
}

function FilterDropdown({ onClose }: { onClose: () => void }) {
  const { data, activeViewId } = useDatabase();
  const ref = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [operator, setOperator] = useState('contains');
  const [value, setValue] = useState('');

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  void activeViewId;
  if (!data) return null;

  return (
    <div className="px-12 py-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
      <div ref={ref} className="flex items-center gap-2">
        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Filter</span>
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="px-2 py-1 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-md outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">Select property</option>
          {data.properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="px-2 py-1 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-md outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="not_equals">Does not equal</option>
          <option value="is_empty">Is empty</option>
          <option value="is_not_empty">Is not empty</option>
        </select>
        {operator !== 'is_empty' && operator !== 'is_not_empty' && (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="px-2 py-1 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-md outline-none focus:ring-1 focus:ring-blue-400 w-40"
          />
        )}
        <button onClick={onClose} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SortDropdown({ onClose }: { onClose: () => void }) {
  const { data } = useDatabase();
  const ref = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!data) return null;

  return (
    <div className="px-12 py-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
      <div ref={ref} className="flex items-center gap-2">
        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Sort by</span>
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="px-2 py-1 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-md outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">Select property</option>
          {data.properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-md hover:bg-stone-50 dark:hover:bg-stone-700"
        >
          {direction === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </button>
        <button onClick={onClose} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AddViewModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, type: ViewType) => void;
}) {
  const [selectedType, setSelectedType] = useState<ViewType>('table');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[480px] bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-700">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">New view</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 dark:text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="View name"
            className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <label className="block mt-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Type</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5 max-h-64 overflow-y-auto">
            {VIEW_TYPES.map((v) => (
              <button
                key={v.type}
                onClick={() => {
                  setSelectedType(v.type);
                  if (!name) setName(v.label);
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  selectedType === v.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-stone-100 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span className="text-xl">{v.icon}</span>
                <span className="text-xs font-medium">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name.trim() || 'Untitled', selectedType)}
            className="px-4 py-2 text-sm bg-stone-900 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors"
          >
            Create view
          </button>
        </div>
      </div>
    </div>
  );
}
