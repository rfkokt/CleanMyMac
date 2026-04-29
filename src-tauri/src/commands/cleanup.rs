use crate::models::{CleanupError, CleanupResult};
use tauri::Emitter;

/// System paths that must NEVER be deleted (matched by filename)
const PROTECTED_NAMES: &[&str] = &[
    ".Trash",
    ".Trashes",
    ".Spotlight-V100",
    ".fseventsd",
    ".DocumentRevisions-V100",
    ".vol",
    ".TemporaryItems",
];

/// Check if a path is protected (system folder that should never be deleted)
fn is_protected(path: &std::path::Path) -> bool {
    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
        // Always block these system dirs regardless of where they are
        if PROTECTED_NAMES.contains(&name) {
            return true;
        }
    }
    // Never delete top-level dirs on root or volumes
    if let Some(parent) = path.parent() {
        let parent_str = parent.to_string_lossy();
        if parent_str == "/" || parent_str == "/Volumes" {
            return true;
        }
        // Protect direct children of /Users (i.e. entire user home dirs)
        if parent_str == "/Users" {
            return true;
        }
        // Protect ~/Library and ~/Applications themselves (but NOT their contents)
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if (name == "Library" || name == "Applications" || name == "Desktop" || name == "Documents" || name == "Downloads") {
                // Only protect if this is a direct child of a user's home dir
                if parent_str.starts_with("/Users/") && parent_str.matches('/').count() == 2 {
                    return true;
                }
            }
        }
    }
    false
}

#[tauri::command]
pub async fn cleanup_items(
    app: tauri::AppHandle,
    paths: Vec<String>,
    permanent: bool,
) -> Result<CleanupResult, String> {
    let total = paths.len() as u64;
    let mut freed_bytes: u64 = 0;
    let mut items_deleted: u64 = 0;
    let mut failed_items: Vec<CleanupError> = Vec::new();

    for (i, path_str) in paths.iter().enumerate() {
        let path = std::path::Path::new(path_str);

        // Skip protected system paths
        if is_protected(path) {
            failed_items.push(CleanupError {
                path: path_str.clone(),
                reason: "Protected system path — skipped".to_string(),
            });
            // Still emit progress
            if i % 100 == 0 || i == paths.len() - 1 {
                let _ = app.emit(
                    "cleanup://progress",
                    serde_json::json!({ "completed": i as u64 + 1, "total": total }),
                );
            }
            continue;
        }

        // Calculate size before deletion
        let size = if path.is_dir() {
            dir_size(path)
        } else {
            std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        };

        let delete_result = if permanent {
            if path.is_dir() {
                std::fs::remove_dir_all(path).map_err(|e| e.to_string())
            } else {
                std::fs::remove_file(path).map_err(|e| e.to_string())
            }
        } else {
            trash::delete(path).map_err(|e| e.to_string())
        };

        match delete_result {
            Ok(()) => {
                freed_bytes += size;
                items_deleted += 1;
            }
            Err(e) => {
                failed_items.push(CleanupError {
                    path: path_str.clone(),
                    reason: e,
                });
            }
        }

        // Emit progress only every 100 items or on the last item to prevent IPC freezing
        if i % 100 == 0 || i == paths.len() - 1 {
            let _ = app.emit(
                "cleanup://progress",
                serde_json::json!({
                    "completed": i as u64 + 1,
                    "total": total,
                }),
            );
        }
    }

    Ok(CleanupResult {
        freed_bytes,
        items_deleted,
        failed_items,
    })
}

fn dir_size(path: &std::path::Path) -> u64 {
    jwalk::WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}
