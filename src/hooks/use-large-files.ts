import { useCallback, useState } from 'react';
import { findLargeFiles } from '../services/tauri';
import type { FileNode } from '../types';

const SIZE_THRESHOLDS = [
  { label: '50 MB', value: 50 * 1024 * 1024 },
  { label: '100 MB', value: 100 * 1024 * 1024 },
  { label: '500 MB', value: 500 * 1024 * 1024 },
  { label: '1 GB', value: 1024 * 1024 * 1024 },
] as const;

export function useLargeFiles() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(100 * 1024 * 1024); // default 100MB

  const scan = useCallback(async (path: string, minSizeBytes?: number) => {
    setIsScanning(true);
    setError(null);

    try {
      const result = await findLargeFiles(path, minSizeBytes || threshold);
      setFiles(result);
      return result;
    } catch (err) {
      setError(String(err));
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [threshold]);

  return {
    files,
    isScanning,
    error,
    scan,
    threshold,
    setThreshold,
    thresholds: SIZE_THRESHOLDS,
  };
}
