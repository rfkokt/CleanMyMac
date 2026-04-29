import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  File,
  ArrowsDownUp,
  CheckSquare,
  Square,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import type { FileNode, FileCategory, SafetyLevel } from '../../types';
import { formatBytes, formatRelativeTime, getCategoryColor, getSafetyColor } from '../../lib/format';

interface FileListProps {
  nodes: FileNode[];
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onOpenInFinder: (path: string) => void;
  onNavigate: (node: FileNode) => void;
  sortBy: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  categoryFilter: FileCategory[];
  safetyFilter: SafetyLevel[];
}

type SortKey = 'name' | 'size' | 'file_type' | 'safety_level' | 'last_modified';

export function FileList({
  nodes,
  selectedPaths,
  onToggleSelect,
  onOpenInFinder,
  onNavigate,
  sortBy,
  sortDir,
  onSort,
  categoryFilter,
  safetyFilter,
}: FileListProps) {
  // Filter
  const filtered = useMemo(() => {
    let result = nodes;
    if (categoryFilter.length > 0) {
      result = result.filter((n) => categoryFilter.includes(n.file_type));
    }
    if (safetyFilter.length > 0) {
      result = result.filter((n) => safetyFilter.includes(n.safety_level));
    }
    return result;
  }, [nodes, categoryFilter, safetyFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'size':
          return dir * (a.size - b.size);
        case 'file_type':
          return dir * String(a.file_type).localeCompare(String(b.file_type));
        case 'safety_level':
          return dir * String(a.safety_level).localeCompare(String(b.safety_level));
        case 'last_modified':
          return dir * ((a.last_modified || 0) - (b.last_modified || 0));
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const columns: { key: SortKey; label: string; width: string }[] = [
    { key: 'name', label: 'Name', width: 'flex-1 min-w-0' },
    { key: 'size', label: 'Size', width: 'w-24 text-right' },
    { key: 'file_type', label: 'Category', width: 'w-28' },
    { key: 'safety_level', label: 'Safety', width: 'w-20' },
    { key: 'last_modified', label: 'Modified', width: 'w-28 text-right' },
  ];

  return (
    <div className="rounded-none overflow-hidden border border-bg-tertiary">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary border-b border-bg-tertiary text-xs text-text-muted font-medium uppercase tracking-wider">
        <div className="w-8" /> {/* checkbox space */}
        {columns.map(({ key, label, width }) => (
          <button
            key={key}
            onClick={() => onSort(key)}
            className={`${width} flex items-center gap-1 hover:text-text-secondary transition-colors ${
              sortBy === key ? 'text-text-secondary' : ''
            }`}
          >
            {label}
            {sortBy === key && (
              <ArrowsDownUp size={12} className={sortDir === 'desc' ? 'rotate-180' : ''} />
            )}
          </button>
        ))}
        <div className="w-8" /> {/* action space */}
      </div>

      {/* Rows */}
      <div className="max-h-[60vh] overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-4 py-12 text-center text-text-muted text-sm">
            No files match your filters
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sorted.map((node, i) => (
              <FileRow
                key={node.path}
                node={node}
                index={i}
                isSelected={selectedPaths.has(node.path)}
                onToggleSelect={() => onToggleSelect(node.path)}
                onOpenInFinder={() => onOpenInFinder(node.path)}
                onNavigate={() => onNavigate(node)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-secondary border-t border-bg-tertiary text-xs text-text-muted">
        <span>{sorted.length} items</span>
        <span>{formatBytes(sorted.reduce((a, n) => a + n.size, 0))} total</span>
      </div>
    </div>
  );
}

function FileRow({
  node,
  index,
  isSelected,
  onToggleSelect,
  onOpenInFinder,
  onNavigate,
}: {
  node: FileNode;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenInFinder: () => void;
  onNavigate: () => void;
}) {
  const safetyColor = getSafetyColor(node.safety_level);
  const categoryColor = getCategoryColor(node.file_type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={`group flex items-center gap-3 px-4 py-2.5 border-b border-bg-tertiary hover:bg-bg-secondary transition-colors cursor-default ${
        isSelected ? 'bg-accent-primary/5' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="w-8 flex items-center justify-center shrink-0"
      >
        {isSelected ? (
          <CheckSquare size={18} weight="duotone" className="text-accent-primary" />
        ) : (
          <Square size={18} className="text-text-muted group-hover:text-text-secondary transition-colors" />
        )}
      </button>

      {/* Name */}
      <button
        onClick={node.is_dir ? onNavigate : undefined}
        className="flex-1 min-w-0 flex flex-col justify-center text-left"
      >
        <div className="flex items-center gap-2">
          {node.is_dir ? (
            <Folder size={16} weight="duotone" className="text-accent-secondary shrink-0" />
          ) : (
            <File size={16} weight="duotone" className="text-text-muted shrink-0" />
          )}
          <span className={`text-sm truncate ${node.is_dir ? 'text-text-primary font-medium hover:text-accent-primary transition-colors' : 'text-text-secondary'}`}>
            {node.name}
          </span>
          {node.is_dir && node.children && (
            <span className="text-xs text-text-muted shrink-0">
              {node.children.length} items
            </span>
          )}
        </div>
        <div className="pl-6 flex items-center gap-2">
          <span className="text-[10px] text-text-muted truncate mt-0.5">
            {getDiskLabel(node.path)} — {shortenPath(node.path)}
          </span>
        </div>
      </button>

      {/* Size */}
      <span className="w-24 text-right text-sm text-text-secondary tabular-nums">
        {formatBytes(node.size)}
      </span>

      {/* Category */}
      <span className="w-28">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-xs font-medium"
          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
          {node.file_type}
        </span>
      </span>

      {/* Safety */}
      <span className="w-20">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: safetyColor }}
          title={node.safety_level}
        />
      </span>

      {/* Modified */}
      <span className="w-28 text-right text-xs text-text-muted tabular-nums">
        {node.last_modified ? formatRelativeTime(node.last_modified) : '—'}
      </span>

      {/* Actions */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpenInFinder(); }}
        className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary"
        title="Open in Finder"
      >
        <ArrowSquareOut size={14} />
      </button>
    </motion.div>
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
