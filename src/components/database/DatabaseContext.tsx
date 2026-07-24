import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import {
  type FullDatabase,
  type DatabaseView,
  type PropertyOption,
  type PropertyType,
  type ViewType,
  type RecordValue,
  fetchFullDatabase,
  createProperty as apiCreateProperty,
  updateProperty as apiUpdateProperty,
  deleteProperty as apiDeleteProperty,
  createOption as apiCreateOption,
  updateOption as apiUpdateOption,
  deleteOption as apiDeleteOption,
  createView as apiCreateView,
  updateView as apiUpdateView,
  deleteView as apiDeleteView,
  createRecord as apiCreateRecord,
  deleteRecord as apiDeleteRecord,
  upsertValue as apiUpsertValue,
  updateDatabase as apiUpdateDatabase,
} from '../../lib/database';

interface DatabaseContextValue {
  data: FullDatabase | null;
  loading: boolean;
  activeViewId: string | null;
  setActiveViewId: (id: string) => void;
  activeView: DatabaseView | null;
  reload: () => Promise<void>;

  // Database
  updateDatabaseName: (name: string) => void;
  updateDatabaseMeta: (meta: Partial<{ icon: string; cover: string; description: string }>) => void;

  // Views
  addView: (name: string, type: ViewType) => Promise<void>;
  renameView: (id: string, name: string) => void;
  removeView: (id: string) => Promise<void>;
  duplicateView: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  togglePinned: (id: string) => void;
  setDefaultView: (id: string) => void;
  updateViewConfig: (id: string, updates: Partial<DatabaseView>) => void;
  reorderViews: (fromId: string, toId: string) => void;

  // Properties
  addProperty: (name: string, type: PropertyType) => Promise<void>;
  renameProperty: (id: string, name: string) => void;
  updatePropertyConfig: (id: string, config: Record<string, unknown>) => void;
  removeProperty: (id: string) => Promise<void>;
  reorderProperties: (fromId: string, toId: string) => void;

  // Options
  addOption: (propertyId: string, label: string, color: string) => Promise<void>;
  updateOption: (id: string, updates: Partial<PropertyOption>) => void;
  removeOption: (id: string) => Promise<void>;

  // Records
  addRecord: () => Promise<string | null>;
  removeRecord: (id: string) => Promise<void>;

  // Values
  setValue: (recordId: string, propertyId: string, value: unknown) => void;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}

export function DatabaseProvider({
  databaseId,
  children,
}: {
  databaseId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<FullDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const reload = useCallback(async () => {
    const full = await fetchFullDatabase(databaseId);
    setData(full);
    if (full && !activeViewId && full.views.length > 0) {
      const def = full.views.find((v) => v.is_default) || full.views[0];
      setActiveViewId(def.id);
    }
    setLoading(false);
  }, [databaseId, activeViewId]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setActiveViewId(null);
    reload();
  }, [databaseId]);

  // Optimistic helpers
  const optimisticUpdateData = (fn: (d: FullDatabase) => FullDatabase) => {
    setData((prev) => (prev ? fn(prev) : prev));
  };

  const debouncedPersist = (key: string, fn: () => Promise<void>, delay = 400) => {
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(() => {
      fn().catch((e) => console.error('Persist failed:', e));
    }, delay);
  };

  // ─── Database ─────────────────────────────────────────────
  const updateDatabaseName = (name: string) => {
    optimisticUpdateData((d) => ({ ...d, database: { ...d.database, name } }));
    debouncedPersist('db_name', () => apiUpdateDatabase(databaseId, { name }), 500);
  };

  const updateDatabaseMeta = (meta: Partial<{ icon: string; cover: string; description: string }>) => {
    optimisticUpdateData((d) => ({ ...d, database: { ...d.database, ...meta } }));
    debouncedPersist('db_meta', () => apiUpdateDatabase(databaseId, meta as Record<string, unknown>), 400);
  };

  // ─── Views ────────────────────────────────────────────────
  const addView = async (name: string, type: ViewType) => {
    if (!data) return;
    const position = data.views.length;
    const newView = await apiCreateView(databaseId, name, type, position);
    optimisticUpdateData((d) => ({ ...d, views: [...d.views, newView] }));
    setActiveViewId(newView.id);
  };

  const renameView = (id: string, name: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      views: d.views.map((v) => (v.id === id ? { ...v, name } : v)),
    }));
    debouncedPersist(`view_${id}`, () => apiUpdateView(id, { name }));
  };

  const removeView = async (id: string) => {
    if (!data || data.views.length <= 1) return;
    optimisticUpdateData((d) => ({
      ...d,
      views: d.views.filter((v) => v.id !== id),
    }));
    await apiDeleteView(id);
    if (activeViewId === id) {
      const remaining = data.views.filter((v) => v.id !== id);
      if (remaining.length) setActiveViewId(remaining[0].id);
    }
  };

  const duplicateView = async (id: string) => {
    if (!data) return;
    const src = data.views.find((v) => v.id === id);
    if (!src) return;
    const position = data.views.length;
    const newView = await apiCreateView(databaseId, `${src.name} copy`, src.type, position);
    await apiUpdateView(newView.id, {
      hidden_properties: src.hidden_properties,
      row_height: src.row_height,
      card_size: src.card_size,
      color_settings: src.color_settings,
      calendar_property: src.calendar_property,
      group_by_property: src.group_by_property,
    });
    optimisticUpdateData((d) => ({ ...d, views: [...d.views, { ...newView, ...src, id: newView.id, name: `${src.name} copy`, position }] }));
    setActiveViewId(newView.id);
  };

  const toggleFavorite = (id: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      views: d.views.map((v) => (v.id === id ? { ...v, is_favorite: !v.is_favorite } : v)),
    }));
    const v = data?.views.find((x) => x.id === id);
    if (v) debouncedPersist(`view_${id}`, () => apiUpdateView(id, { is_favorite: !v.is_favorite }));
  };

  const togglePinned = (id: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      views: d.views.map((v) => (v.id === id ? { ...v, is_pinned: !v.is_pinned } : v)),
    }));
    const v = data?.views.find((x) => x.id === id);
    if (v) debouncedPersist(`view_${id}`, () => apiUpdateView(id, { is_pinned: !v.is_pinned }));
  };

  const setDefaultView = (id: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      views: d.views.map((v) => ({ ...v, is_default: v.id === id })),
    }));
    if (data) {
      data.views.forEach((v) => {
        apiUpdateView(v.id, { is_default: v.id === id });
      });
    }
  };

  const updateViewConfig = (id: string, updates: Partial<DatabaseView>) => {
    optimisticUpdateData((d) => ({
      ...d,
      views: d.views.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }));
    debouncedPersist(`view_${id}`, () => apiUpdateView(id, updates));
  };

  const reorderViews = (fromId: string, toId: string) => {
    if (!data || fromId === toId) return;
    const ordered = [...data.views].sort((a, b) => a.position - b.position);
    const fromIdx = ordered.findIndex((v) => v.id === fromId);
    const toIdx = ordered.findIndex((v) => v.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    const renumbered = ordered.map((v, i) => ({ ...v, position: i }));
    optimisticUpdateData((d) => ({ ...d, views: renumbered }));
    renumbered.forEach((v) => apiUpdateView(v.id, { position: v.position }));
  };

  // ─── Properties ──────────────────────────────────────────
  const addProperty = async (name: string, type: PropertyType) => {
    if (!data) return;
    const position = data.properties.length;
    const newProp = await apiCreateProperty(databaseId, name, type, position, false, {});
    optimisticUpdateData((d) => ({ ...d, properties: [...d.properties, newProp] }));
  };

  const renameProperty = (id: string, name: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      properties: d.properties.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
    debouncedPersist(`prop_${id}`, () => apiUpdateProperty(id, { name }));
  };

  const updatePropertyConfig = (id: string, config: Record<string, unknown>) => {
    optimisticUpdateData((d) => ({
      ...d,
      properties: d.properties.map((p) => (p.id === id ? { ...p, config: { ...p.config, ...config } } : p)),
    }));
    debouncedPersist(`prop_${id}`, () => apiUpdateProperty(id, { config }));
  };

  const removeProperty = async (id: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      properties: d.properties.filter((p) => p.id !== id),
      values: d.values.filter((v) => v.property_id !== id),
      options: d.options.filter((o) => o.property_id !== id),
    }));
    await apiDeleteProperty(id);
  };

  const reorderProperties = (fromId: string, toId: string) => {
    if (!data || fromId === toId) return;
    const ordered = [...data.properties].sort((a, b) => a.position - b.position);
    const fromIdx = ordered.findIndex((p) => p.id === fromId);
    const toIdx = ordered.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    const renumbered = ordered.map((p, i) => ({ ...p, position: i }));
    optimisticUpdateData((d) => ({ ...d, properties: renumbered }));
    renumbered.forEach((p) => apiUpdateProperty(p.id, { position: p.position }));
  };

  // ─── Options ─────────────────────────────────────────────
  const addOption = async (propertyId: string, label: string, color: string) => {
    if (!data) return;
    const position = data.options.filter((o) => o.property_id === propertyId).length;
    const newOpt = await apiCreateOption(propertyId, label, color, position);
    optimisticUpdateData((d) => ({ ...d, options: [...d.options, newOpt] }));
  };

  const updateOption = (id: string, updates: Partial<PropertyOption>) => {
    optimisticUpdateData((d) => ({
      ...d,
      options: d.options.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
    debouncedPersist(`opt_${id}`, () => apiUpdateOption(id, updates));
  };

  const removeOption = async (id: string) => {
    optimisticUpdateData((d) => ({ ...d, options: d.options.filter((o) => o.id !== id) }));
    await apiDeleteOption(id);
  };

  // ─── Records ──────────────────────────────────────────────
  const addRecord = async () => {
    if (!data) return null;
    const position = data.records.length;
    const newRec = await apiCreateRecord(databaseId, position);
    optimisticUpdateData((d) => ({ ...d, records: [...d.records, newRec] }));
    return newRec.id;
  };

  const removeRecord = async (id: string) => {
    optimisticUpdateData((d) => ({
      ...d,
      records: d.records.filter((r) => r.id !== id),
      values: d.values.filter((v) => v.record_id !== id),
    }));
    await apiDeleteRecord(id);
  };

  // ─── Values ───────────────────────────────────────────────
  const setValue = (recordId: string, propertyId: string, value: unknown) => {
    optimisticUpdateData((d) => {
      const existing = d.values.find((v) => v.record_id === recordId && v.property_id === propertyId);
      let newValues: RecordValue[];
      if (existing) {
        newValues = d.values.map((v) =>
          v.record_id === recordId && v.property_id === propertyId ? { ...v, value } : v
        );
      } else {
        newValues = [
          ...d.values,
          {
            id: crypto.randomUUID(),
            record_id: recordId,
            property_id: propertyId,
            value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      return { ...d, values: newValues };
    });
    debouncedPersist(`val_${recordId}_${propertyId}`, () => apiUpsertValue(recordId, propertyId, value), 300);
  };

  const activeView = data?.views.find((v) => v.id === activeViewId) || null;

  return (
    <DatabaseContext.Provider
      value={{
        data,
        loading,
        activeViewId,
        setActiveViewId,
        activeView,
        reload,
        updateDatabaseName,
        updateDatabaseMeta,
        addView,
        renameView,
        removeView,
        duplicateView,
        toggleFavorite,
        togglePinned,
        setDefaultView,
        updateViewConfig,
        reorderViews,
        addProperty,
        renameProperty,
        updatePropertyConfig,
        removeProperty,
        reorderProperties,
        addOption,
        updateOption,
        removeOption,
        addRecord,
        removeRecord,
        setValue,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
