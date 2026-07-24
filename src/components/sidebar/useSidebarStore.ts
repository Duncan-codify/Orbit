import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SidebarState {
  width: number;
  collapsed: boolean;
  expandedSections: Record<string, boolean>;
  expandedPages: string[];
  theme: ThemeMode;
  recents: string[];
  favorites: string[];
}

const STORAGE_KEY = 'sidebar-state-v1';

const DEFAULT_STATE: SidebarState = {
  width: 260,
  collapsed: false,
  expandedSections: {
    Favorites: true,
    Private: true,
    Shared: true,
    Databases: true,
    Projects: true,
    Archive: false,
  },
  expandedPages: [],
  theme: 'light',
  recents: [],
  favorites: [],
};

function loadState(): SidebarState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, expandedSections: { ...DEFAULT_STATE.expandedSections, ...parsed.expandedSections } };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useSidebarStore() {
  const [state, setState] = useState<SidebarState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const setWidth = useCallback((width: number) => {
    setState((s) => ({ ...s, width: Math.min(480, Math.max(56, width)) }));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setState((s) => ({ ...s, collapsed: !s.collapsed }));
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setState((s) => ({ ...s, collapsed }));
  }, []);

  const toggleSection = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      expandedSections: { ...s.expandedSections, [name]: !s.expandedSections[name] },
    }));
  }, []);

  const togglePageExpand = useCallback((pageId: string) => {
    setState((s) => ({
      ...s,
      expandedPages: s.expandedPages.includes(pageId)
        ? s.expandedPages.filter((id) => id !== pageId)
        : [...s.expandedPages, pageId],
    }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((s) => ({ ...s, theme }));
  }, []);

  const addRecent = useCallback((pageId: string) => {
    setState((s) => ({
      ...s,
      recents: [pageId, ...s.recents.filter((id) => id !== pageId)].slice(0, 10),
    }));
  }, []);

  const toggleFavorite = useCallback((pageId: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(pageId)
        ? s.favorites.filter((id) => id !== pageId)
        : [pageId, ...s.favorites],
    }));
  }, []);

  const reorderFavorites = useCallback((favorites: string[]) => {
    setState((s) => ({ ...s, favorites }));
  }, []);

  return {
    state,
    setWidth,
    toggleCollapsed,
    setCollapsed,
    toggleSection,
    togglePageExpand,
    setTheme,
    addRecent,
    toggleFavorite,
    reorderFavorites,
  };
}
