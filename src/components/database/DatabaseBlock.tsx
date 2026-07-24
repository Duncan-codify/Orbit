import { useState, useEffect } from 'react';
import { DatabaseProvider } from './DatabaseContext';
import { DatabaseEngine } from './DatabaseEngine';
import { createDatabase, createProperty, createView, updateView, createRecord } from '../../lib/database';
import { Loader2 } from 'lucide-react';

interface DatabaseBlockProps {
  databaseId: string | null;
  onDatabaseCreated: (id: string) => void;
}

export function DatabaseBlock({ databaseId, onDatabaseCreated }: DatabaseBlockProps) {
  const [resolvedId, setResolvedId] = useState<string | null>(databaseId);
  const [initializing, setInitializing] = useState(!databaseId);

  useEffect(() => {
    if (!databaseId && !resolvedId) {
      (async () => {
        const db = await createDatabase('New database');
        await createProperty(db.id, 'Name', 'text', 0, true, {});
        const view = await createView(db.id, 'Table', 'table', 0);
        await updateView(view.id, { is_default: true });
        await createRecord(db.id, 0);
        setResolvedId(db.id);
        onDatabaseCreated(db.id);
        setInitializing(false);
      })();
    }
  }, [databaseId, resolvedId, onDatabaseCreated]);

  if (initializing || !resolvedId) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-stone-300 dark:text-stone-600 animate-spin" />
      </div>
    );
  }

  return (
    <DatabaseProvider databaseId={resolvedId}>
      <DatabaseEngine />
    </DatabaseProvider>
  );
}
