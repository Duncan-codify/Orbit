import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Block = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: string;
  content: string;
  properties: Record<string, unknown>;
  children: string[];
  created_at: string;
  updated_at: string;
};

export type Workspace = {
  id: string;
  name: string;
  icon: string;
  created_at: string;
};

export type Collection = {
  id: string;
  block_id: string;
  workspace_id: string;
  name: string;
  schema: Record<string, unknown>;
  created_at: string;
};

export type CollectionRow = {
  id: string;
  collection_id: string;
  block_id: string | null;
  cells: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
