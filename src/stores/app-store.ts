import { create } from 'zustand';
import type { DiskInfo } from '../types';

interface AppStore {
  diskInfo: DiskInfo | null;
  hasFDA: boolean | null;
  isLoadingDisk: boolean;

  setDiskInfo: (info: DiskInfo) => void;
  setFDA: (has: boolean) => void;
  setLoadingDisk: (loading: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  diskInfo: null,
  hasFDA: null,
  isLoadingDisk: false,

  setDiskInfo: (diskInfo) => set({ diskInfo, isLoadingDisk: false }),
  setFDA: (hasFDA) => set({ hasFDA }),
  setLoadingDisk: (isLoadingDisk) => set({ isLoadingDisk }),
}));
