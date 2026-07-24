import { Plus } from 'lucide-react';
import { useDatabase } from './DatabaseContext';
import { type DatabaseView, getPropertyOptions, COLOR_CLASSES } from '../../lib/database';

export function GalleryView({ view, onOpenRecord }: { view: DatabaseView; onOpenRecord: (id: string) => void }) {
  const { data, addRecord } = useDatabase();
  if (!data) return null;

  const primaryProp = data.properties.find((p) => p.is_primary) || data.properties[0];
  const orderedRecords = [...data.records].sort((a, b) => a.position - b.position);

  const cardSize = view.card_size;
  const cardWidth = cardSize === 'small' ? 'w-56' : cardSize === 'large' ? 'w-80' : 'w-64';
  const cardHeight = cardSize === 'small' ? 'h-40' : cardSize === 'large' ? 'h-64' : 'h-52';

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 overflow-y-auto p-4">
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`}>
        {orderedRecords.map((rec) => {
          const title = data.values.find((v) => v.record_id === rec.id && v.property_id === primaryProp?.id)?.value;
          const coverProp = data.properties.find((p) => p.type === 'images');
          const coverVal = coverProp ? data.values.find((v) => v.record_id === rec.id && v.property_id === coverProp.id)?.value : null;
          const coverUrl = Array.isArray(coverVal) && coverVal.length > 0 ? coverVal[0] : (typeof coverVal === 'string' ? coverVal : null);

          return (
            <div
              key={rec.id}
              onClick={() => onOpenRecord(rec.id)}
              className={`${cardWidth} bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-sm hover:shadow-lg hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer group`}
            >
              <div className={`${cardHeight} bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-700 relative overflow-hidden`}>
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600 text-4xl font-light">
                    {data.database.icon || '▦'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                  {title ? String(title) : 'Untitled'}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.properties
                    .filter((p) => !p.is_primary)
                    .slice(0, 3)
                    .map((p) => {
                      const val = data.values.find((v) => v.record_id === rec.id && v.property_id === p.id)?.value;
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
                        <span key={p.id} className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-24">
                          {String(val).slice(0, 20)}
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })}
        <button
          onClick={() => addRecord()}
          className={`${cardWidth} ${cardHeight} flex items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-2xl text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800 transition-all`}
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="w-6 h-6" />
            <span className="text-sm">New record</span>
          </div>
        </button>
      </div>
    </div>
  );
}
