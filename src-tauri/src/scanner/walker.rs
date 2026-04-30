// Walker module — placeholder for advanced parallel scanning
// Currently the scan logic is in commands/scan.rs using std::fs
// This module will be expanded when we implement Phase 2 deep scanning with jwalk

use std::path::Path;

/// Calculate directory size using jwalk for parallel traversal
#[allow(dead_code)]
pub fn calculate_dir_size(path: &Path) -> u64 {
    jwalk::WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}
