import React, { useCallback, useRef, useState } from 'react';

interface NumericScrubInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

/**
 * Numeric input with drag-to-scrub behavior.
 * Click and drag horizontally on the label/value to scrub the number.
 * Also supports direct keyboard input on click.
 */
export const NumericScrubInput: React.FC<NumericScrubInputProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  unit,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isEditing) return;
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startValue.current = value;

    const handleMove = (moveEvent: PointerEvent) => {
      if (!isDragging.current) return;
      const deltaX = moveEvent.clientX - startX.current;
      const newValue = clamp(startValue.current + deltaX * step);
      // Round to avoid floating point issues
      const rounded = Math.round(newValue / step) * step;
      onChange(rounded);
    };

    const handleUp = () => {
      isDragging.current = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  }, [value, step, clamp, onChange, isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(String(value));
    setTimeout(() => inputRef.current?.select(), 0);
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
    setIsEditing(false);
  }, [editValue, clamp, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [commitEdit]);

  const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="w-6 shrink-0 text-[10px] font-bold text-slate-400 select-none">
          {label}
        </span>
      )}
      <div
        className="flex h-7 min-w-[52px] cursor-ew-resize items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 select-none transition hover:border-indigo-300 hover:bg-indigo-50"
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={handleInputChange}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-center text-xs font-bold text-slate-700 outline-none"
            autoFocus
          />
        ) : (
          <span>{displayValue}{unit && <span className="ml-0.5 text-slate-400">{unit}</span>}</span>
        )}
      </div>
    </div>
  );
};

export default NumericScrubInput;
