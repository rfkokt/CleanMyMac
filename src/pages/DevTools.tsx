import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Trash,
  ArrowClockwise,
  Spinner,
  CheckCircle,
} from '@phosphor-icons/react';
import { useDevTools } from '../hooks/use-dev-tools';
import { useCleanupStore } from '../stores/cleanup-store';
import { DevJunkList } from '../components/cleanup/DevJunkList';
import { ConfirmDialog } from '../components/cleanup/ConfirmDialog';
import { openInFinder } from '../services/tauri';
import { formatBytes } from '../lib/format';
import type { FileNode } from '../types';

export default function DevTools() {
  const { items, isScanning, error, scan, totalSize, groupedByType } = useDevTools();

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
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="h-full flex flex-col"
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
                className="px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
              >
                Clear ({selectedPaths.size})
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium text-white bg-gradient-to-r from-red-500/80 to-rose-600/80 hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                <Trash size={14} />
                Clean {formatBytes(selectedSize)}
              </button>
            </>
          )}
          <button
            onClick={selectAllSafe}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/20 border border-[#0D9488]/30 transition-all disabled:opacity-40"
          >
            <CheckCircle size={14} />
            Select Safe
          </button>
          <button
            onClick={scan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:shadow-[0_0_30px_rgba(13,148,136,0.6)] transition-all disabled:opacity-50"
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

      {error && (
        <div className="p-4 rounded-2xl glass border-red-500/20 bg-red-500/10">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isScanning && items.length === 0 && (
        <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center">
          <Spinner size={32} className="text-[#00F0FF] animate-spin mb-4" />
          <p className="text-sm text-white/80">Scanning for developer junk...</p>
          <p className="text-xs text-white/50 mt-1">Checking node_modules, Xcode, Docker, and more</p>
        </div>
      )}

      {/* Results */}
      {items.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 mt-6 pb-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
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
                className="glass rounded-2xl p-5 border border-white/5"
              >
                <p className="text-xs text-white/60">{label}</p>
                <p className="text-xl font-bold mt-1" style={{ color }}>
                  {value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Junk list */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <DevJunkList
              groupedByType={groupedByType}
              selectedPaths={selectedPaths}
              onToggleSelect={toggleSelect}
              onSelectGroup={selectGroup}
              onOpenInFinder={(path) => openInFinder(path)}
            />
          </div>
        </div>
      )}

      {!isScanning && items.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-white/5"
        >
          <div className="p-5 rounded-full bg-[#0D9488]/20 border border-[#0D9488]/30 shadow-[0_0_30px_rgba(13,148,136,0.3)] mb-6">
            <CheckCircle size={48} weight="duotone" className="text-[#0D9488]" />
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
        onConfirm={async (permanent) => {
          const paths = Array.from(selectedPaths);
          setShowConfirm(false);
          setSelectedPaths(new Set());
          await useCleanupStore.getState().startCleanup(paths, permanent);
          scan(); // Re-scan after cleanup
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </motion.div>
  );
}
