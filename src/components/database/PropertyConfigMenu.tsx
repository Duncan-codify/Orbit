import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  type DatabaseProperty,
  type PropertyOption,
  COLOR_CLASSES,
} from '../../lib/database';

interface PropertyConfigMenuProps {
  property: DatabaseProperty;
  options: PropertyOption[];
  onClose: () => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onAddOption: (propertyId: string, label: string, color: string) => void;
  onUpdateOption: (id: string, updates: Partial<PropertyOption>) => void;
  onRemoveOption: (id: string) => void;
}

export function PropertyConfigMenu({
  property,
  options,
  onClose,
  onUpdateConfig,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: PropertyConfigMenuProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('gray');

  const hasOptions = ['select', 'multi_select', 'status', 'tags'].includes(property.type);
  const isNumber = ['number', 'currency', 'percent'].includes(property.type);
  const colorList = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[440px] bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-700">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Configure {property.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 dark:text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isNumber && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Decimal places</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={(property.config.decimals as number) ?? (property.type === 'currency' ? 2 : 0)}
                  onChange={(e) => onUpdateConfig({ decimals: Number(e.target.value) })}
                  className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {property.type === 'currency' && (
                <div>
                  <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Currency symbol</label>
                  <input
                    type="text"
                    value={(property.config.symbol as string) ?? '$'}
                    onChange={(e) => onUpdateConfig({ symbol: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Thousands separator</label>
                <select
                  value={(property.config.thousands as string) ?? 'comma'}
                  onChange={(e) => onUpdateConfig({ thousands: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="comma">Comma (1,000)</option>
                  <option value="none">None (1000)</option>
                </select>
              </div>
            </div>
          )}

          {property.type === 'rating' && (
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Max stars</label>
              <input
                type="number"
                min={1}
                max={10}
                value={(property.config.max as number) ?? 5}
                onChange={(e) => onUpdateConfig({ max: Number(e.target.value) })}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {hasOptions && (
            <div>
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 block">Options</label>
              <div className="space-y-1.5">
                {options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2 group">
                    <div className="flex gap-1">
                      {colorList.map((c) => (
                        <button
                          key={c}
                          onClick={() => onUpdateOption(opt.id, { color: c })}
                          className={`w-3.5 h-3.5 rounded-full ${COLOR_CLASSES[c]?.dot} ${opt.color === c ? 'ring-2 ring-offset-1 ring-stone-400' : ''}`}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => onUpdateOption(opt.id, { label: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => onRemoveOption(opt.id)}
                      className="p-1 text-stone-300 dark:text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {colorList.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-3.5 h-3.5 rounded-full ${COLOR_CLASSES[c]?.dot} ${newColor === c ? 'ring-2 ring-offset-1 ring-stone-400' : ''}`}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="New option"
                    className="flex-1 px-2 py-1 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded outline-none focus:ring-1 focus:ring-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLabel.trim()) {
                        onAddOption(property.id, newLabel.trim(), newColor);
                        setNewLabel('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newLabel.trim()) {
                        onAddOption(property.id, newLabel.trim(), newColor);
                        setNewLabel('');
                      }
                    }}
                    className="p-1.5 bg-stone-900 dark:bg-stone-700 text-white rounded hover:bg-stone-800 dark:hover:bg-stone-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!hasOptions && !isNumber && property.type !== 'rating' && (
            <div className="text-center py-8 text-sm text-stone-400 dark:text-stone-500">
              No configuration available for this property type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
