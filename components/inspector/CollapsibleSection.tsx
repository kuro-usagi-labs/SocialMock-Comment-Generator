import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Collapsible section for the Right Inspector.
 * Provides consistent section headers with expand/collapse behavior.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  badge,
  rightAction,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <div className={`border-b border-slate-100 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-slate-50"
      >
        {isOpen ? (
          <ChevronDown size={12} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
        )}
        {icon && <span className="text-slate-500">{icon}</span>}
        <span className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {title}
        </span>
        {badge !== undefined && (
          <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
            {badge}
          </span>
        )}
        {rightAction && (
          <span className="ml-auto" onClick={e => e.stopPropagation()}>
            {rightAction}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
