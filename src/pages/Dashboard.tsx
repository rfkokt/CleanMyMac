import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { HardDrives, ArrowClockwise, Lightning } from '@phosphor-icons/react';
import { useDiskInfo } from '../hooks/use-disk-info';
import { useScanStore } from '../stores/scan-store';
import { useScanner } from '../hooks/use-scanner';
import { formatBytes, formatPercent, getCategoryColor } from '../lib/format';

export default function Dashboard() {
  const { diskInfo, hasFDA, isLoading, refresh } = useDiskInfo();
  const { scanResult, isScanning, progress } = useScanStore();
  const { scan } = useScanner();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const usagePercent = diskInfo
    ? (diskInfo.used_space / diskInfo.total_capacity) * 100
    : 0;

  const usageColor =
    usagePercent > 90 ? '#ef4444' : usagePercent > 70 ? '#f59e0b' : '#22c55e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Storage overview and quick actions
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-text-secondary hover:text-text-primary transition-all duration-200 text-sm disabled:opacity-50"
        >
          <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* FDA Warning */}
      {hasFDA === false && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-caution/10 border border-caution/20"
        >
          <p className="text-sm text-caution font-medium">
            ⚠️ Full Disk Access not granted. Some directories may be inaccessible.
          </p>
          <p className="text-xs text-caution/70 mt-1">
            Go to System Settings → Privacy & Security → Full Disk Access to enable.
          </p>
        </motion.div>
      )}

      {/* Disk Usage Card */}
      {diskInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-accent-primary/15">
              <HardDrives size={24} weight="duotone" className="text-accent-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Storage</h2>
              <p className="text-sm text-text-secondary">
                {formatBytes(diskInfo.used_space)} of {formatBytes(diskInfo.total_capacity)} used
              </p>
            </div>
            <span
              className="ml-auto text-3xl font-bold"
              style={{ color: usageColor }}
            >
              {formatPercent(diskInfo.used_space, diskInfo.total_capacity)}
            </span>
          </div>

          {/* Usage bar */}
          <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${usageColor}cc, ${usageColor})`,
              }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>{formatBytes(diskInfo.used_space)} used</span>
            <span>{formatBytes(diskInfo.available_space)} available</span>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => scan(dirs.home || '/', 3)}
          disabled={isScanning}
          className="glass rounded-2xl p-5 text-left hover:border-accent-primary/30 transition-all duration-200 disabled:opacity-50"
        >
          <Lightning size={24} weight="duotone" className="text-accent-primary mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">Quick Scan</h3>
          <p className="text-xs text-text-secondary mt-1">
            {isScanning
              ? `Scanning... ${progress?.scanned || 0} files`
              : 'Scan home directory'}
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '#/dev-tools'}
          className="glass rounded-2xl p-5 text-left hover:border-cat-devcache/30 transition-all duration-200"
        >
          <span className="text-2xl mb-3 block">🧹</span>
          <h3 className="text-sm font-semibold text-text-primary">Dev Cleanup</h3>
          <p className="text-xs text-text-secondary mt-1">node_modules, Xcode, Docker</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '#/large-files'}
          className="glass rounded-2xl p-5 text-left hover:border-cat-media/30 transition-all duration-200"
        >
          <span className="text-2xl mb-3 block">📦</span>
          <h3 className="text-sm font-semibold text-text-primary">Large Files</h3>
          <p className="text-xs text-text-secondary mt-1">Find files &gt; 100MB</p>
        </motion.button>
      </div>

      {/* Category Breakdown (if scan result available) */}
      {scanResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Storage Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(scanResult.categories)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([category, size]) => {
                const total = scanResult.total_size || 1;
                const pct = (size / total) * 100;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <span className="text-sm text-text-secondary w-24">{category}</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: getCategoryColor(category),
                        }}
                      />
                    </div>
                    <span className="text-xs text-text-muted w-20 text-right">
                      {formatBytes(size)}
                    </span>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Placeholder for home dir - will be replaced with proper Tauri call
const dirs = { home: undefined as string | undefined };
try {
  // This will be populated at runtime
  import('@tauri-apps/api/path').then(m => m.homeDir().then(h => { dirs.home = h; }));
} catch {}
