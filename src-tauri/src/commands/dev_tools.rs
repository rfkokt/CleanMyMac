use crate::models::{DevJunkItem, DevJunkType, SafetyLevel};

#[tauri::command]
pub async fn scan_dev_junk() -> Result<Vec<DevJunkItem>, String> {
    // Run in blocking thread with I/O throttling
    tokio::task::spawn_blocking(|| {
        // Apply macOS background I/O priority
        extern "C" {
            fn setiopolicy_np(iotype: i32, scope: i32, policy: i32) -> i32;
        }
        unsafe {
            setiopolicy_np(0, 1, 3); // IOPOL_TYPE_DISK, IOPOL_SCOPE_THREAD, IOPOL_THROTTLE
            libc::nice(10);
        }
        scan_dev_junk_inner()
    })
    .await
    .map_err(|e| format!("Dev junk scan failed: {}", e))?
}

fn scan_dev_junk_inner() -> Result<Vec<DevJunkItem>, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let mut items: Vec<DevJunkItem> = Vec::new();

    // ── Fixed-path junk (known locations) ──
    let fixed_paths: Vec<(&str, DevJunkType, SafetyLevel)> = vec![
        ("Library/Developer/Xcode/DerivedData", DevJunkType::XcodeDerivedData, SafetyLevel::Safe),
        ("Library/Developer/Xcode/Archives", DevJunkType::XcodeArchives, SafetyLevel::Review),
        ("Library/Developer/Xcode/iOS DeviceSupport", DevJunkType::XcodeDeviceSupport, SafetyLevel::Safe),
        ("Library/Developer/CoreSimulator/Devices", DevJunkType::IOSSimulators, SafetyLevel::Review),
        ("Library/Caches/CocoaPods", DevJunkType::CocoaPodsCache, SafetyLevel::Safe),
        ("Library/Caches/org.swift.swiftpm", DevJunkType::SPMCache, SafetyLevel::Safe),
        (".gradle/caches", DevJunkType::GradleCache, SafetyLevel::Safe),
        ("Library/Containers/com.docker.docker/Data", DevJunkType::DockerImages, SafetyLevel::Review),
        ("Library/Caches/Homebrew", DevJunkType::HomebrewCache, SafetyLevel::Safe),
        (".cargo/registry/cache", DevJunkType::CargoCache, SafetyLevel::Safe),
        ("Library/Caches/pip", DevJunkType::PipCache, SafetyLevel::Safe),
    ];

    for (rel_path, junk_type, safety) in fixed_paths {
        let full_path = home.join(rel_path);
        if full_path.exists() {
            let size = dir_size_fast(&full_path);
            if size > 0 {
                items.push(DevJunkItem {
                    path: full_path.to_string_lossy().to_string(),
                    size,
                    junk_type,
                    project_name: None,
                    last_modified: get_modified_time(&full_path),
                    safety_level: safety,
                });
            }
        }
    }

    // ── Scan for scattered node_modules ──
    // Scan common project directories for node_modules
    let project_dirs = vec![
        home.join("Projects"),
        home.join("Developer"),
        home.join("Code"),
        home.join("Desktop"),
        home.join("Documents"),
        home.to_path_buf(),
    ];

    for project_dir in project_dirs {
        if project_dir.exists() {
            scan_for_node_modules(&project_dir, &mut items, 4);
        }
    }

    // Sort by size descending
    items.sort_by(|a, b| b.size.cmp(&a.size));
    Ok(items)
}

fn scan_for_node_modules(
    dir: &std::path::Path,
    items: &mut Vec<DevJunkItem>,
    max_depth: u32,
) {
    if max_depth == 0 {
        return;
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden directories and known non-project dirs
        if name.starts_with('.') || name == "Library" || name == "Applications" {
            continue;
        }

        if name == "node_modules" {
            let size = dir_size_fast(&path);
            let project_name = path
                .parent()
                .and_then(|p| p.file_name())
                .map(|n| n.to_string_lossy().to_string());

            items.push(DevJunkItem {
                path: path.to_string_lossy().to_string(),
                size,
                junk_type: DevJunkType::NodeModules,
                project_name,
                last_modified: get_modified_time(&path),
                safety_level: SafetyLevel::Safe,
            });
        } else {
            // Recurse into subdirectories (but not into node_modules itself)
            scan_for_node_modules(&path, items, max_depth - 1);
        }
    }
}

fn dir_size_fast(path: &std::path::Path) -> u64 {
    jwalk::WalkDir::new(path)
        .parallelism(jwalk::Parallelism::RayonNewPool(2))
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}

fn get_modified_time(path: &std::path::Path) -> Option<i64> {
    std::fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
}
