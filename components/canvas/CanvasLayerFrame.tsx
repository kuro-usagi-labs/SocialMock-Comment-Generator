import React from 'react';
import { Layer } from '../../types';
import { composeLayerTransform, getLayerMotion, MotionContext } from '../../utils/motionEngine';

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface CanvasLayerFrameProps {
  layer: Layer;
  selected: boolean;
  showSelectionChrome: boolean;
  dragging: boolean;
  motionContext: MotionContext;
  registerLayerTarget: (layerId: string, element: HTMLElement | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onSelect: () => void;
  onResizeHandlePointerDown?: (handle: ResizeHandle, event: React.PointerEvent<Element>) => void;
  className?: string;
  baseStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export const CanvasLayerFrame: React.FC<CanvasLayerFrameProps> = ({
  layer,
  selected,
  showSelectionChrome,
  dragging,
  motionContext,
  registerLayerTarget,
  onPointerDown,
  onSelect,
  onResizeHandlePointerDown,
  className = '',
  baseStyle,
  children,
}) => {
  const motion = getLayerMotion(layer, motionContext);
  const hasMotionAction = layer.actionBlocks?.some((a) => a.style !== 'none' && (a.kind === 'in' || a.kind === 'out' || a.kind === 'emphasis'));

  return (
    <div
      ref={(element) => registerLayerTarget(layer.id, element)}
      data-layer-id={layer.id}
      onPointerDown={onPointerDown}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`group/layer touch-none select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${className} ${
        showSelectionChrome && selected ? 'ring-2 ring-indigo-400 ring-offset-4 ring-offset-white' : ''
      }`}
      style={{
        ...baseStyle,
        transform: composeLayerTransform(layer, motion),
        opacity: (layer.opacity ?? 1) * motion.opacity,
        filter: motion.filter || undefined,
        transformOrigin: 'center',
        transition: 'none',
        willChange: hasMotionAction ? 'transform, opacity, filter' : 'auto',
        backfaceVisibility: (hasMotionAction || layer.opacity !== 1) ? 'hidden' : undefined,
        zIndex: layer.zIndex,
      }}
    >
      {showSelectionChrome && selected && (
        <div className="pointer-events-none absolute -top-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
          <span className="max-w-[140px] truncate">{layer.name}</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>{layer.x}px, {layer.y}px</span>
        </div>
      )}

      {/* Resize handles — only on fully manipulable layers */}
      {showSelectionChrome && selected && layer.visible && layer.id !== 'layer-bg-auto' && layer.id !== 'layer-card-auto' && onResizeHandlePointerDown && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {(
            [
              ['nw', '-top-[5px] -left-[5px]', 'cursor-nwse-resize'],
              ['n', '-top-[5px] left-1/2 -translate-x-1/2', 'cursor-ns-resize'],
              ['ne', '-top-[5px] -right-[5px]', 'cursor-nesw-resize'],
              ['e', '-right-[5px] top-1/2 -translate-y-1/2', 'cursor-ew-resize'],
              ['se', '-bottom-[5px] -right-[5px]', 'cursor-nwse-resize'],
              ['s', '-bottom-[5px] left-1/2 -translate-x-1/2', 'cursor-ns-resize'],
              ['sw', '-bottom-[5px] -left-[5px]', 'cursor-nesw-resize'],
              ['w', '-left-[5px] top-1/2 -translate-y-1/2', 'cursor-ew-resize'],
            ] as const
          ).map(([handle, position, cursor]) => (
            <div
              key={handle}
              role="button"
              aria-label={`Resize ${handle}`}
              className={`pointer-events-auto absolute h-2.5 w-2.5 rounded-sm border border-indigo-500 bg-white shadow-sm select-none ${position} ${cursor}`}
              onPointerDown={(event) => {
                event.stopPropagation();
                onResizeHandlePointerDown(handle as ResizeHandle, event);
              }}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
};
