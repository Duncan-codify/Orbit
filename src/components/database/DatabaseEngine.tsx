import { useState } from 'react';
import { useDatabase } from './DatabaseContext';
import { ViewSwitcher } from './ViewSwitcher';
import { TableView } from './TableView';
import { BoardView } from './BoardView';
import { GalleryView } from './GalleryView';
import { ListView } from './ListView';
import { RecordModal } from './RecordModal';

export function DatabaseEngine() {
  const { data, loading, activeView } = useDatabase();
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-stone-200 dark:border-stone-700 border-t-stone-400 dark:border-t-stone-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center py-24 text-stone-400 dark:text-stone-500">Database not found</div>;
  }

  return (
    <div className="flex flex-col">
      {/* View switcher bar (with right-side toolbar) */}
      <ViewSwitcher onOpenRecord={setOpenRecordId} />

      {/* Active view body */}
      <div className="overflow-visible">
        {!activeView ? (
          <div className="flex items-center justify-center h-full text-stone-400 dark:text-stone-500">No view selected</div>
        ) : activeView.type === 'table' ? (
          <TableView view={activeView} onOpenRecord={setOpenRecordId} />
        ) : activeView.type === 'board' ? (
          <BoardView view={activeView} onOpenRecord={setOpenRecordId} />
        ) : activeView.type === 'gallery' ? (
          <GalleryView view={activeView} onOpenRecord={setOpenRecordId} />
        ) : activeView.type === 'list' ? (
          <ListView view={activeView} onOpenRecord={setOpenRecordId} />
        ) : (
          <ComingSoonView type={activeView.type} />
        )}
      </div>

      {openRecordId && (
        <RecordModal recordId={openRecordId} onClose={() => setOpenRecordId(null)} />
      )}
    </div>
  );
}

function ComingSoonView({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-stone-50 dark:bg-stone-900 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center mb-4 text-2xl">
        ▦
      </div>
      <h3 className="text-base font-semibold text-stone-700 dark:text-stone-200 capitalize">{type} view</h3>
      <p className="text-sm text-stone-400 dark:text-stone-500 mt-1 max-w-xs">
        This view type is wired into the engine. Full interactive {type} rendering is coming next.
      </p>
    </div>
  );
}
