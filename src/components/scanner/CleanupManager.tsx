import { useMemo, useState } from 'react';
import {
  Broom,
  Trash,
  AppWindow,
  FileArchive,
  FileImage,
  Folder,
  File as FileIcon,
  CheckSquareOffset
} from '@phosphor-icons/react';
import type { FileNode } from '../../types';
import { formatBytes } from '../../lib/format';

interface CleanupManagerProps {
  rootNode: FileNode | null;
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onSelectGroup: (paths: string[]) => void;
}

// Fixed categories to map FileNodes into
const CATEGORIES = [
  { id: 'SystemJunk', label: 'System Junk', icon: Broom, color: 'text-purple-400', bg: 'bg-purple-400/20' },
  { id: 'Applications', label: 'Applications', icon: AppWindow, color: 'text-green-400', bg: 'bg-green-400/20' },
  { id: 'LargeFiles', label: 'Large Files', icon: FileArchive, color: 'text-orange-400', bg: 'bg-orange-400/20' },
  { id: 'Media', label: 'Media & Docs', icon: FileImage, color: 'text-blue-400', bg: 'bg-blue-400/20' },
  { id: 'Trash', label: 'Trash Bins', icon: Trash, color: 'text-red-400', bg: 'bg-red-400/20' },
  { id: 'Other', label: 'Other Data', icon: Folder, color: 'text-white/60', bg: 'bg-white/10' },
];

export function CleanupManager({ rootNode, selectedPaths, onToggleSelect, onSelectGroup }: CleanupManagerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('SystemJunk');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  // Parse tree into categories
  const parsedData = useMemo(() => {
    const data: Record<string, Record<string, FileNode[]>> = {};
    CATEGORIES.forEach(c => data[c.id] = {});

    const traverse = (node: FileNode, currentParent: string = 'Unknown') => {
      if (node.is_dir && node.children) {
        node.children.forEach(child => traverse(child, node.name));
        return;
      }

      // It's a file or we treat it as leaf
      let catId = 'Other';
      if (['Cache', 'Log', 'DevCache', 'System'].includes(node.file_type)) catId = 'SystemJunk';
      else if (node.file_type === 'Application') catId = 'Applications';
      else if (node.file_type === 'Media' || node.file_type === 'Document') catId = 'Media';
      else if (node.file_type === 'Archive') catId = 'LargeFiles';
      else if (node.size > 100 * 1024 * 1024) catId = 'LargeFiles';
      else if (node.file_type === 'Trash' || node.path.toLowerCase().includes('/.trash/')) catId = 'Trash';

      // Subcategory is the parent folder name, or some generic name
      let subcat = currentParent;
      if (catId === 'SystemJunk') {
        const p = node.path.toLowerCase();
        if (p.includes('/caches/')) subcat = 'User Cache Files';
        else if (p.includes('/logs/')) subcat = 'User Log Files';
        else if (p.includes('/preferences/')) subcat = 'Broken Preferences';
      } else if (catId === 'Applications') {
        subcat = 'Installed Applications';
      } else if (catId === 'Trash') {
        subcat = 'Local Trash';
      }

      if (!data[catId][subcat]) {
        data[catId][subcat] = [];
      }
      data[catId][subcat].push(node);
    };

    if (rootNode) traverse(rootNode);

    // Filter out empty subcategories
    const cleanData: Record<string, { name: string, items: FileNode[], size: number }[]> = {};
    Object.keys(data).forEach(catId => {
      const subcats = Object.keys(data[catId]).map(subcatName => {
        const items = data[catId][subcatName].sort((a, b) => b.size - a.size);
        const size = items.reduce((sum, item) => sum + item.size, 0);
        return { name: subcatName, items, size };
      }).filter(s => s.items.length > 0)
        .sort((a, b) => b.size - a.size);
      
      cleanData[catId] = subcats;
    });

    return cleanData;
  }, [rootNode]);

  // Handle default subcategory selection when switching categories
  useMemo(() => {
    if (parsedData[activeCategory] && parsedData[activeCategory].length > 0) {
      if (!parsedData[activeCategory].find(s => s.name === activeSubcategory)) {
        setActiveSubcategory(parsedData[activeCategory][0].name);
      }
    } else {
      setActiveSubcategory(null);
    }
  }, [activeCategory, parsedData]);

  const activeSubcategories = parsedData[activeCategory] || [];
  const currentSubcatData = activeSubcategories.find(s => s.name === activeSubcategory);
  const items = currentSubcatData?.items || [];

  return (
    <div className="flex h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
      {/* Pane 1: Categories */}
      <div className="w-1/4 border-r border-white/10 bg-black/10 flex flex-col p-4 space-y-2">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
                isActive 
                  ? `${cat.bg} text-white font-medium border border-white/10 shadow-lg` 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? cat.color : 'text-white/40'} weight={isActive ? "fill" : "duotone"} />
              <span className="text-sm">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pane 2: Subcategories */}
      <div className="w-1/3 border-r border-white/10 bg-black/5 flex flex-col">
        <div className="p-6 pb-2 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-semibold text-white mb-2">{CATEGORIES.find(c => c.id === activeCategory)?.label}</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            Select a subcategory to view its contents and safely remove items to free up disk space.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {activeSubcategories.length === 0 ? (
            <div className="text-center p-6 text-white/30 text-sm">No items found in this category.</div>
          ) : (
            activeSubcategories.map(subcat => {
              const isActive = activeSubcategory === subcat.name;
              return (
                <button
                  key={subcat.name}
                  onClick={() => setActiveSubcategory(subcat.name)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-medium">{subcat.name}</span>
                    <span className="text-xs opacity-60">{formatBytes(subcat.size)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Pane 3: Items */}
      <div className="flex-1 flex flex-col bg-transparent relative">
        {currentSubcatData ? (
          <>
            <div className="p-6 pb-4 border-b border-white/5 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{currentSubcatData.name}</h3>
                <p className="text-xs text-white/50 mt-1">{currentSubcatData.items.length} items</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {items.map(item => {
                const isSelected = selectedPaths.has(item.path);
                return (
                  <div
                    key={item.path}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onToggleSelect(item.path)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                      <button className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#00F0FF] text-black' : 'border border-white/20 text-transparent group-hover:border-white/40'
                      }`}>
                        <CheckSquareOffset size={14} weight="fill" className={isSelected ? 'opacity-100' : 'opacity-0'} />
                      </button>
                      
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-[#00F0FF]">
                        {item.is_dir ? <Folder size={18} weight="fill" /> : <FileIcon size={18} weight="duotone" />}
                      </div>
                      
                      <span className="text-sm text-white truncate group-hover:text-[#00F0FF] transition-colors">
                        {item.name}
                      </span>
                    </div>
                    
                    <span className="text-xs text-white/50 font-medium whitespace-nowrap">
                      {formatBytes(item.size)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-white/30 text-sm">
            Select a subcategory to view details
          </div>
        )}
      </div>
    </div>
  );
}
