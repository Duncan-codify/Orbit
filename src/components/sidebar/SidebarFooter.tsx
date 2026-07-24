import { Settings, Trash2, HelpCircle, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import type { ThemeMode } from './useSidebarStore';

export function SidebarFooter({
  collapsed,
  theme,
  onThemeChange,
}: {
  collapsed: boolean;
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-2 border-t border-stone-200/60 dark:border-stone-700/60">
        <Tooltip label="Settings"><button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"><Settings className="w-4 h-4" /></button></Tooltip>
        <Tooltip label="Trash"><button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"><Trash2 className="w-4 h-4" /></button></Tooltip>
        <Tooltip label="Updates"><button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"><Bell className="w-4 h-4" /></button></Tooltip>
        <Tooltip label="Help"><button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"><HelpCircle className="w-4 h-4" /></button></Tooltip>
        <div className="mt-1">
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
        <Tooltip label="Profile">
          <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-1">
            U
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-stone-200/60 dark:border-stone-700/60 px-2 py-2">
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-700/60 text-sm text-stone-600 dark:text-stone-400 transition-colors flex-1">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors" title="Trash"><Trash2 className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors" title="Updates"><Bell className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors" title="Help"><HelpCircle className="w-4 h-4" /></button>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5 mt-1 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors cursor-pointer">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
          U
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">User</div>
          <div className="text-xs text-stone-400 truncate">user@example.com</div>
        </div>
      </div>
    </div>
  );
}
