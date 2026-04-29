use crate::models::DiskInfo;

#[tauri::command]
pub async fn get_disk_info() -> Result<DiskInfo, String> {
    // Use `diskutil info /` for accurate APFS container-level disk info.
    // `df` on APFS reports per-volume/snapshot usage which is misleading.
    let output = std::process::Command::new("diskutil")
        .args(["info", "/"])
        .output()
        .map_err(|e| format!("Failed to run diskutil: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let mut total: Option<u64> = None;
    let mut free: Option<u64> = None;

    for line in stdout.lines() {
        let trimmed = line.trim();

        // "Container Total Space:  245.1 GB (245107195904 Bytes) ..."
        if trimmed.starts_with("Container Total Space:") || trimmed.starts_with("Disk Size:") {
            total = total.or_else(|| parse_bytes_from_diskutil(trimmed));
        }

        // "Container Free Space:   29.1 GB (29122838528 Bytes) ..."
        if trimmed.starts_with("Container Free Space:") {
            free = parse_bytes_from_diskutil(trimmed);
        }
    }

    // If no container info (non-APFS), fall back to Disk Size + Volume Free
    if free.is_none() {
        for line in stdout.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("Volume Free Space:") || trimmed.starts_with("Volume Available Space:") {
                free = parse_bytes_from_diskutil(trimmed);
                break;
            }
        }
    }

    let total = total.ok_or("Could not determine total disk capacity")?;
    let free = free.ok_or("Could not determine free space")?;
    let used = total.saturating_sub(free);

    Ok(DiskInfo {
        total_capacity: total,
        available_space: free,
        used_space: used,
        purgeable_space: None,
    })
}

/// Parse byte count from diskutil output line.
/// Format: "Container Total Space:  245.1 GB (245107195904 Bytes) (exactly ...)"
fn parse_bytes_from_diskutil(line: &str) -> Option<u64> {
    let open = line.find('(')?;
    let bytes_end = line[open..].find(" Bytes")?;
    let bytes_str = &line[open + 1..open + bytes_end];
    bytes_str.trim().parse::<u64>().ok()
}

#[tauri::command]
pub async fn check_fda_status() -> Result<bool, String> {
    // Try to read a protected directory as a proxy for FDA
    let test_path = dirs::home_dir()
        .map(|h| h.join("Library/Mail"))
        .unwrap_or_default();

    match std::fs::read_dir(&test_path) {
        Ok(_) => Ok(true),
        Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => Ok(false),
        Err(_) => Ok(true), // Directory might not exist, which is fine
    }
}

#[tauri::command]
pub async fn open_system_preferences() -> Result<(), String> {
    std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")
        .spawn()
        .map_err(|e| format!("Failed to open System Settings: {}", e))?;
    Ok(())
}
