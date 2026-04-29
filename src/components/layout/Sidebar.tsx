import { NavLink } from 'react-router-dom';
import {
  HardDrives,
  MagnifyingGlass,
  ChartDonut,
  Wrench,
  Gear,
  FileMagnifyingGlass,
} from '@phosphor-icons/react';

const navItems = [
  { to: '/', icon: HardDrives, label: 'Dashboard' },
  { to: '/scan', icon: MagnifyingGlass, label: 'Scanner' },
  { to: '/visualize', icon: ChartDonut, label: 'Visualizer' },
  { to: '/dev-tools', icon: Wrench, label: 'Dev Tools' },
  { to: '/large-files', icon: FileMagnifyingGlass, label: 'Large Files' },
  { to: '/settings', icon: Gear, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-60 h-full flex flex-col border-r border-bg-tertiary bg-bg-secondary">
      {/* Drag region for macOS title bar */}
      <div className="drag-region h-12 flex items-end px-5 pb-2">
        <span className="no-drag text-sm font-semibold text-text-secondary tracking-wide uppercase">
          CleanMyMac
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `no-drag flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`
            }
          >
            <Icon size={20} weight="duotone" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-bg-tertiary">
        <p className="text-xs text-text-muted">v0.1.0</p>
      </div>
    </aside>
  );
}
