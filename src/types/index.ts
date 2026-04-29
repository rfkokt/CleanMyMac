export type FileCategory =
  | 'System' | 'Application' | 'Document' | 'Media'
  | 'Code' | 'DevCache' | 'Cache' | 'Log'
  | 'Archive' | 'Trash' | 'Other';

export type SafetyLevel = 'Safe' | 'Review' | 'Caution';

export interface FileNode {
  name: string;
  path: string;
  size: number;
  is_dir: boolean;
  file_type: FileCategory;
  children?: FileNode[];
  last_accessed?: number;
  last_modified?: number;
  safety_level: SafetyLevel;
}

export interface ScanResult {
  root: FileNode;
  total_size: number;
  file_count: number;
  dir_count: number;
  scan_duration_ms: number;
  categories: Record<string, number>;
}

export interface ScanProgress {
  scanned: number;
  current_path: string;
  estimated_total?: number;
}

export interface DiskInfo {
  total_capacity: number;
  available_space: number;
  used_space: number;
  purgeable_space?: number;
}

export type DevJunkType =
  | 'NodeModules' | 'XcodeDerivedData' | 'XcodeArchives'
  | 'XcodeDeviceSupport' | 'IOSSimulators' | 'CocoaPodsCache'
  | 'SPMCache' | 'GradleCache' | 'DockerImages' | 'DockerVolumes'
  | 'GitObjects' | 'HomebrewCache' | 'CargoCache' | 'PipCache';

export interface DevJunkItem {
  path: string;
  size: number;
  junk_type: DevJunkType;
  project_name?: string;
  last_modified?: number;
  safety_level: SafetyLevel;
}

export interface CleanupResult {
  freed_bytes: number;
  items_deleted: number;
  failed_items: CleanupError[];
}

export interface CleanupError {
  path: string;
  reason: string;
}
