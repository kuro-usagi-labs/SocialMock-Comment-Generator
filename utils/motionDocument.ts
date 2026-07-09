import { CommentConfig, CURRENT_DOCUMENT_SCHEMA, INITIAL_CONFIG, MotionDocument, MotionDocumentSettings, ExportSettings } from '../types';

const cloneConfig = (config: CommentConfig): CommentConfig => {
  if (typeof structuredClone === 'function') {
    return structuredClone(config);
  }
  return JSON.parse(JSON.stringify(config)) as CommentConfig;
};

interface CreateMotionDocumentOptions {
  title?: string;
  sceneName?: string;
  sourceTemplateId?: string;
}

export const createMotionDocument = (
  config: CommentConfig = INITIAL_CONFIG,
  options: CreateMotionDocumentOptions = {},
): MotionDocument => {
  const createdAt = Date.now();
  const isoCreatedAt = new Date(createdAt).toISOString();
  const width = config.width || 1080;
  const height = config.height || config.width || 1080;
  return {
    id: `motion-doc-${createdAt}`,
    title: options.title || 'Untitled motion',
    schemaVersion: CURRENT_DOCUMENT_SCHEMA,
    metadata: {
      createdAt: isoCreatedAt,
      updatedAt: isoCreatedAt,
      appVersion: '1.0.0',
      sourceTemplateId: options.sourceTemplateId,
    },
    settings: {
      fps: 60,
      defaultDuration: config.animationDuration || 2,
      export: {
        format: 'mp4',
        transparentBackground: false,
      },
    },
    exportSettings: {
      format: 'mp4',
      transparentBackground: false,
      fps: 60,
      preset: 'square-1080',
      width,
      height,
      quality: 90,
    },
    assets: [],
    timeline: {
      scrollX: 0,
      zoomX: 1,
      visibleRange: { start: 0, end: 120 },
    },
    activeSceneId: 'scene-main',
    scenes: [
      {
        id: 'scene-main',
        name: options.sceneName || 'Main artboard',
        config: cloneConfig(config),
      },
    ],
  };
};

export const getActiveScene = (document: MotionDocument) => {
  return document.scenes.find(scene => scene.id === document.activeSceneId) ?? document.scenes[0];
};

export const getActiveSceneConfig = (document: MotionDocument): CommentConfig => {
  return getActiveScene(document).config;
};

export const updateActiveSceneConfig = (
  document: MotionDocument,
  updater: CommentConfig | ((config: CommentConfig) => CommentConfig),
): MotionDocument => {
  const activeScene = getActiveScene(document);
  const nextConfig = typeof updater === 'function'
    ? updater(activeScene.config)
    : updater;

  return {
    ...document,
    metadata: {
      ...document.metadata,
      updatedAt: new Date().toISOString(),
    },
    scenes: document.scenes.map(scene =>
      scene.id === activeScene.id ? { ...scene, config: nextConfig } : scene
    ),
  };
};

export const updateMotionDocumentSettings = (
  document: MotionDocument,
  updater: Partial<MotionDocumentSettings> | ((settings: MotionDocumentSettings) => MotionDocumentSettings),
): MotionDocument => {
  const settings = typeof updater === 'function'
    ? updater(document.settings)
    : { ...document.settings, ...updater };

  return {
    ...document,
    settings,
    metadata: {
      ...document.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
};

/**
 * Update the v2 exportSettings on a MotionDocument.
 * Also syncs the legacy settings.export for backward compatibility.
 */
export const updateExportSettings = (
  document: MotionDocument,
  updater: Partial<ExportSettings> | ((settings: ExportSettings) => ExportSettings),
): MotionDocument => {
  const nextExport = typeof updater === 'function'
    ? updater(document.exportSettings)
    : { ...document.exportSettings, ...updater };

  return {
    ...document,
    exportSettings: nextExport,
    settings: {
      ...document.settings,
      fps: nextExport.fps,
      export: {
        format: nextExport.format,
        transparentBackground: nextExport.transparentBackground,
      },
    },
    metadata: {
      ...document.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
};

// ---------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------

/**
 * Serialize a MotionDocument to a JSON string.
 * Uses 2-space indentation for readability.
 */
export const serializeDocument = (document: MotionDocument): string => {
  return JSON.stringify(document, null, 2);
};

/**
 * Deserialize a JSON string back to a MotionDocument.
 * Does NOT apply migrations — use unwrapLoadedFile for files from disk.
 */
export const deserializeDocument = (json: string): MotionDocument => {
  const parsed = JSON.parse(json) as MotionDocument;
  if (!parsed || typeof parsed !== 'object' || !parsed.id) {
    throw new Error('Invalid document JSON: missing id');
  }
  return parsed;
};
