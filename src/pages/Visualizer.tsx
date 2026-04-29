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
          <h1 className="text-2xl font-bold text-white">Visualizer</h1>
          <p className="text-sm text-white/60 mt-1">
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
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:shadow-[0_0_30px_rgba(13,148,136,0.6)] transition-all disabled:opacity-50"
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
        <div className="glass rounded-2xl p-5 border border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Spinner size={16} className="text-[#00F0FF] animate-spin" />
            <span className="text-sm text-white/60">
              Scanning... {progress.scanned.toLocaleString()} files
            </span>
          </div>
          <p className="text-xs text-white/40 truncate mt-1">{progress.current_path}</p>
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
          <div className="flex-1 min-h-0 glass rounded-3xl overflow-hidden border border-white/5 p-2">
            <Treemap
              data={currentNode}
              onDrillDown={handleDrillDown}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-white/40 shrink-0">
            <span>Click a directory to zoom in · Use breadcrumbs to navigate back</span>
            <span className="text-white/20">·</span>
            <span>
              {scanResult.file_count.toLocaleString()} files ·{' '}
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
            className="glass rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-white/5"
          >
            <div className="p-5 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.3)] mb-6">
              <ChartDonut size={48} weight="duotone" className="text-[#00F0FF]" />
            </div>
            <h2 className="text-lg font-semibold text-white">No Scan Data</h2>
            <p className="text-sm text-white/60 mt-2 max-w-md">
              Run a scan first to see an interactive treemap visualization of your storage.
              Each rectangle represents a file or directory, sized by disk usage.
            </p>
            <button
              onClick={handleStartScan}
              className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:shadow-[0_0_30px_rgba(13,148,136,0.6)] transition-all"
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
