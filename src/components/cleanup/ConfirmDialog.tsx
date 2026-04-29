import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash, Warning, ShieldCheck, X, Spinner } from '@phosphor-icons/react';
import type { FileNode } from '../../types';
import { formatBytes } from '../../lib/format';

interface ConfirmDialogProps {
  isOpen: boolean;
  items: FileNode[];
  totalSize: number;
  isCleaningUp: boolean;
  progress?: { completed: number; total: number } | null;
  onConfirm: () => void;
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
            <div className="w-full max-w-lg rounded-3xl bg-bg-secondary border border-white/[0.08] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-caution/15">
                    <Trash size={24} weight="duotone" className="text-caution" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {isCleaningUp ? 'Cleaning Up...' : 'Confirm Cleanup'}
                    </h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {isCleaningUp
                        ? `${progress?.completed || 0} of ${progress?.total || items.length} items`
                        : `${items.length} items • ${formatBytes(totalSize)}`
                      }
                    </p>
                  </div>
                </div>
                {!isCleaningUp && (
                  <button
                    onClick={onCancel}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Progress bar (when cleaning) */}
              {isCleaningUp && progress && (
                <div className="px-6 pb-4">
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                      transition={{ ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              {!isCleaningUp && (
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {safeCount > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-safe/10 border border-safe/20">
                        <ShieldCheck size={16} className="text-safe" />
                        <div>
                          <p className="text-xs text-safe font-medium">{safeCount} Safe</p>
                        </div>
                      </div>
                    )}
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-review/10 border border-review/20">
                        <Warning size={16} className="text-review" />
                        <div>
                          <p className="text-xs text-review font-medium">{reviewCount} Review</p>
                        </div>
                      </div>
                    )}
                    {cautionCount > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-caution/10 border border-caution/20">
                        <Warning size={16} weight="fill" className="text-caution" />
                        <div>
                          <p className="text-xs text-caution font-medium">{cautionCount} Caution</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items list preview */}
                  <div className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    {items.slice(0, 20).map((item) => (
                      <div
                        key={item.path}
                        className="flex items-center justify-between px-3 py-2 border-b border-white/[0.03] last:border-0"
                      >
                        <span className="text-xs text-text-secondary truncate flex-1 mr-2">
                          {item.name}
                        </span>
                        <span className="text-xs text-text-muted tabular-nums shrink-0">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                    ))}
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
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-caution/50 transition-colors"
                      />
                    </div>
                  )}

                  <p className="mt-3 text-xs text-text-muted">
                    Items will be moved to Trash. You can restore them from Trash if needed.
                  </p>
                </div>
              )}

              {/* Footer */}
              {!isCleaningUp && (
                <div className="p-6 pt-2 flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={!isConfirmEnabled}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-caution to-caution/80 hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash size={16} />
                    Clean {formatBytes(totalSize)}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
