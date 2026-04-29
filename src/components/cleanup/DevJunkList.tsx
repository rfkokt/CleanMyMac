import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Trash,
  ArrowSquareOut,
  CheckSquare,
  Square,
  CaretDown,
  CaretRight,
  Package,
  HardDrive,
  Database,
  Cube,
  Coffee,
} from '@phosphor-icons/react';
import type { DevJunkItem, DevJunkType } from '../../types';
import { formatBytes, formatRelativeTime, getSafetyColor } from '../../lib/format';

interface DevJunkListProps {
  groupedByType: Record<string, DevJunkItem[]>;
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onSelectGroup: (paths: string[]) => void;
  onOpenInFinder: (path: string) => void;
}

const JUNK_TYPE_META: Record<string, { label: string; icon: typeof Package; color: string }> = {
  NodeModules: { label: 'node_modules', icon: Package, color: '#22c55e' },
  XcodeDerivedData: { label: 'Xcode DerivedData', icon: Cube, color: '#3b82f6' },
  XcodeArchives: { label: 'Xcode Archives', icon: Cube, color: '#6366f1' },
  XcodeDeviceSupport: { label: 'Xcode Device Support', icon: HardDrive, color: '#8b5cf6' },
  IOSSimulators: { label: 'iOS Simulators', icon: HardDrive, color: '#a855f7' },
  CocoaPodsCache: { label: 'CocoaPods Cache', icon: Coffee, color: '#f97316' },
  SPMCache: { label: 'Swift Package Manager', icon: Package, color: '#ef4444' },
  GradleCache: { label: 'Gradle Cache', icon: Database, color: '#10b981' },
  DockerImages: { label: 'Docker', icon: Cube, color: '#0ea5e9' },
  DockerVolumes: { label: 'Docker Volumes', icon: Database, color: '#06b6d4' },
  GitObjects: { label: '.git Objects', icon: Folder, color: '#64748b' },
  HomebrewCache: { label: 'Homebrew Cache', icon: Coffee, color: '#f59e0b' },
  CargoCache: { label: 'Cargo Cache', icon: Package, color: '#ec4899' },
  PipCache: { label: 'pip Cache', icon: Package, color: '#14b8a6' },
};

export function DevJunkList({
  groupedByType,
  selectedPaths,
  onToggleSelect,
  onSelectGroup,
  onOpenInFinder,
}: DevJunkListProps) {
  return (
    <div className="space-y-3">
      {Object.entries(groupedByType)
        .sort(([, a], [, b]) => {
          const sizeA = a.reduce((s, i) => s + i.size, 0);
          const sizeB = b.reduce((s, i) => s + i.size, 0);
          return sizeB - sizeA;
        })
        .map(([type, items]) => (
          <DevJunkGroup
            key={type}
            type={type as DevJunkType}
            items={items}
            selectedPaths={selectedPaths}
            onToggleSelect={onToggleSelect}
            onSelectGroup={onSelectGroup}
            onOpenInFinder={onOpenInFinder}
          />
        ))}
    </div>
  );
}

function DevJunkGroup({
  type,
  items,
  selectedPaths,
  onToggleSelect,
  onSelectGroup,
  onOpenInFinder,
}: {
  type: DevJunkType;
  items: DevJunkItem[];
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onSelectGroup: (paths: string[]) => void;
  onOpenInFinder: (path: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = JUNK_TYPE_META[type] || { label: type, icon: Folder, color: '#64748b' };
  const Icon = meta.icon;
  const totalSize = items.reduce((s, i) => s + i.size, 0);
  const allSelected = items.every((i) => selectedPaths.has(i.path));
  const someSelected = items.some((i) => selectedPaths.has(i.path));

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      items.forEach((i) => {
        if (selectedPaths.has(i.path)) onToggleSelect(i.path);
      });
    } else {
      onSelectGroup(items.map((i) => i.path));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${meta.color}15` }}>
          <Icon size={20} weight="duotone" style={{ color: meta.color }} />
        </div>

        <div className="flex-1 text-left min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{meta.label}</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'} • {formatBytes(totalSize)}
          </p>
        </div>

        <span className="text-lg font-bold tabular-nums" style={{ color: meta.color }}>
          {formatBytes(totalSize)}
        </span>

        {isExpanded ? (
          <CaretDown size={16} className="text-text-muted shrink-0" />
        ) : (
          <CaretRight size={16} className="text-text-muted shrink-0" />
        )}
      </button>

      {/* Expanded items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            {/* Select all / batch action */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02]">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {allSelected ? (
                  <CheckSquare size={14} weight="duotone" className="text-accent-primary" />
                ) : (
                  <Square size={14} />
                )}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Individual items */}
            {items.map((item) => (
              <div
                key={item.path}
                className="group flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <button
                  onClick={() => onToggleSelect(item.path)}
                  className="shrink-0"
                >
                  {selectedPaths.has(item.path) ? (
                    <CheckSquare size={16} weight="duotone" className="text-accent-primary" />
                  ) : (
                    <Square size={16} className="text-text-muted" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary truncate">
                    {item.project_name ? (
                      <>
                        <span className="text-text-primary font-medium">{item.project_name}</span>
                        <span className="text-text-muted"> / {type === 'NodeModules' ? 'node_modules' : item.path.split('/').pop()}</span>
                      </>
                    ) : (
                      item.path.replace(/^\/Users\/[^/]+\//, '~/')
                    )}
                  </p>
                  {item.last_modified && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Last modified {formatRelativeTime(item.last_modified)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getSafetyColor(item.safety_level) }}
                    title={item.safety_level}
                  />
                  <span className="text-sm text-text-muted tabular-nums w-20 text-right">
                    {formatBytes(item.size)}
                  </span>
                  <button
                    onClick={() => onOpenInFinder(item.path)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-all"
                    title="Open in Finder"
                  >
                    <ArrowSquareOut size={14} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
