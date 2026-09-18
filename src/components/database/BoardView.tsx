import { CalendarDays, ImageOff, Plus } from 'lucide-react';
import {
  type DatabaseProperty,
  type DatabaseRecord,
  type DatabaseView,
  type PropertyOption,
  COLOR_CLASSES,
  getPropertyOptions,
} from '../../lib/database';
import { useDatabase } from './DatabaseContext';

const fallbackCovers = [
  'https://images.pexels.com/photos/3232545/pexels-photo-3232545.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/4095483/pexels-photo-4095483.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

export function BoardView({
  view: _view,
  onOpenRecord,
}: {
  view: DatabaseView;
  onOpenRecord: (id: string) => void;
}) {
  const { data, addRecord } = useDatabase();

  if (!data) return null;

  const primaryProperty = data.properties.find((property) => property.is_primary) || data.properties[0];
  const descriptionProperty = data.properties.find(
    (property) => property.type === 'long_text'
  ) || data.properties.find((property) => property.type === 'text' && !property.is_primary);
  const coverProperty = data.properties.find((property) => property.type === 'images');
  const dateProperty = data.properties.find((property) => ['date', 'date_range'].includes(property.type));
  const tagProperties = data.properties.filter((property) =>
    ['select', 'status', 'multi_select', 'tags'].includes(property.type)
  );
  const orderedRecords = [...data.records].sort((a, b) => a.position - b.position);

  const getValue = (recordId: string, propertyId: string | undefined): unknown => {
    if (!propertyId) return null;
    return data.values.find(
      (value) => value.record_id === recordId && value.property_id === propertyId
    )?.value;
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white dark:bg-stone-950 px-3 pb-8 pt-3 sm:px-5 sm:pt-5">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-5 lg:grid-cols-2">
        {orderedRecords.map((record, index) => (
          <BoardCard
            key={record.id}
            record={record}
            index={index}
            primaryProperty={primaryProperty}
            descriptionProperty={descriptionProperty}
            coverProperty={coverProperty}
            dateProperty={dateProperty}
            tagProperties={tagProperties}
            getValue={getValue}
            options={data.options}
            onOpen={() => onOpenRecord(record.id)}
          />
        ))}

        <button
          onClick={() => addRecord()}
          className="group flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 text-stone-400 transition-all hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-500 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 dark:hover:text-blue-300"
        >
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-105 dark:bg-stone-800">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">Add a new blog</span>
        </button>
      </div>
    </div>
  );
}

function BoardCard({
  record,
  index,
  primaryProperty,
  descriptionProperty,
  coverProperty,
  dateProperty,
  tagProperties,
  getValue,
  options,
  onOpen,
}: {
  record: DatabaseRecord;
  index: number;
  primaryProperty?: DatabaseProperty;
  descriptionProperty?: DatabaseProperty;
  coverProperty?: DatabaseProperty;
  dateProperty?: DatabaseProperty;
  tagProperties: DatabaseProperty[];
  getValue: (recordId: string, propertyId: string | undefined) => unknown;
  options: PropertyOption[];
  onOpen: () => void;
}) {
  const titleValue = getValue(record.id, primaryProperty?.id);
  const descriptionValue = getValue(record.id, descriptionProperty?.id);
  const coverValue = getValue(record.id, coverProperty?.id);
  const dateValue = getValue(record.id, dateProperty?.id);
  const coverUrl = getCoverUrl(coverValue) || fallbackCovers[index % fallbackCovers.length];
  const tags = getTags(record.id, tagProperties, getValue, options).slice(0, 3);

  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(28,25,23,0.1)] dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
    >
      <div className="relative aspect-[2.05/1] overflow-hidden bg-stone-100 dark:bg-stone-800">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-300 dark:text-stone-600">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="px-4 pb-5 pt-4 sm:px-[18px] sm:pb-6 sm:pt-[18px]">
        <h2 className="text-[21px] font-semibold leading-[1.2] tracking-[-0.02em] text-stone-800 dark:text-stone-100 sm:text-[23px]">
          {String(titleValue || 'Untitled')}
        </h2>

        {descriptionValue != null && descriptionValue !== '' && (
          <p className="mt-4 line-clamp-2 text-[15px] leading-6 text-stone-600 dark:text-stone-300">
            {String(descriptionValue as string)}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={`${tag.propertyId}-${tag.id}`}
                className={`rounded-md px-2 py-1 text-[14px] leading-none ${COLOR_CLASSES[tag.color]?.bg || 'bg-stone-100'} ${COLOR_CLASSES[tag.color]?.text || 'text-stone-700'} dark:brightness-90`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {dateValue != null && dateValue !== '' && (
          <div className="mt-5 flex items-center gap-2 text-[15px] text-stone-600 dark:text-stone-400">
            <CalendarDays className="h-4 w-4 text-stone-400 dark:text-stone-500" />
            <span>{formatDate(dateValue as string | number | Date)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function getCoverUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const firstUrl = value.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return firstUrl || null;
  }
  return null;
}

function getTags(
  recordId: string,
  properties: DatabaseProperty[],
  getValue: (recordId: string, propertyId: string | undefined) => unknown,
  options: PropertyOption[]
) {
  return properties.flatMap((property) => {
    const value = getValue(recordId, property.id);
    const values = Array.isArray(value) ? value : value ? [value] : [];
    const propertyOptions = getPropertyOptions(property.id, options);

    return values.map((item) => {
      const option = propertyOptions.find((candidate) => candidate.id === item || candidate.label === item);
      return {
        id: option?.id || String(item),
        propertyId: property.id,
        label: option?.label || String(item),
        color: option?.color || 'gray',
      };
    });
  });
}

function formatDate(value: unknown): string {
  const rawDate = typeof value === 'string' ? value.split('T')[0] : '';
  const date = new Date(`${rawDate}T00:00:00`);
  if (!rawDate || Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
