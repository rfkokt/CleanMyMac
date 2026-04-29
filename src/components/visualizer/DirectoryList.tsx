import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, 
  File, 
  CaretRight,
  WarningCircle,
  CheckCircle,
  FileText,
  Image,
  Archive,
  TerminalWindow
} from '@phosphor-icons/react';
import type { FileNode } from '../../types';
import { formatBytes } from '../../lib/format';

interface DirectoryListProps {
  data: FileNode;
  onDrillDown: (node: FileNode) => void;
}

export function DirectoryList({ data, onDrillDown }: DirectoryListProps) {
  // Sort children by size (descending)
  const children = useMemo(() => {
    if (!data.children) return [];
    return [...data.children].sort((a, b) => b.size - a.size);
  }, [data]);

  if (children.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/40">
        <Folder size={48} weight="duotone" className="mb-4 opacity-50" />
        <p>Empty Directory</p>
      </div>
    );
  }

  // Find max size to calculate progress bar widths
  const maxSize = children.length > 0 ? children[0].size : 0;

  const getFileIcon = (node: FileNode) => {
    if (node.is_dir) return <Folder size={20} weight="fill" className="text-[#00F0FF]" />;
    
    switch (node.file_type) {
      case 'Document': return <FileText size={20} weight="duotone" className="text-blue-400" />;
      case 'Media': return <Image size={20} weight="duotone" className="text-purple-400" />;
      case 'Archive': return <Archive size={20} weight="duotone" className="text-orange-400" />;
      case 'Application': return <TerminalWindow size={20} weight="duotone" className="text-green-400" />;
      case 'SystemJunk': return <WarningCircle size={20} weight="duotone" className="text-red-400" />;
      default: return <File size={20} weight="duotone" className="text-white/60" />;
    }
  };

  const getSafetyBadge = (level?: string) => {
    if (!level) return null;
    if (level === 'Safe') return <CheckCircle size={14} className="text-[#0D9488]" weight="fill" />;
    if (level === 'Caution') return <WarningCircle size={14} className="text-[#E11D48]" weight="fill" />;
    return <WarningCircle size={14} className="text-[#FF9F0A]" weight="fill" />;
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-2 space-y-1 pr-2">
      {children.map((node, index) => {
        // Calculate relative width. Use a minimum of 1% so tiny files are visible
        const widthPercent = maxSize > 0 ? Math.max((node.size / maxSize) * 100, 1) : 0;
        
        return (
          <motion.div
            key={node.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.5) }} // Cap delay
            onClick={() => node.is_dir && onDrillDown(node)}
            className={`group relative flex items-center justify-between p-3 rounded-2xl transition-colors ${
              node.is_dir ? 'hover:bg-white/5 cursor-pointer' : 'hover:bg-white/[0.02]'
            }`}
          >
            {/* Background Size Bar (behind content) */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#0D9488]/20 to-[#00F0FF]/10 rounded-2xl pointer-events-none transition-all duration-500 ease-out border-y border-r border-[#00F0FF]/10 shadow-[2px_0_10px_rgba(0,240,255,0.05)]"
              style={{ width: `${widthPercent}%` }}
            />
            
            {/* Left side: Icon + Name */}
            <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0 pr-4">
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 border border-white/5 shadow-inner">
                {getFileIcon(node)}
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {node.name}
                  </span>
                  {getSafetyBadge(node.safety_level)}
                </div>
                {node.file_type && (
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">
                    {node.file_type}
                  </span>
                )}
              </div>
            </div>
            
            {/* Right side: Size + Arrow */}
            <div className="flex items-center gap-4 relative z-10 shrink-0">
              <span className="text-sm font-semibold text-white/80 tabular-nums tracking-tight">
                {formatBytes(node.size)}
              </span>
              
              <div className="w-5 flex justify-end">
                {node.is_dir ? (
                  <CaretRight 
                    size={16} 
                    weight="bold" 
                    className="text-white/20 group-hover:text-white/60 transition-colors transform group-hover:translate-x-1" 
                  />
                ) : (
                  <div className="w-4" /> // placeholder
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
