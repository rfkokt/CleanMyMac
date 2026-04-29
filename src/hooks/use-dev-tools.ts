import { useCallback, useState } from 'react';
import { scanDevJunk } from '../services/tauri';
import type { DevJunkItem } from '../types';

export function useDevTools() {
  const [items, setItems] = useState<DevJunkItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setIsScanning(true);
    setError(null);

    try {
      const result = await scanDevJunk();
      setItems(result);
      return result;
    } catch (err) {
      const message = String(err);
      setError(message);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  const totalSize = items.reduce((acc, item) => acc + item.size, 0);

  const groupedByType = items.reduce<Record<string, DevJunkItem[]>>((acc, item) => {
    const key = item.junk_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return {
    items,
    isScanning,
    error,
    scan,
    totalSize,
    groupedByType,
  };
}
