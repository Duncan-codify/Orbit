import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import {
  type DatabaseView,
  COLOR_CLASSES,
  getPropertyOptions,
} from '../../lib/database';
import { useDatabase } from './DatabaseContext';

export function BoardView({
  view,
  onOpenRecord,
}: {
  view: DatabaseView;
  onOpenRecord: (id: string) => void;
}) {
  const { data, setValue, addRecord, updateViewConfig } = useDatabase();
  const [groupPropertyId, setGroupPropertyId] = useState<string | null>(view.group_by_property);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setGroupPropertyId(view.group_by_property);
  }, [view.group_by_property]);

  if (!data) return null;

  const groupableProps = data.properties.filter(
    (p) => ['select', 'status', 'multi_select'].includes(p.type)
  );

  const groupProp = groupableProps.find((p) => p.id === groupPropertyId) || groupableProps[0];
  const groupOptions = groupProp ? getPropertyOptions(groupProp.id, data.options) : [];

  const orderedRecords = [...data.records].sort((a, b) => a.position - b.position);

  const getRecordValue = (recordId: string, propId: string) =>
    data.values.find((v) => v.record_id === recordId && v.property_id === propId)?.value;

  const primaryProp = data.properties.find((p) => p.is_primary) || data.properties[0];

  const groups: { key: string; label: string; color: string; records: typeof orderedRecords }[] = [];
  if (groupProp) {
    groups.push({ key: '__none__', label: 'No status', color: 'gray', records: [] });
    groupOptions.forEach((opt) => {
      groups.push({ key: opt.id, label: opt.label, color: opt.color, records: [] });
    });
    orderedRecords.forEach((rec) => {
      const val = getRecordValue(rec.id, groupProp.id);
      const grp = groups.find((g) => g.key === val);
      if (grp) grp.records.push(rec);
      else groups[0].records.push(rec);
    });
  } else {
    groups.push({ key: 'all', label: 'All records', color: 'gray', records: orderedRecords });
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 dark:border-stone-800 text-sm">
        <span className="text-stone-500 dark:text-stone-400">Group by:</span>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            {groupProp ? groupProp.name : 'Choose property'}
            <MoreHorizontal className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-30">
              {groupableProps.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setGroupPropertyId(p.id);
                    updateViewConfig(view.id, { group_by_property: p.id });
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 ${p.id === groupPropertyId ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-stone-700 dark:text-stone-300'}`}
                >
                  {p.name}
                </button>
              ))}
              {groupableProps.length === 0 && (
                <div className="px-3 py-3 text-xs text-stone-400 dark:text-stone-500">Add a Select or Status property to group</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {groups.map((group) => (
            <div key={group.key} className="w-72 flex-shrink-0 flex flex-col">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${COLOR_CLASSES[group.color]?.dot}`} />
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{group.label}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">{group.records.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {group.records.map((rec) => {
                  const title = getRecordValue(rec.id, primaryProp?.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => onOpenRecord(rec.id)}
                      className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-3 shadow-sm hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer"
                    >
                      <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                        {title ? String(title) : 'Untitled'}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.properties
                          .filter((p) => !p.is_primary && p.id !== groupProp?.id)
                          .slice(0, 3)
                          .map((p) => {
                            const val = getRecordValue(rec.id, p.id);
                            if (!val) return null;
                            const opts = getPropertyOptions(p.id, data.options);
                            const opt = opts.find((o) => o.id === val);
                            if (opt) {
                              return (
                                <span
                                  key={p.id}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}
                                >
                                  {opt.label}
                                </span>
                              );
                            }
                            return (
                              <span key={p.id} className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                {String(val).slice(0, 20)}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={async () => {
                    const newId = await addRecord();
                    if (newId && groupProp && group.key !== '__none__') {
                      setValue(newId, groupProp.id, group.key);
                    }
                  }}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-stone-800 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
