import { create } from 'zustand';
import type { ScanResult, ScanProgress, FileNode } from '../types';

interface ScanStore {
  scanResult: ScanResult | null;
  isScanning: boolean;
  progress: ScanProgress | null;
  error: string | null;
  selectedPaths: Set<string>;

  setScanResult: (result: ScanResult) => void;
  setScanning: (scanning: boolean) => void;
  setProgress: (progress: ScanProgress) => void;
  setError: (error: string | null) => void;
  toggleSelected: (path: string) => void;
  selectAllSafe: (nodes: FileNode[]) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  scanResult: null,
  isScanning: false,
  progress: null,
  error: null,
  selectedPaths: new Set(),

  setScanResult: (result) => set({ scanResult: result, isScanning: false, progress: null }),
  setScanning: (isScanning) => set({ isScanning, error: null }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, isScanning: false }),

  toggleSelected: (path) => {
    const current = new Set(get().selectedPaths);
    if (current.has(path)) {
      current.delete(path);
    } else {
      current.add(path);
    }
    set({ selectedPaths: current });
  },

  selectAllSafe: (nodes) => {
    const safePaths = new Set<string>();
    const collect = (items: FileNode[]) => {
      for (const item of items) {
        if (item.safety_level === 'Safe') {
          safePaths.add(item.path);
        }
        if (item.children) collect(item.children);
      }
    };
    collect(nodes);
    set({ selectedPaths: safePaths });
  },

  clearSelection: () => set({ selectedPaths: new Set() }),
  reset: () => set({
    scanResult: null,
    isScanning: false,
    progress: null,
    error: null,
    selectedPaths: new Set(),
  }),
}));
