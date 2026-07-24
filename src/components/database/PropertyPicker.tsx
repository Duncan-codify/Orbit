import { useState, useRef, useEffect } from 'react';
import { Search, Check, X } from 'lucide-react';
import { PROPERTY_TYPES, type PropertyType, type PropertyMeta } from '../../lib/database';

interface PropertyPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: PropertyType, name: string) => void;
  anchorRect?: DOMRect | null;
}

const CATEGORY_LABELS: Record<PropertyMeta['category'], string> = {
  basic: 'Basic',
  select: 'Select & Tags',
  date: 'Date & Time',
  advanced: 'Advanced',
  system: 'System',
};

export function PropertyPicker({ open, onClose, onSelect, anchorRect }: PropertyPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [customName, setCustomName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedType(null);
      setCustomName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filtered = PROPERTY_TYPES.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, PropertyMeta[]> = {};
  filtered.forEach((p) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const handleConfirm = () => {
    if (!selectedType) return;
    const meta = PROPERTY_TYPES.find((p) => p.type === selectedType);
    const name = customName.trim() || meta?.label || 'Property';
    onSelect(selectedType, name);
    onClose();
  };

  const top = anchorRect ? anchorRect.bottom + 6 : 100;
  const left = anchorRect ? anchorRect.left : 100;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-80 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
        style={{ top, left }}
      >
        <div className="p-3 border-b border-stone-100 dark:border-stone-700">
          <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-900 rounded-lg">
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search property types..."
              className="flex-1 bg-transparent text-sm text-stone-800 dark:text-stone-100 outline-none placeholder-stone-400 dark:placeholder-stone-500"
            />
            <button onClick={onClose} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!selectedType ? (
          <div className="max-h-80 overflow-y-auto py-1">
            {Object.entries(grouped).map(([category, props]) => (
              <div key={category} className="py-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  {CATEGORY_LABELS[category as PropertyMeta['category']]}
                </div>
                {props.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => {
                      setSelectedType(p.type);
                      setCustomName(p.label);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left group"
                  >
                    <span className="w-7 h-7 rounded-md bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-sm text-stone-600 dark:text-stone-300 group-hover:bg-stone-200 dark:group-hover:bg-stone-600 transition-colors">
                      {p.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{p.label}</div>
                      <div className="text-xs text-stone-400 dark:text-stone-500 truncate">{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-stone-400 dark:text-stone-500">No types found</div>
            )}
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm text-blue-600 dark:text-blue-300">
                {PROPERTY_TYPES.find((p) => p.type === selectedType)?.icon}
              </span>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                {PROPERTY_TYPES.find((p) => p.type === selectedType)?.label}
              </span>
            </div>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Property name"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') setSelectedType(null);
              }}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setSelectedType(null)}
                className="flex-1 px-3 py-2 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-3 py-2 text-sm bg-stone-900 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
