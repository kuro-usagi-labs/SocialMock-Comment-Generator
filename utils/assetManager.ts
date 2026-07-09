import { MotionAsset, MotionDocument } from '../types';

// ---------------------------------------------------------------
// Asset Manager — Milestone 7
// Import, store, and manage project assets (image, video, audio).
// ---------------------------------------------------------------

export type AssetType = MotionAsset['type'];

const SUPPORTED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

const SUPPORTED_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

const SUPPORTED_AUDIO_TYPES: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
};

const ALL_SUPPORTED_TYPES: Record<string, string> = {
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES,
};

function classifyMimeType(mimeType: string): AssetType | null {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return null;
}

/**
 * Check if a file MIME type is supported.
 */
export function isSupportedAssetType(mimeType: string): boolean {
  return mimeType in ALL_SUPPORTED_TYPES;
}

/**
 * Get a human-readable list of supported file extensions.
 */
export function getSupportedExtensions(): string[] {
  return [...new Set(Object.values(ALL_SUPPORTED_TYPES))];
}

/**
 * Create a MotionAsset from a file.
 * Reads the file as a data URL for inline storage.
 * Returns a promise that resolves to the asset metadata.
 */
export function createAssetFromFile(file: File): Promise<MotionAsset> {
  return new Promise((resolve, reject) => {
    const assetType = classifyMimeType(file.type);
    if (!assetType) {
      reject(new Error(`Unsupported file type: ${file.type}`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const asset: MotionAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        type: assetType,
        mimeType: file.type,
        fileName: file.name,
        src: dataUrl,
        addedAt: new Date().toISOString(),
      };

      // Get dimensions for images
      if (assetType === 'image') {
        const img = new Image();
        img.onload = () => {
          asset.width = img.naturalWidth;
          asset.height = img.naturalHeight;
          resolve(asset);
        };
        img.onerror = () => resolve(asset); // Still resolve, just without dimensions
        img.src = dataUrl;
      } else if (assetType === 'video') {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          asset.width = video.videoWidth;
          asset.height = video.videoHeight;
          asset.duration = video.duration;
          resolve(asset);
        };
        video.onerror = () => resolve(asset);
        video.src = dataUrl;
      } else {
        resolve(asset);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Add an asset to a MotionDocument.
 * Returns the updated document.
 */
export function addAssetToDocument(document: MotionDocument, asset: MotionAsset): MotionDocument {
  // Check for duplicate by fileName
  const exists = document.assets.some(a => a.fileName === asset.fileName && a.src === asset.src);
  if (exists) return document;

  return {
    ...document,
    assets: [...document.assets, asset],
    metadata: {
      ...document.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Remove an asset from a MotionDocument.
 */
export function removeAssetFromDocument(document: MotionDocument, assetId: string): MotionDocument {
  return {
    ...document,
    assets: document.assets.filter(a => a.id !== assetId),
    metadata: {
      ...document.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Replace an asset's source (for "replace missing asset" flow).
 */
export function replaceAssetInDocument(
  document: MotionDocument,
  assetId: string,
  newSrc: string,
  newFileName?: string,
): MotionDocument {
  return {
    ...document,
    assets: document.assets.map(a =>
      a.id === assetId
        ? { ...a, src: newSrc, fileName: newFileName ?? a.fileName }
        : a
    ),
    metadata: {
      ...document.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Find an asset by ID in a document.
 */
export function findAsset(document: MotionDocument, assetId: string): MotionAsset | undefined {
  return document.assets.find(a => a.id === assetId);
}

/**
 * Check if any assets are missing (null or empty src).
 */
export function findMissingAssets(document: MotionDocument): MotionAsset[] {
  return document.assets.filter(a => !a.src || a.src === '');
}
