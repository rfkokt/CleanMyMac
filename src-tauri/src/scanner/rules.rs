use crate::models::{FileCategory, SafetyLevel};
use std::path::Path;

/// Assess how safe it is to delete a file or directory.
pub fn assess_safety(path: &Path, category: &FileCategory) -> SafetyLevel {
    let path_str = path.to_string_lossy().to_lowercase();

    // 🔴 CAUTION — never delete these
    if path_str.contains("/system/")
        || path_str.contains("/.ssh/")
        || path_str.contains("/.gnupg/")
        || path_str.starts_with("/usr/")
        || path_str.starts_with("/bin/")
        || path_str.starts_with("/sbin/")
        || path_str.contains("/library/preferences/")
    {
        return SafetyLevel::Caution;
    }

    // Active .git directories — caution, contains repo data
    if path_str.ends_with("/.git") || path_str.contains("/.git/") {
        return SafetyLevel::Caution;
    }

    // 🟢 SAFE — can always regenerate
    match category {
        FileCategory::DevCache => return SafetyLevel::Safe,
        FileCategory::Cache => return SafetyLevel::Safe,
        FileCategory::Log => return SafetyLevel::Safe,
        FileCategory::Trash => return SafetyLevel::Safe,
        _ => {}
    }

    // Specific safe paths
    if path_str.contains("/library/caches/")
        || path_str.contains("/library/logs/")
        || path_str.contains("/deriveddata/")
        || path_str.contains("/node_modules/")
    {
        return SafetyLevel::Safe;
    }

    // 🟡 REVIEW — check before deleting
    // Archives in Downloads
    if path_str.contains("/downloads/") {
        match category {
            FileCategory::Archive => return SafetyLevel::Review,
            _ => {}
        }
    }

    // Large files get review
    if let Ok(metadata) = std::fs::metadata(path) {
        let size = metadata.len();
        // Files > 500MB that haven't been modified in 6 months
        if size > 500_000_000 {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = modified.elapsed() {
                    let six_months = std::time::Duration::from_secs(180 * 24 * 3600);
                    if duration > six_months {
                        return SafetyLevel::Review;
                    }
                }
            }
        }
    }

    // Default: review for safety
    SafetyLevel::Review
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_files_caution() {
        let path = Path::new("/System/Library/something");
        assert!(matches!(assess_safety(path, &FileCategory::System), SafetyLevel::Caution));
    }

    #[test]
    fn test_ssh_keys_caution() {
        let path = Path::new("/Users/test/.ssh/id_rsa");
        assert!(matches!(assess_safety(path, &FileCategory::Other), SafetyLevel::Caution));
    }

    #[test]
    fn test_cache_safe() {
        let path = Path::new("/Users/test/Library/Caches/something");
        assert!(matches!(assess_safety(path, &FileCategory::Cache), SafetyLevel::Safe));
    }

    #[test]
    fn test_node_modules_safe() {
        let path = Path::new("/projects/app/node_modules");
        assert!(matches!(assess_safety(path, &FileCategory::DevCache), SafetyLevel::Safe));
    }
}
