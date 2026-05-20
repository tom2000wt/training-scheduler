import { create } from 'zustand';
import type { ViewMode, SidebarTab } from '../types';

interface ViewState {
  currentTab: SidebarTab;
  viewMode: ViewMode;
  currentDate: string;
  sidebarCollapsed: boolean;
  setTab: (tab: SidebarTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: string) => void;
  toggleSidebar: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentTab: 'calendar',
  viewMode: 'week',
  currentDate: new Date().toISOString().slice(0, 10),
  sidebarCollapsed: false,
  setTab: (tab) => set({ currentTab: tab }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentDate: (date) => set({ currentDate: date }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
