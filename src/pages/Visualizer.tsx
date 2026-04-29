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
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="h-full flex flex-col space-y-6"
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
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass rounded-3xl p-6 border border-white/10 shrink-0 overflow-hidden"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Spinner size={16} className="text-[#00F0FF] animate-spin" />
                Scanning Storage...
              </span>
              <span className="text-sm font-medium text-[#00F0FF]">
                {progress.scanned.toLocaleString()} files
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0D9488] to-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            
            <p className="text-xs text-white/40 truncate">
              {progress.current_path}
            </p>
          </div>
        </motion.div>
      )}

      {/* Treemap / Directory List */}
      {scanResult && currentNode && !isScanning && (
        <>
          {/* Breadcrumbs */}
          <div className="shrink-0">
            <Breadcrumbs path={breadcrumbPath} onNavigate={handleBreadcrumbNav} />
          </div>

          {/* Treemap Container */}
          <div className="flex-1 min-h-0 glass rounded-3xl overflow-hidden border border-white/5">
            <Treemap
              data={currentNode}
              onDrillDown={handleDrillDown}
            />
          </div>

          {/* Info Footer */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-white/40 shrink-0">
            <span>Click a block to zoom in · Use breadcrumbs to navigate back</span>
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
              Each colored block represents a folder or file, sized by disk usage.
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
