import { useState } from 'react';
import { FunnelSimple, X } from '@phosphor-icons/react';
import type { FileCategory, SafetyLevel } from '../../types';
import { getCategoryColor, getSafetyColor } from '../../lib/format';

interface FilterBarProps {
  categoryFilter: FileCategory[];
  safetyFilter: SafetyLevel[];
  onCategoryChange: (categories: FileCategory[]) => void;
  onSafetyChange: (levels: SafetyLevel[]) => void;
}

const ALL_CATEGORIES: FileCategory[] = [
  'System', 'Application', 'Document', 'Media', 'Code',
  'DevCache', 'Cache', 'Log', 'Archive', 'Trash', 'Other',
];

const ALL_SAFETY_LEVELS: SafetyLevel[] = ['Safe', 'Review', 'Caution'];
const SAFETY_LABELS: Record<SafetyLevel, string> = {
  Safe: '🟢 Safe',
  Review: '🟡 Review',
  Caution: '🔴 Caution',
};

export function FilterBar({
  categoryFilter,
  safetyFilter,
  onCategoryChange,
  onSafetyChange,
}: FilterBarProps) {
  const [showCategories, setShowCategories] = useState(false);
  const [showSafety, setShowSafety] = useState(false);

  const hasFilters = categoryFilter.length > 0 || safetyFilter.length > 0;

  const toggleCategory = (cat: FileCategory) => {
    if (categoryFilter.includes(cat)) {
      onCategoryChange(categoryFilter.filter((c) => c !== cat));
    } else {
      onCategoryChange([...categoryFilter, cat]);
    }
  };

  const toggleSafety = (level: SafetyLevel) => {
    if (safetyFilter.includes(level)) {
      onSafetyChange(safetyFilter.filter((l) => l !== level));
    } else {
      onSafetyChange([...safetyFilter, level]);
    }
  };

  const clearAll = () => {
    onCategoryChange([]);
    onSafetyChange([]);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Category filter dropdown */}
      <div className="relative">
        <button
          onClick={() => { setShowCategories(!showCategories); setShowSafety(false); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            categoryFilter.length > 0
              ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
              : 'bg-white/[0.04] text-text-secondary hover:text-text-primary border border-transparent hover:border-white/[0.08]'
          }`}
        >
          <FunnelSimple size={14} />
          Category
          {categoryFilter.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary text-[10px]">
              {categoryFilter.length}
            </span>
          )}
        </button>

        {showCategories && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCategories(false)} />
            <div className="absolute top-full left-0 mt-1 z-20 w-48 py-1 rounded-xl bg-bg-tertiary border border-white/[0.08] shadow-xl">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    categoryFilter.includes(cat)
                      ? 'bg-accent-primary/10 text-text-primary'
                      : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(cat) }}
                  />
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Safety filter dropdown */}
      <div className="relative">
        <button
          onClick={() => { setShowSafety(!showSafety); setShowCategories(false); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            safetyFilter.length > 0
              ? 'bg-safe/15 text-safe border border-safe/30'
              : 'bg-white/[0.04] text-text-secondary hover:text-text-primary border border-transparent hover:border-white/[0.08]'
          }`}
        >
          Safety
          {safetyFilter.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-safe/20 text-safe text-[10px]">
              {safetyFilter.length}
            </span>
          )}
        </button>

        {showSafety && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSafety(false)} />
            <div className="absolute top-full left-0 mt-1 z-20 w-40 py-1 rounded-xl bg-bg-tertiary border border-white/[0.08] shadow-xl">
              {ALL_SAFETY_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleSafety(level)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    safetyFilter.includes(level)
                      ? 'bg-accent-primary/10 text-text-primary'
                      : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                  }`}
                >
                  {SAFETY_LABELS[level]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
