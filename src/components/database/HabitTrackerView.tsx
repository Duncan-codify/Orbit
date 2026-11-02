import { useState, useEffect, useMemo } from 'react';
import { Flame, TrendingUp, Check, Plus, ChevronLeft, ChevronRight, StickyNote, X } from 'lucide-react';
import { useDatabase } from './DatabaseContext';
import {
  type DatabaseView,
  type DatabaseProperty,
  type DatabaseRecord,
  type HabitCheckIn,
  type PropertyOption,
  COLOR_CLASSES,
  getPropertyOptions,
  fetchCheckIns,
  upsertCheckIn,
  deleteCheckIn,
} from '../../lib/database';
import { supabase } from '../../lib/supabase';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOODS: { value: string; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Great', emoji: '😄', color: 'green' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'teal' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'yellow' },
  { value: 'low', label: 'Low', emoji: '😕', color: 'orange' },
  { value: 'tough', label: 'Tough', emoji: '😣', color: 'red' },
];

export function HabitTrackerView({
  view: _view,
  onOpenRecord,
}: {
  view: DatabaseView;
  onOpenRecord: (id: string) => void;
}) {
  void _view;
  const { data, addRecord } = useDatabase();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [checkInMap, setCheckInMap] = useState<Map<string, HabitCheckIn[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showNote, setShowNote] = useState<string | null>(null);

  const today = new Date();
  const todayKey = fmtDateKey(today);

  // Load all check-ins for all records in this database
  useEffect(() => {
    if (!data || data.records.length === 0) {
      setCheckInMap(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const allCheckIns: Map<string, HabitCheckIn[]> = new Map();
      const results = await Promise.all(
        data.records.map((r) => fetchCheckIns(r.id).catch(() => [] as HabitCheckIn[]))
      );
      data.records.forEach((rec, i) => {
        allCheckIns.set(rec.id, results[i]);
      });
      setCheckInMap(allCheckIns);
      setLoading(false);
    })();
  }, [data?.records.length]);

  // Auto-select first habit
  useEffect(() => {
    if (!selectedHabitId && data && data.records.length > 0) {
      setSelectedHabitId(data.records[0].id);
    }
  }, [data, selectedHabitId]);

  if (!data) return null;

  const primaryProp = data.properties.find((p) => p.is_primary) || data.properties[0];
  const tagProps = data.properties.filter((p) =>
    ['select', 'status', 'multi_select', 'tags'].includes(p.type));

  // Identify frequency property
  const freqProp = data.properties.find((p) =>
    p.name.toLowerCase().includes('frequency') || p.type === 'select');

  const orderedRecords = [...data.records].sort((a, b) => a.position - b.position);

  // Stats per habit
  const habitStats = useMemo(() => {
    const stats: Record<string, {
      currentStreak: number;
      longestStreak: number;
      completionRate: number;
      totalCheckIns: number;
      last30Rate: number;
    }> = {};
    for (const rec of orderedRecords) {
      const checkIns = (checkInMap.get(rec.id) || []).filter((c) => c.completed);
      const sorted = [...checkIns].sort((a, b) => a.check_date.localeCompare(b.check_date));
      stats[rec.id] = computeStreaks(sorted);
    }
    return stats;
  }, [orderedRecords, checkInMap]);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-white dark:bg-stone-950 min-h-[calc(100vh-7rem)]">
      {/* Left — habit list */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-stone-100 dark:border-stone-800 flex flex-col">
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Your Habits</h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            {orderedRecords.length} habit{orderedRecords.length !== 1 ? 's' : ''} tracked
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {orderedRecords.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-3">No habits yet</p>
              <button
                onClick={() => addRecord()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add habit
              </button>
            </div>
          ) : (
            orderedRecords.map((rec) => {
              const title = getRecordTitle(data, rec.id, primaryProp?.id);
              const tags = getTagsForRecord(data, rec.id, tagProps);
              const stat = habitStats[rec.id];
              const isSelected = selectedHabitId === rec.id;
              const todayChecked = isTodayChecked(checkInMap.get(rec.id) || []);
              return (
                <button
                  key={rec.id}
                  onClick={() => setSelectedHabitId(rec.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-stone-100 dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate flex-1">
                      {title}
                    </span>
                    {todayChecked && (
                      <span className="shrink-0 ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {stat?.currentStreak || 0}
                      </span>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {tags.map((t) => (
                        <span
                          key={t.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${COLOR_CLASSES[t.color]?.bg || 'bg-stone-100'} ${COLOR_CLASSES[t.color]?.text || 'text-stone-600'}`}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-stone-400 dark:text-stone-500">
                    <span>{stat?.totalCheckIns || 0} done</span>
                    <span>·</span>
                    <span>{stat?.completionRate || 0}% rate</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => addRecord()}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 border-t border-stone-100 dark:border-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New habit
        </button>
      </div>

      {/* Right — selected habit detail */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedHabitId ? (
          <HabitDetail
            recordId={selectedHabitId}
            data={data}
            primaryProp={primaryProp}
            tagProps={tagProps}
            freqProp={freqProp}
            checkIns={checkInMap.get(selectedHabitId) || []}
            loading={loading}
            todayKey={todayKey}
            onToggleToday={async (dateKey, currentCompleted, mood, note) => {
              const newCompleted = !currentCompleted;
              const updated = await upsertCheckIn(selectedHabitId, dateKey, newCompleted, mood, note);
              setCheckInMap((prev) => {
                const next = new Map(prev);
                const list = next.get(selectedHabitId) || [];
                const filtered = list.filter((c) => c.check_date !== dateKey);
                if (updated) filtered.push(updated);
                filtered.sort((a, b) => a.check_date.localeCompare(b.check_date));
                next.set(selectedHabitId, filtered);
                return next;
              });
            }}
            onDeleteCheckIn={async (dateKey) => {
              await deleteCheckIn(selectedHabitId, dateKey);
              setCheckInMap((prev) => {
                const next = new Map(prev);
                const list = next.get(selectedHabitId) || [];
                next.set(selectedHabitId, list.filter((c) => c.check_date !== dateKey));
                return next;
              });
            }}
            onOpenRecord={() => onOpenRecord(selectedHabitId)}
            onSetMood={async (dateKey, mood, currentCompleted) => {
              const updated = await upsertCheckIn(selectedHabitId, dateKey, currentCompleted, mood);
              setCheckInMap((prev) => {
                const next = new Map(prev);
                const list = next.get(selectedHabitId) || [];
                const filtered = list.filter((c) => c.check_date !== dateKey);
                if (updated) filtered.push(updated);
                filtered.sort((a, b) => a.check_date.localeCompare(b.check_date));
                next.set(selectedHabitId, filtered);
                return next;
              });
            }}
            showNote={showNote}
            setShowNote={setShowNote}
            onSaveNote={async (dateKey, note, currentCompleted, mood) => {
              const updated = await upsertCheckIn(selectedHabitId, dateKey, currentCompleted, mood, note);
              setCheckInMap((prev) => {
                const next = new Map(prev);
                const list = next.get(selectedHabitId) || [];
                const filtered = list.filter((c) => c.check_date !== dateKey);
                if (updated) filtered.push(updated);
                filtered.sort((a, b) => a.check_date.localeCompare(b.check_date));
                next.set(selectedHabitId, filtered);
                return next;
              });
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 dark:text-stone-500">
            <div className="text-center">
              <Check className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a habit to track</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Habit Detail Panel ──────────────────────────────────────────

function HabitDetail({
  recordId,
  data,
  primaryProp,
  tagProps,
  freqProp,
  checkIns,
  loading,
  todayKey,
  onToggleToday,
  onDeleteCheckIn,
  onOpenRecord,
  onSetMood,
  showNote,
  setShowNote,
  onSaveNote,
}: {
  recordId: string;
  data: NonNullable<ReturnType<typeof useDatabase>['data']>;
  primaryProp?: DatabaseProperty;
  tagProps: DatabaseProperty[];
  freqProp?: DatabaseProperty;
  checkIns: HabitCheckIn[];
  loading: boolean;
  todayKey: string;
  onToggleToday: (dateKey: string, currentCompleted: boolean, mood?: string | null, note?: string | null) => Promise<void>;
  onDeleteCheckIn: (dateKey: string) => Promise<void>;
  onOpenRecord: () => void;
  onSetMood: (dateKey: string, mood: string, currentCompleted: boolean) => Promise<void>;
  showNote: string | null;
  setShowNote: (id: string | null) => void;
  onSaveNote: (dateKey: string, note: string, currentCompleted: boolean, mood?: string | null) => Promise<void>;
}) {
  const title = getRecordTitle(data, recordId, primaryProp?.id);
  const tags = getTagsForRecord(data, recordId, tagProps);
  const freqValue = freqProp
    ? data.values.find((v) => v.record_id === recordId && v.property_id === freqProp.id)?.value
    : null;
  const freqOptions = freqProp ? getPropertyOptions(freqProp.id, data.options) : [];
  const freqLabel = freqValue
    ? freqOptions.find((o) => o.id === freqValue)?.label || String(freqValue)
    : 'Daily';

  const completedCheckIns = useMemo(
    () => checkIns.filter((c) => c.completed).sort((a, b) => a.check_date.localeCompare(b.check_date)),
    [checkIns]
  );

  const stats = useMemo(() => computeStreaks(completedCheckIns), [completedCheckIns]);
  const todayCheckIn = checkIns.find((c) => c.check_date === todayKey);
  const todayDone = !!todayCheckIn?.completed;

  // Last 84 days (12 weeks) for heatmap
  const heatmapData = useMemo(() => buildHeatmapData(completedCheckIns, 84), [completedCheckIns]);

  // Weekly chart — last 7 days
  const weeklyData = useMemo(() => {
    const days: { dateKey: string; label: string; done: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = fmtDateKey(d);
      days.push({
        dateKey: key,
        label: WEEKDAYS[d.getDay()],
        done: completedCheckIns.some((c) => c.check_date === key),
      });
    }
    return days;
  }, [completedCheckIns]);

  // Mood distribution
  const moodDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const c of checkIns) {
      if (c.mood) dist[c.mood] = (dist[c.mood] || 0) + 1;
    }
    return dist;
  }, [checkIns]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-stone-200 dark:border-stone-700 border-t-stone-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={onOpenRecord}
            className="text-xl font-bold text-stone-900 dark:text-stone-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
          >
            {title}
          </button>
          <div className="flex items-center gap-2 mt-1">
            {tags.map((t) => (
              <span key={t.id} className={`text-xs px-2 py-0.5 rounded-md ${COLOR_CLASSES[t.color]?.bg} ${COLOR_CLASSES[t.color]?.text}`}>
                {t.label}
              </span>
            ))}
            <span className="text-xs text-stone-400 dark:text-stone-500">{freqLabel}</span>
          </div>
        </div>
        <button
          onClick={() => onToggleToday(todayKey, todayDone, todayCheckIn?.mood, todayCheckIn?.note)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            todayDone
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:scale-[1.02]'
          }`}
        >
          <Check className="w-4 h-4" />
          {todayDone ? 'Done today' : 'Mark today'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniStat
          icon={<Flame className="w-4 h-4" />}
          label="Current Streak"
          value={`${stats.currentStreak}`}
          sub={stats.currentStreak === 1 ? 'day' : 'days'}
          accent="orange"
        />
        <MiniStat
          icon={<TrendingUp className="w-4 h-4" />}
          label="Longest Streak"
          value={`${stats.longestStreak}`}
          sub={stats.longestStreak === 1 ? 'day' : 'days'}
          accent="blue"
        />
        <MiniStat
          icon={<Check className="w-4 h-4" />}
          label="Total Check-ins"
          value={`${stats.totalCheckIns}`}
          sub="completed"
          accent="green"
        />
        <MiniStat
          icon={<TrendingUp className="w-4 h-4" />}
          label="30-Day Rate"
          value={`${stats.last30Rate}%`}
          sub="completion"
          accent="teal"
        />
      </div>

      {/* Weekly chart */}
      <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-4 mb-6">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">This Week</h4>
        <div className="flex items-end justify-between gap-2">
          {weeklyData.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div className="h-24 w-full flex items-end justify-center">
                <div
                  className={`w-full max-w-8 rounded-lg transition-all duration-500 ${
                    day.done
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                      : 'bg-stone-200 dark:bg-stone-700'
                  }`}
                  style={{ height: day.done ? '100%' : '12%' }}
                />
              </div>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Last 12 Weeks
          </h4>
          <div className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-stone-200 dark:bg-stone-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {heatmapData.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm ${
                    !day.inRange
                      ? 'bg-transparent'
                      : day.done
                        ? day.moodColor
                          ? `${COLOR_CLASSES[day.moodColor]?.bg} ${COLOR_CLASSES[day.moodColor]?.dot}`
                          : 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-stone-200 dark:bg-stone-700'
                  }`}
                  title={day.dateKey}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-2 text-[9px] text-stone-400 dark:text-stone-600">
          {MONTHS.map((m, i) => (
            <span key={i} className="flex-1 text-center">{m[0]}</span>
          ))}
        </div>
      </div>

      {/* Mood tracking */}
      <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-4 mb-6">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
          Today's Mood
        </h4>
        <div className="flex items-center justify-around">
          {MOODS.map((mood) => {
            const isToday = todayCheckIn?.mood === mood.value;
            return (
              <button
                key={mood.value}
                onClick={() => onSetMood(todayKey, mood.value, todayDone || false)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isToday ? 'bg-white dark:bg-stone-800 shadow-sm scale-105' : 'hover:bg-white dark:hover:bg-stone-800'
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className={`text-[10px] ${isToday ? `${COLOR_CLASSES[mood.color]?.text} font-medium` : 'text-stone-400 dark:text-stone-500'}`}>
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood distribution chart */}
      {Object.keys(moodDist).length > 0 && (
        <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-4 mb-6">
          <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
            Mood Distribution
          </h4>
          <div className="space-y-2">
            {MOODS.map((mood) => {
              const count = moodDist[mood.value] || 0;
              const total = Object.values(moodDist).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={mood.value} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{mood.emoji}</span>
                  <div className="flex-1 h-5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${COLOR_CLASSES[mood.color]?.dot || 'bg-stone-400'} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent check-ins */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
          Recent Check-ins
        </h4>
        <div className="space-y-1">
          {[...checkIns]
            .sort((a, b) => b.check_date.localeCompare(a.check_date))
            .slice(0, 14)
            .map((ci) => {
              const moodInfo = MOODS.find((m) => m.value === ci.mood);
              return (
                <div
                  key={ci.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                >
                  <button
                    onClick={() => onToggleToday(ci.check_date, ci.completed, ci.mood, ci.note)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      ci.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-stone-300 dark:border-stone-600 hover:border-emerald-400'
                    }`}
                  >
                    {ci.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="text-sm text-stone-600 dark:text-stone-300 flex-1">
                    {formatCheckInDate(ci.check_date)}
                  </span>
                  {moodInfo && (
                    <span className="text-lg" title={moodInfo.label}>{moodInfo.emoji}</span>
                  )}
                  <button
                    onClick={() => setShowNote(showNote === ci.check_date ? null : ci.check_date)}
                    className={`p-1 rounded transition-colors ${
                      ci.note
                        ? 'text-stone-600 dark:text-stone-300'
                        : 'text-stone-300 dark:text-stone-700 opacity-0 group-hover:opacity-100'
                    } hover:bg-stone-200 dark:hover:bg-stone-700`}
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCheckIn(ci.check_date)}
                    className="p-1 rounded text-stone-300 dark:text-stone-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          {checkIns.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-stone-400 dark:text-stone-500">
              No check-ins yet — mark today to start your streak!
            </div>
          )}
        </div>
      </div>

      {/* Note editor */}
      {showNote && (
        <NoteEditor
          dateKey={showNote}
          initialNote={checkIns.find((c) => c.check_date === showNote)?.note || ''}
          initialMood={checkIns.find((c) => c.check_date === showNote)?.mood}
          completed={checkIns.find((c) => c.check_date === showNote)?.completed || false}
          onClose={() => setShowNote(null)}
          onSave={(note, mood) => {
            onSaveNote(showNote, note, checkIns.find((c) => c.check_date === showNote)?.completed || false, mood);
            setShowNote(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Note Editor ─────────────────────────────────────────────────

function NoteEditor({
  dateKey,
  initialNote,
  initialMood,
  completed,
  onClose,
  onSave,
}: {
  dateKey: string;
  initialNote: string;
  initialMood?: string | null;
  completed: boolean;
  onClose: () => void;
  onSave: (note: string, mood: string | null) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [mood, setMood] = useState<string | null>(initialMood || null);
  void completed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Note for {formatCheckInDate(dateKey)}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did it go? Any reflections?"
          rows={4}
          autoFocus
          className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-3"
        />
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-stone-400 dark:text-stone-500">Mood:</span>
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`text-xl p-1 rounded-lg transition-all ${mood === m.value ? 'bg-stone-100 dark:bg-stone-700 scale-110' : 'opacity-50 hover:opacity-100'}`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(note.trim() || null, mood)}
            className="px-4 py-1.5 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:scale-[1.02] transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Stat Card ──────────────────────────────────────────────

const MINI_ACCENT: Record<string, { bg: string; text: string }> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
};

function MiniStat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: keyof typeof MINI_ACCENT;
}) {
  const c = MINI_ACCENT[accent];
  return (
    <div className="bg-stone-50 dark:bg-stone-800/40 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`${c.bg} ${c.text} w-7 h-7 rounded-lg flex items-center justify-center`}>
          {icon}
        </span>
        <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">{sub}</span>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function computeStreaks(checkIns: HabitCheckIn[]) {
  if (checkIns.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completionRate: 0, totalCheckIns: 0, last30Rate: 0 };
  }

  const dateSet = new Set(checkIns.map((c) => c.check_date));
  const sortedDates = checkIns.map((c) => c.check_date).sort();
  const total = checkIns.length;

  // Current streak — count back from today
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = fmtDateKey(d);
    if (dateSet.has(key)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let temp = 0;
  let prevDate: string | null = null;
  for (const dateStr of sortedDates) {
    if (prevDate) {
      const diff = dayDiff(prevDate, dateStr);
      if (diff === 1) {
        temp++;
      } else {
        temp = 1;
      }
    } else {
      temp = 1;
    }
    longestStreak = Math.max(longestStreak, temp);
    prevDate = dateStr;
  }

  // 30-day completion rate
  let last30Count = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dateSet.has(fmtDateKey(d))) last30Count++;
  }
  const last30Rate = Math.round((last30Count / 30) * 100);

  // Overall completion rate (since first check-in)
  const firstDate = new Date(sortedDates[0]);
  const totalDays = Math.max(1, dayDiff(sortedDates[0], fmtDateKey(today)) + 1);
  const completionRate = Math.round((total / totalDays) * 100);

  return { currentStreak, longestStreak, completionRate, totalCheckIns: total, last30Rate };
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function fmtDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatCheckInDate(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  if (isNaN(d.getTime())) return dateKey;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 0 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isTodayChecked(checkIns: HabitCheckIn[]): boolean {
  const today = fmtDateKey(new Date());
  return checkIns.some((c) => c.check_date === today && c.completed);
}

interface HeatmapDay {
  dateKey: string;
  inRange: boolean;
  done: boolean;
  moodColor: string | null;
}

function buildHeatmapData(checkIns: HabitCheckIn[], days: number) {
  const dateMap = new Map<string, HabitCheckIn>();
  for (const ci of checkIns) {
    dateMap.set(ci.check_date, ci);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Sunday of the week that is `days` ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setDate(startDate.getDate() - startDate.getDay()); // back to Sunday

  const weeks: HeatmapDay[][] = [];
  let current = new Date(startDate);
  while (current <= today) {
    const week: HeatmapDay[] = [];
    for (let i = 0; i < 7; i++) {
      const key = fmtDateKey(current);
      const inRange = current <= today && current >= new Date(startDate);
      const ci = dateMap.get(key);
      week.push({
        dateKey: key,
        inRange,
        done: !!ci?.completed,
        moodColor: ci?.mood || null,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks };
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

function getTagsForRecord(
  data: NonNullable<ReturnType<typeof useDatabase>['data']>,
  recordId: string,
  tagProps: DatabaseProperty[]
): { id: string; label: string; color: string }[] {
  const result: { id: string; label: string; color: string }[] = [];
  for (const tp of tagProps) {
    const val = data.values.find((v) => v.record_id === recordId && v.property_id === tp.id)?.value;
    if (!val) continue;
    const opts = getPropertyOptions(tp.id, data.options);
    const ids = Array.isArray(val) ? val : [val];
    for (const id of ids) {
      const opt = opts.find((o) => o.id === id);
      if (opt) result.push({ id: opt.id, label: opt.label, color: opt.color });
    }
  }
  return result.slice(0, 4);
}
