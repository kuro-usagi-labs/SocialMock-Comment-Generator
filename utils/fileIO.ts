import {
  CURRENT_SCHEMA_VERSION,
  MotionDocument,
  SocialMockFile,
  SocialMockFileMeta,
} from '../types';
import { migrateMotionDocument } from './migration';

const APP_VERSION = '1.0.0';

/**
 * Wrap a MotionDocument into the .socialmock file envelope.
 */
export function wrapDocumentForSave(document: MotionDocument): SocialMockFile {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    document,
    _meta: {
      savedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      platform: typeof window !== 'undefined'
        ? window.electronAPI?.platform ?? 'web'
        : 'main',
    },
  };
}

/**
 * Validate that a parsed object is a plausible SocialMockFile.
 * Returns a discriminated result so callers can show meaningful errors.
 */
export function validateSocialMockFile(raw: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'File is empty or not valid JSON.' };
  }

  const file = raw as Record<string, unknown>;

  if (typeof file.schemaVersion !== 'number') {
    return { valid: false, error: 'Missing schemaVersion field. This may not be a SocialMock file.' };
  }

  if (file.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `File was created with a newer version of SocialMock (schema v${file.schemaVersion}). Please update the app.`,
    };
  }

  if (!file.document || typeof file.document !== 'object') {
    return { valid: false, error: 'Missing document data.' };
  }

  const doc = file.document as Record<string, unknown>;
  if (typeof doc.id !== 'string' || !doc.id) {
    return { valid: false, error: 'Document is missing a valid id.' };
  }
  if (!Array.isArray(doc.scenes) || doc.scenes.length === 0) {
    return { valid: false, error: 'Document has no scenes.' };
  }

  return { valid: true };
}

/**
 * Unwrap and validate a loaded .socialmock file.
 * Applies any necessary migrations for older schema versions.
 */
export function unwrapLoadedFile(raw: unknown): {
  document: MotionDocument | null;
  valid: boolean;
  error?: string;
} {
  const validation = validateSocialMockFile(raw);
  if (!validation.valid) {
    return { document: null, valid: false, error: validation.error };
  }

  const file = raw as SocialMockFile;

  // Apply document-level migrations (v1 → v2, etc.)
  const migrated = migrateMotionDocument(file.document);

  // Ensure metadata fields exist (defensive)
  if (!migrated.metadata) {
    migrated.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appVersion: '1.0.0',
    };
  }
  if (!migrated.settings) {
    migrated.settings = {
      fps: 60,
      defaultDuration: 2,
      export: { format: 'mp4', transparentBackground: false },
    };
  }

  return { document: migrated, valid: true };
}

/**
 * Build SocialMockFileMeta for the current session.
 */
export function buildFileMeta(): SocialMockFileMeta {
  return {
    savedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    platform: typeof window !== 'undefined'
      ? window.electronAPI?.platform ?? 'web'
      : 'main',
  };
}
