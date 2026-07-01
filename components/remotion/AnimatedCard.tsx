import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { CommentConfig, BulkMessage } from '../../types';
import FacebookCard from '../FacebookCard';
import YouTubeCard from '../YouTubeCard';
import TikTokCard from '../TikTokCard';
import TwitterCard from '../TwitterCard';
import InstagramCard from '../InstagramCard';
import BubbleChatCard from '../BubbleChatCard';

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

export const AnimatedCard: React.FC<Props> = ({ config, message }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overriddenConfig = applyBulkMessageToConfig(config, message);
  const style = overriddenConfig.animationStyle;

  // Animations
  const popProgress = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 200 },
  });

  const slideProgress = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 150 },
  });

  let transform = 'none';
  let opacity = 1;

  if (style === 'pop') {
    transform = `scale(${popProgress})`;
    opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'slide-up') {
    const yOffset = interpolate(slideProgress, [0, 1], [50, 0]);
    transform = `translateY(${yOffset}px)`;
    opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'slide-down') {
    const yOffset = interpolate(slideProgress, [0, 1], [-50, 0]);
    transform = `translateY(${yOffset}px)`;
    opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'slide-left') {
    const xOffset = interpolate(slideProgress, [0, 1], [50, 0]);
    transform = `translateX(${xOffset}px)`;
    opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'slide-right') {
    const xOffset = interpolate(slideProgress, [0, 1], [-50, 0]);
    transform = `translateX(${xOffset}px)`;
    opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'fade-scale') {
    const scale = interpolate(frame, [0, 15], [0.95, 1], { extrapolateRight: 'clamp' });
    transform = `scale(${scale})`;
    opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'elastic-spin') {
    const rotate = interpolate(popProgress, [0, 1], [-180, 0]);
    transform = `scale(${popProgress}) rotate(${rotate}deg)`;
    opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  } else if (style === 'flip-in') {
    const rotateX = interpolate(popProgress, [0, 1], [-90, 0]);
    transform = `perspective(1000px) rotateX(${rotateX}deg)`;
    opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  }

  const renderCard = () => {
    switch (config.platform) {
      case 'facebook': return <FacebookCard config={overriddenConfig} />;
      case 'youtube': return <YouTubeCard config={overriddenConfig} />;
      case 'tiktok': return <TikTokCard config={overriddenConfig} />;
      case 'twitter': return <TwitterCard config={overriddenConfig} />;
      case 'instagram': return <InstagramCard config={overriddenConfig} />;
      case 'dm': return <BubbleChatCard config={overriddenConfig} messageOverride={message?.content} />;
      default: return null;
    }
  };

  return (
    <div style={{ transform, opacity, width: config.width, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {renderCard()}
    </div>
  );
};
