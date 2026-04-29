import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash,
  ArrowClockwise,
  Spinner,
  CheckCircle,
} from '@phosphor-icons/react';
import { useDevTools } from '../hooks/use-dev-tools';
import { useCleanup } from '../hooks/use-cleanup';
import { DevJunkList } from '../components/cleanup/DevJunkList';
import { ConfirmDialog } from '../components/cleanup/ConfirmDialog';
import { CleanupSummary } from '../components/cleanup/CleanupSummary';
import { openInFinder } from '../services/tauri';
import { formatBytes } from '../lib/format';
import type { FileNode } from '../types';

export default function DevTools() {
  const { items, isScanning, error, scan, totalSize, groupedByType } = useDevTools();
  const { isCleaningUp, cleanupResult, cleanupProgress, cleanup, dismissResult } = useCleanup();

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (items.length === 0) scan();
  }, []);

  const toggleSelect = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const selectGroup = useCallback((paths: string[]) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => next.add(p));
      return next;
    });
  }, []);

  const selectAllSafe = useCallback(() => {
    const safePaths = items
      .filter((i) => i.safety_level === 'Safe')
      .map((i) => i.path);
    setSelectedPaths(new Set(safePaths));
  }, [items]);

  // Convert DevJunkItems to FileNodes for the confirm dialog
  const selectedItems: FileNode[] = items
    .filter((i) => selectedPaths.has(i.path))
    .map((i) => ({
      name: i.project_name || i.path.split('/').pop() || i.path,
      path: i.path,
      size: i.size,
      is_dir: true,
      file_type: 'DevCache' as const,
      safety_level: i.safety_level,
      last_modified: i.last_modified,
    }));

  const selectedSize = selectedItems.reduce((a, i) => a + i.size, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Developer Tools</h1>
          <p className="text-sm text-text-secondary mt-1">
            {items.length > 0
              ? `Found ${items.length} items • ${formatBytes(totalSize)} reclaimable`
              : 'Scan for developer-specific junk files'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPaths.size > 0 && (
            <>
              <button
                onClick={() => setSelectedPaths(new Set())}
                className="px-3 py-2 rounded-none text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-secondary transition-all"
              >
                Clear ({selectedPaths.size})
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-none text-xs font-medium text-white bg-gradient-to-r from-caution to-caution/80 hover:opacity-90 transition-opacity"
              >
                <Trash size={14} />
                Clean {formatBytes(selectedSize)}
              </button>
            </>
          )}
          <button
            onClick={selectAllSafe}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-none text-xs font-medium text-safe bg-safe/10 hover:bg-safe/20 border border-safe/20 transition-all disabled:opacity-40"
          >
            <CheckCircle size={14} />
            Select Safe
          </button>
          <button
            onClick={scan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium text-white bg-accent-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Spinner size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ArrowClockwise size={16} />
                Re-scan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-none bg-caution/10 border border-caution/20">
          <p className="text-sm text-caution">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isScanning && items.length === 0 && (
        <div className="glass rounded-none p-12 flex flex-col items-center justify-center">
          <Spinner size={32} className="text-accent-primary animate-spin mb-4" />
          <p className="text-sm text-text-secondary">Scanning for developer junk...</p>
          <p className="text-xs text-text-muted mt-1">Checking node_modules, Xcode, Docker, and more</p>
        </div>
      )}

      {/* Results */}
      {items.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Found', value: formatBytes(totalSize), color: '#6366f1' },
              { label: 'Items', value: items.length.toString(), color: '#8b5cf6' },
              { label: 'Types', value: Object.keys(groupedByType).length.toString(), color: '#ec4899' },
              { label: 'Selected', value: formatBytes(selectedSize), color: '#22c55e' },
            ].map(({ label, value, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-none p-4"
              >
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-xl font-bold mt-1" style={{ color }}>
                  {value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Junk list */}
          <DevJunkList
            groupedByType={groupedByType}
            selectedPaths={selectedPaths}
            onToggleSelect={toggleSelect}
            onSelectGroup={selectGroup}
            onOpenInFinder={(path) => openInFinder(path)}
          />
        </>
      )}

      {/* Empty state */}
      {!isScanning && items.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-none p-16 flex flex-col items-center justify-center text-center"
        >
          <div className="p-4 rounded-none bg-safe/10 mb-4">
            <CheckCircle size={40} weight="duotone" className="text-safe" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">All Clean!</h2>
          <p className="text-sm text-text-secondary mt-2 max-w-md">
            No developer junk was found on your system. Your dev environment is already optimized!
          </p>
        </motion.div>
      )}

      {/* Cleanup confirm */}
      <ConfirmDialog
        isOpen={showConfirm}
        items={selectedItems}
        totalSize={selectedSize}
        isCleaningUp={isCleaningUp}
        progress={cleanupProgress}
        onConfirm={async () => {
          const result = await cleanup(Array.from(selectedPaths));
          if (result) {
            setShowConfirm(false);
            setSelectedPaths(new Set());
            scan(); // Re-scan after cleanup
          }
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Cleanup result */}
      <AnimatePresence>
        {cleanupResult && (
          <CleanupSummary result={cleanupResult} onDismiss={dismissResult} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
