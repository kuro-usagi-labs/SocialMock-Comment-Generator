import React from 'react';
import { CommentConfig } from '../types';

interface PreviewCanvasProps {
  config: CommentConfig;
  previewRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  hasBulkMessages?: boolean;
  children: React.ReactNode;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ config, previewRef, zoom, hasBulkMessages = false, children }) => {
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const displayZoom = viewportWidth < 768
    ? Math.min(zoom, Math.max(0.25, (viewportWidth - 88) / config.width))
    : zoom;

  const getBackgroundClass = () => {
    if (config.backgroundType === 'transparent') return 'bg-transparent';
    if (config.backgroundType === 'gradient') return `bg-gradient-to-r ${config.backgroundColor}`;
    return '';
  };

  const getBackgroundStyle = () => {
    if (config.backgroundType === 'solid') return { backgroundColor: config.backgroundColor };
    return {};
  };

  return (
    <div 
      className="relative min-h-0 flex-1 overflow-auto px-4 md:px-6 lg:pr-[100px] xl:pr-[110px]"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1.2px)`,
        backgroundSize: '18px 18px',
      }}
    >
      <div
        className={`relative mx-auto flex w-full flex-1 min-h-full items-center justify-center pt-12 ${
          hasBulkMessages ? 'pb-[240px]' : 'pb-16'
        }`}
      >
        <div className="pointer-events-none absolute left-5 top-5 hidden items-center gap-2 rounded-full glass-panel px-3 py-1.5 text-xs font-bold text-slate-500 md:flex shadow-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
          <span className="truncate">Live Preview</span>
        </div>

        <div
          className={`rounded-[24px] transition-transform ${config.backgroundType === 'transparent' ? '' : 'shadow-[0_28px_70px_rgba(15,23,42,0.15)]'}`}
          style={{ maxWidth: `min(100%, ${config.width * displayZoom}px)` }}
        >
          <div style={{ width: `${config.width * displayZoom}px` }}>
            <div
              ref={previewRef}
              className="origin-top-left transition-transform duration-200"
              style={{ transform: `scale(${displayZoom})`, width: `${config.width}px` }}
            >
            <div
              id="export-container"
              className={`p-8 rounded-[24px] ${getBackgroundClass()}`}
              style={getBackgroundStyle()}
            >
              {children}
            </div>
            </div>
          </div>
        </div>
        
        <div
          className={`absolute left-1/2 hidden -translate-x-1/2 rounded-[22px] glass-panel p-1.5 shadow-lg lg:block ${
            hasBulkMessages ? 'bottom-[228px]' : 'bottom-10'
          }`}
        >
          <div className="segmented-control">
            <button type="button" className="segmented-btn segmented-btn-active text-xs">Desktop</button>
            <button type="button" className="segmented-btn segmented-btn-inactive text-xs">Mobile</button>
          </div>
          <div className="px-2 pb-1 pt-1.5 text-center font-display text-[11px] font-bold text-slate-400">{config.width} x Auto</div>
        </div>
      </div>
    </div>
  );
};
