import { create } from 'zustand';
import { cleanupItems, onCleanupProgress } from '../services/tauri';
import type { CleanupResult } from '../types';

interface CleanupStore {
  isCleaningUp: boolean;
  progress: { completed: number; total: number } | null;
  result: CleanupResult | null;

  startCleanup: (paths: string[], permanent?: boolean) => Promise<void>;
  dismissResult: () => void;
}

export const useCleanupStore = create<CleanupStore>((set) => ({
  isCleaningUp: false,
  progress: null,
  result: null,

  startCleanup: async (paths, permanent = false) => {
    if (paths.length === 0) return;

    set({ isCleaningUp: true, progress: { completed: 0, total: paths.length }, result: null });

    const unlisten = await onCleanupProgress((progress) => {
      set({ progress });
    });

    try {
      const result = await cleanupItems(paths, permanent);
      set({ result, isCleaningUp: false, progress: null });
    } catch (error) {
      console.error('Cleanup failed:', error);
      set({ isCleaningUp: false, progress: null });
    } finally {
      unlisten();
    }
  },

  dismissResult: () => set({ result: null }),
}));
