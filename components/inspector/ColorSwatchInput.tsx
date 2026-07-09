import React, { useCallback, useRef, useState } from 'react';

interface ColorSwatchInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9',
  '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

/**
 * Color input with small swatch preview and hex input.
 * Shows a swatch next to a compact text field.
 */
export const ColorSwatchInput: React.FC<ColorSwatchInputProps> = ({
  value,
  onChange,
  label,
  className = '',
  presets = DEFAULT_PRESETS,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleSwatchClick = useCallback(() => {
    setShowPicker(prev => !prev);
    setEditValue(value);
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEditValue(v);
    // Only commit valid hex colors
    if (/^#[0-9a-fA-F]{3,8}$/.test(v)) {
      onChange(v);
    }
  }, [onChange]);

  const handlePresetClick = useCallback((color: string) => {
    onChange(color);
    setShowPicker(false);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (/^#[0-9a-fA-F]{3,8}$/.test(editValue)) {
      onChange(editValue);
    }
  }, [editValue, onChange]);

  // Close picker on outside click
  React.useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [showPicker]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {label && (
          <span className="w-10 shrink-0 text-[10px] font-bold text-slate-400">{label}</span>
        )}
        <button
          type="button"
          onClick={handleSwatchClick}
          className="h-6 w-6 shrink-0 rounded-md border border-slate-200 shadow-sm transition hover:scale-110"
          style={{ backgroundColor: value || 'transparent' }}
          title={`Current: ${value}`}
          aria-label={`Color: ${value}`}
        />
        <input
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="h-7 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none transition focus:border-indigo-400"
          placeholder="#000000"
        />
      </div>

      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute left-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 grid grid-cols-8 gap-1">
            {presets.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className={`h-5 w-5 rounded-md border transition hover:scale-110 ${
                  value === color ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-200'
                }`}
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
          <input
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(e.target.value)}
            className="h-8 w-full cursor-pointer rounded-md border border-slate-200"
          />
        </div>
      )}
    </div>
  );
};

export default ColorSwatchInput;
