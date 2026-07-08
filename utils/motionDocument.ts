import { CommentConfig, INITIAL_CONFIG, MotionDocument, MotionDocumentSettings } from '../types';

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
  return {
    id: `motion-doc-${createdAt}`,
    title: options.title || 'Untitled motion',
    version: 1,
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
