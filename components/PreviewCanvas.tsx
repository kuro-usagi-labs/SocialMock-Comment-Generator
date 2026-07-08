import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentConfig } from '../types';
import { resolveCanvasBackgroundStyle } from '../utils/backgroundLayer';

import { ResizeHandle } from './canvas/CanvasLayerFrame';

interface PreviewCanvasProps {
  config: CommentConfig;
  previewRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  hasBulkMessages?: boolean;
  selectedLayerId?: string;
  showSelectionChrome?: boolean;
  mode?: 'canvas' | 'animation';
  isPlaying?: boolean;
  progress?: number;
  duration?: number;
  onCanvasSelect?: () => void;
  beginLayerResize?: (id: string, handle: ResizeHandle, event: React.PointerEvent<Element>) => void;
  children: React.ReactNode;
}

const PreviewCanvasComponent: React.FC<PreviewCanvasProps> = ({
  config,
  previewRef,
  zoom,
  hasBulkMessages = false,
  selectedLayerId,
  showSelectionChrome = true,
  mode = 'canvas',
  isPlaying = false,
  progress = 0,
  duration = 2,
  onCanvasSelect,
  children,
}) => {
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const displayZoom = viewportWidth < 768
    ? Math.min(zoom, Math.max(0.25, (viewportWidth - 88) / config.width))
    : zoom;

  const background = resolveCanvasBackgroundStyle(config);

  return (
    <div 
      onClick={onCanvasSelect}
      className="relative min-h-0 flex-1 overflow-auto rounded-[22px] border border-slate-200 bg-slate-100 px-4 md:px-6"
      style={{
        backgroundImage: `linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }}
    >
      <div
        className="relative mx-auto flex min-h-full w-full flex-1 items-center justify-center pb-16 pt-12"
      >
        <div className="pointer-events-none absolute left-4 top-4 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm md:flex">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
          <span className="truncate">{mode === 'animation' ? 'Motion Preview' : 'Live Preview'}</span>
        </div>

        {mode === 'animation' && (
          <div className="pointer-events-none absolute right-4 top-4 hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm md:flex">
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.14)]' : 'bg-slate-300'}`} />
            <span className="tabular-nums">{((duration || 2) * (progress / 100)).toFixed(2)}s</span>
            <span className="h-3 w-px bg-slate-200" />
            <span className="text-slate-400">Timeline linked</span>
          </div>
        )}

        <div
          className={`rounded-lg ${mode === 'animation' ? '' : 'transition-transform'} ${background.hasVisibleBackground ? 'shadow-[0_28px_70px_rgba(15,23,42,0.15)]' : ''}`}
          style={{ maxWidth: `min(100%, ${config.width * displayZoom}px)` }}
        >
          <div style={{ width: `${config.width * displayZoom}px` }}>
            <div
              ref={previewRef}
              className={`origin-top-left ${mode === 'animation' ? '' : 'transition-transform duration-200'}`}
              style={{ transform: `scale(${displayZoom})`, width: `${config.width}px` }}
            >
              <div
                id="export-container"
                className={`relative overflow-hidden rounded-[28px] p-8 flex justify-center ${mode === 'animation' ? '' : 'transition'} ${showSelectionChrome && selectedLayerId === 'layer-bg-auto' ? 'ring-2 ring-indigo-400 ring-offset-4 ring-offset-slate-100' : ''}`}
                style={{ backgroundColor: 'transparent' }}
              >
                {background.hasVisibleBackground && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={background.style}
                  />
                )}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={config.platform}
                    initial={mode === 'animation' ? false : { opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={mode === 'animation' ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: mode === 'animation' ? 0 : 0.25, ease: "easeOut" }}
                    className="relative z-10 w-full flex justify-center"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        <div
          className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm lg:block"
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

export const PreviewCanvas = React.memo(PreviewCanvasComponent);
