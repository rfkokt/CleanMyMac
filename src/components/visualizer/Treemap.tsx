import { useMemo, useCallback } from 'react';
import { ResponsiveTreeMap } from '@nivo/treemap';
import type { FileNode } from '../../types';
import { getCategoryColor } from '../../lib/format';

interface TreemapProps {
  data: FileNode;
  onDrillDown: (node: FileNode) => void;
  onContextMenu?: (node: FileNode, event: React.MouseEvent) => void;
}

interface NivoNode {
  name: string;
  path: string;
  fileType: string;
  safetyLevel: string;
  size?: number;
  children?: NivoNode[];
}

// Vibrant color palette for treemap blocks
const CATEGORY_COLORS: Record<string, string> = {
  Cache: '#0EA5E9',
  Logs: '#8B5CF6',
  Trash: '#E11D48',
  Downloads: '#F59E0B',
  Applications: '#10B981',
  Documents: '#3B82F6',
  Media: '#EC4899',
  Archives: '#F97316',
  DevCache: '#06B6D4',
  NodeModules: '#22D3EE',
  XcodeDerivedData: '#A78BFA',
  CocoaPods: '#FB923C',
  Other: '#64748B',
};

function getBlockColor(fileType: string): string {
  return CATEGORY_COLORS[fileType] || CATEGORY_COLORS['Other'];
}

export function Treemap({ data, onDrillDown }: TreemapProps) {
  // Transform FileNode data to nivo-compatible format
  const nivoData = useMemo(() => transformToNivo(data), [data]);

  const getColor = useCallback((node: any) => {
    return getBlockColor(node.data?.fileType || 'Other');
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden">
      <ResponsiveTreeMap
        data={nivoData}
        identity="name"
        value="size"
        valueFormat={(v) => formatSize(v)}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        labelSkipSize={50}
        label={(node) => {
          const name = node.id as string;
          return name.length > 16 ? name.slice(0, 14) + '…' : name;
        }}
        labelTextColor="#ffffff"
        parentLabelPosition="left"
        parentLabelTextColor="#ffffffcc"
        parentLabelSize={18}
        colors={getColor}
        borderColor="#0A0D1580"
        borderWidth={2}
        nodeOpacity={0.85}
        animate={true}
        motionConfig="gentle"
        onClick={(node) => {
          if ((node.data as any).children) {
            onDrillDown(fileNodeFromNivo(node.data as NivoNode));
          }
        }}
        tooltip={({ node }) => (
          <div className="px-4 py-3 rounded-2xl glass border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <p className="text-sm font-semibold text-white truncate">{node.id}</p>
            </div>
            <p className="text-xs text-white/60">
              {formatSize(node.value)} · {(node.data as any)?.fileType || 'Unknown'}
            </p>
            {(node.data as any)?.children && (
              <p className="text-[10px] text-white/40 mt-1">Click to explore →</p>
            )}
          </div>
        )}
        theme={{
          labels: {
            text: {
              fontSize: 11,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 600,
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            },
          },
        }}
      />
    </div>
  );
}

function transformToNivo(node: FileNode, maxDepth: number = 2): NivoNode {
  if (maxDepth > 0 && node.children && node.children.length > 0) {
    // Filter very small children to avoid visual clutter
    const significantChildren = node.children
      .filter((c) => c.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 40); // Limit for performance

    return {
      name: node.name,
      path: node.path,
      fileType: node.file_type,
      safetyLevel: node.safety_level,
      children: significantChildren.map(c => transformToNivo(c, maxDepth - 1)),
    };
  }

  return {
    name: node.name,
    path: node.path,
    fileType: node.file_type,
    safetyLevel: node.safety_level,
    size: node.size,
  };
}

function fileNodeFromNivo(nivo: NivoNode): FileNode {
  return {
    name: nivo.name,
    path: nivo.path,
    size: nivo.size || 0,
    is_dir: !!nivo.children,
    file_type: nivo.fileType as any,
    safety_level: nivo.safetyLevel as any,
    children: nivo.children?.map(fileNodeFromNivo),
  };
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const decimals = i >= 3 ? 2 : i >= 1 ? 1 : 0;
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${units[i]}`;
}
