import {
  MotionDocument,
  Layer,
  LayerActionBlock,
  LayerType,
  LayerActionKind,
} from '../types';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_LAYER_TYPES: LayerType[] = ['background', 'card', 'text', 'shape', 'image'];
const VALID_ACTION_KINDS: LayerActionKind[] = ['in', 'out', 'emphasis'];

/**
 * Validate a MotionDocument for structural integrity.
 * Returns all errors found so callers can display them at once.
 */
export function validateDocument(document: MotionDocument): ValidationResult {
  const errors: ValidationError[] = [];

  // --- Root level ---
  if (!document.id || typeof document.id !== 'string') {
    errors.push({ path: 'document.id', message: 'Document ID is missing or invalid.' });
  }
  if (!document.title || typeof document.title !== 'string') {
    errors.push({ path: 'document.title', message: 'Document title is missing.' });
  }
  if (!Array.isArray(document.scenes) || document.scenes.length === 0) {
    errors.push({ path: 'document.scenes', message: 'Document must have at least one scene.' });
  }
  if (!document.activeSceneId) {
    errors.push({ path: 'document.activeSceneId', message: 'Active scene ID is missing.' });
  }

  // --- Scenes ---
  if (document.scenes) {
    const sceneIds = new Set<string>();
    for (let i = 0; i < document.scenes.length; i++) {
      const scene = document.scenes[i];
      const prefix = `scenes[${i}]`;

      if (!scene.id || typeof scene.id !== 'string') {
        errors.push({ path: `${prefix}.id`, message: 'Scene ID is missing.' });
      } else if (sceneIds.has(scene.id)) {
        errors.push({ path: `${prefix}.id`, message: `Duplicate scene ID: ${scene.id}` });
      } else {
        sceneIds.add(scene.id);
      }

      if (!scene.config) {
        errors.push({ path: `${prefix}.config`, message: 'Scene is missing config.' });
      } else if (scene.config.canvas?.layers) {
        validateLayers(scene.config.canvas.layers, prefix, errors);
      }
    }
  }

  // --- Export settings ---
  if (document.exportSettings) {
    const es = document.exportSettings;
    if (es.quality < 0 || es.quality > 100) {
      errors.push({ path: 'exportSettings.quality', message: 'Quality must be 0-100.' });
    }
    if (es.fps <= 0) {
      errors.push({ path: 'exportSettings.fps', message: 'FPS must be positive.' });
    }
    if (es.width <= 0 || es.height <= 0) {
      errors.push({ path: 'exportSettings.width/height', message: 'Width and height must be positive.' });
    }
  }

  // --- Assets ---
  if (document.assets) {
    const assetIds = new Set<string>();
    for (let i = 0; i < document.assets.length; i++) {
      const asset = document.assets[i];
      const prefix = `assets[${i}]`;
      if (!asset.id) {
        errors.push({ path: `${prefix}.id`, message: 'Asset ID is missing.' });
      } else if (assetIds.has(asset.id)) {
        errors.push({ path: `${prefix}.id`, message: `Duplicate asset ID: ${asset.id}` });
      } else {
        assetIds.add(asset.id);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateLayers(layers: Layer[], scenePrefix: string, errors: ValidationError[]): void {
  const layerIds = new Set<string>();

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const prefix = `${scenePrefix}.layers[${i}]`;

    // ID check
    if (!layer.id || typeof layer.id !== 'string') {
      errors.push({ path: `${prefix}.id`, message: 'Layer ID is missing.' });
    } else if (layerIds.has(layer.id)) {
      errors.push({ path: `${prefix}.id`, message: `Duplicate layer ID: ${layer.id}` });
    } else {
      layerIds.add(layer.id);
    }

    // Type check
    if (!VALID_LAYER_TYPES.includes(layer.type)) {
      errors.push({ path: `${prefix}.type`, message: `Invalid layer type: ${layer.type}` });
    }

    // Numeric bounds
    if (layer.opacity < 0 || layer.opacity > 1) {
      errors.push({ path: `${prefix}.opacity`, message: 'Opacity must be 0-1.' });
    }
    if (layer.width <= 0 || layer.height <= 0) {
      errors.push({ path: `${prefix}.width/height`, message: 'Width and height must be positive.' });
    }
    if (layer.delayFrames < 0) {
      errors.push({ path: `${prefix}.delayFrames`, message: 'Delay frames must be non-negative.' });
    }

    // Action blocks
    if (layer.actionBlocks) {
      validateActionBlocks(layer.actionBlocks, prefix, errors);
    }
  }
}

function validateActionBlocks(
  blocks: LayerActionBlock[],
  layerPrefix: string,
  errors: ValidationError[],
): void {
  const actionIds = new Set<string>();

  for (let j = 0; j < blocks.length; j++) {
    const block = blocks[j];
    const prefix = `${layerPrefix}.actionBlocks[${j}]`;

    if (!block.id) {
      errors.push({ path: `${prefix}.id`, message: 'Action block ID is missing.' });
    } else if (actionIds.has(block.id)) {
      errors.push({ path: `${prefix}.id`, message: `Duplicate action block ID: ${block.id}` });
    } else {
      actionIds.add(block.id);
    }

    if (!VALID_ACTION_KINDS.includes(block.kind)) {
      errors.push({ path: `${prefix}.kind`, message: `Invalid action kind: ${block.kind}` });
    }
    if (block.durationFrames <= 0) {
      errors.push({ path: `${prefix}.durationFrames`, message: 'Duration must be positive.' });
    }
    if (block.startFrame < 0) {
      errors.push({ path: `${prefix}.startFrame`, message: 'Start frame must be non-negative.' });
    }
    if (block.intensity < 0 || block.intensity > 1) {
      errors.push({ path: `${prefix}.intensity`, message: 'Intensity must be 0-1.' });
    }
  }
}
