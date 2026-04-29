import { useMemo, useCallback } from 'react';
import { ResponsiveTreeMap } from '@nivo/treemap';
import type { FileNode } from '../../types';
import { getCategoryColor } from '../../lib/format';
import { TiltCard } from '../ui/TiltCard';

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

export function Treemap({ data, onDrillDown }: TreemapProps) {
  // Transform FileNode data to nivo-compatible format
  const nivoData = useMemo(() => transformToNivo(data), [data]);

  const getColor = useCallback((node: any) => {
    return getCategoryColor(node.data?.fileType || 'Other');
  }, []);

  return (
    <TiltCard className="w-full h-full min-h-[400px] shadow-2xl rounded-none border border-bg-tertiary">
      <div className="w-full h-full">
      <ResponsiveTreeMap
        data={nivoData}
        identity="name"
        value="size"
        valueFormat={(v) => formatSize(v)}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        labelSkipSize={40}
        label={(node) => {
          const name = node.id as string;
          return name.length > 20 ? name.slice(0, 18) + '…' : name;
        }}
        labelTextColor={{ from: 'color', modifiers: [['brighter', 3]] }}
        parentLabelPosition="left"
        parentLabelTextColor={{ from: 'color', modifiers: [['brighter', 2]] }}
        colors={getColor}
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        borderWidth={1}
        nodeOpacity={1}
        animate={false}
        motionConfig="gentle"
        onClick={(node) => {
          if ((node.data as any).children) {
            onDrillDown(fileNodeFromNivo(node.data as NivoNode));
          }
        }}
        tooltip={({ node }) => (
          <div className="px-3 py-2 rounded-none bg-bg-secondary border border-bg-tertiary shadow-xl">
            <p className="text-sm font-medium text-text-primary">{node.id}</p>
            <p className="text-xs text-text-secondary mt-1">
              {formatSize(node.value)} • {(node.data as any)?.fileType || 'Unknown'}
            </p>
          </div>
        )}
        theme={{
          labels: {
            text: {
              fontSize: 11,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 600,
            },
          },
        }}
      />
      </div>
    </TiltCard>
  );
}

function transformToNivo(node: FileNode, maxDepth: number = 2): NivoNode {
  if (maxDepth > 0 && node.children && node.children.length > 0) {
    // Filter very small children to avoid visual clutter
    const significantChildren = node.children
      .filter((c) => c.size > 0)
      .slice(0, 30); // Limit to 30 children for performance

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
