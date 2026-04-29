import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gear,
  ShieldCheck,
  ShieldWarning,
  Info,
  ArrowSquareOut,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { useDiskInfo } from '../hooks/use-disk-info';
import { openSystemPreferences } from '../services/tauri';
import { formatBytes } from '../lib/format';

export default function Settings() {
  const { diskInfo, hasFDA, refresh } = useDiskInfo();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          App preferences and system information
        </p>
      </div>

      {/* Full Disk Access */}
      <div className="glass rounded-3xl p-6 space-y-4 border border-white/5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck size={18} weight="duotone" className="text-[#0D9488]" />
          Permissions
        </h2>
        <div className="flex items-center justify-between py-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            {hasFDA ? (
              <div className="p-2 rounded-full bg-[#0D9488]/20 text-[#0D9488]">
                <ShieldCheck size={20} />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A]">
                <ShieldWarning size={20} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">Full Disk Access</p>
              <p className="text-xs text-white/50 mt-0.5">
                {hasFDA ? 'Granted — all directories accessible' : 'Not granted — some directories inaccessible'}
              </p>
            </div>
          </div>
          {!hasFDA && (
            <button
              onClick={() => {
                openSystemPreferences().catch(console.error);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white bg-[#FF9F0A] hover:bg-[#FF9F0A]/80 shadow-[0_0_15px_rgba(255,159,10,0.4)] transition-all"
            >
              <ArrowSquareOut size={14} />
              Open Settings
            </button>
          )}
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <ArrowClockwise size={12} />
            Recheck
          </button>
        </div>
      </div>

      {/* Disk Info */}
      {diskInfo && (
        <div className="glass rounded-3xl p-6 space-y-3 border border-white/5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Info size={18} weight="duotone" className="text-[#0D9488]" />
            System Information
          </h2>
          <div className="space-y-3 pt-3 border-t border-white/10">
            {[
              { label: 'Total Capacity', value: formatBytes(diskInfo.total_capacity) },
              { label: 'Used Space', value: formatBytes(diskInfo.used_space) },
              { label: 'Available Space', value: formatBytes(diskInfo.available_space) },
              ...(diskInfo.purgeable_space ? [{ label: 'Purgeable', value: formatBytes(diskInfo.purgeable_space) }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{label}</span>
                <span className="text-sm text-text-primary font-medium tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div className="glass rounded-3xl p-6 space-y-3 border border-white/5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Gear size={18} weight="duotone" className="text-[#0D9488]" />
          About
        </h2>
        <div className="space-y-3 pt-3 border-t border-white/10">
          {[
            { label: 'Version', value: '0.1.0' },
            { label: 'Framework', value: 'Tauri v2' },
            { label: 'Frontend', value: 'React 19 + TypeScript' },
            { label: 'Backend', value: 'Rust' },
            { label: 'Platform', value: 'macOS' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{label}</span>
              <span className="text-sm text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cleanup behavior */}
      <div className="glass rounded-3xl p-6 space-y-3 border border-white/5">
        <h2 className="text-sm font-semibold text-white">Cleanup Behavior</h2>
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-[#0D9488] shrink-0 shadow-[0_0_10px_#0D9488]" />
            <div>
              <p className="text-sm font-medium text-white">Safe deletion only</p>
              <p className="text-xs text-white/50 mt-1">
                All deletions use macOS Trash — files can be recovered anytime
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-[#FF9F0A] shrink-0 shadow-[0_0_10px_#FF9F0A]" />
            <div>
              <p className="text-sm font-medium text-white">Safety ratings</p>
              <p className="text-xs text-white/50 mt-1">
                Items rated 🟢 Safe, 🟡 Review, or 🔴 Caution to prevent accidental data loss
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-[#E11D48] shrink-0 shadow-[0_0_10px_#E11D48]" />
            <div>
              <p className="text-sm font-medium text-white">Extra confirmation</p>
              <p className="text-xs text-white/50 mt-1">
                Caution-rated items require typing "DELETE" to confirm
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
