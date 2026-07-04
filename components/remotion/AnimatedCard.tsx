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
) => {
  if (style === 'none') {
    return { opacity: 1, transform: 'none' };
  }

  const easedVisibility = style === 'pop' || style === 'elastic-spin' || style === 'flip-in'
    ? springValue
    : visibility;
  const hidden = 1 - easedVisibility;
  let transform = 'none';

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
  }

  return { opacity: visibility, transform };
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

  const inProgress = animationInStyle === 'none'
    ? 1
    : interpolate(frame, [0, inFrames], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const outProgress = animationOutStyle === 'none'
    ? 0
    : interpolate(frame, [outStartFrame, durationInFrames - 1], [0, 1], {
      easing: Easing.in(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const inSpring = spring({
    frame: Math.min(frame, inFrames),
    fps,
    durationInFrames: inFrames,
    config: { damping: 12, mass: 0.5, stiffness: 180 },
  });
  const outSpring = spring({
    frame: Math.max(0, frame - outStartFrame),
    fps,
    durationInFrames: outFrames,
    config: { damping: 16, mass: 0.6, stiffness: 140 },
  });

  const motionState = frame < inFrames
    ? getEffectState(animationInStyle, inProgress, inSpring)
    : frame >= outStartFrame
      ? getEffectState(animationOutStyle, 1 - outProgress, 1 - outSpring)
      : { opacity: 1, transform: 'none' };

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
    <div style={{ ...motionState, width: config.width, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {renderCard()}
    </div>
  );
};
