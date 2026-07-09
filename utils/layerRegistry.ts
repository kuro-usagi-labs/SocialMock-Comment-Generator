import {
  BackgroundLayer,
  CardLayer,
  ImageLayer,
  Layer,
  LayerActionBlock,
  LayerType,
  ShapeLayer,
  TextLayer,
} from '../types';

// ---------------------------------------------------------------
// Layer Registry — Milestone 6
// Central registry for layer type defaults, validation, and metadata.
// Adding a new layer type only requires adding an entry here.
// ---------------------------------------------------------------

export interface LayerTypeDefinition {
  type: LayerType;
  label: string;
  icon: string; // lucide icon name
  /** Create default values for this layer type */
  createDefaults(id: string, name: string): Layer;
  /** Validate type-specific fields (beyond base layer) */
  validate(layer: Layer): string[];
  /** Get a human-readable summary for the layer panel */
  summarize(layer: Layer): string;
}

const createBaseDefaults = <T extends LayerType>(id: string, type: T, name: string) => ({
  id,
  type: type as T,
  name,
  visible: true,
  zIndex: 10,
  x: 80,
  y: 80,
  width: 400,
  height: 300,
  rotation: 0,
  opacity: 1,
  delayFrames: 0,
  staggerFrames: 0,
  motionBlur: false,
  actionBlocks: [] as LayerActionBlock[],
});

const registry = new Map<LayerType, LayerTypeDefinition>();

registry.set('background', {
  type: 'background',
  label: 'Background',
  icon: 'Palette',
  createDefaults: (id, name): BackgroundLayer => ({
    ...createBaseDefaults(id, 'background', name),
    zIndex: 0,
    x: 0,
    y: 0,
    width: 1080,
    height: 1080,
    bgKind: 'solid',
    bgColor1: '#0f172a',
    bgColor2: '#1e293b',
    bgGradientAngle: 135,
    bgImageUrl: null,
    bgImageFit: 'cover',
    bgBlur: 0,
  }),
  validate: (layer) => {
    const l = layer as BackgroundLayer;
    const errors: string[] = [];
    if (!l.bgColor1) errors.push('Background must have a fill color');
    return errors;
  },
  summarize: (layer) => {
    const l = layer as BackgroundLayer;
    if (l.bgKind === 'image') return l.bgImageUrl ? 'Image fill' : 'No image set';
    if (l.bgKind === 'solid') return `Solid ${l.bgColor1}`;
    return `${l.bgKind} gradient`;
  },
});

registry.set('card', {
  type: 'card',
  label: 'Comment Card',
  icon: 'MessageCircle',
  createDefaults: (id, name): CardLayer => ({
    ...createBaseDefaults(id, 'card', name),
    cardConfig: null,
  }),
  validate: () => [],
  summarize: () => 'Social media card',
});

registry.set('text', {
  type: 'text',
  label: 'Text',
  icon: 'Type',
  createDefaults: (id, name): TextLayer => ({
    ...createBaseDefaults(id, 'text', name),
    text: 'New text',
    textFont: 'outfit',
    textWeight: 'bold',
    textAlign: 'center',
    textColor: '#ffffff',
    textStrokeColor: '#0f172a',
    textStrokeWidth: 0,
    textShadow: false,
    textTemplate: 'minimal',
    textSize: 36,
    textLetterSpacing: 0,
    textLineHeight: 110,
    backgroundColor: '',
    paddingX: 16,
    paddingY: 12,
    borderRadius: 12,
  }),
  validate: (layer) => {
    const l = layer as TextLayer;
    const errors: string[] = [];
    if (l.textSize <= 0) errors.push('Text size must be positive');
    return errors;
  },
  summarize: (layer) => {
    const l = layer as TextLayer;
    const preview = l.text.length > 30 ? l.text.slice(0, 30) + '...' : l.text;
    return `"${preview}"`;
  },
});

registry.set('shape', {
  type: 'shape',
  label: 'Shape',
  icon: 'Square',
  createDefaults: (id, name): ShapeLayer => ({
    ...createBaseDefaults(id, 'shape', name),
    shapeKind: 'rectangle',
    fillColor: '#6366f1',
    strokeColor: '',
    strokeWidth: 0,
    borderRadius: 0,
    lineOrientation: 'horizontal',
  }),
  validate: (layer) => {
    const l = layer as ShapeLayer;
    const errors: string[] = [];
    if (l.strokeWidth < 0) errors.push('Stroke width must be non-negative');
    return errors;
  },
  summarize: (layer) => {
    const l = layer as ShapeLayer;
    return l.shapeKind.charAt(0).toUpperCase() + l.shapeKind.slice(1);
  },
});

registry.set('image', {
  type: 'image',
  label: 'Image',
  icon: 'ImageIcon',
  createDefaults: (id, name): ImageLayer => ({
    ...createBaseDefaults(id, 'image', name),
    src: null,
    fitMode: 'cover',
    blur: 0,
    brightness: 100,
    grayscale: 0,
  }),
  validate: (layer) => {
    const l = layer as ImageLayer;
    const errors: string[] = [];
    if (l.brightness < 0 || l.brightness > 200) errors.push('Brightness must be 0-200');
    if (l.grayscale < 0 || l.grayscale > 100) errors.push('Grayscale must be 0-100');
    return errors;
  },
  summarize: (layer) => {
    const l = layer as ImageLayer;
    return l.src ? 'Image loaded' : 'No image set';
  },
});

/**
 * Get the type definition for a layer type.
 */
export function getLayerTypeDef(type: LayerType): LayerTypeDefinition | undefined {
  return registry.get(type);
}

/**
 * Get all registered layer type definitions.
 */
export function getAllLayerTypes(): LayerTypeDefinition[] {
  return Array.from(registry.values());
}

/**
 * Create a new layer with default values for the given type.
 */
export function createLayer(type: LayerType, id: string, name: string): Layer {
  const def = registry.get(type);
  if (!def) throw new Error(`Unknown layer type: ${type}`);
  return def.createDefaults(id, name);
}

/**
 * Validate a layer against its type definition.
 */
export function validateLayer(layer: Layer): string[] {
  const def = registry.get(layer.type);
  if (!def) return [`Unknown layer type: ${layer.type}`];
  return def.validate(layer);
}

/**
 * Get a human-readable summary of a layer for display in the layer panel.
 */
export function getLayerSummary(layer: Layer): string {
  const def = registry.get(layer.type);
  if (!def) return layer.type;
  return def.summarize(layer);
}
