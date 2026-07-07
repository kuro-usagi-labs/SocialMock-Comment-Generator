import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationStyle, BezierPoints, EasingPreset, Layer } from '../../types';
import { getLayerMotion, speedToFrames } from '../../utils/motionEngine';

export { speedToFrames };

export interface LayerAnimOptions {
  inStyle: AnimationStyle;
  outStyle?: AnimationStyle;
  inPreset: EasingPreset;
  outPreset: EasingPreset;
  customBezierIn?: BezierPoints;
  customBezierOut?: BezierPoints;
  speed?: keyof typeof speedToFrames;
  delayFrames?: number;
  staggerFrames?: number;
  motionBlur?: boolean;
}

export const useLayerAnimation = (opts: LayerAnimOptions) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const layer: Layer = {
    id: 'legacy-remotion-layer',
    type: 'card',
    name: 'Legacy remotion layer',
    visible: true,
    zIndex: 0,
    x: 80,
    y: 80,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    delayFrames: opts.delayFrames ?? 0,
    staggerFrames: opts.staggerFrames ?? 0,
    motionBlur: opts.motionBlur ?? false,
    animationInStyle: opts.inStyle,
    animationOutStyle: opts.outStyle || 'none',
    actionBlocks: [],
    cardConfig: null,
  };

  return getLayerMotion(layer, {
    frame,
    fps,
    durationInFrames,
    config: {
      animationStyle: opts.inStyle,
      animationInStyle: opts.inStyle,
      animationOutStyle: opts.outStyle || 'none',
      animationSpeed: opts.speed || 'medium',
      easingInPreset: opts.inPreset,
      easingOutPreset: opts.outPreset,
      customBezierIn: opts.customBezierIn,
      customBezierOut: opts.customBezierOut,
    },
  });
};
