import { motion } from 'framer-motion';
import { CaretRight, House } from '@phosphor-icons/react';
import type { FileNode } from '../../types';

interface BreadcrumbsProps {
  path: FileNode[];
  onNavigate: (index: number) => void;
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  if (path.length <= 1) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-sm overflow-x-auto pb-1"
    >
      {path.map((node, i) => {
        const isLast = i === path.length - 1;
        const isFirst = i === 0;

        return (
          <div key={node.path} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <CaretRight size={12} className="text-text-muted" />
            )}
            <button
              onClick={() => onNavigate(i)}
              disabled={isLast}
              className={`px-2 py-1 rounded-none transition-colors ${
                isLast
                  ? 'text-text-primary font-medium cursor-default'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              {isFirst ? (
                <House size={14} weight="duotone" />
              ) : (
                <span className="text-xs">{node.name}</span>
              )}
            </button>
          </div>
        );
      })}
    </motion.nav>
  );
}
