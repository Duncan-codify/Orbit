import { Plus, ChevronRight } from 'lucide-react';
import { useDatabase } from './DatabaseContext';
import { type DatabaseView, getPropertyOptions, COLOR_CLASSES, formatPropertyValue } from '../../lib/database';

export function ListView({ onOpenRecord }: { view: DatabaseView; onOpenRecord: (id: string) => void }) {
  const { data, addRecord } = useDatabase();
  if (!data) return null;

  const primaryProp = data.properties.find((p) => p.is_primary) || data.properties[0];
  const secondaryProps = data.properties.filter((p) => !p.is_primary).slice(0, 4);
  const orderedRecords = [...data.records].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 overflow-y-auto">
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {orderedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-stone-400 dark:text-stone-500" />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">No records yet</p>
            <button
              onClick={() => addRecord()}
              className="mt-4 px-4 py-2 text-sm bg-stone-900 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors"
            >
              New record
            </button>
          </div>
        ) : (
          orderedRecords.map((rec) => {
            const title = data.values.find((v) => v.record_id === rec.id && v.property_id === primaryProp?.id)?.value;
            return (
              <div
                key={rec.id}
                onClick={() => onOpenRecord(rec.id)}
                className="group flex items-center gap-4 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                    {title ? String(title) : 'Untitled'}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {secondaryProps.map((p) => {
                      const val = data.values.find((v) => v.record_id === rec.id && v.property_id === p.id)?.value;
                      if (!val) return null;
                      const opts = getPropertyOptions(p.id, data.options);
                      const opt = opts.find((o) => o.id === val);
                      return (
                        <div key={p.id} className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <span className="text-stone-400 dark:text-stone-500">{p.name}:</span>
                          {opt ? (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${COLOR_CLASSES[opt.color]?.bg} ${COLOR_CLASSES[opt.color]?.text}`}>
                              {opt.label}
                            </span>
                          ) : (
                            <span>{formatPropertyValue(p, val, opts)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {orderedRecords.length > 0 && (
        <button
          onClick={() => addRecord()}
          className="flex items-center gap-1.5 px-4 py-3 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New record
        </button>
      )}
    </div>
  );
}
