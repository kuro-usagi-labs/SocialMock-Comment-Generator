import React from 'react';
import { Layer } from '../../types';
import { composeLayerTransform, getLayerMotion, MotionContext } from '../../utils/motionEngine';

interface CanvasLayerFrameProps {
  layer: Layer;
  selected: boolean;
  showSelectionChrome: boolean;
  dragging: boolean;
  motionContext: MotionContext;
  registerLayerTarget: (layerId: string, element: HTMLElement | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onSelect: () => void;
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
  className = '',
  baseStyle,
  children,
}) => {
  const motion = getLayerMotion(layer, motionContext);

  return (
    <div
      ref={(element) => registerLayerTarget(layer.id, element)}
      data-layer-id={layer.id}
      onPointerDown={onPointerDown}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`group/layer touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${className} ${
        showSelectionChrome && selected ? 'ring-2 ring-indigo-400 ring-offset-4 ring-offset-white' : ''
      }`}
      style={{
        ...baseStyle,
        transform: composeLayerTransform(layer, motion),
        opacity: (layer.opacity ?? 1) * motion.opacity,
        filter: motion.filter || undefined,
        transformOrigin: 'center',
        transition: 'none',
        willChange: 'transform, opacity, filter',
        backfaceVisibility: 'hidden',
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
      {children}
    </div>
  );
};
