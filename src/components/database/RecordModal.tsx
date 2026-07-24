import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, MessageSquare, Activity } from 'lucide-react';
import { useDatabase } from './DatabaseContext';
import {
  type DatabaseProperty,
  type PropertyOption,
  PROPERTY_TYPES,
  COLOR_CLASSES,
  getPropertyOptions,
  formatPropertyValue,
} from '../../lib/database';

export function RecordModal({
  recordId,
  onClose,
}: {
  recordId: string;
  onClose: () => void;
}) {
  const { data, setValue, removeRecord } = useDatabase();
  const [activeTab, setActiveTab] = useState<'properties' | 'comments' | 'activity'>('properties');
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<{ id: string; text: string; time: string }[]>([]);

  if (!data) return null;
  const record = data.records.find((r) => r.id === recordId);
  if (!record) return null;

  const primaryProp = data.properties.find((p) => p.is_primary) || data.properties[0];
  const primaryValue = data.values.find((v) => v.record_id === recordId && v.property_id === primaryProp?.id)?.value;

  const orderedProps = [...data.properties].sort((a, b) => a.position - b.position);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl h-[85vh] bg-white dark:bg-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-700">
          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <span className="text-base">{data.database.icon || '▦'}</span>
            <span>{data.database.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (confirm('Delete this record?')) {
                  removeRecord(recordId);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-8 pt-6 pb-4">
          <input
            type="text"
            value={primaryValue ? String(primaryValue) : ''}
            onChange={(e) => setValue(recordId, primaryProp.id, e.target.value)}
            placeholder="Untitled"
            className="text-3xl font-bold text-stone-900 dark:text-stone-100 w-full bg-transparent outline-none placeholder-stone-300 dark:placeholder-stone-600"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-8 border-b border-stone-100 dark:border-stone-700">
          {[
            { id: 'properties' as const, label: 'Properties', icon: <Plus className="w-3.5 h-3.5" /> },
            { id: 'comments' as const, label: 'Comments', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'activity' as const, label: 'Activity', icon: <Activity className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 font-medium'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'properties' && (
            <div className="px-8 py-5">
              <div className="space-y-1">
                {orderedProps.map((prop) => (
                  <RecordPropertyRow
                    key={prop.id}
                    property={prop}
                    value={data.values.find((v) => v.record_id === recordId && v.property_id === prop.id)?.value}
                    options={getPropertyOptions(prop.id, data.options)}
                    onChange={(val) => setValue(recordId, prop.id, val)}
                  />
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-700">
                <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">Page content</div>
                <textarea
                  placeholder="Add notes, description, or any rich content..."
                  className="w-full min-h-32 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="px-8 py-5">
              <div className="space-y-3 mb-4">
                {comments.length === 0 && (
                  <div className="text-center py-8 text-sm text-stone-400 dark:text-stone-500">No comments yet</div>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-300 text-sm font-medium">
                      U
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-stone-800 dark:text-stone-100">{c.text}</div>
                      <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{c.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentInput.trim()) {
                      setComments((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), text: commentInput.trim(), time: 'just now' },
                      ]);
                      setCommentInput('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (commentInput.trim()) {
                      setComments((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), text: commentInput.trim(), time: 'just now' },
                      ]);
                      setCommentInput('');
                    }
                  }}
                  className="px-3 py-2 text-sm bg-stone-900 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="px-8 py-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                  <Clock className="w-4 h-4" />
                  <span>Record created {new Date(record.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                  <Clock className="w-4 h-4" />
                  <span>Last updated {new Date(record.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordPropertyRow({
  property,
  value,
  options,
  onChange,
}: {
  property: DatabaseProperty;
  value: unknown;
  options: PropertyOption[];
  onChange: (val: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);

  useEffect(() => {
    if (editing) setInputValue(typeof value === 'string' ? value : '');
  }, [editing, value]);

  const hasOptions = ['select', 'multi_select', 'status', 'tags'].includes(property.type);

  return (
    <div className="flex items-start gap-3 py-2 group">
      <div className="w-40 flex-shrink-0 flex items-center gap-1.5 pt-2">
        <span className="text-xs text-stone-400 dark:text-stone-500">{PROPERTY_TYPES.find((p) => p.type === property.type)?.icon}</span>
        <span className="text-sm text-stone-500 dark:text-stone-400 truncate">{property.name}</span>
      </div>
      <div className="flex-1 min-h-8 relative">
        {property.type === 'checkbox' ? (
          <button
            onClick={() => onChange(!value)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-1.5 ${
              value ? 'bg-blue-600 border-blue-600' : 'border-stone-300 dark:border-stone-600 hover:border-blue-400'
            }`}
          >
            {Boolean(value) && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : hasOptions ? (
          <div>
            <button
              onClick={() => setSelectOpen(!selectOpen)}
              className="min-h-8 px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 w-full text-left"
            >
              {property.type === 'select' || property.type === 'status' ? (
                value ? (
                  (() => {
                    const opt = options.find((o) => o.id === value);
                    return opt ? (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[opt.color]?.dot}`} />
                        {opt.label}
                      </span>
                    ) : null;
                  })()
                ) : (
                  <span className="text-sm text-stone-300">Empty</span>
                )
              ) : (
                <div className="flex flex-wrap gap-1">
                  {((value as string[]) || []).map((id) => {
                    const opt = options.find((o) => o.id === id);
                    return opt ? (
                      <span key={id} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}>
                        {opt.label}
                      </span>
                    ) : null;
                  })}
                  {!value || (value as string[]).length === 0 ? <span className="text-sm text-stone-300 dark:text-stone-600">Empty</span> : null}
                </div>
              )}
            </button>
            {selectOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-30">
                {options.map((opt) => {
                  const isSelected = property.type === 'multi_select' || property.type === 'tags'
                    ? ((value as string[]) || []).includes(opt.id)
                    : value === opt.id;
                  void isSelected;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (property.type === 'multi_select' || property.type === 'tags') {
                          const arr = (value as string[]) || [];
                          onChange(arr.includes(opt.id) ? arr.filter((x) => x !== opt.id) : [...arr, opt.id]);
                        } else {
                          onChange(opt.id);
                          setSelectOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-700"
                    >
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[opt.color]?.dot}`} />
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectOpen(false)}
                  className="w-full text-center py-1.5 text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : editing ? (
          <input
            type={property.type === 'number' || property.type === 'currency' || property.type === 'percent' ? 'number' : property.type === 'date' ? 'date' : 'text'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => {
              onChange(property.type === 'number' || property.type === 'currency' || property.type === 'percent'
                ? inputValue === '' ? null : Number(inputValue)
                : inputValue);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onChange(property.type === 'number' || property.type === 'currency' || property.type === 'percent'
                  ? inputValue === '' ? null : Number(inputValue)
                  : inputValue);
                setEditing(false);
              }
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
            className="w-full px-2 py-1 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-blue-400 rounded outline-none"
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="min-h-8 px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 cursor-text text-sm text-stone-700 dark:text-stone-200"
          >
            {value !== null && value !== undefined && value !== ''
              ? formatPropertyValue(property, value, options)
              : <span className="text-stone-300 dark:text-stone-600">Empty</span>}
          </div>
        )}
      </div>
    </div>
  );
}
