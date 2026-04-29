import { motion, AnimatePresence } from 'framer-motion';
import { ShieldWarning, ArrowSquareOut, X } from '@phosphor-icons/react';
import { useState } from 'react';

interface FDAModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function FDAModal({ isOpen, onDismiss }: FDAModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
          >
            <div className="w-full max-w-md rounded-3xl bg-bg-secondary border border-white/[0.08] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onDismiss}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-review/15">
                    <ShieldWarning size={32} weight="duotone" className="text-review" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      Full Disk Access Required
                    </h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                      CleanMyMac needs permission to scan
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-4">
                <div className="space-y-3 text-sm text-text-secondary">
                  <p>
                    To scan and clean your entire disk, CleanMyMac needs <strong className="text-text-primary">Full Disk Access</strong> permission.
                  </p>
                  <p>
                    Without it, many directories (like Library and system caches) will be inaccessible, and your scan results will be incomplete.
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-xs text-text-muted font-medium mb-2">HOW TO ENABLE:</p>
                    <ol className="text-xs text-text-secondary space-y-1.5 list-decimal list-inside">
                      <li>Open <strong className="text-text-primary">System Settings</strong></li>
                      <li>Go to <strong className="text-text-primary">Privacy & Security</strong></li>
                      <li>Click <strong className="text-text-primary">Full Disk Access</strong></li>
                      <li>Toggle on <strong className="text-text-primary">CleanMyMac</strong></li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 flex gap-3">
                <button
                  onClick={onDismiss}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                >
                  Later
                </button>
                <button
                  onClick={() => {
                    // Open System Settings > Privacy & Security > Full Disk Access
                    import('@tauri-apps/plugin-shell').then(({ open }) => {
                      open('x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles');
                    }).catch(() => {
                      // Fallback
                      window.open('x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles');
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 transition-opacity"
                >
                  <ArrowSquareOut size={16} />
                  Open Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Persistent banner shown when FDA is not granted and modal is dismissed */
export function FDABanner({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-review/10 border border-review/20"
    >
      <div className="flex items-center gap-2">
        <ShieldWarning size={16} weight="duotone" className="text-review shrink-0" />
        <p className="text-xs text-review">
          Full Disk Access not granted — scan results may be incomplete.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSettings}
          className="text-xs font-medium text-review hover:text-review/80 transition-colors underline"
        >
          Fix
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 text-review/50 hover:text-review transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}
