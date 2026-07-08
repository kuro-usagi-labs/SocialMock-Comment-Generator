import type React from 'react';
import { BackgroundLayer, CommentConfig, Layer } from '../types';

export interface BackgroundGradientPreset {
  label: string;
  value: string;
  color1: string;
  color2: string;
  angle: number;
}

export const BACKGROUND_GRADIENT_PRESETS: BackgroundGradientPreset[] = [
  { label: 'Blue to Purple', value: 'linear-gradient(135deg, #60a5fa, #a855f7)', color1: '#60a5fa', color2: '#a855f7', angle: 135 },
  { label: 'Pink to Orange', value: 'linear-gradient(135deg, #ec4899, #fb923c)', color1: '#ec4899', color2: '#fb923c', angle: 135 },
  { label: 'Green to Cyan', value: 'linear-gradient(135deg, #4ade80, #06b6d4)', color1: '#4ade80', color2: '#06b6d4', angle: 135 },
  { label: 'Dark', value: 'linear-gradient(135deg, #374151, #111827)', color1: '#374151', color2: '#111827', angle: 135 },
];

const LEGACY_TAILWIND_GRADIENTS: Record<string, BackgroundGradientPreset> = {
  'from-blue-400 to-purple-500': BACKGROUND_GRADIENT_PRESETS[0],
  'from-pink-500 to-orange-400': BACKGROUND_GRADIENT_PRESETS[1],
  'from-green-400 to-cyan-500': BACKGROUND_GRADIENT_PRESETS[2],
  'from-gray-700 to-gray-900': BACKGROUND_GRADIENT_PRESETS[3],
};

/**
 * Convert a BackgroundLayer's rich fields (bgKind, gradient, image, blur)
 * into the inline style for the export container. This is what makes the
 * inspector-driven background layer actually render on the canvas.
 *
 * Falls back to nothing (returns `undefined`) for non-background layers or
 * hidden backgrounds so the legacy `CommentConfig.backgroundType`/`backgroundColor`
 * path can take over.
 */
export interface BackgroundDerivedStyle {
  className?: string;
  style?: React.CSSProperties;
}

export interface ResolvedBackgroundStyle extends BackgroundDerivedStyle {
  hasVisibleBackground: boolean;
}

const gradientStyle = (angleDeg: number, color1: string, color2: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(${angleDeg}deg, ${color1}, ${color2})`,
  backgroundColor: color1,
});

const radialStyle = (color1: string, color2: string): React.CSSProperties => ({
  backgroundImage: `radial-gradient(circle at center, ${color1}, ${color2})`,
  backgroundColor: color1,
});

const imageStyle = (url: string | null, fit: BackgroundLayer['bgImageFit']): React.CSSProperties => {
  if (!url) return {};
  const size = fit === 'tile'
    ? 'var(--bg-tile, 220px) var(--bg-tile, 220px)'
    : fit;
  const repeat = fit === 'tile' ? 'repeat' : 'no-repeat';
  const position = fit === 'tile' ? undefined : 'center';
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: typeof size === 'string' && /^\d+$/.test(size) ? `${size}px ${size}px` : (size ?? 'cover'),
    backgroundRepeat: repeat,
    backgroundPosition: position,
    backgroundColor: 'transparent',
  };
};

const parseLinearGradient = (value: string): BackgroundGradientPreset | null => {
  const preset = BACKGROUND_GRADIENT_PRESETS.find(item => item.value === value) || LEGACY_TAILWIND_GRADIENTS[value];
  if (preset) return preset;

  const match = value.match(/^linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8}),\s*(#[0-9a-fA-F]{3,8})\)$/);
  if (!match) return null;
  return {
    label: 'Custom gradient',
    value,
    angle: Number(match[1]),
    color1: match[2],
    color2: match[3],
  };
};

export const deriveLegacyBackgroundStyle = (config: Pick<CommentConfig, 'backgroundType' | 'backgroundColor'>): ResolvedBackgroundStyle => {
  if (config.backgroundType === 'transparent') {
    return { hasVisibleBackground: false, style: { backgroundColor: 'transparent' } };
  }

  if (config.backgroundType === 'solid') {
    return {
      hasVisibleBackground: true,
      style: { backgroundColor: config.backgroundColor.startsWith('#') ? config.backgroundColor : '#e5e7eb' },
    };
  }

  const gradient = parseLinearGradient(config.backgroundColor) || BACKGROUND_GRADIENT_PRESETS[0];
  return {
    hasVisibleBackground: true,
    style: gradientStyle(gradient.angle, gradient.color1, gradient.color2),
  };
};

/**
 * Translates a BackgroundLayer into the React style/className tuple that
 * should be applied to the export container. Respects the layer's visibility
 * flag and skips when the layer is not actually a background variant.
 */
export const deriveBackgroundLayerStyle = (layer: Layer | undefined | null): BackgroundDerivedStyle => {
  if (!layer || layer.type !== 'background' || !layer.visible) {
    return {};
  }

  // Start with the layer's base color (always useful as a fallback fill).
  const baseStyle: React.CSSProperties = {
    backgroundColor: layer.bgColor1,
  };

  let fill: React.CSSProperties = baseStyle;
  switch (layer.bgKind) {
    case 'solid':
      fill = { ...baseStyle };
      break;
    case 'linear-gradient':
      fill = { ...baseStyle, ...gradientStyle(layer.bgGradientAngle, layer.bgColor1, layer.bgColor2) };
      break;
    case 'radial-gradient':
      fill = { ...baseStyle, ...radialStyle(layer.bgColor1, layer.bgColor2) };
      break;
    case 'image':
      fill = { ...baseStyle, ...imageStyle(layer.bgImageUrl, layer.bgImageFit) };
      break;
  }

  if (layer.bgBlur > 0) {
    fill.filter = `blur(${layer.bgBlur}px)`;
  }

  return { style: fill };
};

export const resolveCanvasBackgroundStyle = (
  config: Pick<CommentConfig, 'backgroundType' | 'backgroundColor' | 'canvas'>,
  options: { forceTransparent?: boolean } = {},
): ResolvedBackgroundStyle => {
  if (options.forceTransparent || config.backgroundType === 'transparent') {
    return { hasVisibleBackground: false, style: { backgroundColor: 'transparent' } };
  }

  const bgLayer = findBackgroundLayer(config.canvas?.layers ?? []);
  if (bgLayer) {
    if (!bgLayer.visible) {
      return { hasVisibleBackground: false, style: { backgroundColor: 'transparent' } };
    }
    const derived = deriveBackgroundLayerStyle(bgLayer);
    return {
      ...derived,
      hasVisibleBackground: !!derived.style,
    };
  }

  return deriveLegacyBackgroundStyle(config);
};

export const syncBackgroundLayerFromConfig = (config: CommentConfig): CommentConfig => {
  const layers = config.canvas?.layers ?? [];
  const bgLayer = findBackgroundLayer(layers);
  if (!bgLayer) return config;

  const nextBgLayer: BackgroundLayer = { ...bgLayer };
  if (config.backgroundType === 'transparent') {
    nextBgLayer.visible = false;
  } else if (config.backgroundType === 'solid') {
    nextBgLayer.visible = true;
    nextBgLayer.bgKind = 'solid';
    nextBgLayer.bgColor1 = config.backgroundColor.startsWith('#') ? config.backgroundColor : nextBgLayer.bgColor1;
  } else {
    const gradient = parseLinearGradient(config.backgroundColor) || BACKGROUND_GRADIENT_PRESETS[0];
    nextBgLayer.visible = true;
    nextBgLayer.bgKind = 'linear-gradient';
    nextBgLayer.bgColor1 = gradient.color1;
    nextBgLayer.bgColor2 = gradient.color2;
    nextBgLayer.bgGradientAngle = gradient.angle;
  }

  return {
    ...config,
    canvas: {
      ...config.canvas,
      layers: layers.map(layer => layer.id === nextBgLayer.id ? nextBgLayer : layer),
    },
  };
};

export const cloneConfigWithTransparentBackground = (config: CommentConfig): CommentConfig => ({
  ...config,
  greenscreen: false,
  backgroundType: 'transparent',
  canvas: {
    ...config.canvas,
    layers: config.canvas.layers.map(layer =>
      layer.type === 'background' ? ({ ...layer, visible: false } as Layer) : layer
    ),
  },
});

/**
 * Find the BACKGROUND layer in a layer array (typically the only one).
 * Returns `null` if there are zero or multiple; the caller decides
 * how to resolve duplicate IDs.
 */
export const findBackgroundLayer = (layers: Layer[]): BackgroundLayer | null => {
  const matches = layers.filter((layer): layer is BackgroundLayer => layer.type === 'background');
  if (matches.length === 0) return null;
  return matches[0];
};
