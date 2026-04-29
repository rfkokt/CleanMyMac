import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HardDrives,
  ArrowClockwise,
  Lightning,
  Wrench,
  FileMagnifyingGlass,
  ChartDonut,
  ArrowRight,
} from '@phosphor-icons/react';
import { useDiskInfo } from '../hooks/use-disk-info';
import { useScanStore } from '../stores/scan-store';
import { useScanner } from '../hooks/use-scanner';
import { CategoryChart } from '../components/scanner/CategoryChart';
import { FDAModal, FDABanner } from '../components/ui/FDAModal';
import { TiltCard } from '../components/ui/TiltCard';
import { GSAPScanner3D } from '../components/ui/GSAPScanner3D';
import { formatBytes, formatPercent } from '../lib/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const { diskInfo, hasFDA, isLoading, refresh } = useDiskInfo();
  const { scanResult, isScanning, progress } = useScanStore();
  const { scan } = useScanner();

  const [showFDAModal, setShowFDAModal] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Show FDA modal on first load if not granted
  useEffect(() => {
    if (hasFDA === false) {
      setShowFDAModal(true);
    }
  }, [hasFDA]);

  const handleQuickScan = useCallback(async () => {
    const homeDir = await import('@tauri-apps/api/path')
      .then((m) => m.homeDir())
      .catch(() => '/');
    scan(homeDir, 3);
  }, [scan]);

  const usagePercent = diskInfo
    ? (diskInfo.used_space / diskInfo.total_capacity) * 100
    : 0;

  const usageColor =
    usagePercent > 90 ? '#ef4444' : usagePercent > 70 ? '#f59e0b' : '#22c55e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-300 shadow-md backdrop-blur-md border border-white/10 text-sm disabled:opacity-50"
        >
          <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* FDA Banner */}
      {hasFDA === false && (
        <FDABanner onOpenSettings={() => setShowFDAModal(true)} />
      )}

      {/* Disk Usage Card */}
      {diskInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TiltCard className="glass p-8 text-left w-full block">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-[#FF2E93]/20 border border-[#FF2E93]/30 shadow-[0_0_20px_rgba(255,46,147,0.3)]">
              <HardDrives size={32} weight="duotone" className="text-[#FF2E93]" />
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
          <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
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
          </TiltCard>
        </motion.div>
      )}

      {/* Disk Info loading skeleton */}
      {!diskInfo && isLoading && (
        <div className="glass p-6 animate-pulse">
          <div className="h-6 w-32 bg-white/5 rounded mb-4" />
          <div className="h-3 w-full bg-white/5 rounded-full" />
        </div>
      )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button onClick={() => { navigate('/scan'); handleQuickScan(); }} className="w-full text-left glass p-6 flex flex-col gap-3 group block transition-transform hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all">
                <Lightning size={24} weight="duotone" className="text-[#00F0FF]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Quick Scan</h3>
                <p className="text-sm text-white/60">Scan home directory</p>
              </div>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button onClick={() => navigate('/dev-tools')} className="w-full text-left glass p-6 flex flex-col gap-3 group block transition-transform hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-[#FF9F0A]/20 border border-[#FF9F0A]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,159,10,0.2)] group-hover:shadow-[0_0_30px_rgba(255,159,10,0.4)] transition-all">
                <Wrench size={24} weight="duotone" className="text-[#FF9F0A]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Dev Cleanup</h3>
                <p className="text-sm text-white/60">node_modules, Xcode, Docker</p>
              </div>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button onClick={() => navigate('/large-files')} className="w-full text-left glass p-6 flex flex-col gap-3 group block transition-transform hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-[#BF5AF2]/20 border border-[#BF5AF2]/30 flex items-center justify-center shadow-[0_0_20px_rgba(191,90,242,0.2)] group-hover:shadow-[0_0_30px_rgba(191,90,242,0.4)] transition-all">
                <FileMagnifyingGlass size={24} weight="duotone" className="text-[#BF5AF2]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Large Files</h3>
                <p className="text-sm text-white/60">Find files &gt; 100MB</p>
              </div>
            </button>
          </motion.div>
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

      {/* Category Breakdown (F-010) */}
      {scanResult && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CategoryChart
            categories={scanResult.categories}
            totalSize={scanResult.total_size}
            onCategoryClick={() => {
              navigate('/scan');
            }}
          />
        </motion.div>
      )}

      {/* Scan stats */}
      {scanResult && !isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Scanned', value: formatBytes(scanResult.total_size), color: '#6366f1' },
            { label: 'Files', value: scanResult.file_count.toLocaleString(), color: '#8b5cf6' },
            { label: 'Directories', value: scanResult.dir_count.toLocaleString(), color: '#ec4899' },
            { label: 'Scan Time', value: `${(scanResult.scan_duration_ms / 1000).toFixed(1)}s`, color: '#22c55e' },
          ].map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="glass rounded-none p-4"
            >
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-lg font-bold mt-1" style={{ color }}>{value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick navigation cards */}
      {scanResult && !isScanning && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/visualize')}
            className="glass rounded-none p-5 text-left hover:border-accent-secondary/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChartDonut size={20} weight="duotone" className="text-accent-secondary" />
                <span className="text-sm font-medium text-text-primary">View Treemap</span>
              </div>
              <ArrowRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Interactive visualization of disk usage
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/scan')}
            className="glass rounded-none p-5 text-left hover:border-accent-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileMagnifyingGlass size={20} weight="duotone" className="text-accent-primary" />
                <span className="text-sm font-medium text-text-primary">Browse Results</span>
              </div>
              <ArrowRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Sort, filter, and manage scanned files
            </p>
          </motion.button>
        </div>
      )}

      {/* FDA Modal */}
      <FDAModal isOpen={showFDAModal} onDismiss={() => setShowFDAModal(false)} />
    </motion.div>
  );
}
