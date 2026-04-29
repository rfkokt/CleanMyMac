import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top drag region for the main area */}
        <div className="drag-region h-12 w-full shrink-0" />
        <div className="px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
