import { NavLink, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  return (
    <aside className="w-64 h-full flex flex-col bg-white/5 backdrop-blur-md border-r border-white/10 z-50">
      {/* Drag region for macOS title bar */}
      <div className="drag-region h-12 flex items-end px-5 pb-2">
        <span className="no-drag text-sm font-semibold text-white/80 tracking-wide">
          CleanMyMac
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `no-drag flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={22} weight={location.pathname === to ? "fill" : "duotone"} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">v0.1.0</p>
      </div>
    </aside>
  );
}
