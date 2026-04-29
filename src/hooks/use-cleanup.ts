import { useCallback, useState } from 'react';
import { useScanStore } from '../stores/scan-store';
import { cleanupItems as cleanupService, onCleanupProgress } from '../services/tauri';
import type { CleanupResult } from '../types';

export function useCleanup() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupProgress, setCleanupProgress] = useState<{ completed: number; total: number } | null>(null);
  const { selectedPaths, clearSelection, reset: resetScan } = useScanStore();

  const cleanup = useCallback(async (paths?: string[]) => {
    const targetPaths = paths || Array.from(selectedPaths);
    if (targetPaths.length === 0) return null;

    setIsCleaningUp(true);
    setCleanupProgress({ completed: 0, total: targetPaths.length });

    const unlisten = await onCleanupProgress((progress) => {
      setCleanupProgress(progress);
    });

    try {
      const result = await cleanupService(targetPaths);
      setCleanupResult(result);
      clearSelection();
      return result;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return null;
    } finally {
      unlisten();
      setIsCleaningUp(false);
      setCleanupProgress(null);
    }
  }, [selectedPaths, clearSelection]);

  const dismissResult = useCallback(() => {
    setCleanupResult(null);
  }, []);

  return {
    isCleaningUp,
    cleanupResult,
    cleanupProgress,
    cleanup,
    dismissResult,
  };
}
