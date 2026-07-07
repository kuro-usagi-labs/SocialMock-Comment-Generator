import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationStyle, EasingPreset, BezierPoints } from '../../types';

export const speedToFrames = {
  slow: 52,
  medium: 34,
  fast: 20,
};

export const getEasingFn = (preset: EasingPreset | undefined, bezier?: BezierPoints) => {
  switch (preset) {
    case 'linear': return Easing.linear;
    case 'ease-in': return Easing.in(Easing.cubic);
    case 'ease-out': return Easing.out(Easing.cubic);
    case 'ease-in-out': return Easing.inOut(Easing.cubic);
    case 'bounce': return Easing.bounce;
    case 'elastic': return Easing.elastic(1);
    case 'back': return Easing.back(1.7);
    case 'spring': return Easing.out(Easing.cubic);
    case 'custom': {
      if (bezier) return Easing.bezier(bezier.x1, bezier.y1, bezier.x2, bezier.y2);
      return Easing.out(Easing.cubic);
    }
    default: return Easing.out(Easing.cubic);
  }
};

export const getEffectState = (
  style: AnimationStyle,
  visibility: number,
  springValue: number,
  frame: number = 0,
  inFrames: number = 30,
): { opacity: number; transform: string; filter: string } => {
  if (style === 'none' || !style) {
    return { opacity: 1, transform: 'none', filter: '' };
  }
  const easedVisibility = style === 'pop' || style === 'elastic-spin' || style === 'flip-in' || style === 'bounce-in' || style === 'rubber-band' ? springValue : visibility;
  const hidden = 1 - easedVisibility;
  let transform = 'none';
  let filter = '';
  if (style === 'pop') transform = `scale(${0.82 + easedVisibility * 0.18})`;
  else if (style === 'slide-up') transform = `translateY(${hidden * 56}px)`;
  else if (style === 'slide-down') transform = `translateY(${-hidden * 56}px)`;
  else if (style === 'slide-left') transform = `translateX(${hidden * 64}px)`;
  else if (style === 'slide-right') transform = `translateX(${-hidden * 64}px)`;
  else if (style === 'fade-scale') transform = `scale(${0.94 + easedVisibility * 0.06})`;
  else if (style === 'elastic-spin') transform = `scale(${0.82 + easedVisibility * 0.18}) rotate(${-180 * hidden}deg)`;
  else if (style === 'flip-in') transform = `perspective(1000px) rotateX(${-90 * hidden}deg)`;
  else if (style === 'bounce-in') {
    const bounceY = Math.abs(Math.sin(springValue * Math.PI * 2)) * hidden * 80;
    const squash = 1 + Math.sin(springValue * Math.PI) * 0.1 * hidden;
    transform = `translateY(${-bounceY}px) scale(${squash}, ${1 / squash})`;
  } else if (style === 'rubber-band') {
    const stretch = 1 + Math.sin(springValue * Math.PI * 3) * 0.3 * hidden;
    transform = `scaleX(${stretch}) scaleY(${2 - stretch})`;
  } else if (style === 'shake') {
    const shakeX = Math.sin(frame * 1.5) * 8 * hidden;
    const shakeY = Math.cos(frame * 2.1) * 4 * hidden;
    transform = `translate(${shakeX}px, ${shakeY}px) rotate(${Math.sin(frame * 1.8) * 2 * hidden}deg)`;
  } else if (style === 'wiggle') transform = `rotate(${Math.sin(frame * 0.3) * 6 * hidden}deg)`;
  else if (style === 'zoom-blur') { transform = `scale(${0.6 + easedVisibility * 0.4})`; filter = `blur(${hidden * 8}px)`; }
  else if (style === 'rotate-in') transform = `rotate(${-360 * hidden}deg) scale(${0.7 + easedVisibility * 0.3})`;
  else if (style === 'swipe-in') transform = `translateX(${(1 - easedVisibility) * 200}px)`;
  else if (style === 'glitch') {
    const gx = frame < inFrames ? (Math.random() - 0.5) * 12 * hidden : 0;
    const gy = frame < inFrames ? (Math.random() - 0.5) * 6 * hidden : 0;
    transform = `translate(${gx}px, ${gy}px) scale(${0.9 + easedVisibility * 0.1})`;
    filter = frame < inFrames ? `hue-rotate(${hidden * 90}deg)` : '';
  }
  return { opacity: visibility, transform, filter };
};

export interface LayerAnimOptions {
  inStyle: AnimationStyle;
  outStyle?: AnimationStyle;
  inPreset: EasingPreset;
  outPreset: EasingPreset;
  customBezierIn?: BezierPoints;
  customBezierOut?: BezierPoints;
  speed?: keyof typeof speedToFrames;
  delayFrames?: number;
}

export const useLayerAnimation = (opts: LayerAnimOptions) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const delay = opts.delayFrames ?? 0;
  const localFrame = Math.max(0, frame - delay);
  const baseInFrames = speedToFrames[opts.speed || 'medium'];
  const maxTransitionFrames = Math.max(6, Math.floor(durationInFrames * 0.42));
  const inFrames = Math.min(baseInFrames, maxTransitionFrames);
  const outFrames = Math.min(Math.max(8, Math.round(baseInFrames * 0.7)), maxTransitionFrames);
  const outStartFrame = Math.max(inFrames + 1, durationInFrames - outFrames);
  const localDuration = durationInFrames - delay;
  const easingInFn = getEasingFn(opts.inPreset, opts.customBezierIn);
  const easingOutFn = getEasingFn(opts.outPreset, opts.customBezierOut);
  const inProgress = !opts.inStyle || opts.inStyle === 'none' ? 1 : interpolate(localFrame, [0, inFrames], [0, 1], { easing: easingInFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outProgress = !opts.outStyle || opts.outStyle === 'none' ? 0 : interpolate(localFrame, [outStartFrame, localDuration - 1], [0, 1], { easing: easingOutFn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const inSpring = spring({ frame: Math.min(localFrame, inFrames), fps, durationInFrames: inFrames, config: { damping: 12, mass: 0.5, stiffness: 180 } });
  return getEffectState(opts.inStyle, 1 - outProgress, inSpring, localFrame, inFrames);
};
