use crate::models::{FileNode, ScanProgress, ScanResult};
use crate::scanner::categorizer::categorize_path;
use crate::scanner::rules::assess_safety;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};
use tauri::Emitter;

/// Directories to skip during scanning (system/virtual dirs that cause hangs)
const SKIP_DIRS: &[&str] = &[
    ".Spotlight-V100",
    ".fseventsd",
    ".Trashes",
    ".DocumentRevisions-V100",
    ".vol",
    "System",
    ".TemporaryItems",
    "private/var/db",
    "private/var/folders",
];

/// Throttle interval — sleep this long every N files to let macOS I/O breathe
const THROTTLE_SLEEP: Duration = Duration::from_millis(1);
/// How many files to process between throttle sleeps
const THROTTLE_BATCH: u64 = 500;

/// Set current thread to background I/O + CPU priority on macOS.
/// This tells the kernel to deprioritize this thread's disk access,
/// similar to how Time Machine and Spotlight work in the background.
fn throttle_current_thread() {
    extern "C" {
        fn setiopolicy_np(iotype: i32, scope: i32, policy: i32) -> i32;
    }
    unsafe {
        // macOS: set I/O policy to THROTTLE for this thread
        // IOPOL_TYPE_DISK = 0, IOPOL_SCOPE_THREAD = 1, IOPOL_THROTTLE = 3
        setiopolicy_np(0, 1, 3);

        // Lower CPU priority (nice value 10 = low priority)
        libc::nice(10);
    }
}

#[tauri::command]
pub async fn start_scan(
    app: tauri::AppHandle,
    path: String,
    max_depth: Option<u32>,
) -> Result<ScanResult, String> {
    let start = Instant::now();
    let root_path = std::path::Path::new(&path).to_path_buf();

    if !root_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    if !root_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let depth = max_depth.unwrap_or(u32::MAX);

    // Run the scan in a blocking thread so it doesn't starve the async runtime
    let result = tokio::task::spawn_blocking(move || {
        // Apply macOS I/O throttling to this thread
        throttle_current_thread();

        let mut file_count: u64 = 0;
        let mut dir_count: u64 = 0;
        let mut categories: HashMap<String, u64> = HashMap::new();
        let scanned = AtomicU64::new(0);

        let root = scan_directory(
            &root_path,
            depth,
            &app,
            &mut file_count,
            &mut dir_count,
            &mut categories,
            &scanned,
        );

        let duration = start.elapsed().as_millis() as u64;
        let total_size = root.size;

        ScanResult {
            root,
            total_size,
            file_count,
            dir_count,
            scan_duration_ms: duration,
            categories,
        }
    })
    .await
    .map_err(|e| format!("Scan task failed: {}", e))?;

    Ok(result)
}

/// Check if a directory name should be skipped
fn should_skip(name: &str) -> bool {
    SKIP_DIRS.iter().any(|s| name == *s)
}

fn scan_directory(
    path: &std::path::Path,
    max_depth: u32,
    app: &tauri::AppHandle,
    file_count: &mut u64,
    dir_count: &mut u64,
    categories: &mut HashMap<String, u64>,
    scanned: &AtomicU64,
) -> FileNode {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());

    let category = categorize_path(path, &name);
    let safety = assess_safety(path, &category);

    let mut children = Vec::new();
    let mut total_size: u64 = 0;

    if max_depth > 0 {
        match std::fs::read_dir(path) {
            Ok(entries) => {
                for entry in entries.flatten() {
                    let entry_path = entry.path();
                    let entry_name = entry
                        .file_name()
                        .to_string_lossy()
                        .to_string();

                    // Skip system directories that cause hangs or are useless
                    if should_skip(&entry_name) {
                        continue;
                    }

                    if let Ok(metadata) = entry.metadata() {
                        if metadata.is_dir() {
                            *dir_count += 1;
                            let child = scan_directory(
                                &entry_path,
                                max_depth - 1,
                                app,
                                file_count,
                                dir_count,
                                categories,
                                scanned,
                            );
                            total_size += child.size;
                            children.push(child);
                        } else {
                            *file_count += 1;
                            let file_size = metadata.len();
                            total_size += file_size;

                            let file_cat = categorize_path(&entry_path, &entry_name);
                            let file_safety = assess_safety(&entry_path, &file_cat);

                            let cat_key = file_cat.to_string();
                            *categories.entry(cat_key).or_insert(0) += file_size;

                            let last_modified = metadata
                                .modified()
                                .ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs() as i64);

                            children.push(FileNode {
                                name: entry_name,
                                path: entry_path.to_string_lossy().to_string(),
                                size: file_size,
                                is_dir: false,
                                file_type: file_cat,
                                children: None,
                                last_accessed: None,
                                last_modified,
                                safety_level: file_safety,
                            });
                        }
                    }

                    let count = scanned.fetch_add(1, Ordering::Relaxed);

                    // Emit progress + throttle every THROTTLE_BATCH files
                    if count % THROTTLE_BATCH == 0 {
                        let _ = app.emit(
                            "scan://progress",
                            ScanProgress {
                                scanned: count,
                                current_path: entry_path.to_string_lossy().to_string(),
                                estimated_total: None,
                            },
                        );

                        // Sleep to let macOS I/O scheduler serve other processes
                        std::thread::sleep(THROTTLE_SLEEP);
                    }
                }
            }
            Err(e) => {
                log::warn!("Skipping inaccessible directory: {} ({})", path.display(), e);
            }
        }
    }

    // Sort children by size descending
    children.sort_by(|a, b| b.size.cmp(&a.size));

    let dir_cat_key = category.to_string();
    *categories.entry(dir_cat_key).or_insert(0) += total_size;

    let last_modified = std::fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);

    FileNode {
        name,
        path: path.to_string_lossy().to_string(),
        size: total_size,
        is_dir: true,
        file_type: category,
        children: Some(children),
        last_accessed: None,
        last_modified,
        safety_level: safety,
    }
}

#[tauri::command]
pub async fn find_large_files(
    path: String,
    min_size_bytes: u64,
) -> Result<Vec<FileNode>, String> {
    let root_path = std::path::Path::new(&path).to_path_buf();
    if !root_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    // Run in blocking thread to prevent async runtime starvation
    let large_files = tokio::task::spawn_blocking(move || {
        throttle_current_thread();
        let mut results = Vec::new();

        for entry in jwalk::WalkDir::new(&root_path)
            .skip_hidden(false)
            .parallelism(jwalk::Parallelism::RayonNewPool(2)) // Limit to 2 threads
            .into_iter()
            .filter_map(|e| e.ok())
        {
            // Skip system directories
            if let Some(name) = entry.path().file_name() {
                if should_skip(&name.to_string_lossy()) {
                    continue;
                }
            }

            if entry.file_type().is_file() {
                if let Ok(metadata) = entry.metadata() {
                    let size = metadata.len();
                    if size >= min_size_bytes {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let entry_path = entry.path();
                        let category = categorize_path(&entry_path, &name);
                        let safety = assess_safety(&entry_path, &category);

                        let last_modified = metadata
                            .modified()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs() as i64);

                        results.push(FileNode {
                            name,
                            path: entry_path.to_string_lossy().to_string(),
                            size,
                            is_dir: false,
                            file_type: category,
                            children: None,
                            last_accessed: None,
                            last_modified,
                            safety_level: safety,
                        });
                    }
                }
            }
        }

        results.sort_by(|a, b| b.size.cmp(&a.size));
        results
    })
    .await
    .map_err(|e| format!("Large files scan failed: {}", e))?;

    Ok(large_files)
}

#[tauri::command]
pub async fn open_in_finder(path: String) -> Result<(), String> {
    std::process::Command::new("open")
        .args(["-R", &path])
        .spawn()
        .map_err(|e| format!("Failed to open Finder: {}", e))?;
    Ok(())
}
