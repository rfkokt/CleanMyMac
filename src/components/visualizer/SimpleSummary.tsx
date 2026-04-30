import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartDonut, Folder } from '@phosphor-icons/react';
import { formatBytes, getCategoryColor, getCategoryLabel } from '../../lib/format';
import type { FileNode } from '../../types';

interface SimpleSummaryProps {
  data: FileNode;
  totalSize: number;
}

interface CategoryInfo {
  name: string;
  label: string;
  size: number;
  color: string;
  percentage: number;
}

interface FolderInfo {
  name: string;
  path: string;
  size: number;
  percentage: number;
  isDir: boolean;
}

export function SimpleSummary({ data, totalSize }: SimpleSummaryProps) {
  const [viewMode, setViewMode] = useState<'categories' | 'folders'>('categories');

  const categories = useMemo<CategoryInfo[]>(() => {
    const catMap = new Map<string, number>();
    
    const walk = (node: FileNode) => {
      if (!node.is_dir) {
        const cat = node.file_type || 'Other';
        catMap.set(cat, (catMap.get(cat) || 0) + node.size);
      }
      node.children?.forEach(walk);
    };
    walk(data);

    const base = totalSize > 0 ? totalSize : 1;
    return Array.from(catMap.entries())
      .map(([name, size]) => ({
        name,
        label: getCategoryLabel(name),
        size,
        color: getCategoryColor(name),
        percentage: (size / base) * 100,
      }))
      .filter((c) => c.percentage > 0.5)
      .sort((a, b) => b.size - a.size);
  }, [data, totalSize]);

  const topFolders = useMemo<FolderInfo[]>(() => {
    if (!data.children) return [];
    
    const base = totalSize > 0 ? totalSize : 1;
    return data.children
      .filter((c) => c.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 15)
      .map((folder) => ({
        name: folder.name,
        path: folder.path,
        size: folder.size,
        percentage: (folder.size / base) * 100,
        isDir: folder.is_dir,
      }));
  }, [data, totalSize]);

  // Donut chart calculations
  const chartData = useMemo(() => {
    let currentAngle = -90;
    return categories.map((cat) => {
      const angle = (cat.percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...cat, startAngle, endAngle: currentAngle, angle };
    });
  }, [categories]);

  const radius = 90;
  const innerRadius = 60;
  const center = 120;

  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            viewMode === 'categories'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <ChartDonut size={16} weight="fill" />
          By Category
        </button>
        <button
          onClick={() => setViewMode('folders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            viewMode === 'folders'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <Folder size={16} weight="fill" />
          Top Folders
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'categories' ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col lg:flex-row items-center gap-8"
          >
            {/* Donut Chart */}
            <div className="relative shrink-0">
              <svg width={240} height={240} viewBox="0 0 240 240">
                {chartData.map((cat, i) => (
                  <motion.path
                    key={cat.name}
                    d={describeArc(center, center, radius, cat.startAngle, cat.endAngle)}
                    stroke={cat.color}
                    strokeWidth={radius - innerRadius}
                    fill="none"
                    initial={{ opacity: 0, strokeDasharray: 1000 }}
                    animate={{ opacity: 0.9, strokeDasharray: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                    className="cursor-pointer hover:opacity-100"
                  />
                ))}
                {/* Center */}
                <text x={center} y={center - 8} textAnchor="middle" className="fill-white text-xl font-bold">
                  {formatBytes(totalSize)}
                </text>
                <text x={center} y={center + 14} textAnchor="middle" className="fill-white/50 text-xs">
                  Total Used
                </text>
              </svg>
            </div>

            {/* Category List */}
            <div className="flex-1 space-y-3 max-w-md">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="w-4 h-4 rounded-lg shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-white/80 flex-1">{cat.label}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{formatBytes(cat.size)}</div>
                    <div className="text-xs text-white/40">{cat.percentage.toFixed(1)}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="folders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto space-y-2 pr-2"
          >
            {topFolders.map((folder, i) => (
              <motion.div
                key={folder.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Folder size={16} className="text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{folder.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${folder.percentage}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-white/40 w-10 text-right">{folder.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-white/80 shrink-0">
                  {formatBytes(folder.size)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
