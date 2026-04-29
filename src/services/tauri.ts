import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { DiskInfo, ScanResult, ScanProgress, CleanupResult, DevJunkItem, FileNode } from '../types';

// ── Disk Info ──
export const getDiskInfo = () =>
  invoke<DiskInfo>('get_disk_info');

export const checkFDAStatus = () =>
  invoke<boolean>('check_fda_status');

// ── Scanning ──
export const startScan = (path: string, maxDepth?: number) =>
  invoke<ScanResult>('start_scan', { path, maxDepth });

export const findLargeFiles = (path: string, minSizeBytes: number) =>
  invoke<FileNode[]>('find_large_files', { path, minSizeBytes });

// ── Developer Tools ──
export const scanDevJunk = () =>
  invoke<DevJunkItem[]>('scan_dev_junk');

// ── Cleanup ──
export const cleanupItems = (paths: string[]) =>
  invoke<CleanupResult>('cleanup_items', { paths });

// ── File Operations ──
export const openInFinder = (path: string) =>
  invoke<void>('open_in_finder', { path });

// ── Event Listeners ──
export const onScanProgress = (callback: (progress: ScanProgress) => void): Promise<UnlistenFn> =>
  listen<ScanProgress>('scan://progress', (event) => callback(event.payload));

export const onCleanupProgress = (
  callback: (progress: { completed: number; total: number }) => void
): Promise<UnlistenFn> =>
  listen<{ completed: number; total: number }>('cleanup://progress', (event) => callback(event.payload));
