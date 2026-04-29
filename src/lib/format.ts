export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const decimals = i >= 3 ? 2 : i >= 1 ? 1 : 0;
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${units[i]}`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export function formatPercent(used: number, total: number): string {
  if (total === 0) return '0%';
  const pct = (used / total) * 100;
  return pct >= 10 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    System: '#ef4444',
    Application: '#3b82f6',
    Document: '#22c55e',
    Media: '#f59e0b',
    Code: '#8b5cf6',
    DevCache: '#ec4899',
    Cache: '#6366f1',
    Log: '#64748b',
    Archive: '#14b8a6',
    Trash: '#78716c',
    Other: '#475569',
  };
  return colors[category] || '#475569';
}

export function getSafetyColor(level: string): string {
  switch (level) {
    case 'Safe': return '#22c55e';
    case 'Review': return '#f59e0b';
    case 'Caution': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function getSafetyEmoji(level: string): string {
  switch (level) {
    case 'Safe': return '🟢';
    case 'Review': return '🟡';
    case 'Caution': return '🔴';
    default: return '⚪';
  }
}
