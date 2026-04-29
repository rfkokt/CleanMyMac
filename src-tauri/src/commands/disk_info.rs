use crate::models::DiskInfo;

#[tauri::command]
pub async fn get_disk_info() -> Result<DiskInfo, String> {
    // Use system command to get accurate disk info
    let output = std::process::Command::new("df")
        .args(["-k", "/"])
        .output()
        .map_err(|e| format!("Failed to run df: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();

    if lines.len() < 2 {
        return Err("Unexpected df output".to_string());
    }

    let parts: Vec<&str> = lines[1].split_whitespace().collect();
    if parts.len() < 4 {
        return Err("Unexpected df output format".to_string());
    }

    let total_kb: u64 = parts[1].parse().map_err(|_| "Failed to parse total")?;
    let used_kb: u64 = parts[2].parse().map_err(|_| "Failed to parse used")?;
    let available_kb: u64 = parts[3].parse().map_err(|_| "Failed to parse available")?;

    Ok(DiskInfo {
        total_capacity: total_kb * 1024,
        available_space: available_kb * 1024,
        used_space: used_kb * 1024,
        purgeable_space: None,
    })
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
