import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Edit3,
  ChevronDown,
  Check,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import {
  type DatabaseProperty,
  type DatabaseRecord,
  type PropertyOption,
  type DatabaseView,
  PROPERTY_TYPES,
  COLOR_CLASSES,
  formatPropertyValue,
  getPropertyOptions,
} from '../../lib/database';
import { useDatabase } from './DatabaseContext';
import { PropertyPicker } from './PropertyPicker';
import { PropertyConfigMenu } from './PropertyConfigMenu';

const ROW_HEIGHTS: Record<string, number> = { short: 32, medium: 40, tall: 56 };

export function TableView({
  view,
  onOpenRecord,
}: {
  view: DatabaseView;
  onOpenRecord: (recordId: string) => void;
}) {
  const {
    data,
    addProperty,
    addRecord,
    setValue,
    renameProperty,
    reorderProperties,
    removeProperty,
    updatePropertyConfig,
    addOption,
    updateOption,
    removeOption,
  } = useDatabase();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null);
  const [configFor, setConfigFor] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ recordId: string; propertyId: string } | null>(null);
  const [draggingCol, setDraggingCol] = useState<string | null>(null);
  const [resizingCol, setResizingCol] = useState<{ id: string; startX: number; startWidth: number } | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [renamingCol, setRenamingCol] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sortMenuFor, setSortMenuFor] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFor(null);
        setSortMenuFor(null);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) {
        const delta = e.clientX - resizingCol.startX;
        setColWidths((prev) => ({ ...prev, [resizingCol.id]: Math.max(100, resizingCol.startWidth + delta) }));
      }
    };
    const handleMouseUp = () => {
      if (resizingCol) setResizingCol(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  if (!data) return null;

  const visibleProperties = data.properties
    .filter((p) => !view.hidden_properties.includes(p.id))
    .sort((a, b) => a.position - b.position);

  const orderedRecords = [...data.records].sort((a, b) => a.position - b.position);

  const rowHeight = ROW_HEIGHTS[view.row_height] || 40;

  const handleAddPropertyClick = (e: React.MouseEvent) => {
    setPickerAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setPickerOpen(true);
  };

  const toggleRowSelection = (id: string, additive = false) => {
    setSelectedRows((prev) => {
      const next = new Set(additive ? prev : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startResize = (e: React.MouseEvent, propId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol({ id: propId, startX: e.clientX, startWidth: colWidths[propId] || 180 });
  };

  const getColWidth = (propId: string) => colWidths[propId] || 180;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block">
          {/* Header */}
          <div ref={headerRef} className="flex sticky top-0 z-10 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
            {/* Row selector header */}
            <div className="w-10 flex-shrink-0 flex items-center justify-center border-r border-stone-200 dark:border-stone-700" style={{ height: 36 }}>
              <input
                type="checkbox"
                checked={selectedRows.size === orderedRecords.length && orderedRecords.length > 0}
                onChange={(e) => {
                  setSelectedRows(e.target.checked ? new Set(orderedRecords.map((r) => r.id)) : new Set());
                }}
                className="w-3.5 h-3.5"
              />
            </div>

            {visibleProperties.map((prop) => (
              <div
                key={prop.id}
                draggable
                onDragStart={() => setDraggingCol(prop.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingCol && draggingCol !== prop.id) reorderProperties(draggingCol, prop.id);
                  setDraggingCol(null);
                }}
                className="relative group flex-shrink-0 border-r border-stone-200 dark:border-stone-700"
                style={{ width: getColWidth(prop.id), height: 36 }}
              >
                <div className="flex items-center gap-1.5 px-3 h-full cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                  <GripVertical className="w-3 h-3 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {PROPERTY_TYPES.find((p) => p.type === prop.type)?.icon}
                  </span>
                  {renamingCol === prop.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        if (renameValue.trim()) renameProperty(prop.id, renameValue.trim());
                        setRenamingCol(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (renameValue.trim()) renameProperty(prop.id, renameValue.trim());
                          setRenamingCol(null);
                        }
                        if (e.key === 'Escape') setRenamingCol(null);
                      }}
                      autoFocus
                      className="flex-1 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-blue-400 rounded px-1 py-0 text-xs outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wide truncate flex-1"
                      onClick={() => setSortMenuFor(sortMenuFor === prop.id ? null : prop.id)}
                    >
                      {prop.name}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuFor(menuFor === prop.id ? null : prop.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-400 dark:text-stone-500"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Resize handle */}
                <div
                  onMouseDown={(e) => startResize(e, prop.id)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 transition-colors"
                />
                {/* Sort menu */}
                {sortMenuFor === prop.id && (
                  <div
                    ref={menuRef}
                    className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <ArrowUp className="w-4 h-4" /> Sort ascending
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <ArrowDown className="w-4 h-4" /> Sort descending
                    </button>
                  </div>
                )}
                {/* Property menu */}
                {menuFor === prop.id && (
                  <div
                    ref={menuRef}
                    className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenamingCol(prop.id);
                        setRenameValue(prop.name);
                        setMenuFor(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <Edit3 className="w-4 h-4" /> Rename
                    </button>
                    <button
                      onClick={() => {
                        setConfigFor(prop.id);
                        setMenuFor(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <ChevronDown className="w-4 h-4" /> Configure
                    </button>
                    <div className="my-1 border-t border-stone-100 dark:border-stone-700" />
                    <button
                      onClick={() => {
                        removeProperty(prop.id);
                        setMenuFor(null);
                      }}
                      disabled={data.properties.length <= 1}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" /> Delete property
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add property column */}
            <div className="flex-shrink-0" style={{ width: 140 }}>
              <button
                onClick={handleAddPropertyClick}
                className="flex items-center gap-1.5 px-3 h-full text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors w-full"
              >
                <Plus className="w-3.5 h-3.5" />
                Add property
              </button>
            </div>
          </div>

          {/* Body */}
          <div>
            {orderedRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-stone-400 dark:text-stone-500" />
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">No records yet</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Add your first record to get started</p>
                <button
                  onClick={() => addRecord()}
                  className="mt-4 px-4 py-2 text-sm bg-stone-900 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors"
                >
                  New record
                </button>
              </div>
            ) : (
              orderedRecords.map((record) => (
                <div
                  key={record.id}
                  className={`flex border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group ${
                    selectedRows.has(record.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                  style={{ height: rowHeight }}
                >
                  <div className="w-10 flex-shrink-0 flex items-center justify-center border-r border-stone-100 dark:border-stone-800">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={() => toggleRowSelection(record.id)}
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100"
                    />
                  </div>
                  {visibleProperties.map((prop) => (
                    <Cell
                      key={prop.id}
                      property={prop}
                      record={record}
                      options={getPropertyOptions(prop.id, data.options)}
                      width={getColWidth(prop.id)}
                      height={rowHeight}
                      isEditing={editingCell?.recordId === record.id && editingCell?.propertyId === prop.id}
                      onStartEdit={() => setEditingCell({ recordId: record.id, propertyId: prop.id })}
                      onStopEdit={() => setEditingCell(null)}
                      onOpenRecord={() => onOpenRecord(record.id)}
                      onChange={(val) => {
                        setValue(record.id, prop.id, val);
                        setEditingCell(null);
                      }}
                      onAddOption={(label, color) => addOption(prop.id, label, color)}
                      onUpdateOption={updateOption}
                      onRemoveOption={removeOption}
                      allValues={data.values.filter((v) => v.record_id === record.id)}
                    />
                  ))}
                  <div className="flex-shrink-0" style={{ width: 140 }}>
                    <button
                      onClick={() => onOpenRecord(record.id)}
                      className="flex items-center gap-1.5 px-3 h-full text-xs text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Search className="w-3 h-3" />
                      Open
                    </button>
                  </div>
                </div>
              ))
            )}
            {/* Add row */}
            {orderedRecords.length > 0 && (
              <button
                onClick={() => addRecord()}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors w-full text-left"
              >
                <Plus className="w-4 h-4" />
                New record
              </button>
            )}
          </div>
        </div>
      </div>

      <PropertyPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchorRect={pickerAnchor}
        onSelect={(type, name) => addProperty(name, type)}
      />

      {configFor && (
        <PropertyConfigMenu
          property={data.properties.find((p) => p.id === configFor)!}
          onClose={() => setConfigFor(null)}
          onUpdateConfig={(cfg) => updatePropertyConfig(configFor, cfg)}
          onAddOption={addOption}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          options={getPropertyOptions(configFor, data.options)}
        />
      )}
    </div>
  );
}

// ─── Cell ────────────────────────────────────────────────────

interface CellProps {
  property: DatabaseProperty;
  record: DatabaseRecord;
  options: PropertyOption[];
  width: number;
  height: number;
  isEditing: boolean;
  allValues: { property_id: string; value: unknown }[];
  onStartEdit: () => void;
  onStopEdit: () => void;
  onOpenRecord: () => void;
  onChange: (val: unknown) => void;
  onAddOption: (label: string, color: string) => void;
  onUpdateOption: (id: string, updates: Partial<PropertyOption>) => void;
  onRemoveOption: (id: string) => void;
}

function Cell({
  property,
  record,
  options,
  width,
  height,
  isEditing,
  onStartEdit,
  onStopEdit,
  onChange,
  onAddOption,
}: CellProps) {
  const value = useRecordValue(record.id, property.id);
  const [inputValue, setInputValue] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      setInputValue(typeof value === 'string' ? value : '');
    }
  }, [isEditing, value]);

  const handleClick = () => {
    if (property.type === 'checkbox') {
      onChange(!value);
    } else if (property.type === 'select' || property.type === 'status' || property.type === 'multi_select' || property.type === 'tags') {
      setSelectOpen(true);
    } else {
      onStartEdit();
    }
  };

  return (
    <div
      ref={cellRef}
      className="relative flex-shrink-0 border-r border-stone-100 dark:border-stone-800 cursor-text"
      style={{ width, height }}
      onClick={(e) => {
        if (property.type === 'checkbox') {
          e.stopPropagation();
          handleClick();
        } else if (!isEditing && !selectOpen) {
          handleClick();
        }
      }}
    >
      <CellContent
        property={property}
        value={value}
        options={options}
        isEditing={isEditing}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onChange={onChange}
        onStopEdit={onStopEdit}
        selectOpen={selectOpen}
        setSelectOpen={setSelectOpen}
        onAddOption={onAddOption}
      />
    </div>
  );
}

function useRecordValue(recordId: string, propertyId: string): unknown {
  const { data } = useDatabase();
  return data?.values.find((v) => v.record_id === recordId && v.property_id === propertyId)?.value;
}

function CellContent({
  property,
  value,
  options,
  isEditing,
  inputValue,
  setInputValue,
  onChange,
  onStopEdit,
  selectOpen,
  setSelectOpen,
  onAddOption,
}: {
  property: DatabaseProperty;
  value: unknown;
  options: PropertyOption[];
  isEditing: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  onChange: (v: unknown) => void;
  onStopEdit: () => void;
  selectOpen: boolean;
  setSelectOpen: (v: boolean) => void;
  onAddOption: (label: string, color: string) => void;
}) {
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('gray');

  if (property.type === 'checkbox') {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            value ? 'bg-blue-600 border-blue-600' : 'border-stone-300 dark:border-stone-600 hover:border-blue-400'
          }`}
        >
          {Boolean(value) && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    );
  }

  if (property.type === 'select' || property.type === 'status') {
    const selectedOpt = options.find((o) => o.id === value);
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectOpen(!selectOpen);
          }}
          className="w-full h-full flex items-center px-3"
        >
          {selectedOpt ? (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${COLOR_CLASSES[selectedOpt.color]?.bg} ${COLOR_CLASSES[selectedOpt.color]?.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[selectedOpt.color]?.dot}`} />
              {selectedOpt.label}
            </span>
          ) : (
            <span className="text-xs text-stone-300 dark:text-stone-600">Empty</span>
          )}
        </button>
        {selectOpen && (
          <SelectDropdown
            options={options}
            selectedIds={value ? [value as string] : []}
            onToggle={(id) => {
              onChange(id === value ? null : id);
              setSelectOpen(false);
            }}
            onClose={() => setSelectOpen(false)}
            multi={false}
            newOptionLabel={newOptionLabel}
            setNewOptionLabel={setNewOptionLabel}
            newOptionColor={newOptionColor}
            setNewOptionColor={setNewOptionColor}
            onAddOption={() => {
              if (newOptionLabel.trim()) {
                onAddOption(newOptionLabel.trim(), newOptionColor);
                setNewOptionLabel('');
              }
            }}
          />
        )}
      </>
    );
  }

  if (property.type === 'multi_select' || property.type === 'tags') {
    const selectedIds = (value as string[]) || [];
    const selected = options.filter((o) => selectedIds.includes(o.id));
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectOpen(!selectOpen);
          }}
          className="w-full h-full flex items-center gap-1 px-3 overflow-hidden"
        >
          {selected.length === 0 ? (
            <span className="text-xs text-stone-300">Empty</span>
          ) : (
            selected.map((opt) => (
              <span
                key={opt.id}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}
              >
                {opt.label}
              </span>
            ))
          )}
        </button>
        {selectOpen && (
          <SelectDropdown
            options={options}
            selectedIds={selectedIds}
            onToggle={(id) => {
              const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
              onChange(next);
            }}
            onClose={() => setSelectOpen(false)}
            multi
            newOptionLabel={newOptionLabel}
            setNewOptionLabel={setNewOptionLabel}
            newOptionColor={newOptionColor}
            setNewOptionColor={setNewOptionColor}
            onAddOption={() => {
              if (newOptionLabel.trim()) {
                onAddOption(newOptionLabel.trim(), newOptionColor);
                setNewOptionLabel('');
              }
            }}
          />
        )}
      </>
    );
  }

  if (property.type === 'rating') {
    const max = (property.config?.max as number) || 5;
    const current = Number(value) || 0;
    return (
      <div className="flex items-center gap-0.5 px-3 h-full">
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onChange(i + 1 === current ? 0 : i + 1);
            }}
            className={`text-sm ${i < current ? 'text-amber-400' : 'text-stone-300 dark:text-stone-600 hover:text-amber-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  if (property.type === 'progress') {
    const n = Number(value) || 0;
    return (
      <div className="flex items-center gap-2 px-3 h-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${n}%` }} />
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400 w-8 text-right">{n}%</span>
      </div>
    );
  }

  if (property.type === 'date') {
    return isEditing ? (
      <input
        type="date"
        value={value ? new Date(value as string).toISOString().slice(0, 10) : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        onBlur={onStopEdit}
        autoFocus
        className="w-full h-full px-3 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 outline-none text-sm"
        onClick={(e) => e.stopPropagation()}
      />
    ) : (
      <div className="px-3 flex items-center text-sm text-stone-700 dark:text-stone-200">
        {value ? new Date(value as string).toLocaleDateString() : <span className="text-stone-300 dark:text-stone-600">Empty</span>}
      </div>
    );
  }

  if (property.type === 'number' || property.type === 'currency' || property.type === 'percent') {
    return isEditing ? (
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => {
          onChange(inputValue === '' ? null : Number(inputValue));
          onStopEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(inputValue === '' ? null : Number(inputValue));
            onStopEdit();
          }
          if (e.key === 'Escape') onStopEdit();
        }}
        autoFocus
        className="w-full h-full px-3 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 outline-none text-sm text-right"
        onClick={(e) => e.stopPropagation()}
      />
    ) : (
      <div className="px-3 flex items-center justify-end text-sm text-stone-700 dark:text-stone-200">
        {value !== null && value !== undefined ? formatPropertyValue(property, value, options) : <span className="text-stone-300 dark:text-stone-600">0</span>}
      </div>
    );
  }

  // Default: text-like
  return isEditing ? (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={() => {
        onChange(inputValue);
        onStopEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onChange(inputValue);
          onStopEdit();
        }
        if (e.key === 'Escape') onStopEdit();
      }}
      autoFocus
      className="w-full h-full px-3 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 outline-none text-sm"
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
    <div className="px-3 flex items-center text-sm text-stone-700 dark:text-stone-200 truncate">
      {value ? String(value) : <span className="text-stone-300 dark:text-stone-600">Empty</span>}
    </div>
  );
}

// ─── Select Dropdown ─────────────────────────────────────────

function SelectDropdown({
  options,
  selectedIds,
  onToggle,
  onClose,
  multi,
  newOptionLabel,
  setNewOptionLabel,
  newOptionColor,
  setNewOptionColor,
  onAddOption,
}: {
  options: PropertyOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  multi: boolean;
  newOptionLabel: string;
  setNewOptionLabel: (v: string) => void;
  newOptionColor: string;
  setNewOptionColor: (v: string) => void;
  onAddOption: () => void;
}) {
  void multi;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-40"
    >
      <div className="max-h-48 overflow-y-auto">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
              {!isSelected && <span className="w-3.5" />}
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[opt.color]?.dot}`} />
                {opt.label}
              </span>
            </button>
          );
        })}
        {options.length === 0 && (
          <div className="px-3 py-3 text-xs text-stone-400 dark:text-stone-500 text-center">No options yet</div>
        )}
      </div>
      <div className="border-t border-stone-100 dark:border-stone-700 p-2">
        <div className="flex items-center gap-1.5 mb-2">
          {['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink'].map((c) => (
            <button
              key={c}
              onClick={() => setNewOptionColor(c)}
              className={`w-4 h-4 rounded-full ${COLOR_CLASSES[c]?.dot} ${newOptionColor === c ? 'ring-2 ring-offset-1 ring-stone-400' : ''}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="New option"
            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded outline-none focus:ring-1 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddOption();
            }}
          />
          <button
            onClick={onAddOption}
            className="px-2 py-1 text-xs bg-stone-900 dark:bg-stone-700 text-white rounded hover:bg-stone-800 dark:hover:bg-stone-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
