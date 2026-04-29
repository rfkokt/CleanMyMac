import { motion } from 'framer-motion';
import { CaretRight, House } from '@phosphor-icons/react';
import type { FileNode } from '../../types';
import { formatBytes } from '../../lib/format';

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
      className="flex items-center gap-1 text-sm overflow-x-auto pb-1 glass rounded-full px-3 py-1.5 border border-white/10 w-fit"
    >
      {path.map((node, i) => {
        const isLast = i === path.length - 1;
        const isFirst = i === 0;

        return (
          <div key={node.path} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <CaretRight size={10} className="text-white/30" />
            )}
            <button
              onClick={() => onNavigate(i)}
              disabled={isLast}
              className={`px-2 py-0.5 rounded-full transition-all ${
                isLast
                  ? 'text-white font-medium cursor-default bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
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
