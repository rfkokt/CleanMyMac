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
      <div className="glass rounded-none p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <ShieldCheck size={18} weight="duotone" className="text-accent-primary" />
          Permissions
        </h2>
        <div className="flex items-center justify-between py-3 border-t border-bg-tertiary">
          <div className="flex items-center gap-3">
            {hasFDA ? (
              <div className="p-1.5 rounded-none bg-safe/15">
                <ShieldCheck size={16} className="text-safe" />
              </div>
            ) : (
              <div className="p-1.5 rounded-none bg-review/15">
                <ShieldWarning size={16} className="text-review" />
              </div>
            )}
            <div>
              <p className="text-sm text-text-primary">Full Disk Access</p>
              <p className="text-xs text-text-muted mt-0.5">
                {hasFDA ? 'Granted — all directories accessible' : 'Not granted — some directories inaccessible'}
              </p>
            </div>
          </div>
          {!hasFDA && (
            <button
              onClick={() => {
                openSystemPreferences().catch(console.error);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-none text-xs font-medium text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 transition-colors"
            >
              <ArrowSquareOut size={12} />
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
        <div className="glass rounded-none p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Info size={18} weight="duotone" className="text-accent-primary" />
            System Information
          </h2>
          <div className="space-y-2.5 pt-2 border-t border-bg-tertiary">
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
      <div className="glass rounded-none p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Gear size={18} weight="duotone" className="text-accent-primary" />
          About
        </h2>
        <div className="space-y-2.5 pt-2 border-t border-bg-tertiary">
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
      <div className="glass rounded-none p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Cleanup Behavior</h2>
        <div className="space-y-3 pt-2 border-t border-bg-tertiary">
          <div className="flex items-start gap-3 p-3 rounded-none bg-safe/5 border border-safe/10">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-safe shrink-0" />
            <div>
              <p className="text-sm text-text-primary">Safe deletion only</p>
              <p className="text-xs text-text-muted mt-0.5">
                All deletions use macOS Trash — files can be recovered anytime
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-none bg-review/5 border border-review/10">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-review shrink-0" />
            <div>
              <p className="text-sm text-text-primary">Safety ratings</p>
              <p className="text-xs text-text-muted mt-0.5">
                Items rated 🟢 Safe, 🟡 Review, or 🔴 Caution to prevent accidental data loss
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-none bg-caution/5 border border-caution/10">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-caution shrink-0" />
            <div>
              <p className="text-sm text-text-primary">Extra confirmation</p>
              <p className="text-xs text-text-muted mt-0.5">
                Caution-rated items require typing "DELETE" to confirm
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
