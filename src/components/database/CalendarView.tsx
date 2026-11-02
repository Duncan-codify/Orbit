import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useDatabase } from './DatabaseContext';
import {
  type DatabaseView,
  type DatabaseProperty,
  type DatabaseRecord,
  type PropertyOption,
  COLOR_CLASSES,
  getPropertyOptions,
} from '../../lib/database';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarView({
  view,
  onOpenRecord,
}: {
  view: DatabaseView;
  onOpenRecord: (id: string) => void;
}) {
  const { data, addRecord, setValue } = useDatabase();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Resolve the date property — use view config or auto-detect
  const dateProperty = useMemo<DatabaseProperty | undefined>(() => {
    if (view.calendar_property) {
      const configured = data?.properties.find((p) => p.id === view.calendar_property);
      if (configured) return configured;
    }
    return data?.properties.find((p) => p.type === 'date' || p.type === 'date_range');
  }, [view.calendar_property, data?.properties]);

  const primaryProperty = useMemo(
    () => data?.properties.find((p) => p.is_primary) || data?.properties[0],
    [data?.properties]
  );

  const tagProperties = useMemo(
    () => (data?.properties || []).filter((p) =>
      ['select', 'status', 'multi_select', 'tags'].includes(p.type)),
    [data?.properties]
  );

  const recordsByDate = useMemo(() => {
    const map = new Map<string, { record: DatabaseRecord; tagColor: string | null }[]>();
    if (!data || !dateProperty) return map;

    for (const record of data.records) {
      const rawValue = data.values.find(
        (v) => v.record_id === record.id && v.property_id === dateProperty.id
      )?.value;
      if (!rawValue) continue;

      const dateKey = parseDateKey(rawValue);
      if (!dateKey) continue;

      // Resolve a tag color for the dot
      let tagColor: string | null = null;
      for (const tp of tagProperties) {
        const val = data.values.find((v) => v.record_id === record.id && v.property_id === tp.id)?.value;
        if (!val) continue;
        const opts = getPropertyOptions(tp.id, data.options);
        const ids = Array.isArray(val) ? val : [val];
        const found = opts.find((o) => ids.includes(o.id));
        if (found) { tagColor = found.color; break; }
      }

      const existing = map.get(dateKey) || [];
      existing.push({ record, tagColor });
      map.set(dateKey, existing);
    }
    return map;
  }, [data, dateProperty, tagProperties]);

  // Build the 6-row calendar grid
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { dateKey: string; day: number; inMonth: boolean; isToday: boolean }[] = [];

    // Leading days from previous month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const d = new Date(year, month - 1, day);
      cells.push({ dateKey: fmtKey(d), day, inMonth: false, isToday: false });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      cells.push({ dateKey: fmtKey(d), day, inMonth: true, isToday });
    }
    // Trailing days to fill 42 cells
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      cells.push({ dateKey: fmtKey(d), day, inMonth: false, isToday: false });
    }

    return cells;
  }, [cursor, today]);

  if (!data) return null;

  const recordsForSelected = selectedDate
    ? recordsByDate.get(selectedDate) || []
    : [];

  const recordsWithoutDate = data.records.filter((rec) => {
    if (!dateProperty) return true;
    const val = data.values.find((v) => v.record_id === rec.id && v.property_id === dateProperty.id)?.value;
    return !val || !parseDateKey(val);
  });

  return (
    <div className="flex flex-col lg:flex-row h-full bg-white dark:bg-stone-950">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col p-3 sm:p-5 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
            <button
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-xs px-2 py-1 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1) && setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-semibold text-stone-400 dark:text-stone-500 py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden flex-1">
          {grid.map((cell) => {
            const items = recordsByDate.get(cell.dateKey) || [];
            const isSelected = selectedDate === cell.dateKey;
            return (
              <div
                key={cell.dateKey}
                onClick={() => setSelectedDate(isSelected ? null : cell.dateKey)}
                className={`relative min-h-[72px] sm:min-h-[96px] p-1 cursor-pointer transition-colors group ${
                  cell.inMonth
                    ? 'bg-white dark:bg-stone-900'
                    : 'bg-stone-50/60 dark:bg-stone-950/60'
                } ${
                  isSelected
                    ? 'ring-2 ring-blue-400 ring-inset z-10'
                    : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                    cell.isToday
                      ? 'bg-blue-500 text-white'
                      : cell.inMonth
                        ? 'text-stone-700 dark:text-stone-300'
                        : 'text-stone-300 dark:text-stone-700'
                  }`}
                >
                  {cell.day}
                </div>
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {items.slice(0, 3).map((item) => {
                    const title = getRecordTitle(data, item.record.id, primaryProperty?.id);
                    const colorClass = item.tagColor
                      ? COLOR_CLASSES[item.tagColor]
                      : null;
                    return (
                      <div
                        key={item.record.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRecord(item.record.id);
                        }}
                        className="flex items-center gap-1 px-1 py-0.5 rounded text-[11px] leading-tight hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer max-w-full"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            colorClass ? colorClass.dot : 'bg-stone-400'
                          }`}
                        />
                        <span className="truncate text-stone-600 dark:text-stone-300">{title}</span>
                      </div>
                    );
                  })}
                  {items.length > 3 && (
                    <div className="text-[10px] text-stone-400 dark:text-stone-600 px-1">
                      +{items.length - 3} more
                    </div>
                  )}
                </div>
                {/* Quick add on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addRecord().then((newId) => {
                      if (newId && dateProperty) {
                        setValue(newId, dateProperty.id, cell.dateKey);
                      }
                    });
                  }}
                  className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-stone-300 dark:text-stone-700 hover:text-stone-600 dark:hover:text-stone-300 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda sidebar */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-stone-100 dark:border-stone-800 flex flex-col max-h-[50vh] lg:max-h-none">
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {selectedDate ? formatPretty(selectedDate) : 'Upcoming'}
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            {selectedDate
              ? `${recordsForSelected.length} item${recordsForSelected.length !== 1 ? 's' : ''}`
              : `${recordsWithoutDate.length} unscheduled`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedDate ? (
            recordsForSelected.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-stone-400 dark:text-stone-500">Nothing scheduled</p>
                <button
                  onClick={() => addRecord()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add record
                </button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {recordsForSelected.map((item) => (
                  <AgendaItem
                    key={item.record.id}
                    title={getRecordTitle(data, item.record.id, primaryProperty?.id)}
                    tagColor={item.tagColor}
                    onClick={() => onOpenRecord(item.record.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="p-2">
              {recordsWithoutDate.length === 0 ? (
                <div className="px-2 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
                  All records are scheduled
                </div>
              ) : (
                recordsWithoutDate.map((rec) => (
                  <AgendaItem
                    key={rec.id}
                    title={getRecordTitle(data, rec.id, primaryProperty?.id)}
                    tagColor={null}
                    onClick={() => onOpenRecord(rec.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function AgendaItem({
  title,
  tagColor,
  onClick,
}: {
  title: string;
  tagColor: string | null;
  onClick: () => void;
}) {
  const colorClass = tagColor ? COLOR_CLASSES[tagColor] : null;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors group text-left"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass ? colorClass.dot : 'bg-stone-300 dark:bg-stone-700'}`} />
      <span className="flex-1 text-sm text-stone-700 dark:text-stone-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </span>
    </button>
  );
}

function getRecordTitle(
  data: NonNullable<ReturnType<typeof useDatabase>['data']>,
  recordId: string,
  primaryPropId?: string
): string {
  if (!primaryPropId) return 'Untitled';
  const val = data.values.find((v) => v.record_id === recordId && v.property_id === primaryPropId)?.value;
  return val ? String(val) : 'Untitled';
}

function parseDateKey(value: unknown): string | null {
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return fmtKey(d);
  }
  if (value && typeof value === 'object' && 'start' in value) {
    const start = (value as { start: string }).start;
    if (start) {
      const d = new Date(start);
      if (!isNaN(d.getTime())) return fmtKey(d);
    }
  }
  return null;
}

function fmtKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPretty(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  if (isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });
}
