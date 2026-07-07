import React from 'react';
import { ImageLayer, Layer, ShapeLayer, TextLayer } from '../../types';

const fontFamily: Record<TextLayer['textFont'], string> = {
  inter: 'var(--font-inter), Inter, system-ui, sans-serif',
  outfit: 'var(--font-outfit), Outfit, system-ui, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const fontWeight: Record<TextLayer['textWeight'], number> = {
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
};

const renderTextLayer = (layer: TextLayer) => (
  <div
    className="flex h-full w-full items-center"
    style={{
      justifyContent:
        layer.textAlign === 'left' ? 'flex-start' : layer.textAlign === 'right' ? 'flex-end' : 'center',
      padding: `${layer.paddingY}px ${layer.paddingX}px`,
      borderRadius: layer.borderRadius,
      backgroundColor: layer.backgroundColor || 'transparent',
      color: layer.textColor,
      fontFamily: fontFamily[layer.textFont],
      fontSize: layer.textSize,
      fontWeight: fontWeight[layer.textWeight],
      lineHeight: `${layer.textLineHeight}%`,
      letterSpacing: layer.textLetterSpacing,
      textAlign: layer.textAlign,
      WebkitTextStroke: layer.textStrokeWidth > 0 ? `${layer.textStrokeWidth}px ${layer.textStrokeColor}` : undefined,
      textShadow: layer.textShadow ? '0 12px 28px rgba(15, 23, 42, 0.24)' : undefined,
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    }}
  >
    <span className="block max-w-full">{layer.text}</span>
  </div>
);

const renderShapeLayer = (layer: ShapeLayer) => {
  const isLine = layer.shapeKind === 'line';
  const lineThickness = Math.max(2, layer.strokeWidth || 4);

  return (
    <div
      className="h-full w-full"
      style={{
        borderRadius: layer.shapeKind === 'circle' ? 9999 : layer.borderRadius,
        backgroundColor: isLine ? 'transparent' : layer.fillColor,
        border: isLine ? undefined : `${layer.strokeWidth}px solid ${layer.strokeColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isLine && (
        <span
          className="block rounded-full"
          style={{
            width: layer.lineOrientation === 'horizontal' ? '100%' : lineThickness,
            height: layer.lineOrientation === 'vertical' ? '100%' : lineThickness,
            backgroundColor: layer.strokeColor || layer.fillColor,
          }}
        />
      )}
    </div>
  );
};

const renderImageLayer = (layer: ImageLayer) => {
  const filter = `blur(${layer.blur}px) brightness(${layer.brightness}%) grayscale(${layer.grayscale}%)`;
  const objectFit = layer.fitMode === 'fill' ? 'fill' : layer.fitMode;

  if (!layer.src) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-[inherit] border border-dashed border-slate-300 bg-slate-50 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        Image
      </div>
    );
  }

  return (
    <img
      src={layer.src}
      alt=""
      draggable={false}
      className="h-full w-full select-none rounded-[inherit]"
      style={{
        objectFit,
        filter,
      }}
    />
  );
};

export const renderLayerContent = (layer: Layer) => {
  if (layer.type === 'text') return renderTextLayer(layer);
  if (layer.type === 'shape') return renderShapeLayer(layer);
  if (layer.type === 'image') return renderImageLayer(layer);
  return null;
};
