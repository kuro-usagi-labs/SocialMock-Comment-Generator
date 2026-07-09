import { VideoExportFormat } from '../types';

// ---------------------------------------------------------------
// Export Pipeline — Milestone 12
// Export presets, resolution management, batch export helpers.
// ---------------------------------------------------------------

export interface ExportPresetConfig {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  icon: string;
}

export const EXPORT_PRESETS: ExportPresetConfig[] = [
  {
    id: 'square-1080',
    label: 'Square 1:1',
    description: '1080×1080 — Instagram, Facebook',
    width: 1080,
    height: 1080,
    icon: '◻',
  },
  {
    id: 'story-1080x1920',
    label: 'Story 9:16',
    description: '1080×1920 — Instagram/TikTok Story',
    width: 1080,
    height: 1920,
    icon: '▯',
  },
  {
    id: 'landscape-1920x1080',
    label: 'Landscape 16:9',
    description: '1920×1080 — YouTube, Twitter',
    width: 1920,
    height: 1080,
    icon: '▬',
  },
  {
    id: 'portrait-1080x1350',
    label: 'Portrait 4:5',
    description: '1080×1350 — Instagram Feed',
    width: 1080,
    height: 1350,
    icon: '▮',
  },
  {
    id: 'twitter-1200x675',
    label: 'Twitter Card',
    description: '1200×675 — Twitter/X link card',
    width: 1200,
    height: 675,
    icon: '═',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set your own dimensions',
    width: 1080,
    height: 1080,
    icon: '⚙',
  },
];

export const FORMAT_OPTIONS: Array<{ value: VideoExportFormat; label: string; description: string }> = [
  { value: 'mp4', label: 'MP4', description: 'Best compatibility, H.264' },
  { value: 'webm', label: 'WebM', description: 'VP9 with alpha transparency' },
  { value: 'mov', label: 'MOV', description: 'ProRes 4444 with alpha' },
  { value: 'gif', label: 'GIF', description: 'Animated GIF, no audio' },
];

/**
 * Get a preset by ID.
 */
export function getExportPreset(id: string): ExportPresetConfig | undefined {
  return EXPORT_PRESETS.find(p => p.id === id);
}

/**
 * Format duration in frames to human-readable string.
 */
export function formatDuration(durationSeconds: number): string {
  if (durationSeconds < 1) return `${Math.round(durationSeconds * 1000)}ms`;
  if (durationSeconds < 60) return `${durationSeconds.toFixed(1)}s`;
  const min = Math.floor(durationSeconds / 60);
  const sec = Math.round(durationSeconds % 60);
  return `${min}m ${sec}s`;
}

/**
 * Estimate file size for a given format and duration.
 * Returns a rough estimate in MB.
 */
export function estimateFileSize(
  format: VideoExportFormat,
  width: number,
  height: number,
  fps: number,
  durationSeconds: number,
): number {
  const pixels = width * height;
  const totalFrames = fps * durationSeconds;
  // Very rough estimates
  const bitratePerPixel: Record<VideoExportFormat, number> = {
    mp4: 0.08,   // H.264 is efficient
    webm: 0.06,  // VP9 is similar
    mov: 0.5,    // ProRes is large
    gif: 0.15,   // GIF is uncompressed-ish
  };
  const bitsPerPixel = bitratePerPixel[format] ?? 0.08;
  const totalBits = pixels * totalFrames * bitsPerPixel;
  return totalBits / (8 * 1024 * 1024); // Convert to MB
}
