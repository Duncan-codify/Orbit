import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { TEMPLATES, type Template, instantiateTemplate } from '../lib/templates';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Templates',
  productivity: 'Productivity',
  personal: 'Personal',
  business: 'Business',
  education: 'Education',
  lifestyle: 'Lifestyle',
};

const CATEGORY_ICONS: Record<string, string> = {
  all: '✨',
  productivity: '⚡',
  personal: '🌿',
  business: '💼',
  education: '🎓',
  lifestyle: '☕',
};

export function TemplateGallery({
  workspaceId,
  onClose,
  onInstalled,
}: {
  workspaceId: string;
  onClose: () => void;
  onInstalled: (pageId: string) => Promise<void>;
}) {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !installing) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, installing]);

  const filtered = TEMPLATES.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.databases.some((db) => db.properties.some((p) => p.name.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const handleInstall = async (template: Template) => {
    setInstalling(template.id);
    setError(null);
    try {
      const pageIds = await instantiateTemplate(template, workspaceId);
      if (pageIds.length > 0) {
        await onInstalled(pageIds[0]);
      }
      onClose();
    } catch (err) {
      console.error('Template installation failed:', err);
      setError('Something went wrong while setting up the template. Please try again.');
      setInstalling(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm"
      onClick={() => !installing && onClose()}
    >
      <div
        className="w-full max-w-5xl h-[88vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Templates</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">Start from a pre-built system, then make it yours</p>
            </div>
          </div>
          <button
            onClick={() => !installing && onClose()}
            disabled={!!installing}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-stone-100 dark:border-stone-800 overflow-x-auto">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                category === key
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="text-xs">{CATEGORY_ICONS[key]}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="w-10 h-10 text-stone-300 dark:text-stone-700 mb-3" />
              <p className="text-sm text-stone-500 dark:text-stone-400">No templates match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onInstall={() => handleInstall(template)}
                  installing={installing === template.id}
                  disabled={!!installing}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onInstall,
  installing,
  disabled,
}: {
  template: Template;
  onInstall: () => void;
  installing: boolean;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    purple: 'from-violet-500 to-violet-600',
    teal: 'from-teal-500 to-teal-600',
    yellow: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-stone-500 to-stone-600',
  };

  const gradient = colorClasses[template.color] || colorClasses.gray;
  const propCount = template.databases.reduce((acc, db) => acc + db.properties.length, 0);
  const viewCount = template.databases.reduce((acc, db) => acc + db.views.length, 0);
  const recordCount = template.databases.reduce((acc, db) => acc + db.records.length, 0);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden transition-all ${
        hovered ? 'shadow-lg border-stone-300 dark:border-stone-600 -translate-y-0.5' : ''
      } ${disabled && !installing ? 'opacity-50' : ''}`}
    >
      {/* Cover */}
      <div className={`h-24 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute bottom-2 left-3 text-3xl drop-shadow-sm">{template.icon}</div>
        <div className="absolute top-2 right-2 text-[10px] font-medium uppercase tracking-wider text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
          {template.category}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-1">{template.name}</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">{template.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-stone-400 dark:text-stone-500 mb-3">
          <span>{propCount} fields</span>
          <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          <span>{viewCount} views</span>
          <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          <span>{recordCount} sample records</span>
        </div>

        {/* Property preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.databases[0].properties.slice(0, 5).map((p) => (
            <span
              key={p.name}
              className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded"
            >
              {p.name}
            </span>
          ))}
          {propCount > 5 && (
            <span className="text-[10px] px-1.5 py-0.5 text-stone-400">
              +{propCount - 5} more
            </span>
          )}
        </div>

        {/* Install button */}
        <button
          onClick={onInstall}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 py-2 text-sm rounded-lg font-medium transition-all ${
            installing
              ? 'bg-stone-100 dark:bg-stone-700 text-stone-500'
              : hovered
                ? `bg-gradient-to-r ${gradient} text-white`
                : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
          } disabled:cursor-not-allowed`}
        >
          {installing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Use Template
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
