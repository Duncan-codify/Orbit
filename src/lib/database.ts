import { supabase } from './supabase';

// ==================== TYPES ====================

export type PropertyType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'rating'
  | 'checkbox'
  | 'status'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'date_range'
  | 'time'
  | 'duration'
  | 'person'
  | 'email'
  | 'phone'
  | 'url'
  | 'location'
  | 'files'
  | 'images'
  | 'color'
  | 'tags'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'lookup'
  | 'button'
  | 'created_time'
  | 'updated_time'
  | 'created_by'
  | 'last_edited_by'
  | 'progress'
  | 'ai_generated'
  | 'uuid'
  | 'auto_increment'
  | 'json';

export type ViewType =
  | 'table'
  | 'board'
  | 'gallery'
  | 'list'
  | 'calendar'
  | 'timeline'
  | 'chart'
  | 'dashboard'
  | 'feed'
  | 'map'
  | 'form'
  | 'gantt'
  | 'spreadsheet'
  | 'tree'
  | 'pivot';

export interface Database {
  id: string;
  name: string;
  icon: string | null;
  cover: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseView {
  id: string;
  database_id: string;
  name: string;
  type: ViewType;
  icon: string | null;
  position: number;
  is_default: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  hidden_properties: string[];
  row_height: 'short' | 'medium' | 'tall';
  card_size: 'small' | 'medium' | 'large';
  color_settings: Record<string, unknown>;
  calendar_property: string | null;
  group_by_property: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProperty {
  id: string;
  database_id: string;
  name: string;
  type: PropertyType;
  position: number;
  is_primary: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseRecord {
  id: string;
  database_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface RecordValue {
  id: string;
  record_id: string;
  property_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface PropertyOption {
  id: string;
  property_id: string;
  label: string;
  color: string;
  position: number;
  created_at: string;
}

export interface ViewFilter {
  id: string;
  view_id: string;
  property_id: string;
  operator: string;
  value: unknown;
  position: number;
}

export interface ViewSort {
  id: string;
  view_id: string;
  property_id: string;
  direction: 'asc' | 'desc';
  position: number;
}

export interface ViewGrouping {
  id: string;
  view_id: string;
  property_id: string;
  collapsed_groups: string[];
}

export interface FullDatabase {
  database: Database;
  views: DatabaseView[];
  properties: DatabaseProperty[];
  records: DatabaseRecord[];
  values: RecordValue[];
  options: PropertyOption[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupings: ViewGrouping[];
}

// ==================== PROPERTY METADATA ====================

export interface PropertyMeta {
  type: PropertyType;
  label: string;
  icon: string;
  description: string;
  category: 'basic' | 'select' | 'date' | 'advanced' | 'system';
}

export const PROPERTY_TYPES: PropertyMeta[] = [
  { type: 'text', label: 'Text', icon: 'Aa', description: 'Single line of text', category: 'basic' },
  { type: 'long_text', label: 'Long Text', icon: '¶', description: 'Multi-line rich text', category: 'basic' },
  { type: 'number', label: 'Number', icon: '123', description: 'Numeric value', category: 'basic' },
  { type: 'currency', label: 'Currency', icon: '$', description: 'Monetary value', category: 'basic' },
  { type: 'percent', label: 'Percent', icon: '%', description: 'Percentage value', category: 'basic' },
  { type: 'rating', label: 'Rating', icon: '★', description: 'Star rating', category: 'basic' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑', description: 'True/false toggle', category: 'basic' },
  { type: 'status', label: 'Status', icon: '◉', description: 'Single status with color', category: 'select' },
  { type: 'select', label: 'Select', icon: '▾', description: 'Single option from list', category: 'select' },
  { type: 'multi_select', label: 'Multi-select', icon: '⊞', description: 'Multiple options', category: 'select' },
  { type: 'date', label: 'Date', icon: '◷', description: 'Date or date & time', category: 'date' },
  { type: 'date_range', label: 'Date Range', icon: '⇄', description: 'Start and end date', category: 'date' },
  { type: 'time', label: 'Time', icon: '⏱', description: 'Time of day', category: 'date' },
  { type: 'duration', label: 'Duration', icon: '⌛', description: 'Length of time', category: 'date' },
  { type: 'person', label: 'Person', icon: '☻', description: 'User reference', category: 'basic' },
  { type: 'email', label: 'Email', icon: '@', description: 'Email address', category: 'basic' },
  { type: 'phone', label: 'Phone', icon: '☎', description: 'Phone number', category: 'basic' },
  { type: 'url', label: 'URL', icon: '↗', description: 'Web link', category: 'basic' },
  { type: 'location', label: 'Location', icon: '⌖', description: 'Geographic location', category: 'basic' },
  { type: 'files', label: 'Files', icon: '⧉', description: 'File attachments', category: 'basic' },
  { type: 'images', label: 'Images', icon: '▣', description: 'Image attachments', category: 'basic' },
  { type: 'color', label: 'Color', icon: '◐', description: 'Color value', category: 'basic' },
  { type: 'tags', label: 'Tags', icon: '#', description: 'Tag list', category: 'select' },
  { type: 'formula', label: 'Formula', icon: 'ƒ', description: 'Computed value', category: 'advanced' },
  { type: 'relation', label: 'Relation', icon: '⇄', description: 'Link to another database', category: 'advanced' },
  { type: 'rollup', label: 'Rollup', icon: 'Σ', description: 'Aggregate related data', category: 'advanced' },
  { type: 'lookup', label: 'Lookup', icon: '⊙', description: 'Pull related values', category: 'advanced' },
  { type: 'button', label: 'Button', icon: '▢', description: 'Action trigger', category: 'advanced' },
  { type: 'created_time', label: 'Created Time', icon: '◷', description: 'When record was created', category: 'system' },
  { type: 'updated_time', label: 'Updated Time', icon: '◷', description: 'When record was last edited', category: 'system' },
  { type: 'created_by', label: 'Created By', icon: '☻', description: 'Who created the record', category: 'system' },
  { type: 'last_edited_by', label: 'Last Edited By', icon: '☻', description: 'Who last edited the record', category: 'system' },
  { type: 'progress', label: 'Progress', icon: '▰', description: 'Completion percentage', category: 'basic' },
  { type: 'ai_generated', label: 'AI Generated', icon: '✦', description: 'AI-computed value', category: 'advanced' },
  { type: 'uuid', label: 'UUID', icon: '⌗', description: 'Unique identifier', category: 'system' },
  { type: 'auto_increment', label: 'Auto Increment ID', icon: '#', description: 'Sequential ID', category: 'system' },
  { type: 'json', label: 'JSON', icon: '{}', description: 'Raw JSON data', category: 'advanced' },
];

export const VIEW_TYPES: { type: ViewType; label: string; icon: string; description: string }[] = [
  { type: 'table', label: 'Table', icon: '▦', description: 'Spreadsheet-style grid view' },
  { type: 'board', label: 'Board', icon: '☰', description: 'Kanban grouped by status' },
  { type: 'gallery', label: 'Gallery', icon: '▦', description: 'Card grid with images' },
  { type: 'list', label: 'List', icon: '≡', description: 'Compact list of records' },
  { type: 'calendar', label: 'Calendar', icon: '◷', description: 'Monthly calendar view' },
  { type: 'timeline', label: 'Timeline', icon: '━', description: 'Horizontal timeline' },
  { type: 'chart', label: 'Chart', icon: '📊', description: 'Visual data chart' },
  { type: 'dashboard', label: 'Dashboard', icon: '▣', description: 'Widget collection' },
  { type: 'feed', label: 'Feed', icon: '⊙', description: 'Activity feed' },
  { type: 'map', label: 'Map', icon: '⌖', description: 'Geographic map' },
  { type: 'form', label: 'Form', icon: '▢', description: 'Input form' },
  { type: 'gantt', label: 'Gantt', icon: '━', description: 'Project Gantt chart' },
  { type: 'spreadsheet', label: 'Spreadsheet', icon: '▦', description: 'Raw spreadsheet' },
  { type: 'tree', label: 'Tree', icon: '⌅', description: 'Hierarchical tree' },
  { type: 'pivot', label: 'Pivot', icon: '⊞', description: 'Pivot table' },
];

export const OPTION_COLORS = [
  'gray', 'red', 'orange', 'yellow', 'green',
  'teal', 'blue', 'indigo', 'purple', 'pink',
];

export const COLOR_CLASSES: Record<string, { bg: string; text: string; dot: string; soft: string }> = {
  gray: { bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-400', soft: 'bg-stone-50' },
  red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', soft: 'bg-red-50' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', soft: 'bg-orange-50' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', soft: 'bg-amber-50' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', soft: 'bg-emerald-50' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500', soft: 'bg-teal-50' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', soft: 'bg-blue-50' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', soft: 'bg-indigo-50' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', soft: 'bg-purple-50' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500', soft: 'bg-pink-50' },
};

// ==================== API ====================

export async function fetchFullDatabase(databaseId: string): Promise<FullDatabase | null> {
  const [dbRes, viewsRes, propsRes, recordsRes, valuesRes, optionsRes, filtersRes, sortsRes, groupingsRes] =
    await Promise.all([
      supabase.from('databases').select('*').eq('id', databaseId).maybeSingle(),
      supabase.from('database_views').select('*').eq('database_id', databaseId).order('position'),
      supabase.from('database_properties').select('*').eq('database_id', databaseId).order('position'),
      supabase.from('database_records').select('*').eq('database_id', databaseId).order('position'),
      supabase
        .from('record_values')
        .select('*, record:database_records!inner(database_id)')
        .eq('record.database_id', databaseId),
      supabase
        .from('property_options')
        .select('*, property:database_properties!inner(database_id)')
        .eq('property.database_id', databaseId)
        .order('position'),
      supabase
        .from('view_filters')
        .select('*, view:database_views!inner(database_id)')
        .eq('view.database_id', databaseId)
        .order('position'),
      supabase
        .from('view_sorts')
        .select('*, view:database_views!inner(database_id)')
        .eq('view.database_id', databaseId)
        .order('position'),
      supabase
        .from('view_groupings')
        .select('*, view:database_views!inner(database_id)')
        .eq('view.database_id', databaseId),
    ]);

  if (!dbRes.data) return null;

  return {
    database: dbRes.data,
    views: viewsRes.data || [],
    properties: propsRes.data || [],
    records: recordsRes.data || [],
    values: (valuesRes.data || []).map((v) => ({ id: v.id, record_id: v.record_id, property_id: v.property_id, value: v.value, created_at: v.created_at, updated_at: v.updated_at })),
    options: (optionsRes.data || []).map((o) => ({ id: o.id, property_id: o.property_id, label: o.label, color: o.color, position: o.position, created_at: o.created_at })),
    filters: (filtersRes.data || []).map((f) => ({ id: f.id, view_id: f.view_id, property_id: f.property_id, operator: f.operator, value: f.value, position: f.position })),
    sorts: (sortsRes.data || []).map((s) => ({ id: s.id, view_id: s.view_id, property_id: s.property_id, direction: s.direction, position: s.position })),
    groupings: (groupingsRes.data || []).map((g) => ({ id: g.id, view_id: g.view_id, property_id: g.property_id, collapsed_groups: g.collapsed_groups || [] })),
  };
}

export async function createDatabase(name: string = 'Untitled Database'): Promise<Database> {
  const { data, error } = await supabase
    .from('databases')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDatabase(id: string, updates: Partial<Database>): Promise<void> {
  await supabase.from('databases').update(updates).eq('id', id);
}

export async function deleteDatabase(id: string): Promise<void> {
  await supabase.from('databases').delete().eq('id', id);
}

export async function createProperty(
  databaseId: string,
  name: string,
  type: PropertyType,
  position: number,
  isPrimary: boolean = false,
  config: Record<string, unknown> = {}
): Promise<DatabaseProperty> {
  const { data, error } = await supabase
    .from('database_properties')
    .insert({ database_id: databaseId, name, type, position, is_primary: isPrimary, config })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProperty(id: string, updates: Partial<DatabaseProperty>): Promise<void> {
  await supabase.from('database_properties').update(updates).eq('id', id);
}

export async function deleteProperty(id: string): Promise<void> {
  await supabase.from('database_properties').delete().eq('id', id);
}

export async function createOption(
  propertyId: string,
  label: string,
  color: string,
  position: number
): Promise<PropertyOption> {
  const { data, error } = await supabase
    .from('property_options')
    .insert({ property_id: propertyId, label, color, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOption(id: string, updates: Partial<PropertyOption>): Promise<void> {
  await supabase.from('property_options').update(updates).eq('id', id);
}

export async function deleteOption(id: string): Promise<void> {
  await supabase.from('property_options').delete().eq('id', id);
}

export async function createView(
  databaseId: string,
  name: string,
  type: ViewType,
  position: number
): Promise<DatabaseView> {
  const { data, error } = await supabase
    .from('database_views')
    .insert({ database_id: databaseId, name, type, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateView(id: string, updates: Partial<DatabaseView>): Promise<void> {
  await supabase.from('database_views').update(updates).eq('id', id);
}

export async function deleteView(id: string): Promise<void> {
  await supabase.from('database_views').delete().eq('id', id);
}

export async function createRecord(databaseId: string, position: number): Promise<DatabaseRecord> {
  const { data, error } = await supabase
    .from('database_records')
    .insert({ database_id: databaseId, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecord(id: string, updates: Partial<DatabaseRecord>): Promise<void> {
  await supabase.from('database_records').update(updates).eq('id', id);
}

export async function deleteRecord(id: string): Promise<void> {
  await supabase.from('database_records').delete().eq('id', id);
}

export async function upsertValue(
  recordId: string,
  propertyId: string,
  value: unknown
): Promise<void> {
  await supabase
    .from('record_values')
    .upsert({ record_id: recordId, property_id: propertyId, value }, { onConflict: 'record_id,property_id' });
}

export async function deleteValue(recordId: string, propertyId: string): Promise<void> {
  await supabase.from('record_values').delete().eq('record_id', recordId).eq('property_id', propertyId);
}

// ==================== HELPERS ====================

export function getRecordValues(
  recordId: string,
  values: RecordValue[]
): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  values.filter((v) => v.record_id === recordId).forEach((v) => {
    map[v.property_id] = v.value;
  });
  return map;
}

export function getPropertyOptions(
  propertyId: string,
  options: PropertyOption[]
): PropertyOption[] {
  return options
    .filter((o) => o.property_id === propertyId)
    .sort((a, b) => a.position - b.position);
}

export function formatPropertyValue(
  property: DatabaseProperty,
  value: unknown,
  options: PropertyOption[]
): string {
  if (value === null || value === undefined || value === '') return '';
  switch (property.type) {
    case 'checkbox':
      return value ? 'Yes' : 'No';
    case 'select':
    case 'status': {
      const opt = options.find((o) => o.id === value);
      return opt?.label || '';
    }
    case 'multi_select':
    case 'tags': {
      const ids = value as string[];
      if (!Array.isArray(ids)) return '';
      return ids.map((id) => options.find((o) => o.id === id)?.label).filter(Boolean).join(', ');
    }
    case 'number': {
      const n = Number(value);
      const config = property.config || {};
      const decimals = (config.decimals as number) ?? 0;
      return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    case 'currency': {
      const n = Number(value);
      const config = property.config || {};
      const symbol = (config.symbol as string) ?? '$';
      const decimals = (config.decimals as number) ?? 2;
      return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
    case 'percent': {
      const n = Number(value);
      return `${n}%`;
    }
    case 'rating': {
      const n = Number(value);
      return '★'.repeat(n);
    }
    case 'date': {
      const d = new Date(value as string);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString();
    }
    case 'date_range': {
      const range = value as { start: string; end: string };
      if (!range?.start) return '';
      const start = new Date(range.start).toLocaleDateString();
      if (!range.end) return start;
      const end = new Date(range.end).toLocaleDateString();
      return `${start} → ${end}`;
    }
    case 'progress': {
      const n = Number(value);
      return `${n}%`;
    }
    default:
      return String(value);
  }
}
