import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { AnimationStyle, EasingPreset } from '../types';

interface MotionPresetGalleryProps {
  currentStyle: AnimationStyle;
  currentEasing: EasingPreset;
  direction: 'in' | 'out' | 'emphasis';
  onSelect: (style: AnimationStyle, easing: EasingPreset) => void;
  onClose: () => void;
}

interface PresetEntry {
  style: AnimationStyle;
  label: string;
  description: string;
  group: 'fade' | 'slide' | 'scale' | 'rotate' | 'blur' | 'emphasis' | 'none';
  icon: string; // emoji as visual thumbnail placeholder
  recommendedEasing: EasingPreset;
}

const presets: PresetEntry[] = [
  { style: 'none', label: 'None', description: 'No animation', group: 'none', icon: '⊘', recommendedEasing: 'linear' },
  { style: 'pop', label: 'Pop', description: 'Subtle scale up with bounce', group: 'scale', icon: '●', recommendedEasing: 'ease-out' },
  { style: 'fade-scale', label: 'Fade Scale', description: 'Gentle fade with scale', group: 'fade', icon: '◎', recommendedEasing: 'ease-in-out' },
  { style: 'slide-up', label: 'Slide Up', description: 'Enter from below', group: 'slide', icon: '↑', recommendedEasing: 'ease-out' },
  { style: 'slide-down', label: 'Slide Down', description: 'Enter from above', group: 'slide', icon: '↓', recommendedEasing: 'ease-out' },
  { style: 'slide-left', label: 'Slide Left', description: 'Enter from right', group: 'slide', icon: '←', recommendedEasing: 'ease-out' },
  { style: 'slide-right', label: 'Slide Right', description: 'Enter from left', group: 'slide', icon: '→', recommendedEasing: 'ease-out' },
  { style: 'elastic-spin', label: 'Elastic Spin', description: 'Spin with spring easing', group: 'rotate', icon: '↻', recommendedEasing: 'elastic' },
  { style: 'flip-in', label: 'Flip In', description: '3D flip entrance', group: 'rotate', icon: '⤾', recommendedEasing: 'ease-out' },
  { style: 'bounce-in', label: 'Bounce', description: 'Bouncy entrance', group: 'scale', icon: '⟡', recommendedEasing: 'bounce' },
  { style: 'rubber-band', label: 'Rubber Band', description: 'Stretchy wobble', group: 'emphasis', icon: '∿', recommendedEasing: 'ease-out' },
  { style: 'shake', label: 'Shake', description: 'Horizontal shake', group: 'emphasis', icon: '↔', recommendedEasing: 'linear' },
  { style: 'wiggle', label: 'Wiggle', description: 'Rotational wiggle', group: 'emphasis', icon: '∿', recommendedEasing: 'linear' },
  { style: 'zoom-blur', label: 'Zoom Blur', description: 'Zoom with motion blur', group: 'blur', icon: '⊕', recommendedEasing: 'ease-out' },
  { style: 'rotate-in', label: 'Rotate In', description: 'Rotate and scale in', group: 'rotate', icon: '↻', recommendedEasing: 'ease-out' },
  { style: 'swipe-in', label: 'Swipe In', description: 'Fast horizontal swipe', group: 'slide', icon: '⇒', recommendedEasing: 'ease-out' },
  { style: 'glitch', label: 'Glitch', description: 'Digital glitch effect', group: 'emphasis', icon: '⚡', recommendedEasing: 'linear' },
];

const groupLabels: Record<string, string> = {
  none: 'None',
  fade: 'Fade',
  scale: 'Scale',
  slide: 'Slide',
  rotate: 'Rotate',
  blur: 'Blur',
  emphasis: 'Emphasis',
};

const easingOptions: Array<{ value: EasingPreset; label: string }> = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'elastic', label: 'Elastic' },
  { value: 'back', label: 'Back' },
];

export const MotionPresetGallery: React.FC<MotionPresetGalleryProps> = ({
  currentStyle,
  currentEasing,
  direction,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const filteredPresets = useMemo(() => {
    let filtered = presets;
    if (filterGroup !== 'all') {
      filtered = filtered.filter(p => p.group === filterGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [search, filterGroup]);

  const groups = useMemo(() => {
    const unique = [...new Set(filteredPresets.map(p => p.group))];
    return unique;
  }, [filteredPresets]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="font-display text-xs font-black uppercase tracking-wider text-slate-600">
          Motion Presets · {direction === 'in' ? 'Entrance' : direction === 'out' ? 'Exit' : 'Emphasis'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search presets..."
            className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-1 px-4 py-2">
        <button
          type="button"
          onClick={() => setFilterGroup('all')}
          className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            filterGroup === 'all' ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        {['fade', 'slide', 'scale', 'rotate', 'blur', 'emphasis'].map(group => (
          <button
            key={group}
            type="button"
            onClick={() => setFilterGroup(group)}
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              filterGroup === group ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            {groupLabels[group]}
          </button>
        ))}
      </div>

      {/* Preset grid */}
      <div className="max-h-[320px] overflow-y-auto px-4 pb-3">
        {groups.map(group => (
          <div key={group} className="mb-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {groupLabels[group]}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {filteredPresets.filter(p => p.group === group).map(preset => {
                const isActive = currentStyle === preset.style;
                return (
                  <button
                    key={preset.style}
                    type="button"
                    onClick={() => onSelect(preset.style, preset.recommendedEasing)}
                    className={`group relative flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition ${
                      isActive
                        ? 'border-violet-400 bg-violet-50 shadow-sm'
                        : 'border-slate-150 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    {/* Visual preview thumbnail (emoji placeholder) */}
                    <div className={`flex h-10 w-full items-center justify-center rounded-md text-xl transition ${
                      isActive ? 'bg-violet-100' : 'bg-slate-50 group-hover:bg-slate-100'
                    }`}>
                      {preset.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{preset.label}</span>
                    {isActive && (
                      <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Easing picker */}
      <div className="border-t border-slate-100 px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Easing</p>
        <div className="flex flex-wrap gap-1">
          {easingOptions.map(easing => (
            <button
              key={easing.value}
              type="button"
              onClick={() => onSelect(currentStyle, easing.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                currentEasing === easing.value
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
              }`}
            >
              {easing.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MotionPresetGallery;
