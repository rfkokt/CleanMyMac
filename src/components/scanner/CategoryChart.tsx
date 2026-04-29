import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatBytes, getCategoryColor } from '../../lib/format';

interface CategoryChartProps {
  categories: Record<string, number>;
  totalSize: number;
  onCategoryClick?: (category: string) => void;
}

export function CategoryChart({ categories, totalSize, onCategoryClick }: CategoryChartProps) {
  const sortedCategories = useMemo(() => {
    return Object.entries(categories)
      .filter(([, size]) => size > 0)
      .sort(([, a], [, b]) => b - a);
  }, [categories]);

  // Calculate angles for donut chart
  const chartData = useMemo(() => {
    let currentAngle = 0;
    return sortedCategories.map(([category, size]) => {
      const percentage = (size / totalSize) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        category,
        size,
        percentage,
        startAngle,
        endAngle: currentAngle,
        color: getCategoryColor(category),
      };
    });
  }, [sortedCategories, totalSize]);

  const radius = 80;
  const innerRadius = 55;
  const center = 100;

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-5">Storage Breakdown</h3>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative shrink-0">
          <svg width={200} height={200} viewBox="0 0 200 200">
            {chartData.map(({ category, startAngle, endAngle, color, percentage }, i) => {
              if (percentage < 0.5) return null; // Skip tiny slices

              const startRad = ((startAngle - 90) * Math.PI) / 180;
              const endRad = ((endAngle - 90) * Math.PI) / 180;

              const x1 = center + radius * Math.cos(startRad);
              const y1 = center + radius * Math.sin(startRad);
              const x2 = center + radius * Math.cos(endRad);
              const y2 = center + radius * Math.sin(endRad);

              const ix1 = center + innerRadius * Math.cos(startRad);
              const iy1 = center + innerRadius * Math.sin(startRad);
              const ix2 = center + innerRadius * Math.cos(endRad);
              const iy2 = center + innerRadius * Math.sin(endRad);

              const largeArc = endAngle - startAngle > 180 ? 1 : 0;

              const d = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${ix2} ${iy2}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
                'Z',
              ].join(' ');

              return (
                <motion.path
                  key={category}
                  d={d}
                  fill={color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => onCategoryClick?.(category)}
                >
                  <title>{category}: {formatBytes(chartData[i].size)}</title>
                </motion.path>
              );
            })}

            {/* Center text */}
            <text x={center} y={center - 5} textAnchor="middle" className="fill-text-primary text-lg font-bold">
              {formatBytes(totalSize)}
            </text>
            <text x={center} y={center + 14} textAnchor="middle" className="fill-text-muted text-[10px]">
              Total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {chartData.slice(0, 8).map(({ category, size, percentage, color }, i) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              onClick={() => onCategoryClick?.(category)}
              className="w-full flex items-center gap-3 group hover:bg-white/[0.03] -mx-2 px-2 py-1 rounded-lg transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors flex-1 text-left">
                {category}
              </span>
              <span className="text-xs text-text-muted tabular-nums">
                {formatBytes(size)}
              </span>
              <span className="text-xs text-text-muted tabular-nums w-10 text-right">
                {percentage.toFixed(1)}%
              </span>
            </motion.button>
          ))}
          {chartData.length > 8 && (
            <p className="text-xs text-text-muted pl-6">
              + {chartData.length - 8} more categories
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
