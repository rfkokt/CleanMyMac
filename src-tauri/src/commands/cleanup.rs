use crate::models::{CleanupError, CleanupResult};
use tauri::Emitter;

#[tauri::command]
pub async fn cleanup_items(
    app: tauri::AppHandle,
    paths: Vec<String>,
) -> Result<CleanupResult, String> {
    let total = paths.len() as u64;
    let mut freed_bytes: u64 = 0;
    let mut items_deleted: u64 = 0;
    let mut failed_items: Vec<CleanupError> = Vec::new();

    for (i, path_str) in paths.iter().enumerate() {
        let path = std::path::Path::new(path_str);

        // Calculate size before deletion
        let size = if path.is_dir() {
            dir_size(path)
        } else {
            std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        };

        // Move to trash (never permanent delete)
        match trash::delete(path) {
            Ok(()) => {
                freed_bytes += size;
                items_deleted += 1;
            }
            Err(e) => {
                failed_items.push(CleanupError {
                    path: path_str.clone(),
                    reason: e.to_string(),
                });
            }
        }

        // Emit progress
        let _ = app.emit(
            "cleanup://progress",
            serde_json::json!({
                "completed": i as u64 + 1,
                "total": total,
            }),
        );
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
