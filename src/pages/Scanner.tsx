import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Spinner, Broom } from '@phosphor-icons/react';
import { useScanStore } from '../stores/scan-store';
import { useCleanupStore } from '../stores/cleanup-store';
import { useScanner } from '../hooks/use-scanner';
import { CleanupManager } from '../components/scanner/CleanupManager';
import { ConfirmDialog } from '../components/cleanup/ConfirmDialog';
import { formatBytes } from '../lib/format';

export default function Scanner() {
  const { scanResult, isScanning, progress, selectedPaths } = useScanStore();
  const { toggleSelected, clearSelection } = useScanStore();
  const { scan } = useScanner();

  const [showConfirm, setShowConfirm] = useState(false);

  // Auto remove items from UI when cleanup finishes
  const cleanupResult = useCleanupStore((s) => s.result);
  const prevResultRef = useRef(cleanupResult);
  useEffect(() => {
    if (cleanupResult && cleanupResult !== prevResultRef.current && scanResult) {
      const successfulPaths = cleanupResult.items_deleted > 0 
        ? Array.from(selectedPaths) 
        : [];
      
      if (successfulPaths.length > 0) {
        useScanStore.getState().removeItems(successfulPaths);
      }
      clearSelection();
    }
    prevResultRef.current = cleanupResult;
  }, [cleanupResult, scanResult, clearSelection, selectedPaths]);

  const handleStartScan = async () => {
    try {
      const homeDir = await import('@tauri-apps/api/path')
        .then((m) => m.homeDir())
        .catch(() => '/');
      scan(homeDir, 4); // Deep scan for comprehensive cleanup manager
    } catch (e) {
      console.error(e);
    }
  };

  // Helper for selecting multiple paths from a group in CleanupManager
  const handleSelectGroup = (paths: string[]) => {
    const store = useScanStore.getState();
    const currentPaths = new Set(store.selectedPaths);
    let allSelected = true;
    for (const p of paths) {
      if (!currentPaths.has(p)) {
        allSelected = false;
        break;
      }
    }

    if (allSelected) {
      // deselect all
      paths.forEach(p => currentPaths.delete(p));
    } else {
      // select all
      paths.forEach(p => currentPaths.add(p));
    }
    
    paths.forEach(p => store.toggleSelected(p));
  };

  // Calculate selected items list for the ConfirmDialog
  const selectedItemsList = useMemo(() => {
    const found: any[] = [];
    const paths = new Set(selectedPaths);
    
    const findNodes = (node: any) => {
      if (paths.has(node.path)) {
        found.push(node);
      }
      if (node.children) {
        node.children.forEach(findNodes);
      }
    };
    
    if (scanResult) findNodes(scanResult.root);
    return found;
  }, [scanResult, selectedPaths]);

  // Calculate selected total size
  const selectedSize = useMemo(() => {
    return selectedItemsList.reduce((total, node) => total + node.size, 0);
  }, [selectedItemsList]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Cleanup Manager</h1>
          <p className="text-sm text-white/40 mt-1">
            {scanResult
              ? `${scanResult.file_count.toLocaleString()} files • ${formatBytes(scanResult.total_size)} total`
              : 'Scan your disk to identify unused files and caches'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 border border-white/10"
          >
            {isScanning ? (
              <>
                <Spinner size={16} className="animate-spin text-[#00F0FF]" />
                Scanning...
              </>
            ) : (
              <>
                <Play size={16} weight="fill" className={scanResult ? 'text-[#00F0FF]' : 'text-white'} />
                {scanResult ? 'Re-scan' : 'Start Scan'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        {isScanning ? (
          <div className="absolute inset-0 flex items-center justify-center glass rounded-3xl border border-white/5 z-10 flex-col">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D9488]/20 to-[#00F0FF]/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)] mb-6 border border-[#00F0FF]/20">
              <Spinner size={32} className="text-[#00F0FF] animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Analyzing Storage...</h2>
            <p className="text-sm text-white/50 mb-6">{progress ? progress.current_path : 'Preparing scan...'}</p>
            
            {progress && (
              <div className="w-64 max-w-sm flex flex-col items-center">
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-2 shadow-inner border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#0D9488] to-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <span className="text-xs text-[#00F0FF] font-medium">{progress.scanned.toLocaleString()} files scanned</span>
              </div>
            )}
          </div>
        ) : !scanResult ? (
          <div className="absolute inset-0 flex items-center justify-center glass rounded-3xl border border-white/5 z-10">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-xl border border-white/10">
                <Broom size={36} weight="duotone" className="text-white/40" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Ready to Clean</h2>
              <p className="text-sm text-white/40 max-w-sm">
                Start a scan to safely identify unnecessary files, caches, and logs that can be removed to free up space.
              </p>
            </div>
          </div>
        ) : null}

        {/* The 3-pane Layout */}
        {scanResult && !isScanning && (
          <CleanupManager 
            rootNode={scanResult.root} 
            selectedPaths={selectedPaths}
            onToggleSelect={toggleSelected}
            onSelectGroup={handleSelectGroup}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <AnimatePresence>
        {selectedPaths.size > 0 && !isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="shrink-0 glass rounded-2xl p-3 border border-white/10 flex items-center justify-between pl-6 shadow-2xl bg-black/40 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white">{selectedPaths.size} Items Selected</span>
              <span className="text-white/20">|</span>
              <span className="text-sm text-[#00F0FF] font-medium">{formatBytes(selectedSize)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(236,72,153,0.4)]"
              >
                Clean Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        items={selectedItemsList}
        totalSize={selectedSize}
        onConfirm={(permanent) => {
          setShowConfirm(false);
          useCleanupStore.getState().cleanup(Array.from(selectedPaths), permanent);
        }}
      />
    </motion.div>
  );
}
