import {
  BezierPoints,
  EasingPreset,
  LayerActionProperty,
  LayerActionPropertyValue,
} from '../types';

// ---------------------------------------------------------------
// Property Track System — Milestone 5
// Multiple keyframes per property with per-segment easing.
// ---------------------------------------------------------------

export interface PropertyKeyframe {
  id: string;
  /** Frame number within the layer's local timeline */
  frame: number;
  /** Value at this keyframe */
  value: number;
  /** Easing used to interpolate FROM this keyframe to the next */
  easingPreset: EasingPreset;
  /** Custom bezier points when easingPreset is 'custom' */
  customBezier?: BezierPoints;
}

export interface PropertyTrack {
  id: string;
  property: LayerActionProperty;
  /** Keyframes sorted by frame ascending */
  keyframes: PropertyKeyframe[];
}

/**
 * Create a default property track with two keyframes (start/end).
 * Mirrors the current LayerActionPropertyValue.from/to pattern.
 */
export function createDefaultTrack(
  property: LayerActionProperty,
  fromValue: number,
  toValue: number,
  startFrame: number,
  endFrame: number,
  easing: EasingPreset = 'ease-out',
): PropertyTrack {
  return {
    id: `track-${property}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    property,
    keyframes: [
      {
        id: `kf-${property}-start-${Date.now()}`,
        frame: startFrame,
        value: fromValue,
        easingPreset: easing,
      },
      {
        id: `kf-${property}-end-${Date.now()}`,
        frame: endFrame,
        value: toValue,
        easingPreset: 'linear',
      },
    ],
  };
}

/**
 * Interpolate a value from a property track at a given frame.
 * Returns the default value if no keyframes apply.
 */
export function interpolateTrack(
  track: PropertyTrack,
  frame: number,
  defaultValue: number,
): number {
  const kfs = track.keyframes;
  if (kfs.length === 0) return defaultValue;

  // Before first keyframe
  if (frame <= kfs[0].frame) return kfs[0].value;

  // After last keyframe
  if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1].value;

  // Find the segment that contains this frame
  for (let i = 0; i < kfs.length - 1; i++) {
    const from = kfs[i];
    const to = kfs[i + 1];
    if (frame >= from.frame && frame <= to.frame) {
      const segmentLength = to.frame - from.frame;
      if (segmentLength <= 0) return from.value;
      const rawProgress = (frame - from.frame) / segmentLength;
      const t = easeValue(rawProgress, from.easingPreset, from.customBezier);
      return from.value + (to.value - from.value) * t;
    }
  }

  return defaultValue;
}

/**
 * Get the current value for a property from multiple tracks at a frame.
 */
export function getPropertyValueAtFrame(
  tracks: PropertyTrack[],
  property: LayerActionProperty,
  frame: number,
  defaultValue: number,
): number {
  const track = tracks.find(t => t.property === property);
  if (!track) return defaultValue;
  return interpolateTrack(track, frame, defaultValue);
}

/**
 * Add a keyframe to a track at the given frame with the given value.
 * If the track doesn't exist, creates one.
 */
export function addKeyframeToTrack(
  tracks: PropertyTrack[],
  property: LayerActionProperty,
  frame: number,
  value: number,
  easing: EasingPreset = 'ease-out',
): PropertyTrack[] {
  const existingIndex = tracks.findIndex(t => t.property === property);

  if (existingIndex >= 0) {
    const track = { ...tracks[existingIndex] };
    const keyframes = [...track.keyframes];

    // Check if keyframe at this frame already exists
    const existingKfIndex = keyframes.findIndex(kf => kf.frame === frame);
    if (existingKfIndex >= 0) {
      // Update existing keyframe
      keyframes[existingKfIndex] = {
        ...keyframes[existingKfIndex],
        value,
        easingPreset: easing,
      };
    } else {
      // Insert new keyframe in sorted position
      const newKf: PropertyKeyframe = {
        id: `kf-${property}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        frame,
        value,
        easingPreset: easing,
      };
      const insertIndex = keyframes.findIndex(kf => kf.frame > frame);
      if (insertIndex < 0) {
        keyframes.push(newKf);
      } else {
        keyframes.splice(insertIndex, 0, newKf);
      }
    }

    track.keyframes = keyframes;
    const result = [...tracks];
    result[existingIndex] = track;
    return result;
  }

  // Create new track
  return [
    ...tracks,
    {
      id: `track-${property}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      property,
      keyframes: [
        {
          id: `kf-${property}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          frame,
          value,
          easingPreset: easing,
        },
      ],
    },
  ];
}

/**
 * Delete a keyframe from a track.
 */
export function deleteKeyframeFromTrack(
  tracks: PropertyTrack[],
  trackId: string,
  keyframeId: string,
): PropertyTrack[] {
  return tracks
    .map(track => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        keyframes: track.keyframes.filter(kf => kf.id !== keyframeId),
      };
    })
    .filter(track => track.keyframes.length > 0); // Remove empty tracks
}

/**
 * Convert a LayerActionPropertyValue[] (from/to pattern) into PropertyTrack[].
 */
export function convertActionPropertiesToTracks(
  properties: LayerActionPropertyValue[],
  startFrame: number,
  endFrame: number,
  easing: EasingPreset = 'ease-out',
): PropertyTrack[] {
  return properties.map(prop =>
    createDefaultTrack(prop.property, prop.from, prop.to, startFrame, endFrame, easing)
  );
}

// ── Internal easing function ───────────────────────────────────

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const cubicBezier = (t: number, points?: BezierPoints) => {
  if (!points) return easeValue(t, 'ease-out');
  const u = 1 - t;
  return (3 * u * u * t * points.y1) + (3 * u * t * t * points.y2) + (t * t * t);
};

function easeValue(value: number, preset?: EasingPreset, bezier?: BezierPoints): number {
  const t = clamp(value);
  if (preset === 'linear') return t;
  if (preset === 'ease-in') return t * t * (2.2 - 1.2 * t);
  if (preset === 'ease-in-out') return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  if (preset === 'custom') return clamp(cubicBezier(t, bezier), -0.5, 1.5);
  if (preset === 'back') {
    const c1 = 1.35;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  if (preset === 'bounce') {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t - 1.5 / d1) * (t - 1.5 / d1) + 0.75;
    if (t < 2.5 / d1) return n1 * (t - 2.25 / d1) * (t - 2.25 / d1) + 0.9375;
    return n1 * (t - 2.625 / d1) * (t - 2.625 / d1) + 0.984375;
  }
  if (preset === 'elastic') {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  }
  return 1 - Math.pow(1 - t, 4);
}
