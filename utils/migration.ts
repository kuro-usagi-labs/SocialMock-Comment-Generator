import { CURRENT_DOCUMENT_SCHEMA, MotionDocument } from '../types';

/**
 * Apply all pending document migrations.
 * Accepts a raw parsed object (any schema version) and returns a fully migrated MotionDocument.
 *
 * Migration pipeline:
 *   v1 (original) → v2 (schemaVersion, exportSettings, assets, timeline)
 */
export function migrateMotionDocument(raw: unknown): MotionDocument {
  const doc = raw as Record<string, unknown>;
  const version = (doc.schemaVersion as number) ?? (doc.version as number) ?? 1;

  let migrated = { ...doc };

  if (version < 2) {
    migrated = migrateV1ToV2(migrated);
  }

  // Future migrations:
  // if (version < 3) migrated = migrateV2ToV3(migrated);

  migrated.schemaVersion = CURRENT_DOCUMENT_SCHEMA;
  return migrated as unknown as MotionDocument;
}

// ── v1 → v2 ─────────────────────────────────────────────────────────────
// Adds: schemaVersion, exportSettings, assets, timeline
// Keeps: settings (backward compat, deprecated in favor of exportSettings)

function migrateV1ToV2(doc: Record<string, unknown>): Record<string, unknown> {
  const settings = (doc.settings as Record<string, unknown>) ?? {};
  const exportSub = (settings.export as Record<string, unknown>) ?? {};
  const scenes = (doc.scenes as Array<Record<string, unknown>>) ?? [];
  const firstConfig = (scenes[0]?.config as Record<string, unknown>) ?? {};

  return {
    ...doc,
    schemaVersion: 2,
    exportSettings: {
      format: (exportSub.format as string) ?? 'mp4',
      transparentBackground: (exportSub.transparentBackground as boolean) ?? false,
      fps: (settings.fps as number) ?? 60,
      preset: 'square-1080' as const,
      width: (firstConfig.width as number) ?? 1080,
      height: (firstConfig.height as number) ?? (firstConfig.width as number) ?? 1080,
      quality: 90,
    },
    assets: (doc.assets as unknown[]) ?? [],
    timeline: (doc.timeline as Record<string, unknown>) ?? {
      scrollX: 0,
      zoomX: 1,
      visibleRange: { start: 0, end: 120 },
    },
  };
}
