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
  }, [config, targets]);

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

    let rafId = 0;
    let lastTime = performance.now();
    let lastUiUpdate = lastTime;
    runtimeDirectionRef.current = direction;

    const tick = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;
      const duration = Math.max(0.5, config.animationDuration || 2);
      const delta = (deltaSeconds / duration) * 100 * runtimeDirectionRef.current;
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
    return () => cancelAnimationFrame(rafId);
  }, [
    applyProgress,
    config.animationDuration,
    config.animationLoop,
    direction,
    isPlaying,
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
