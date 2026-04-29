# CleanMyMac — Technical Documentation

> **Purpose**: This document serves as the single source of truth for any AI or developer working on this project. It describes the architecture, tech stack, features, conventions, and implementation details.

> **⚠️ IMPORTANT FOR AI**: Before implementing ANY feature, you MUST also read:
> - **[FEATURES.md](./FEATURES.md)** — Feature backlog with IDs, priorities, acceptance criteria, and dependencies. Only implement features that are listed and `planned`. If a feature is not listed, add it as `proposed` first.

---

## 1. Project Overview

**CleanMyMac** is a macOS desktop application for analyzing and cleaning disk storage. It targets developers (node_modules, Xcode DerivedData, Docker, .git) and general users (large files, duplicates, caches).

### Core Value Propositions
1. **Developer-first cleanup** — Detect scattered `node_modules`, Xcode DerivedData, Docker volumes, `.git` objects
2. **Visual disk analysis** — Interactive treemap visualization (like DaisyDisk but modern)
3. **Smart safety system** — Traffic light rating (🟢 safe / 🟡 review / 🔴 caution) per item
4. **Lightweight** — App itself must be < 15MB bundle, < 50MB RAM idle

---

## 2. Tech Stack

### Framework: Tauri v2

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | React 19 + TypeScript + Vite | UI rendering via system WebView (WebKit on macOS) |
| **Backend** | Rust (via Tauri) | File scanning, hashing, cleanup operations |
| **IPC** | Tauri Commands + Events | Frontend ↔ Backend communication |
| **Styling** | Tailwind CSS v4 | Utility-first styling |
| **State** | Zustand | Frontend state management |
| **Visualization** | Nivo (@nivo/treemap) | Interactive treemap charts |
| **Icons** | Phosphor Icons | Consistent icon set |
| **Package Manager** | pnpm | Fast, disk-efficient |

### Why Tauri v2 (not Electron/Swift)
- **Bundle size**: < 10MB (Electron = 100-150MB — ironic for a cleaner app)
- **Memory**: 30-50MB idle (Electron = 150-300MB)
- **Startup**: < 1 second (Electron = 1-3 seconds)
- **Rust backend**: Native-speed file scanning (critical for millions of files)
- **Security**: Capability-based permission model

### Scaffolding Command
```bash
pnpm create tauri-app@latest CleanMyMac -- --template react-ts --manager pnpm
```

---

## 3. Project Structure

```
CleanMyMac/
├── src/                          # React Frontend
│   ├── assets/                   # Static assets (icons, images)
│   ├── components/
│   │   ├── ui/                   # Base UI components (Button, Card, Dialog, etc.)
│   │   ├── layout/               # Layout components (Sidebar, Header, Shell)
│   │   ├── scanner/              # Scanner-related components
│   │   ├── visualizer/           # Treemap and chart components
│   │   └── cleanup/              # Cleanup flow components
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-scanner.ts        # Scanner IPC bridge
│   │   ├── use-disk-info.ts      # Disk capacity info
│   │   └── use-cleanup.ts        # Cleanup operations
│   ├── pages/                    # Page-level views
│   │   ├── Dashboard.tsx         # Main overview
│   │   ├── Scanner.tsx           # Scan results view
│   │   ├── Visualizer.tsx        # Treemap view
│   │   ├── DevTools.tsx          # Developer cleanup tools
│   │   └── Settings.tsx          # App settings
│   ├── services/                 # Tauri IPC bridge layer
│   │   └── tauri.ts              # invoke/listen wrappers
│   ├── stores/                   # Zustand stores
│   │   ├── scan-store.ts         # Scan state & results
│   │   └── app-store.ts          # Global app state
│   ├── types/                    # Shared TypeScript types
│   │   └── index.ts              # FileNode, ScanResult, etc.
│   ├── lib/                      # Utility functions
│   │   └── format.ts             # Size formatting, date helpers
│   ├── App.tsx                   # Root component with routing
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles + Tailwind
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── commands/             # Tauri IPC command handlers
│   │   │   ├── mod.rs
│   │   │   ├── scan.rs           # File system scanning
│   │   │   ├── cleanup.rs        # File deletion/trash
│   │   │   ├── disk_info.rs      # Volume capacity info
│   │   │   ├── dev_tools.rs      # Developer-specific cleanup
│   │   │   └── duplicates.rs     # Duplicate file detection
│   │   ├── scanner/              # Core scanner engine
│   │   │   ├── mod.rs
│   │   │   ├── walker.rs         # Parallel directory traversal
│   │   │   ├── categorizer.rs    # File categorization rules
│   │   │   └── rules.rs          # Cleanup safety rules
│   │   ├── models/               # Data structures
│   │   │   ├── mod.rs
│   │   │   ├── file_node.rs      # File tree node
│   │   │   └── scan_result.rs    # Scan result types
│   │   ├── lib.rs                # App builder, plugin/state registration
│   │   └── main.rs               # Entry point (minimal)
│   ├── capabilities/             # Tauri v2 permissions
│   │   └── default.json          # App capability definitions
│   ├── icons/                    # App icons
│   ├── tauri.conf.json           # Tauri configuration
│   └── Cargo.toml                # Rust dependencies
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── TECHNICAL.md                  # This file
└── README.md                     # User-facing readme
```

---

## 4. Rust Dependencies (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
tauri-plugin-dialog = "2"
tauri-plugin-os = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }

# File system scanning
jwalk = "0.8"                    # Parallel directory walking (uses rayon internally)
ignore = "0.4"                   # High-perf parallel walker (from ripgrep)

# Hashing (for duplicate detection)
xxhash-rust = { version = "0.8", features = ["xxh3"] }  # Fast non-crypto hash

# File operations
trash = "5"                      # Move to OS trash (cross-platform)
dirs = "5"                       # Standard directory paths (~, ~/Library, etc.)

# Database (scan cache)
rusqlite = { version = "0.31", features = ["bundled"] }

# Utilities
chrono = "0.4"                   # Date/time
bytesize = "1"                   # Human-readable file sizes
log = "0.4"
env_logger = "0.11"
```

---

## 5. Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-shell": "^2",
    "@tauri-apps/plugin-dialog": "^2",
    "@tauri-apps/plugin-os": "^2",
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "@nivo/treemap": "^0.88",
    "zustand": "^5",
    "@phosphor-icons/react": "^2",
    "framer-motion": "^11",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.7",
    "vite": "^6",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^4",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## 6. Core Data Models

### 6.1 Rust Models (shared via serde)

```rust
// models/file_node.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub size: u64,               // bytes
    pub is_dir: bool,
    pub file_type: FileCategory,
    pub children: Option<Vec<FileNode>>,
    pub last_accessed: Option<i64>,  // unix timestamp
    pub last_modified: Option<i64>,
    pub safety_level: SafetyLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileCategory {
    System,       // macOS system files
    Application,  // .app bundles
    Document,     // docs, PDFs, office files
    Media,        // images, video, audio
    Code,         // source code files
    DevCache,     // node_modules, DerivedData, .gradle, etc.
    Cache,        // ~/Library/Caches, browser cache
    Log,          // system & app logs
    Archive,      // .zip, .tar, .dmg
    Trash,        // items in trash
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SafetyLevel {
    Safe,         // 🟢 Can delete without worry
    Review,       // 🟡 Check before deleting
    Caution,      // 🔴 May break things if deleted
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub root: FileNode,
    pub total_size: u64,
    pub file_count: u64,
    pub dir_count: u64,
    pub scan_duration_ms: u64,
    pub categories: HashMap<String, u64>,  // category -> total bytes
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub total_capacity: u64,
    pub available_space: u64,
    pub used_space: u64,
    pub purgeable_space: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevJunkItem {
    pub path: String,
    pub size: u64,
    pub junk_type: DevJunkType,
    pub project_name: Option<String>,
    pub last_modified: Option<i64>,
    pub safety_level: SafetyLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DevJunkType {
    NodeModules,
    XcodeDerivedData,
    XcodeArchives,
    XcodeDeviceSupport,
    IOSSimulators,
    CocoaPodsCache,
    SPMCache,
    GradleCache,
    DockerImages,
    DockerVolumes,
    GitObjects,
    HomebrewCache,
    CargoCache,
    PipCache,
}
```

### 6.2 TypeScript Types (mirror of Rust)

```typescript
// types/index.ts
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
```

---

## 7. IPC Commands (Tauri)

### 7.1 Command Definitions

| Command | Direction | Description |
|---------|-----------|-------------|
| `get_disk_info` | FE → BE | Get volume capacity info |
| `start_scan` | FE → BE | Start scanning a path (streams results via events) |
| `cancel_scan` | FE → BE | Cancel ongoing scan |
| `scan_dev_junk` | FE → BE | Scan for developer-specific junk |
| `find_duplicates` | FE → BE | Find duplicate files by hash |
| `find_large_files` | FE → BE | Find files larger than threshold |
| `cleanup_items` | FE → BE | Move selected items to trash |
| `get_file_details` | FE → BE | Get detailed info for a specific path |
| `open_in_finder` | FE → BE | Reveal file in Finder |

### 7.2 Event Definitions (Backend → Frontend streaming)

| Event | Payload | Description |
|-------|---------|-------------|
| `scan://progress` | `{ scanned: u64, current_path: String }` | Scan progress updates |
| `scan://result` | `ScanResult` | Final scan result |
| `scan://error` | `{ message: String }` | Scan error |
| `cleanup://progress` | `{ completed: u64, total: u64 }` | Cleanup progress |

### 7.3 Example: Scan Command with Streaming

**Rust backend:**
```rust
#[tauri::command]
async fn start_scan(
    app: tauri::AppHandle,
    path: String,
    max_depth: Option<u32>,
) -> Result<ScanResult, String> {
    let scanner = Scanner::new(&path, max_depth);

    // Stream progress via events
    let app_clone = app.clone();
    scanner.on_progress(move |scanned, current_path| {
        let _ = app_clone.emit("scan://progress", ScanProgress {
            scanned,
            current_path,
        });
    });

    scanner.run().await.map_err(|e| e.to_string())
}
```

**TypeScript frontend:**
```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

async function startScan(path: string) {
  const unlisten = await listen<ScanProgress>('scan://progress', (event) => {
    updateProgress(event.payload);
  });

  try {
    const result = await invoke<ScanResult>('start_scan', { path });
    return result;
  } finally {
    unlisten();
  }
}
```

---

## 8. Scanner Engine Design

### 8.1 Parallel Scanning Strategy

```
Phase 1: Shallow Scan (instant feedback)
  → Scan top-level directories only
  → Show approximate sizes immediately
  → User sees results within 1-2 seconds

Phase 2: Deep Scan (background)
  → Use jwalk for parallel traversal
  → Stream updates via Tauri events
  → Build complete FileNode tree
  → Cache results in SQLite
```

### 8.2 File Categorization Rules

```rust
fn categorize(path: &Path, name: &str) -> FileCategory {
    // By directory name (developer junk)
    match name {
        "node_modules" => FileCategory::DevCache,
        "DerivedData" => FileCategory::DevCache,
        ".gradle" => FileCategory::DevCache,
        "Caches" => FileCategory::Cache,
        _ => {}
    }

    // By extension
    match extension {
        "jpg" | "png" | "gif" | "mp4" | "mov" | "mp3" => FileCategory::Media,
        "pdf" | "doc" | "docx" | "xls" | "xlsx" => FileCategory::Document,
        "rs" | "ts" | "js" | "py" | "swift" | "go" => FileCategory::Code,
        "zip" | "tar" | "gz" | "dmg" | "iso" => FileCategory::Archive,
        "log" => FileCategory::Log,
        "app" => FileCategory::Application,
        _ => FileCategory::Other,
    }
}
```

### 8.3 Safety Level Rules

```rust
fn assess_safety(path: &Path, category: &FileCategory) -> SafetyLevel {
    // 🟢 SAFE — can always delete
    // - node_modules (can npm install)
    // - DerivedData (Xcode rebuilds)
    // - Caches (apps regenerate)
    // - .log files
    // - Trash items
    // - Homebrew cache
    // - Docker dangling images

    // 🟡 REVIEW — check before deleting
    // - Large files not accessed in 6+ months
    // - Duplicate files (keep one, delete rest)
    // - Old archives/DMGs in Downloads
    // - Application leftovers

    // 🔴 CAUTION — may break things
    // - System files
    // - Active app support files
    // - .git directories (repo data!)
    // - Files accessed recently
}
```

---

## 9. Developer Junk Detection

### Known Paths to Scan

```rust
pub const DEV_JUNK_PATTERNS: &[(&str, DevJunkType)] = &[
    // Node.js
    ("**/node_modules", DevJunkType::NodeModules),

    // Xcode
    ("~/Library/Developer/Xcode/DerivedData", DevJunkType::XcodeDerivedData),
    ("~/Library/Developer/Xcode/Archives", DevJunkType::XcodeArchives),
    ("~/Library/Developer/Xcode/iOS DeviceSupport", DevJunkType::XcodeDeviceSupport),
    ("~/Library/Developer/CoreSimulator", DevJunkType::IOSSimulators),

    // CocoaPods & SPM
    ("~/Library/Caches/CocoaPods", DevJunkType::CocoaPodsCache),
    ("~/Library/Caches/org.swift.swiftpm", DevJunkType::SPMCache),

    // Gradle (Android)
    ("~/.gradle/caches", DevJunkType::GradleCache),

    // Docker
    ("~/Library/Containers/com.docker.docker/Data", DevJunkType::DockerImages),

    // Homebrew
    ("~/Library/Caches/Homebrew", DevJunkType::HomebrewCache),

    // Rust
    ("~/.cargo/registry/cache", DevJunkType::CargoCache),

    // Python
    ("~/Library/Caches/pip", DevJunkType::PipCache),
];
```

---

## 10. Tauri v2 Permissions (Capabilities)

```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for CleanMyMac",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "dialog:allow-open",
    "dialog:allow-save",
    "os:default",
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$HOME/**" },
        { "path": "/Applications/**" },
        { "path": "/Library/**" },
        { "path": "/System/**" },
        { "path": "/private/var/**" }
      ]
    },
    {
      "identifier": "fs:allow-remove",
      "allow": [
        { "path": "$HOME/Library/Caches/**" },
        { "path": "$HOME/Library/Logs/**" }
      ]
    }
  ]
}
```

> **Note**: Most cleanup operations use Rust's `std::fs` and `trash` crate directly (bypassing Tauri's fs plugin), so macOS Full Disk Access is the real gatekeeper. The app must detect FDA status and guide users to System Settings if needed.

---

## 11. UI/UX Design System

### Color Palette (Dark Theme)

```css
:root {
  --bg-primary: #0a0a0f;       /* Deep dark background */
  --bg-secondary: #12121a;     /* Card backgrounds */
  --bg-tertiary: #1a1a28;      /* Elevated surfaces */
  --accent-primary: #6366f1;   /* Indigo - primary actions */
  --accent-secondary: #8b5cf6; /* Purple - secondary */
  --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --text-primary: #f1f5f9;     /* Primary text */
  --text-secondary: #94a3b8;   /* Secondary text */
  --text-muted: #475569;       /* Muted/disabled */
  --safe: #22c55e;             /* 🟢 Safe to delete */
  --review: #f59e0b;           /* 🟡 Review before delete */
  --caution: #ef4444;          /* 🔴 Caution */
  --border: rgba(255,255,255,0.06);
  --glass: rgba(255,255,255,0.03);
}
```

### Category Colors (for treemap/charts)
```css
--color-system: #ef4444;
--color-application: #3b82f6;
--color-document: #22c55e;
--color-media: #f59e0b;
--color-code: #8b5cf6;
--color-dev-cache: #ec4899;
--color-cache: #6366f1;
--color-log: #64748b;
--color-archive: #14b8a6;
--color-other: #475569;
```

### Layout
- **Sidebar**: 240px fixed, dark with glassmorphism
- **Main content**: Flexible, scrollable
- **Windows controls**: Native macOS traffic lights
- **Font**: SF Pro Display (system) via `-apple-system`

---

## 12. Pages & Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview: disk bar, category breakdown, quick actions |
| `/scan` | Scanner | Full scan results, file list sorted by size |
| `/visualize` | Visualizer | Interactive treemap (Nivo) |
| `/dev-tools` | Dev Tools | Developer junk scanner & cleaner |
| `/large-files` | Large Files | Files > 100MB sorted by size |
| `/duplicates` | Duplicates | Duplicate file finder |
| `/settings` | Settings | Preferences, FDA check, about |

---

## 13. Development Commands

```bash
# Prerequisites
rustup update                      # Ensure Rust is current
xcode-select --install             # macOS build tools

# Setup
pnpm install                       # Install frontend deps
cd src-tauri && cargo build        # Verify Rust compiles

# Development
pnpm tauri dev                     # Start dev server + Tauri window

# Build
pnpm tauri build                   # Production build → .dmg

# Testing
pnpm test                          # Frontend tests
cd src-tauri && cargo test         # Rust tests
```

---

## 14. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Parallel walker | `jwalk` | Built on rayon, parallelizes traversal itself (not just processing) |
| Hash algorithm | xxHash3 | 10x faster than SHA-256, sufficient for duplicate detection |
| File deletion | `trash` crate | Moves to OS Trash, user can undo. Never permanent delete by default |
| Scan caching | SQLite (rusqlite) | Persist scan results for instant re-analysis without re-scan |
| State management | Zustand | Lightweight, TypeScript-native, no boilerplate |
| Treemap chart | Nivo | Best React treemap with built-in interactivity and TypeScript support |

---

## 15. macOS-Specific Considerations

1. **Full Disk Access (FDA)**: Required to scan `~/Library`, system dirs. App must detect FDA status on launch and show onboarding if not granted.
2. **APFS Clones**: Use `totalFileAllocatedSizeKey` instead of `fileSizeKey` to avoid inflated sizes.
3. **SIP (System Integrity Protection)**: Never attempt to modify `/System`, `/usr` (except `/usr/local`).
4. **Time Machine Snapshots**: Detect and offer cleanup via `tmutil`.
5. **Code Signing**: Required for FDA to work properly. Use Apple Developer cert for distribution.
6. **Notarization**: Required for distribution outside App Store since macOS Catalina.

---

## 16. Conventions & Rules for AI Contributors

1. **Rust code**: Use `snake_case`, impl `Serialize`/`Deserialize` on all IPC types
2. **TypeScript**: Use `camelCase` for functions, `PascalCase` for types/components
3. **Components**: One component per file, co-locate styles when possible
4. **IPC**: Always wrap `invoke()` calls in custom hooks, never call directly in components
5. **Error handling**: Rust commands return `Result<T, String>`, frontend catches with try/catch
6. **File paths**: Always use `dirs` crate for standard paths, never hardcode absolute paths
7. **Cleanup operations**: Always use `trash` crate (move to Trash), never `std::fs::remove_*`
8. **Events**: Use `scan://` prefix for scan events, `cleanup://` for cleanup events
9. **Testing**: Unit test all categorization and safety rules in Rust
10. **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)

---

## 17. Data Flow Diagrams

### 17.1 Scan Flow (end-to-end)

```
User clicks "Scan"
       │
       ▼
[Dashboard.tsx] ──invoke──▶ [start_scan command]
       │                           │
       │                    ┌──────┴───────┐
       │                    │ Scanner::new  │
       │                    │ Phase 1:      │
       │                    │ shallow scan  │
       │                    └──────┬───────┘
       │                           │
       │  ◄──event(scan://progress)─┤  (every ~100 files)
       │                           │
   [scan-store.ts]          ┌──────┴───────┐
   updates UI state         │ Phase 2:      │
       │                    │ deep scan     │
       │                    │ (jwalk)       │
       │                    └──────┬───────┘
       │                           │
       │  ◄──event(scan://progress)─┤  (streaming)
       │                           │
       │                    ┌──────┴───────┐
       │                    │ Build tree    │
       │                    │ Cache SQLite  │
       │                    └──────┬───────┘
       │                           │
       ▼                           ▼
[scan-store.ts] ◄───Result────  ScanResult returned
       │
       ▼
[Visualizer.tsx / Scanner.tsx] renders treemap/list
```

### 17.2 Cleanup Flow

```
User selects items → clicks "Clean"
       │
       ▼
[cleanup/ConfirmDialog.tsx]  ──shows summary──▶ User confirms
       │
       ▼
[use-cleanup.ts] ──invoke──▶ [cleanup_items command]
       │                           │
       │                    ┌──────┴───────┐
       │                    │ For each item:│
       │                    │ trash::delete │
       │                    └──────┬───────┘
       │                           │
       │  ◄──event(cleanup://progress)─┤
       │                           │
   [scan-store.ts]                 ▼
   removes cleaned items    Returns CleanupResult {
   updates category sizes     freed_bytes, failed_items
       │                    }
       ▼
[Dashboard.tsx] shows "X GB freed!" toast
```

### 17.3 State Management Flow

```
                    ┌─────────────────────┐
                    │     Zustand Stores   │
                    ├─────────────────────┤
                    │ scan-store.ts        │
                    │  - scanResult        │
                    │  - isScanning        │
                    │  - progress          │
                    │  - selectedItems     │
                    ├─────────────────────┤
                    │ app-store.ts         │
                    │  - diskInfo          │
                    │  - hasFDA            │
                    │  - currentPage       │
                    │  - theme             │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
    [Pages/*.tsx]      [components/*.tsx]   [hooks/*.ts]
    read & render      read & render        write & invoke
```

---

## 18. Error Handling Patterns

### 18.1 Rust Backend — Always return `Result<T, String>`

```rust
// ✅ CORRECT: Return meaningful error messages
#[tauri::command]
async fn start_scan(path: String) -> Result<ScanResult, String> {
    // Validate path exists
    let path = std::path::Path::new(&path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    // Validate permissions
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", path.display()));
    }

    // Run scanner, map internal errors to String
    Scanner::new(path)
        .run()
        .await
        .map_err(|e| format!("Scan failed: {}", e))
}

// ❌ WRONG: unwrap/panic in commands
#[tauri::command]
async fn start_scan(path: String) -> ScanResult {
    Scanner::new(&path).run().await.unwrap() // NEVER DO THIS
}
```

### 18.2 TypeScript Frontend — try/catch with user feedback

```typescript
// ✅ CORRECT: Wrap in hook, handle errors gracefully
export function useScanner() {
  const { setError, setLoading, setScanResult } = useScanStore();

  const startScan = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const unlisten = await listen<ScanProgress>('scan://progress', (e) => {
        useScanStore.getState().setProgress(e.payload);
      });

      const result = await invoke<ScanResult>('start_scan', { path });
      setScanResult(result);
      unlisten();
    } catch (error) {
      // error is the String from Rust's Err()
      setError(String(error));
      toast.error(`Scan failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return { startScan };
}

// ❌ WRONG: invoke directly in component without error handling
function Dashboard() {
  const onClick = () => invoke('start_scan', { path: '/' }); // NO!
}
```

### 18.3 FDA (Full Disk Access) Handling

```typescript
// On app launch, check FDA status
async function checkFDA(): Promise<boolean> {
  try {
    // Attempt to read a protected directory as a proxy check
    const result = await invoke<boolean>('check_fda_status');
    return result;
  } catch {
    return false;
  }
}

// If FDA not granted → show onboarding modal, NOT an error page
// The modal should have a button that opens System Settings:
//   invoke('open_system_preferences', { pane: 'privacy' })
```

### 18.4 Permission Denied During Scan

```rust
// In the scanner: SKIP files we can't read, don't abort the whole scan
fn walk_directory(path: &Path) -> Vec<FileNode> {
    let mut results = vec![];
    for entry in jwalk::WalkDir::new(path) {
        match entry {
            Ok(entry) => results.push(process_entry(entry)),
            Err(e) => {
                // Log and skip — don't crash
                log::warn!("Skipping inaccessible: {}", e);
                continue;
            }
        }
    }
    results
}
```

---

## 19. Common Pitfalls & FAQ for AI Contributors

### Q: Where does `invoke()` get imported from?
```typescript
// Tauri v2:
import { invoke } from '@tauri-apps/api/core';     // ✅ CORRECT
// NOT from:
import { invoke } from '@tauri-apps/api/tauri';     // ❌ This is Tauri v1
```

### Q: Where does `listen()` / `emit()` get imported from?
```typescript
// Tauri v2:
import { listen, emit } from '@tauri-apps/api/event';  // ✅
```

### Q: How do I register a new Rust command?
```rust
// In src-tauri/src/lib.rs — add to invoke_handler:
.invoke_handler(tauri::generate_handler![
    commands::scan::start_scan,
    commands::scan::cancel_scan,
    commands::cleanup::cleanup_items,
    commands::my_new_command,           // ← add here
])
```
**If you forget this step, `invoke('my_new_command')` will silently fail or throw "command not found".**

### Q: Rust command parameter names must match TypeScript invoke keys
```rust
// Rust:
#[tauri::command]
async fn find_large_files(path: String, min_size_bytes: u64) -> Result<...> { }
```
```typescript
// TypeScript — keys MUST match Rust param names (camelCase → snake_case auto-converted):
invoke('find_large_files', { path: '/Users', minSizeBytes: 100_000_000 });
// Tauri auto-converts camelCase → snake_case for you
```

### Q: Why is my scan returning 0 files?
1. **Full Disk Access not granted** — Check FDA status first
2. **Capability not configured** — Check `src-tauri/capabilities/default.json`
3. **Path doesn't exist** — Validate before invoking
4. **Using Tauri fs plugin** instead of `std::fs` — Our scanner uses `std::fs`/`jwalk` directly

### Q: Should I use Tauri's `fs` plugin or Rust `std::fs`?
- **Tauri `fs` plugin**: ONLY for simple, one-off file operations from the frontend (reading a config file)
- **Rust `std::fs` / `jwalk`**: For ALL scanner and cleanup operations. The plugin's permission scopes are too restrictive for a full-disk scanner. We rely on macOS FDA instead.

### Q: How do I add a new page/route?
1. Create `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add sidebar nav item in `src/components/layout/Sidebar.tsx`
4. Update the route table in Section 12 of this document

### Q: How do I handle large data from Rust without blocking UI?
Use **Tauri Events** for streaming, not a single large return value:
```rust
// ✅ Stream chunks via events, return summary at end
#[tauri::command]
async fn start_scan(app: AppHandle, path: String) -> Result<ScanSummary, String> {
    for chunk in scanner.scan_chunks() {
        app.emit("scan://chunk", &chunk).unwrap();  // stream
    }
    Ok(summary)  // final result
}
```

### Q: What files/directories should NEVER be deleted?
```
/System/**                    # SIP protected
/usr/** (except /usr/local)   # SIP protected
/bin, /sbin                   # System binaries
~/Library/Preferences/**      # App settings (breaks apps)
~/Library/Application Support/** (active apps)
~/.ssh/**                     # SSH keys!
~/.gnupg/**                   # GPG keys!
Any file currently open/locked by a process
```

### Q: Zustand store pattern for this project?

```typescript
// ✅ Standard store pattern:
import { create } from 'zustand';

interface ScanStore {
  // State
  scanResult: ScanResult | null;
  isScanning: boolean;
  progress: ScanProgress | null;
  error: string | null;

  // Actions
  setScanResult: (result: ScanResult) => void;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: ScanProgress) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  scanResult: null,
  isScanning: false,
  progress: null,
  error: null,

  setScanResult: (result) => set({ scanResult: result, isScanning: false }),
  setLoading: (isScanning) => set({ isScanning }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, isScanning: false }),
  reset: () => set({ scanResult: null, isScanning: false, progress: null, error: null }),
}));
```

---

## 20. How to Add a New Feature (Step-by-Step)

This is a checklist for AI contributors implementing a new feature:

### Example: Adding "Browser Cache Cleanup"

#### Step 1: Define the data model (if new types needed)
```rust
// src-tauri/src/models/ — add or extend existing types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserCacheItem {
    pub browser: String,       // "Chrome", "Safari", "Firefox"
    pub path: String,
    pub size: u64,
    pub cache_type: String,    // "cache", "cookies", "history"
    pub safety_level: SafetyLevel,
}
```
Mirror in TypeScript (`src/types/index.ts`).

#### Step 2: Implement the Rust command
```rust
// src-tauri/src/commands/browser.rs
#[tauri::command]
pub async fn scan_browser_cache() -> Result<Vec<BrowserCacheItem>, String> {
    // Implementation
}
```

#### Step 3: Register the command
```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    commands::browser::scan_browser_cache,  // ← add
])
```

#### Step 4: Create the React hook
```typescript
// src/hooks/use-browser-cache.ts
export function useBrowserCache() {
  // Wrap invoke(), handle errors, update store
}
```

#### Step 5: Build the UI component
```typescript
// src/components/cleanup/BrowserCachePanel.tsx
// Use the hook, render the data, handle user actions
```

#### Step 6: Add to page/route (if new page)
Update `App.tsx` and `Sidebar.tsx`.

#### Step 7: Update this document
Add the new command to Section 7.1, update Section 12 routes if applicable.

---

## 21. Glossary

| Term | Meaning |
|------|---------|
| **FDA** | Full Disk Access — macOS permission required to scan protected directories |
| **SIP** | System Integrity Protection — macOS security preventing modification of system files |
| **APFS** | Apple File System — supports clones/snapshots that affect size calculations |
| **IPC** | Inter-Process Communication — how frontend (WebView) talks to backend (Rust) |
| **invoke** | Tauri function to call a Rust command from TypeScript |
| **emit/listen** | Tauri event system for streaming data from Rust to TypeScript |
| **DevJunk** | Developer-generated files that can be safely regenerated (caches, build artifacts) |
| **Safety Level** | Our 🟢🟡🔴 classification of how risky it is to delete a file |
| **Treemap** | Hierarchical visualization where rectangle area = file size |
| **jwalk** | Rust crate for parallel directory traversal |
| **trash crate** | Rust crate that moves files to OS Trash instead of permanent delete |

---

## 22. Missing Types (Referenced but Not Defined in §6)

These types are used in flow diagrams and hooks but were not in the models section. **AI must include these.**

### Rust
```rust
// models/scan_result.rs — add these alongside ScanResult

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub scanned: u64,           // files scanned so far
    pub current_path: String,   // file currently being scanned
    pub estimated_total: Option<u64>,  // estimated total files (if known)
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
    pub reason: String,  // e.g. "Permission denied", "File in use"
}
```

### TypeScript
```typescript
// types/index.ts — add these

export interface ScanProgress {
  scanned: number;
  current_path: string;
  estimated_total?: number;
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
```

---

## 23. Boilerplate Configs

### 23.1 tauri.conf.json

```json
{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-config-schema/schema.json",
  "productName": "CleanMyMac",
  "version": "0.1.0",
  "identifier": "com.cleanmymac.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "windows": [
      {
        "title": "CleanMyMac",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "resizable": true,
        "decorations": true,
        "transparent": false,
        "titleBarStyle": "Overlay",
        "hiddenTitle": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "targets": ["dmg", "app"],
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  }
}
```

**Key points for AI:**
- `titleBarStyle: "Overlay"` + `hiddenTitle: true` = native macOS traffic lights overlaid on our custom header
- Window size 1200×800 with min 900×600
- CSP is null for dev flexibility (tighten for production)

### 23.2 lib.rs (Complete Boilerplate)

```rust
// src-tauri/src/lib.rs
mod commands;
mod models;
mod scanner;

use commands::{cleanup, dev_tools, disk_info, duplicates, scan};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        // Commands — EVERY new command must be added here
        .invoke_handler(tauri::generate_handler![
            disk_info::get_disk_info,
            disk_info::check_fda_status,
            scan::start_scan,
            scan::cancel_scan,
            scan::find_large_files,
            scan::get_file_details,
            scan::open_in_finder,
            cleanup::cleanup_items,
            dev_tools::scan_dev_junk,
            duplicates::find_duplicates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 23.3 App.tsx (Routing Setup)

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Visualizer from './pages/Visualizer';
import DevTools from './pages/DevTools';
import LargeFiles from './pages/LargeFiles';
import Duplicates from './pages/Duplicates';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/visualize" element={<Visualizer />} />
          <Route path="/dev-tools" element={<DevTools />} />
          <Route path="/large-files" element={<LargeFiles />} />
          <Route path="/duplicates" element={<Duplicates />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
```

### 23.4 services/tauri.ts (IPC Wrapper)

```typescript
// src/services/tauri.ts
// Centralized Tauri IPC wrapper — all invoke/listen calls go through here
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { DiskInfo, ScanResult, ScanProgress, CleanupResult, DevJunkItem } from '../types';

// ── Disk Info ──
export const getDiskInfo = () =>
  invoke<DiskInfo>('get_disk_info');

export const checkFDAStatus = () =>
  invoke<boolean>('check_fda_status');

// ── Scanning ──
export const startScan = (path: string, maxDepth?: number) =>
  invoke<ScanResult>('start_scan', { path, maxDepth });

export const cancelScan = () =>
  invoke<void>('cancel_scan');

export const findLargeFiles = (path: string, minSizeBytes: number) =>
  invoke<ScanResult>('find_large_files', { path, minSizeBytes });

// ── Developer Tools ──
export const scanDevJunk = () =>
  invoke<DevJunkItem[]>('scan_dev_junk');

// ── Duplicates ──
export const findDuplicates = (path: string) =>
  invoke<ScanResult>('find_duplicates', { path });

// ── Cleanup ──
export const cleanupItems = (paths: string[]) =>
  invoke<CleanupResult>('cleanup_items', { paths });

// ── File Operations ──
export const openInFinder = (path: string) =>
  invoke<void>('open_in_finder', { path });

// ── Event Listeners ──
export const onScanProgress = (callback: (progress: ScanProgress) => void): Promise<UnlistenFn> =>
  listen<ScanProgress>('scan://progress', (event) => callback(event.payload));

export const onCleanupProgress = (
  callback: (progress: { completed: number; total: number }) => void
): Promise<UnlistenFn> =>
  listen<{ completed: number; total: number }>('cleanup://progress', (event) => callback(event.payload));
```

**AI must use these wrappers in hooks, NEVER call `invoke()` directly in components.**

---

## 24. Utility Specs

### 24.1 Size Formatting (src/lib/format.ts)

```typescript
// src/lib/format.ts

/**
 * Format bytes to human-readable string.
 * Rules:
 * - < 1 KB → "XXX B"
 * - < 1 MB → "X.X KB"
 * - < 1 GB → "X.X MB"  (1 decimal)
 * - >= 1 GB → "X.XX GB" (2 decimals)
 * - >= 1 TB → "X.XX TB" (2 decimals)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const decimals = i >= 3 ? 2 : i >= 1 ? 1 : 0;
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${units[i]}`;
}

/**
 * Format unix timestamp to relative time.
 * Rules:
 * - < 1 hour → "X minutes ago"
 * - < 24 hours → "X hours ago"
 * - < 30 days → "X days ago"
 * - < 365 days → "X months ago"
 * - >= 365 days → "X years ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

/**
 * Format percentage with appropriate precision.
 */
export function formatPercent(used: number, total: number): string {
  if (total === 0) return '0%';
  const pct = (used / total) * 100;
  return pct >= 10 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
}
```

---

## 25. SQLite Cache Schema

The scanner caches results in SQLite so re-opening the app doesn't require a full re-scan.

```sql
-- Database location: ~/Library/Application Support/com.cleanmymac.app/scan_cache.db

CREATE TABLE IF NOT EXISTS scan_cache (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT NOT NULL,               -- scanned root path
    scan_data   TEXT NOT NULL,               -- JSON-serialized ScanResult
    total_size  INTEGER NOT NULL,            -- for quick lookup without parsing JSON
    file_count  INTEGER NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expires_at  INTEGER NOT NULL             -- cache TTL (default: created_at + 24h)
);

CREATE INDEX idx_scan_cache_path ON scan_cache(path);

CREATE TABLE IF NOT EXISTS ignored_files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT NOT NULL UNIQUE,         -- file/dir to ignore in future scans
    reason      TEXT,                          -- why user ignored it
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS cleanup_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    freed_bytes INTEGER NOT NULL,
    items_count INTEGER NOT NULL,
    details     TEXT NOT NULL,                -- JSON array of cleaned paths
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
```

**Cache rules:**
- Default TTL: 24 hours (re-scan if cache expired)
- Force re-scan: user can click "Refresh" button
- After cleanup: invalidate cache for affected paths
- `ignored_files`: persist user's "don't show this again" choices
- `cleanup_history`: for the "History" tab and scheduled cleanup logs

---

## 26. Component Pattern Example

This is the reference pattern for how a page component should look. AI must follow this structure.

```tsx
// src/pages/Dashboard.tsx — REFERENCE IMPLEMENTATION
import { useEffect } from 'react';
import { HardDrive, Scan, Trash } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useDiskInfo } from '../hooks/use-disk-info';
import { useScanStore } from '../stores/scan-store';
import { formatBytes, formatPercent } from '../lib/format';

export default function Dashboard() {
  const { diskInfo, isLoading, error, refresh } = useDiskInfo();
  const { scanResult } = useScanStore();

  useEffect(() => {
    refresh(); // fetch disk info on mount
  }, []);

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>

      {/* Disk usage bar */}
      {diskInfo && (
        <DiskUsageBar
          used={diskInfo.used_space}
          total={diskInfo.total_capacity}
        />
      )}

      {/* Category cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* ... category cards using scanResult.categories */}
      </div>
    </motion.div>
  );
}
```

**Key patterns to follow:**
1. Import icons from `@phosphor-icons/react`
2. Use `motion.div` from framer-motion for page transitions
3. Use custom hooks (never raw `invoke()`)
4. Use `formatBytes`/`formatPercent` from `lib/format.ts`
5. Handle loading and error states
6. Use Tailwind classes for styling

