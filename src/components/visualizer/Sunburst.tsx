import { useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileNode } from '../../types';
import { formatBytes } from '../../lib/format';

interface SunburstProps {
  data: FileNode;
  onDrillDown: (node: FileNode) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  System: '#6366F1',
  Application: '#10B981',
  Document: '#3B82F6',
  Media: '#EC4899',
  Code: '#8B5CF6',
  DevCache: '#06B6D4',
  Cache: '#F59E0B',
  Log: '#F97316',
  Archive: '#EF4444',
  Trash: '#E11D48',
  Other: '#64748B',
};

const RING_COLORS = ['#1E293B', '#334155', '#475569', '#64748B'];

interface ArcData {
  node: FileNode;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  depth: number;
  color: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.999) {
    return [
      `M ${cx - outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}`,
      `Z`,
      `M ${cx - innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
      `Z`,
    ].join(' ');
  }

  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function buildArcs(node: FileNode, cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number, depth: number, maxDepth: number): ArcData[] {
  const arcs: ArcData[] = [];
  const angleRange = endAngle - startAngle;

  const color = node.is_dir
    ? RING_COLORS[Math.min(depth, RING_COLORS.length - 1)]
    : CATEGORY_COLORS[node.file_type || 'Other'] || CATEGORY_COLORS['Other'];

  arcs.push({
    node,
    startAngle,
    endAngle,
    innerRadius: innerR,
    outerRadius: outerR,
    depth,
    color,
  });

  if (depth < maxDepth && node.children && node.children.length > 0) {
    const significant = node.children
      .filter((c) => c.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 30);

    const totalSize = significant.reduce((sum, c) => sum + c.size, 0);
    if (totalSize === 0) return arcs;

    const ringWidth = (outerR - innerR) * 0.85;
    const nextInnerR = outerR - ringWidth;
    const gap = 0.5;

    let currentAngle = startAngle;
    for (const child of significant) {
      const childAngle = (child.size / totalSize) * angleRange;
      const childEnd = Math.min(currentAngle + childAngle - gap, endAngle);
      if (childEnd > currentAngle + 2) {
        arcs.push(...buildArcs(child, cx, cy, nextInnerR, outerR - ringWidth + (outerR - nextInnerR) * 0.15, currentAngle, childEnd, depth + 1, maxDepth));
      }
      currentAngle = childEnd + gap;
    }
  }

  return arcs;
}

export function Sunburst({ data, onDrillDown }: SunburstProps) {
  const [hoveredNode, setHoveredNode] = useState<FileNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 20;

  const arcs = useMemo(() => {
    return buildArcs(data, cx, cy, 40, maxRadius, 0, 360, 0, 4);
  }, [data, cx, cy, maxRadius]);

  const handleClick = useCallback((arc: ArcData) => {
    if (arc.node.is_dir && arc.node.children && arc.node.children.length > 0) {
      onDrillDown(arc.node);
    }
  }, [onDrillDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent, node: FileNode) => {
    setHoveredNode(node);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const centerNode = data;
  const centerSize = formatBytes(centerNode.size);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full max-w-[560px] max-h-[560px]"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx={cx} cy={cy} r={maxRadius} fill="#0F172A" opacity="0.5" />

        {/* Arcs */}
        {arcs.map((arc, i) => {
          const isHovered = hoveredNode?.path === arc.node.path;
          const isParent = hoveredNode && arc.node.path && hoveredNode.path.startsWith(arc.node.path + '/');
          const opacity = hoveredNode ? (isHovered || isParent ? 1 : 0.3) : 0.85;

          return (
            <motion.path
              key={`${arc.node.path}-${i}`}
              d={describeArc(cx, cy, arc.innerRadius, arc.outerRadius, arc.startAngle, arc.endAngle)}
              fill={arc.color}
              opacity={opacity}
              stroke="#0A0D15"
              strokeWidth={1.5}
              className="cursor-pointer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity, scale: 1 }}
              transition={{ delay: i * 0.01, duration: 0.3 }}
              whileHover={{ opacity: 1, scale: 1.02 }}
              onClick={() => handleClick(arc)}
              onMouseMove={(e) => handleMouseMove(e, arc.node)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Center circle */}
        <g className="pointer-events-none">
          <circle cx={cx} cy={cy} r={38} fill="#0F172A" stroke="#1E293B" strokeWidth={2} />
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
            {centerNode.name.length > 12 ? centerNode.name.slice(0, 11) + '…' : centerNode.name}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">
            {centerSize}
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="fixed z-50 px-4 py-3 rounded-xl glass border border-white/10 shadow-2xl backdrop-blur-xl bg-black/70 pointer-events-none max-w-[240px]"
            style={{
              left: Math.min(tooltipPos.x + 16, window.innerWidth - 260),
              top: tooltipPos.y - 12,
            }}
          >
            <p className="text-sm font-semibold text-white truncate">{hoveredNode.name}</p>
            <p className="text-xs text-white/60 mt-1">{formatBytes(hoveredNode.size)}</p>
            {hoveredNode.is_dir && hoveredNode.children && (
              <p className="text-[10px] text-teal-400 mt-2 font-medium">
                {hoveredNode.children.length} items · Click to explore
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 text-[10px] text-white/50">
        {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
