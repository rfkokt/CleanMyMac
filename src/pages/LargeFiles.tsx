import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  File,
  ArrowSquareOut,
  Trash,
  Spinner,
  Lightning,
  CaretDown,
  FunnelSimple,
  Clock,
} from '@phosphor-icons/react';
import { useLargeFiles } from '../hooks/use-large-files';
import { useCleanupStore } from '../stores/cleanup-store';
import { ConfirmDialog } from '../components/cleanup/ConfirmDialog';
import { openInFinder } from '../services/tauri';
import { formatBytes, formatRelativeTime, getCategoryColor } from '../lib/format';
import type { FileNode } from '../types';

export default function LargeFiles() {
  const { files, isScanning, error, scan, threshold, setThreshold, thresholds } = useLargeFiles();

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showThresholdMenu, setShowThresholdMenu] = useState(false);

  useEffect(() => {
    if (files.length === 0) handleScan();
  }, []);

  const handleScan = useCallback(async () => {
    const homeDir = await import('@tauri-apps/api/path').then((m) => m.homeDir()).catch(() => '/');
    scan(homeDir);
  }, [scan]);

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

  const selectedItems: FileNode[] = files.filter((f) => selectedPaths.has(f.path));
  const selectedSize = selectedItems.reduce((a, i) => a + i.size, 0);

  // Check if file is stale (not modified in 6+ months)
  const isStale = (lastModified?: number) => {
    if (!lastModified) return false;
    const sixMonthsAgo = Date.now() / 1000 - 180 * 24 * 3600;
    return lastModified < sixMonthsAgo;
  };

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
          <h1 className="text-2xl font-bold text-text-primary">Large Files</h1>
          <p className="text-sm text-text-secondary mt-1">
            {files.length > 0
              ? `${files.length} files larger than ${formatBytes(threshold)}`
              : `Find files larger than ${formatBytes(threshold)}`
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

          {/* Threshold selector */}
          <div className="relative">
            <button
              onClick={() => setShowThresholdMenu(!showThresholdMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <FunnelSimple size={14} />
              Min: {formatBytes(threshold)}
              <CaretDown size={12} />
            </button>
            {showThresholdMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowThresholdMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 w-32 py-2 rounded-2xl glass border border-white/10 shadow-xl overflow-hidden">
                  {thresholds.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setThreshold(value);
                        setShowThresholdMenu(false);
                        // Re-scan with new threshold on next effect
                      }}
                      className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                        threshold === value
                          ? 'bg-accent-primary/10 text-accent-primary'
                          : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:shadow-[0_0_30px_rgba(13,148,136,0.6)] transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Spinner size={16} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Lightning size={16} weight="fill" />
                Scan
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
      {isScanning && (
        <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center">
          <Spinner size={32} className="text-[#00F0FF] animate-spin mb-4" />
          <p className="text-sm text-white/80">Searching for large files...</p>
          <p className="text-xs text-white/50 mt-1">Looking for files larger than {formatBytes(threshold)}</p>
        </div>
      )}

      {/* Results */}
      {!isScanning && files.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <p className="text-xs text-white/50">Total Size</p>
              <p className="text-xl font-bold text-[#FF2E93] mt-1">
                {formatBytes(files.reduce((a, f) => a + f.size, 0))}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <p className="text-xs text-white/50">Files Found</p>
              <p className="text-xl font-bold text-[#00F0FF] mt-1">{files.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <p className="text-xs text-white/50">Stale Files</p>
              <p className="text-xl font-bold text-[#FF9F0A] mt-1">
                {files.filter((f) => isStale(f.last_modified)).length}
              </p>
            </motion.div>
          </div>

          {/* File list */}
          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border-b border-white/5 text-xs text-white/50 font-medium uppercase tracking-wider">
              <div className="w-8" />
              <span className="flex-1">File</span>
              <span className="w-24 text-right">Size</span>
              <span className="w-24">Category</span>
              <span className="w-28 text-right">Last Modified</span>
              <div className="w-8" />
            </div>

            {/* Rows */}
            <div className="max-h-[55vh] overflow-y-auto">
              {files.map((file, i) => {
                const stale = isStale(file.last_modified);
                const catColor = getCategoryColor(file.file_type);

                return (
                  <motion.div
                    key={file.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={`group flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      selectedPaths.has(file.path) ? 'bg-[#FF2E93]/10' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleSelect(file.path)}
                      className="w-8 flex items-center justify-center shrink-0"
                    >
                      <div className={`w-4 h-4 rounded border transition-all ${
                        selectedPaths.has(file.path)
                          ? 'bg-accent-primary border-accent-primary'
                          : 'border-bg-tertiary group-hover:border-bg-tertiary'
                      }`}>
                        {selectedPaths.has(file.path) && (
                          <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                            <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <File size={14} weight="duotone" className="text-text-muted shrink-0" />
                        <span className="text-sm text-text-primary truncate">{file.name}</span>
                        {stale && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-review/10 text-review text-[10px] font-medium shrink-0">
                            <Clock size={10} />
                            Stale
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate mt-0.5">
                        {file.path.replace(/^\/Users\/[^/]+\//, '~/')}
                      </p>
                    </div>

                    <span className="w-24 text-right text-sm font-semibold text-text-primary tabular-nums">
                      {formatBytes(file.size)}
                    </span>

                    <span className="w-24">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs"
                        style={{ backgroundColor: `${catColor}15`, color: catColor }}
                      >
                        {file.file_type}
                      </span>
                    </span>

                    <span className="w-28 text-right text-xs text-text-muted tabular-nums">
                      {file.last_modified ? formatRelativeTime(file.last_modified) : '—'}
                    </span>

                    <button
                      onClick={() => openInFinder(file.path)}
                      className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary"
                      title="Open in Finder"
                    >
                      <ArrowSquareOut size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!isScanning && files.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-white/5"
        >
          <div className="p-5 rounded-full bg-[#BF5AF2]/20 border border-[#BF5AF2]/30 shadow-[0_0_30px_rgba(191,90,242,0.3)] mb-6">
            <File size={48} weight="duotone" className="text-[#BF5AF2]" />
          </div>
          <h2 className="text-lg font-semibold text-white">No Large Files Found</h2>
          <p className="text-sm text-white/60 mt-2 max-w-md">
            No files larger than {formatBytes(threshold)} were found. Try lowering the threshold.
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
          handleScan();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </motion.div>
  );
}
