import {
  AnimationSpeed,
  AnimationStyle,
  BezierPoints,
  CommentConfig,
  EasingPreset,
  Layer,
  LayerActionBlock,
} from '../types';

export interface MotionState {
  opacity: number;
  transform: string;
  filter: string;
  blurPx: number;
}

export interface MotionContext {
  frame: number;
  fps: number;
  durationInFrames: number;
  config: Pick<
    CommentConfig,
    | 'animationStyle'
    | 'animationInStyle'
    | 'animationOutStyle'
    | 'animationSpeed'
    | 'easingInPreset'
    | 'easingOutPreset'
    | 'customBezierIn'
    | 'customBezierOut'
  >;
}

export const speedToFrames: Record<AnimationSpeed, number> = {
  slow: 70,
  medium: 46,
  fast: 30,
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const progressToFrame = (progress: number, durationSeconds: number, fps = 60) => {
  return (clamp(progress / 100) * Math.max(0.5, durationSeconds)) * fps;
};

const cubicBezier = (t: number, points?: BezierPoints) => {
  if (!points) return easeProgress(t, 'ease-out');
  const u = 1 - t;
  return (3 * u * u * t * points.y1) + (3 * u * t * t * points.y2) + (t * t * t);
};

export const easeProgress = (value: number, preset?: EasingPreset, bezier?: BezierPoints) => {
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
};

const seededWave = (seed: string, frame: number, salt: number) => {
  let hash = salt;
  for (let index = 0; index < seed.length; index++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return Math.sin((frame + hash) * 12.9898 + salt * 78.233);
};

const defaultActionBlocks = (layer: Layer, context: MotionContext): LayerActionBlock[] => {
  const delay = (layer.delayFrames || 0) + (layer.staggerFrames || 0);
  const speedFrames = speedToFrames[context.config.animationSpeed || 'medium'];
  const maxTransitionFrames = Math.max(6, Math.floor(context.durationInFrames * 0.42));
  const inDuration = Math.min(speedFrames, maxTransitionFrames);
  const outDuration = Math.min(Math.max(8, Math.round(speedFrames * 0.7)), maxTransitionFrames);

  return [
    {
      id: `${layer.id}-action-in`,
      kind: 'in',
      name: 'In',
      style: layer.animationInStyle || context.config.animationInStyle || context.config.animationStyle || 'none',
      startFrame: delay,
      durationFrames: inDuration,
      easingPreset: context.config.easingInPreset,
      customBezier: context.config.customBezierIn,
      intensity: 1,
    },
    {
      id: `${layer.id}-action-out`,
      kind: 'out',
      name: 'Out',
      style: layer.animationOutStyle || context.config.animationOutStyle || 'none',
      startFrame: Math.max(delay + inDuration + 1, context.durationInFrames - outDuration),
      durationFrames: outDuration,
      easingPreset: context.config.easingOutPreset,
      customBezier: context.config.customBezierOut,
      intensity: 1,
    },
  ];
};

export const getLayerActionBlocks = (layer: Layer, context: MotionContext) => {
  if (layer.actionBlocks && layer.actionBlocks.length > 0) {
    const offset = (layer.delayFrames || 0) + (layer.staggerFrames || 0);
    return layer.actionBlocks.map(action => ({
      ...action,
      startFrame: action.startFrame + offset,
    }));
  }

  return defaultActionBlocks(layer, context);
};

const effectState = (style: AnimationStyle, visibility: number, frame: number, layerId: string, intensity = 1): MotionState => {
  if (style === 'none' || !style) {
    return { opacity: 1, transform: 'none', filter: '', blurPx: 0 };
  }

  const progress = clamp(visibility, -0.5, 1.5);
  const hidden = 1 - progress;
  let transform = 'none';
  let filter = '';
  let blurPx = 0;

  if (style === 'pop') transform = `translate3d(0, ${hidden * 10 * intensity}px, 0) scale(${0.94 + progress * 0.06})`;
  else if (style === 'slide-up') transform = `translate3d(0, ${hidden * 34 * intensity}px, 0)`;
  else if (style === 'slide-down') transform = `translate3d(0, ${-hidden * 34 * intensity}px, 0)`;
  else if (style === 'slide-left') transform = `translate3d(${hidden * 42 * intensity}px, 0, 0)`;
  else if (style === 'slide-right') transform = `translate3d(${-hidden * 42 * intensity}px, 0, 0)`;
  else if (style === 'fade-scale') transform = `scale(${0.97 + progress * 0.03})`;
  else if (style === 'elastic-spin') transform = `scale(${0.92 + progress * 0.08}) rotate(${-24 * hidden * intensity}deg)`;
  else if (style === 'flip-in') transform = `perspective(1000px) rotateX(${-42 * hidden * intensity}deg) translate3d(0, ${hidden * 18 * intensity}px, 0)`;
  else if (style === 'bounce-in') transform = `translate3d(0, ${-Math.abs(Math.sin(progress * Math.PI * 2)) * hidden * 34 * intensity}px, 0) scale(${0.96 + progress * 0.04})`;
  else if (style === 'rubber-band') transform = `scaleX(${1 + Math.sin(progress * Math.PI * 2) * 0.08 * hidden}) scaleY(${1 - Math.sin(progress * Math.PI * 2) * 0.04 * hidden})`;
  else if (style === 'shake') transform = `translate3d(${Math.sin(frame * 1.4) * 5 * hidden * intensity}px, ${Math.cos(frame * 2.1) * 2 * hidden * intensity}px, 0)`;
  else if (style === 'wiggle') transform = `rotate(${Math.sin(frame * 0.32) * 4 * hidden * intensity}deg)`;
  else if (style === 'zoom-blur') {
    transform = `scale(${0.92 + progress * 0.08})`;
    blurPx = hidden * 6 * intensity;
    filter = `blur(${blurPx}px)`;
  } else if (style === 'rotate-in') transform = `rotate(${-18 * hidden * intensity}deg) scale(${0.94 + progress * 0.06})`;
  else if (style === 'swipe-in') transform = `translate3d(${hidden * 72 * intensity}px, 0, 0)`;
  else if (style === 'glitch') {
    const gx = seededWave(layerId, frame, 17) * 6 * hidden * intensity;
    const gy = seededWave(layerId, frame, 41) * 3 * hidden * intensity;
    transform = `translate3d(${gx}px, ${gy}px, 0) scale(${0.96 + progress * 0.04})`;
    filter = `hue-rotate(${hidden * 36}deg)`;
  }

  return { opacity: clamp(visibility), transform, filter, blurPx };
};

export const getLayerMotion = (layer: Layer | undefined, context: MotionContext): MotionState => {
  if (!layer?.visible) return { opacity: 0, transform: 'none', filter: '', blurPx: 0 };

  const actions = getLayerActionBlocks(layer, context);
  const hasMotionAction = actions.some(action => action.style && action.style !== 'none');
  if (!hasMotionAction) {
    return { opacity: 1, transform: 'none', filter: '', blurPx: 0 };
  }

  const activeAction = actions.find(action => {
    const endFrame = action.startFrame + Math.max(1, action.durationFrames);
    return context.frame >= action.startFrame && context.frame <= endFrame;
  });

  if (activeAction) {
    const rawProgress = (context.frame - activeAction.startFrame) / Math.max(1, activeAction.durationFrames);
    const eased = easeProgress(rawProgress, activeAction.easingPreset, activeAction.customBezier);
    const visibility = activeAction.kind === 'out' ? 1 - eased : eased;
    const motion = effectState(activeAction.style, visibility, context.frame, layer.id, activeAction.intensity ?? 1);
    if (layer.motionBlur && activeAction.style !== 'none') {
      const extraBlur = Math.abs(0.5 - clamp(rawProgress)) * 5;
      return {
        ...motion,
        blurPx: motion.blurPx + extraBlur,
        filter: `${motion.filter ? `${motion.filter} ` : ''}blur(${extraBlur}px)`,
      };
    }
    return motion;
  }

  const firstInAction = actions.find(action => action.kind === 'in');
  if (firstInAction && firstInAction.style !== 'none' && context.frame < firstInAction.startFrame) {
    return { opacity: 0, transform: 'scale(0.96)', filter: '', blurPx: 0 };
  }

  return { opacity: 1, transform: 'none', filter: '', blurPx: 0 };
};

export const composeLayerTransform = (layer: Layer | undefined, motion: MotionState, originX = 80, originY = 80) => {
  const x = (layer?.x ?? originX) - originX;
  const y = (layer?.y ?? originY) - originY;
  const base = `translate3d(${x}px, ${y}px, 0) rotate(${layer?.rotation || 0}deg)`;
  return `${base} ${motion.transform !== 'none' ? motion.transform : ''}`.trim();
};
