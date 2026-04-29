use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::file_node::FileNode;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub root: FileNode,
    pub total_size: u64,
    pub file_count: u64,
    pub dir_count: u64,
    pub scan_duration_ms: u64,
    pub categories: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub scanned: u64,
    pub current_path: String,
    pub estimated_total: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub total_capacity: u64,
    pub available_space: u64,
    pub used_space: u64,
    pub purgeable_space: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
    pub freed_bytes: u64,
    pub items_deleted: u64,
    pub failed_items: Vec<CleanupError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupError {
    pub path: String,
    pub reason: String,
}
