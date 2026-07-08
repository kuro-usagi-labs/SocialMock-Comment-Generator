import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { CommentConfig, Layer } from '../types';
import { composeLayerTransform, getLayerMotion, progressToFrame } from './motionEngine';

type PreviewElementRef = RefObject<HTMLElement | null>;

export interface PreviewLayerTarget {
  layerId: string;
  ref?: PreviewElementRef;
  getElement?: () => HTMLElement | null;
  transformMode?: 'composed' | 'motion-only';
  originX?: number;
  originY?: number;
}

interface UsePreviewRuntimeOptions {
  config: CommentConfig;
  layers: Layer[];
  targets: PreviewLayerTarget[];
  progress: number;
  isPlaying: boolean;
  direction: number;
  pausedLayerIds?: ReadonlySet<string>;
  setProgress: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  setDirection: (value: number) => void;
}

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

export const usePreviewRuntime = ({
  config,
  layers,
  targets,
  progress,
  isPlaying,
  direction,
  pausedLayerIds,
  setProgress,
  setIsPlaying,
  setDirection,
}: UsePreviewRuntimeOptions) => {
  const runtimeProgressRef = useRef(progress);
  const runtimeDirectionRef = useRef(direction);
  const layerByIdRef = useRef(new Map(layers.map(layer => [layer.id, layer])));

  useEffect(() => {
    layerByIdRef.current = new Map(layers.map(layer => [layer.id, layer]));
  }, [layers]);

  const applyProgress = useCallback((nextProgress: number) => {
    const frame = progressToFrame(nextProgress, config.animationDuration || 2, 60);
    const context = {
      frame,
      fps: 60,
      durationInFrames: Math.max(60, Math.round((config.animationDuration || 2) * 60)),
      config,
      pausedLayerIds: pausedLayerIds ?? new Set<string>(),
    };

    targets.forEach((target) => {
      const element = target.getElement?.() ?? target.ref?.current ?? null;
      const layer = layerByIdRef.current.get(target.layerId);
      if (!element || !layer) return;

      const motion = getLayerMotion(layer, context);
      element.style.transform = target.transformMode === 'motion-only'
        ? motion.transform
        : composeLayerTransform(layer, motion, target.originX, target.originY);
      element.style.opacity = String((layer.opacity ?? 1) * motion.opacity);
      element.style.filter = motion.filter || '';
    });
  }, [config, pausedLayerIds, targets]);

  const setPreviewProgress = useCallback((value: number) => {
    const next = clampProgress(value);
    runtimeProgressRef.current = next;
    setProgress(next);
  }, [setProgress]);

  const setPreviewPlaying = useCallback((value: boolean) => {
    if (!value) {
      setPreviewProgress(runtimeProgressRef.current);
    }
    setIsPlaying(value);
  }, [setIsPlaying, setPreviewProgress]);

  const restartPlayback = useCallback(() => {
    runtimeDirectionRef.current = 1;
    setDirection(1);
    setPreviewProgress(0);
    setPreviewPlaying(true);
  }, [setDirection, setPreviewPlaying, setPreviewProgress]);

  useEffect(() => {
    if (isPlaying) return;
    runtimeProgressRef.current = progress;
    applyProgress(progress);
  }, [applyProgress, isPlaying, progress]);

  useEffect(() => {
    if (!isPlaying) return;
    if (typeof document === 'undefined') return;

    let resumedFromHidden = false;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause the global clock while the tab is hidden so playback
        // does not race ahead in the background (CPU/UI sync drift).
        setIsPlaying(false);
        resumedFromHidden = true;
      } else if (resumedFromHidden) {
        resumedFromHidden = false;
        setIsPlaying(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;
    let rafId = 0;
    let lastTime = performance.now();
    let lastUiUpdate = lastTime;
    runtimeDirectionRef.current = direction;

    const tick = (time: number) => {
      if (cancelled) return;
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;
      // Skip the actual progress advance when no motion-bearing layers are visible —
      // protects against runaway CPU when pausedLayerIds covers every active layer.
      const hasMovingLayer = Array.from(pausedLayerIds ?? []).length < layerByIdRef.current.size;
      const duration = Math.max(0.5, config.animationDuration || 2);
      const delta = hasMovingLayer ? (deltaSeconds / duration) * 100 * runtimeDirectionRef.current : 0;
      let next = runtimeProgressRef.current + delta;
      let stopPlayback = false;

      if (next >= 100) {
        if (config.animationLoop === 'once') {
          next = 100;
          stopPlayback = true;
        } else if (config.animationLoop === 'ping-pong') {
          runtimeDirectionRef.current = -1;
          setDirection(-1);
          next = 100 - (next - 100);
        } else {
          next %= 100;
        }
      }

      if (next <= 0) {
        if (config.animationLoop === 'ping-pong') {
          runtimeDirectionRef.current = 1;
          setDirection(1);
          next = Math.abs(next);
        } else {
          next = 0;
        }
      }

      runtimeProgressRef.current = next;
      applyProgress(next);

      if (time - lastUiUpdate >= 40 || stopPlayback) {
        setProgress(next);
        lastUiUpdate = time;
      }

      if (stopPlayback) {
        setIsPlaying(false);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [
    applyProgress,
    config.animationDuration,
    config.animationLoop,
    direction,
    isPlaying,
    pausedLayerIds,
    setDirection,
    setIsPlaying,
    setProgress,
  ]);

  return {
    applyProgress,
    setPreviewProgress,
    setPreviewPlaying,
    restartPlayback,
  };
};
