import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass,
  Play,
  Trash,
  CheckCircle,
  Lightning,
  CaretRight,
  House,
  Spinner,
} from '@phosphor-icons/react';
import { useScanStore } from '../stores/scan-store';
import { useScanner } from '../hooks/use-scanner';
import { useCleanup } from '../hooks/use-cleanup';
import { FileList } from '../components/scanner/FileList';
import { FilterBar } from '../components/scanner/FilterBar';
import { ConfirmDialog } from '../components/cleanup/ConfirmDialog';
import { CleanupSummary } from '../components/cleanup/CleanupSummary';
import { GSAPScanner3D } from '../components/ui/GSAPScanner3D';
import { ScanningPlaceholder } from '../components/scanner/ScanningPlaceholder';
import { GlassIcon } from '../components/ui/GlassIcon';
import { openInFinder } from '../services/tauri';
import { formatBytes } from '../lib/format';
import type { FileNode, FileCategory, SafetyLevel } from '../types';

type SortKey = 'name' | 'size' | 'file_type' | 'safety_level' | 'last_modified';

export default function Scanner() {
  const { scanResult, isScanning, progress, selectedPaths } = useScanStore();
  const { toggleSelected, selectAllSafe, clearSelection } = useScanStore();
  const { scan } = useScanner();
  const { isCleaningUp, cleanupResult, cleanupProgress, cleanup, dismissResult } = useCleanup();

  // Drill-down state
  const [navStack, setNavStack] = useState<FileNode[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('size');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory[]>([]);
  const [safetyFilter, setSafetyFilter] = useState<SafetyLevel[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  // Current view — either root or drilled-down
  const currentNode = navStack.length > 0 ? navStack[navStack.length - 1] : scanResult?.root;
  const currentChildren = currentNode?.children || [];

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }, [sortBy]);

  const handleDrillDown = useCallback((node: FileNode) => {
    if (node.is_dir && node.children) {
      setNavStack((stack) => [...stack, node]);
    }
  }, []);

  const handleBreadcrumbNav = useCallback((index: number) => {
    if (index === -1) {
      setNavStack([]);
    } else {
      setNavStack((stack) => stack.slice(0, index + 1));
    }
  }, []);

  const handleStartScan = useCallback(async () => {
    setNavStack([]);
    const homeDir = await import('@tauri-apps/api/path').then((m) => m.homeDir()).catch(() => '/');
    scan(homeDir);
  }, [scan]);

  // Selected items for cleanup
  const selectedItems = useMemo(() => {
    if (!scanResult) return [];
    const items: FileNode[] = [];
    const collectItems = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (selectedPaths.has(node.path)) {
          items.push(node);
        }
        if (node.children) collectItems(node.children);
      }
    };
    collectItems([scanResult.root]);
    return items;
  }, [scanResult, selectedPaths]);

  const selectedSize = selectedItems.reduce((a, i) => a + i.size, 0);

  if (!scanResult && !isScanning) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-full relative w-full"
      >
        <GlassIcon
          icon={<MagnifyingGlass size={64} weight="duotone" />}
          color="teal"
          pulse={true}
        />
        <h2 className="text-4xl font-bold text-white mt-8 tracking-tight">Welcome back!</h2>
        <p className="text-lg text-white/70 mt-3 max-w-md text-center">
          Start with a quick and extensive scan of your Mac.
        </p>
        <div className="mt-16 flex flex-col items-center">
          <button
            onClick={handleStartScan}
            className="btn-scan-glow flex items-center justify-center w-28 h-28 text-xl font-bold mb-4"
          >
            Scan
          </button>
          <p className="text-[11px] text-white/30 text-center font-medium tracking-wide">
            Powered by Antigravity
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Scanner</h1>
          <p className="text-sm text-text-secondary mt-1">
            {scanResult
              ? `${scanResult.file_count.toLocaleString()} files • ${scanResult.dir_count.toLocaleString()} folders • ${formatBytes(scanResult.total_size)}`
              : 'Scan your disk to analyze storage usage'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPaths.size > 0 && (
            <>
              <button
                onClick={clearSelection}
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
            onClick={handleStartScan}
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
                <Play size={16} weight="fill" />
                {scanResult ? 'Re-scan' : 'Start Scan'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scanning progress */}
      <AnimatePresence>
        {isScanning && progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-none p-6 overflow-hidden"
          >
            <div className="flex items-center gap-6">
              {/* GSAP 3D Animation */}
              <GSAPScanner3D />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary">
                    Scanning Storage...
                  </span>
                  <span className="text-sm font-medium text-accent-primary">
                    {progress.scanned.toLocaleString()} files
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-bg-tertiary rounded-none overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-accent-primary"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                
                <p className="text-xs text-text-muted truncate">
                  {progress.current_path}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state filling skeleton grid */}
      <AnimatePresence>
        {isScanning && progress && (
          <ScanningPlaceholder currentPath={progress.current_path} />
        )}
      </AnimatePresence>

      {/* Results */}
      {scanResult && !isScanning && (
        <>
          {/* Breadcrumbs */}
          {navStack.length > 0 && (
            <nav className="flex items-center gap-1 text-sm">
              <button
                onClick={() => handleBreadcrumbNav(-1)}
                className="p-1 rounded-none text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
              >
                <House size={14} weight="duotone" />
              </button>
              {navStack.map((node, i) => (
                <div key={node.path} className="flex items-center gap-1">
                  <CaretRight size={12} className="text-text-muted" />
                  <button
                    onClick={() => handleBreadcrumbNav(i)}
                    disabled={i === navStack.length - 1}
                    className={`px-2 py-1 rounded-none text-xs transition-colors ${
                      i === navStack.length - 1
                        ? 'text-text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                    }`}
                  >
                    {node.name}
                  </button>
                </div>
              ))}
            </nav>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <FilterBar
              categoryFilter={categoryFilter}
              safetyFilter={safetyFilter}
              onCategoryChange={setCategoryFilter}
              onSafetyChange={setSafetyFilter}
            />
            <button
              onClick={() => scanResult && selectAllSafe(currentChildren)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-none text-xs font-medium text-safe bg-safe/10 hover:bg-safe/20 border border-safe/20 transition-all"
            >
              <CheckCircle size={14} />
              Select All Safe
            </button>
          </div>

          {/* File List */}
          <FileList
            nodes={currentChildren}
            selectedPaths={selectedPaths}
            onToggleSelect={toggleSelected}
            onOpenInFinder={(path) => openInFinder(path)}
            onNavigate={handleDrillDown}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            categoryFilter={categoryFilter}
            safetyFilter={safetyFilter}
          />

          {/* Scan info */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>Scanned in {(scanResult.scan_duration_ms / 1000).toFixed(1)}s</span>
            <span>•</span>
            <span>{Object.keys(scanResult.categories).length} categories</span>
          </div>
        </>
      )}



      {/* Cleanup confirm dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        items={selectedItems}
        totalSize={selectedSize}
        isCleaningUp={isCleaningUp}
        progress={cleanupProgress}
        onConfirm={async () => {
          const result = await cleanup();
          if (result) {
            setShowConfirm(false);
          }
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Cleanup result toast */}
      <AnimatePresence>
        {cleanupResult && (
          <CleanupSummary result={cleanupResult} onDismiss={dismissResult} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
