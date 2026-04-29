import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChartDonut,
  MagnifyingGlass,
  Lightning,
  Spinner,
} from '@phosphor-icons/react';
import { useScanStore } from '../stores/scan-store';
import { useScanner } from '../hooks/use-scanner';
import { Treemap } from '../components/visualizer/Treemap';
import { Breadcrumbs } from '../components/visualizer/Breadcrumbs';
import { formatBytes } from '../lib/format';
import type { FileNode } from '../types';

export default function Visualizer() {
  const { scanResult, isScanning, progress } = useScanStore();
  const { scan } = useScanner();

  // Drill-down navigation
  const [navStack, setNavStack] = useState<FileNode[]>([]);

  const currentNode = navStack.length > 0
    ? navStack[navStack.length - 1]
    : scanResult?.root;

  const handleDrillDown = useCallback((node: FileNode) => {
    if (node.is_dir && node.children && node.children.length > 0) {
      setNavStack((stack) => [...stack, node]);
    }
  }, []);

  const handleBreadcrumbNav = useCallback((index: number) => {
    if (index === 0) {
      setNavStack([]);
    } else {
      setNavStack((stack) => stack.slice(0, index));
    }
  }, []);

  const handleStartScan = useCallback(async () => {
    setNavStack([]);
    const homeDir = await import('@tauri-apps/api/path').then((m) => m.homeDir()).catch(() => '/');
    scan(homeDir);
  }, [scan]);

  // Build breadcrumb path
  const breadcrumbPath: FileNode[] = [
    ...(scanResult ? [scanResult.root] : []),
    ...navStack,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Visualizer</h1>
          <p className="text-sm text-text-secondary mt-1">
            {currentNode
              ? `${currentNode.name} — ${formatBytes(currentNode.size)}`
              : 'Interactive treemap of your disk usage'
            }
          </p>
        </div>
        {!scanResult && (
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
                <Lightning size={16} weight="fill" />
                Scan to Visualize
              </>
            )}
          </button>
        )}
      </div>

      {/* Scanning progress */}
      {isScanning && progress && (
        <div className="glass rounded-none p-4 shrink-0">
          <div className="flex items-center gap-3">
            <Spinner size={16} className="text-accent-primary animate-spin" />
            <span className="text-sm text-text-secondary">
              Scanning... {progress.scanned.toLocaleString()} files
            </span>
          </div>
          <p className="text-xs text-text-muted truncate mt-1">{progress.current_path}</p>
        </div>
      )}

      {/* Treemap */}
      {scanResult && currentNode && !isScanning && (
        <>
          {/* Breadcrumbs */}
          <div className="shrink-0">
            <Breadcrumbs path={breadcrumbPath} onNavigate={handleBreadcrumbNav} />
          </div>

          {/* Treemap container */}
          <div className="flex-1 min-h-0 glass rounded-none overflow-hidden">
            <Treemap
              data={currentNode}
              onDrillDown={handleDrillDown}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted shrink-0">
            <span>Click a directory to zoom in • Use breadcrumbs to navigate back</span>
            <span>•</span>
            <span>
              {scanResult.file_count.toLocaleString()} files •{' '}
              {scanResult.dir_count.toLocaleString()} directories
            </span>
          </div>
        </>
      )}

      {/* Empty state */}
      {!scanResult && !isScanning && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-none p-16 flex flex-col items-center justify-center text-center"
          >
            <div className="p-4 rounded-none bg-accent-secondary/10 mb-4">
              <ChartDonut size={40} weight="duotone" className="text-accent-secondary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">No Scan Data</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md">
              Run a scan first to see an interactive treemap visualization of your storage.
              Each rectangle represents a file or directory, sized by disk usage.
            </p>
            <button
              onClick={handleStartScan}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-none text-sm font-medium text-white bg-accent-primary hover:opacity-90 transition-opacity"
            >
              <MagnifyingGlass size={18} />
              Start Scanning
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
