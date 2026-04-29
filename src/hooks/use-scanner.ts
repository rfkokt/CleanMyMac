import { useCallback } from 'react';
import { useScanStore } from '../stores/scan-store';
import { startScan as startScanService, onScanProgress } from '../services/tauri';

export function useScanner() {
  const { setScanning, setProgress, setScanResult, setError } = useScanStore();

  const scan = useCallback(async (path: string, maxDepth?: number) => {
    setScanning(true);

    const unlisten = await onScanProgress((progress) => {
      setProgress(progress);
    });

    try {
      const result = await startScanService(path, maxDepth);
      setScanResult(result);
      return result;
    } catch (error) {
      setError(String(error));
      return null;
    } finally {
      unlisten();
    }
  }, [setScanning, setProgress, setScanResult, setError]);

  return { scan };
}
