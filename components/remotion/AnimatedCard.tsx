import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from 'remotion';
import { AnimationStyle, CommentConfig, BulkMessage } from '../../types';
import FacebookCard from '../FacebookCard';
import YouTubeCard from '../YouTubeCard';
import TikTokCard from '../TikTokCard';
import TwitterCard from '../TwitterCard';
import InstagramCard from '../InstagramCard';
import BubbleChatCard from '../BubbleChatCard';
import TextOverlayCard from '../TextOverlayCard';
import { AnimatedText } from './AnimatedText';

interface Props {
  config: CommentConfig;
  message?: BulkMessage;
}

const applyBulkMessageToConfig = (config: CommentConfig, message?: BulkMessage): CommentConfig => {
  if (!message) return config;

  return {
    ...config,
    content: message.content,
    displayName: message.displayName,
    username: message.username,
    avatarInitials: message.avatarInitials,
    avatarColor: message.avatarColor,
    avatarUrl: message.avatarUrl,
  };
};

const speedToFrames = {
  slow: 52,
  medium: 34,
  fast: 20,
};

const getEffectState = (
  style: AnimationStyle,
  visibility: number,
  springValue: number,
  frame: number = 0,
  inFrames: number = 30,
) => {
  if (style === 'none') {
    return { opacity: 1, transform: 'none' };
  }

  const easedVisibility = style === 'pop' || style === 'elastic-spin' || style === 'flip-in' || style === 'bounce-in' || style === 'rubber-band'
    ? springValue
    : visibility;
  const hidden = 1 - easedVisibility;
  let transform = 'none';
  let filter = '';

  if (style === 'pop') {
    transform = `scale(${0.82 + easedVisibility * 0.18})`;
  } else if (style === 'slide-up') {
    transform = `translateY(${hidden * 56}px)`;
  } else if (style === 'slide-down') {
    transform = `translateY(${-hidden * 56}px)`;
  } else if (style === 'slide-left') {
    transform = `translateX(${hidden * 64}px)`;
  } else if (style === 'slide-right') {
    transform = `translateX(${-hidden * 64}px)`;
  } else if (style === 'fade-scale') {
    transform = `scale(${0.94 + easedVisibility * 0.06})`;
  } else if (style === 'elastic-spin') {
    transform = `scale(${0.82 + easedVisibility * 0.18}) rotate(${-180 * hidden}deg)`;
  } else if (style === 'flip-in') {
    transform = `perspective(1000px) rotateX(${-90 * hidden}deg)`;
  } else if (style === 'bounce-in') {
    // Ball bouncing from above with squash
    const bounceY = Math.abs(Math.sin(springValue * Math.PI * 2)) * hidden * 80;
    const squash = 1 + Math.sin(springValue * Math.PI) * 0.1 * hidden;
    transform = `translateY(${-bounceY}px) scale(${squash}, ${1 / squash})`;
  } else if (style === 'rubber-band') {
    // Elastic overshoot with horizontal stretch
    const stretch = 1 + Math.sin(springValue * Math.PI * 3) * 0.3 * hidden;
    transform = `scaleX(${stretch}) scaleY(${2 - stretch})`;
  } else if (style === 'shake') {
    // Tremor effect
    const shakeX = Math.sin(frame * 1.5) * 8 * hidden;
    const shakeY = Math.cos(frame * 2.1) * 4 * hidden;
    transform = `translate(${shakeX}px, ${shakeY}px) rotate(${Math.sin(frame * 1.8) * 2 * hidden}deg)`;
  } else if (style === 'wiggle') {
    // Gentle wobble
    const wiggle = Math.sin(frame * 0.3) * 6 * hidden;
    transform = `rotate(${wiggle}deg)`;
  } else if (style === 'zoom-blur') {
    // Scale + blur fade-in
    transform = `scale(${0.6 + easedVisibility * 0.4})`;
    filter = `blur(${hidden * 8}px)`;
  } else if (style === 'rotate-in') {
    // 360° rotation entrance
    transform = `rotate(${-360 * hidden}deg) scale(${0.7 + easedVisibility * 0.3})`;
  } else if (style === 'swipe-in') {
    // Horizontal swipe with clip
    transform = `translateX(${(1 - easedVisibility) * 200}px)`;
  } else if (style === 'glitch') {
    // Glitchy entrance with jitter
    const glitchX = frame < inFrames ? (Math.random() - 0.5) * 12 * hidden : 0;
    const glitchY = frame < inFrames ? (Math.random() - 0.5) * 6 * hidden : 0;
    transform = `translate(${glitchX}px, ${glitchY}px) scale(${0.9 + easedVisibility * 0.1})`;
    filter = frame < inFrames ? `hue-rotate(${hidden * 90}deg)` : '';
  }

  return { opacity: visibility, transform, filter };
};

export const AnimatedCard: React.FC<Props> = ({ config, message }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const overriddenConfig = applyBulkMessageToConfig(config, message);
  const animationInStyle = overriddenConfig.animationInStyle || overriddenConfig.animationStyle;
  const animationOutStyle = overriddenConfig.animationOutStyle || 'none';
  const baseInFrames = speedToFrames[overriddenConfig.animationSpeed || 'medium'];
  const maxTransitionFrames = Math.max(6, Math.floor(durationInFrames * 0.42));
  const inFrames = Math.min(baseInFrames, maxTransitionFrames);
  const outFrames = Math.min(Math.max(8, Math.round(baseInFrames * 0.7)), maxTransitionFrames);
  const outStartFrame = Math.max(inFrames + 1, durationInFrames - outFrames);

  // ── Loop Mode ──────────────────────────────────────────
  const loopMode = overriddenConfig.animationLoop || 'loop';
  let effectiveFrame = frame;
  if (loopMode === 'ping-pong') {
    // Forward then reverse: cycle length = 2 × durationInFrames
    const cycleLength = durationInFrames * 2;
    const cyclePos = frame % cycleLength;
    effectiveFrame = cyclePos < durationInFrames ? cyclePos : cycleLength - cyclePos - 1;
  }
  // 'once' and 'loop' use frame as-is (Remotion Player handles looping)

  // ── Easing Selection ────────────────────────────────────
  const getEasingFn = () => {
    const preset = overriddenConfig.easingPreset || 'ease-out';
    switch (preset) {
      case 'linear': return Easing.linear;
      case 'ease-in': return Easing.in(Easing.cubic);
      case 'ease-out': return Easing.out(Easing.cubic);
      case 'ease-in-out': return Easing.inOut(Easing.cubic);
      case 'bounce': return Easing.bounce;
      case 'elastic': return Easing.elastic(Easing.ease);
      case 'back': return Easing.back(Easing.ease);
      case 'spring': return Easing.out(Easing.cubic); // spring uses spring() not easing
      case 'custom': {
        const cb = overriddenConfig.customBezier;
        if (cb) return Easing.bezier(cb.x1, cb.y1, cb.x2, cb.y2);
        return Easing.out(Easing.cubic);
      }
      default: return Easing.out(Easing.cubic);
    }
  };
  const easingFn = getEasingFn();

  const inProgress = animationInStyle === 'none'
    ? 1
    : interpolate(effectiveFrame, [0, inFrames], [0, 1], {
      easing: easingFn,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const outProgress = animationOutStyle === 'none'
    ? 0
    : interpolate(effectiveFrame, [outStartFrame, durationInFrames - 1], [0, 1], {
      easing: easingFn,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const inSpring = spring({
    frame: Math.min(effectiveFrame, inFrames),
    fps,
    durationInFrames: inFrames,
    config: { damping: 12, mass: 0.5, stiffness: 180 },
  });
  const outSpring = spring({
    frame: Math.max(0, effectiveFrame - outStartFrame),
    fps,
    durationInFrames: outFrames,
    config: { damping: 16, mass: 0.6, stiffness: 140 },
  });

  const motionState = effectiveFrame < inFrames
    ? getEffectState(animationInStyle, inProgress, inSpring, effectiveFrame, inFrames)
    : effectiveFrame >= outStartFrame
      ? getEffectState(animationOutStyle, 1 - outProgress, 1 - outSpring, effectiveFrame, outFrames)
      : { opacity: 1, transform: 'none', filter: '' };

  const animatedContent = overriddenConfig.textAnimationMode === 'off' ? undefined : (
    <AnimatedText
      mode={overriddenConfig.textAnimationMode}
      preset={overriddenConfig.textAnimationPreset}
      speed={overriddenConfig.animationSpeed || 'medium'}
    >
      {overriddenConfig.content}
    </AnimatedText>
  );

  const renderCard = () => {
    switch (config.platform) {
      case 'facebook': return <FacebookCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'youtube': return <YouTubeCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'tiktok': return <TikTokCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'twitter': return <TwitterCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'instagram': return <InstagramCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'dm': return <BubbleChatCard config={overriddenConfig} messageOverride={message?.content} />;
      case 'text': return <TextOverlayCard config={overriddenConfig} contentNode={animatedContent} />;
      default: return null;
    }
  };

  return (
    <div style={{ 
      ...motionState, 
      width: config.width, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      ...(motionState.filter ? { filter: motionState.filter } : {}),
    }}>
      {renderCard()}
    </div>
  );
};
