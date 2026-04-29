import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash, Warning, ShieldCheck, X } from '@phosphor-icons/react';
import type { FileNode } from '../../types';
import { formatBytes } from '../../lib/format';
import { GSAPCleanup3D } from '../ui/GSAPCleanup3D';

interface ConfirmDialogProps {
  isOpen: boolean;
  items: FileNode[];
  totalSize: number;
  isCleaningUp: boolean;
  progress?: { completed: number; total: number } | null;
  onConfirm: (permanent: boolean) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  items,
  totalSize,
  isCleaningUp,
  progress,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);

  const hasCautionItems = items.some((i) => i.safety_level === 'Caution');
  const needsTyping = hasCautionItems;
  const isConfirmEnabled = !needsTyping || confirmText.toUpperCase() === 'DELETE';

  const safeCount = items.filter((i) => i.safety_level === 'Safe').length;
  const reviewCount = items.filter((i) => i.safety_level === 'Review').length;
  const cautionCount = items.filter((i) => i.safety_level === 'Caution').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={!isCleaningUp ? onCancel : undefined}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg rounded-none bg-bg-secondary border border-bg-tertiary shadow-2xl overflow-hidden">
              {/* Cleaning State (Full Animation) */}
              {isCleaningUp && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-6">
                    <GSAPCleanup3D isCleaningUp={isCleaningUp} />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-2">
                    Shredding Files...
                  </h2>
                  <p className="text-sm text-text-secondary mb-8">
                    {progress?.completed.toLocaleString() || 0} of {progress?.total.toLocaleString() || items.length.toLocaleString()} items securely removed
                  </p>
                  
                  {/* Progress bar */}
                  {progress && (
                    <div className="w-full max-w-sm">
                      <div className="w-full h-2 bg-bg-tertiary rounded-none overflow-hidden">
                        <motion.div
                          className="h-full bg-caution"
                          initial={{ width: 0 }}
                          animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                          transition={{ ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation State (Idle) */}
              {!isCleaningUp && (
                <>
                  {/* Header */}
                  <div className="p-6 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GSAPCleanup3D isCleaningUp={isCleaningUp} />
                      <div>
                        <h2 className="text-lg font-bold text-text-primary">
                          Confirm Cleanup
                        </h2>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {items.length.toLocaleString()} items • {formatBytes(totalSize)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onCancel}
                      className="p-1.5 rounded-none text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="px-6 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {safeCount > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-none bg-safe/10 border border-safe/20">
                        <ShieldCheck size={16} className="text-safe" />
                        <div>
                          <p className="text-xs text-safe font-medium">{safeCount} Safe</p>
                        </div>
                      </div>
                    )}
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-none bg-review/10 border border-review/20">
                        <Warning size={16} className="text-review" />
                        <div>
                          <p className="text-xs text-review font-medium">{reviewCount} Review</p>
                        </div>
                      </div>
                    )}
                    {cautionCount > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-none bg-caution/10 border border-caution/20">
                        <Warning size={16} weight="fill" className="text-caution" />
                        <div>
                          <p className="text-xs text-caution font-medium">{cautionCount} Caution</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items list preview */}
                  <div className="mt-4 max-h-40 overflow-y-auto rounded-none bg-bg-secondary border border-bg-tertiary">
                    {items.slice(0, 20).map((item) => {
                      const diskLabel = getDiskLabel(item.path);
                      return (
                        <div
                          key={item.path}
                          className="flex items-center justify-between px-3 py-2 border-b border-bg-tertiary last:border-0"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <span className="text-xs text-text-secondary truncate block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate block mt-0.5">
                              {diskLabel} — {shortenPath(item.path)}
                            </span>
                          </div>
                          <span className="text-xs text-text-muted tabular-nums shrink-0">
                            {formatBytes(item.size)}
                          </span>
                        </div>
                      );
                    })}
                    {items.length > 20 && (
                      <div className="px-3 py-2 text-xs text-text-muted text-center">
                        + {items.length - 20} more items
                      </div>
                    )}
                  </div>

                  {/* Typing confirmation for caution items */}
                  {needsTyping && (
                    <div className="mt-4">
                      <p className="text-xs text-caution mb-2 font-medium">
                        ⚠️ You have caution items. Type DELETE to confirm:
                      </p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full px-3 py-2 rounded-none bg-bg-secondary border border-bg-tertiary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-caution/50 transition-colors"
                      />
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-bg-tertiary">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={isPermanent}
                          onChange={(e) => setIsPermanent(e.target.checked)}
                          className="peer appearance-none w-4 h-4 border border-bg-tertiary rounded-none bg-bg-secondary checked:bg-caution checked:border-caution transition-colors cursor-pointer"
                        />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary group-hover:text-caution transition-colors">
                          Permanently delete items
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Bypass Trash and free up space immediately. This action cannot be undone.
                        </p>
                      </div>
                    </label>
                  </div>

                  {!isPermanent && (
                    <p className="mt-3 text-xs text-text-muted">
                      Items will be moved to Trash. You can restore them if needed.
                    </p>
                  )}
                </div>

              {/* Footer */}
                <div className="p-6 pt-2 flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-none text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-tertiary transition-all border border-bg-tertiary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onConfirm(isPermanent)}
                    disabled={!isConfirmEnabled}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-none text-sm font-medium text-white bg-caution hover:bg-caution/90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash size={16} />
                    Clean {formatBytes(totalSize)}
                  </button>
                </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Determine which disk/volume a path belongs to */
function getDiskLabel(path: string): string {
  if (path.startsWith('/Volumes/')) {
    // External or named volume: /Volumes/External M4/...
    const parts = path.split('/');
    return `💾 ${parts[2]}`;
  }
  // Root disk (Macintosh HD)
  return '💻 Macintosh HD';
}

/** Shorten a file path for display */
function shortenPath(path: string): string {
  // Replace home dir with ~
  const shortened = path.replace(/^\/Users\/[^/]+\//, '~/');
  // If still long, take last 2 segments
  if (shortened.length > 60) {
    const parts = shortened.split('/');
    return '…/' + parts.slice(-2).join('/');
  }
  return shortened;
}
