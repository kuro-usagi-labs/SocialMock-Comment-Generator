import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CommentConfig, BulkMessage } from '../../types';
import { composeLayerTransform, getLayerMotion } from '../../utils/motionEngine';
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

const getEffectiveFrame = (frame: number, durationInFrames: number, loopMode: CommentConfig['animationLoop']) => {
  if (loopMode !== 'ping-pong') return frame;

  const cycleLength = durationInFrames * 2;
  const cyclePos = frame % cycleLength;
  return cyclePos < durationInFrames ? cyclePos : cycleLength - cyclePos - 1;
};

export const AnimatedCard: React.FC<Props> = ({ config, message }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const overriddenConfig = applyBulkMessageToConfig(config, message);
  const cardLayer = overriddenConfig.canvas.layers.find(layer => layer.id === 'layer-card-auto');
  const contentLayer = overriddenConfig.canvas.layers.find(layer => layer.id === 'layer-overlay-auto');
  const effectiveFrame = getEffectiveFrame(frame, durationInFrames, overriddenConfig.animationLoop || 'loop');
  const motionContext = {
    frame: effectiveFrame,
    fps,
    durationInFrames,
    config: overriddenConfig,
  };
  const cardMotion = getLayerMotion(cardLayer, motionContext);
  const contentMotion = getLayerMotion(contentLayer, motionContext);
  const contentHasLayerMotion = !contentLayer?.actionBlocks?.length || contentLayer.actionBlocks.some(action => action.style !== 'none');
  const shouldAnimateText = overriddenConfig.textAnimationMode !== 'off' && contentHasLayerMotion;

  const contentStyle: React.CSSProperties = {
    display: 'inline-block',
    opacity: (contentLayer?.opacity ?? 1) * contentMotion.opacity,
    transform: contentMotion.transform,
    willChange: 'transform, opacity, filter',
    backfaceVisibility: 'hidden',
    ...(contentMotion.filter ? { filter: contentMotion.filter } : {}),
  };

  const animatedContent = contentLayer?.visible === false
    ? ''
    : (
      <span style={contentStyle}>
        {!shouldAnimateText ? (
          overriddenConfig.content
        ) : (
          <AnimatedText
            mode={overriddenConfig.textAnimationMode}
            preset={overriddenConfig.textAnimationPreset}
            speed={overriddenConfig.animationSpeed || 'medium'}
            easingPreset={overriddenConfig.easingInPreset || 'ease-out'}
            customBezier={overriddenConfig.customBezierIn}
          >
            {overriddenConfig.content}
          </AnimatedText>
        )}
      </span>
    );

  const renderCard = () => {
    switch (config.platform) {
      case 'facebook': return <FacebookCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'youtube': return <YouTubeCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'tiktok': return <TikTokCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'twitter': return <TwitterCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'instagram': return <InstagramCard config={overriddenConfig} contentNode={animatedContent} />;
      case 'dm': return <BubbleChatCard config={overriddenConfig} messageOverride={contentLayer?.visible === false ? '' : message?.content} />;
      case 'text': return <TextOverlayCard config={overriddenConfig} contentNode={animatedContent} />;
      default: return null;
    }
  };

  return (
    <div
      style={{
        opacity: (cardLayer?.opacity ?? 1) * cardMotion.opacity,
        transform: composeLayerTransform(cardLayer, cardMotion),
        width: config.width,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        willChange: 'transform, opacity, filter',
        backfaceVisibility: 'hidden',
        ...(cardMotion.filter ? { filter: cardMotion.filter } : {}),
      }}
    >
      {renderCard()}
    </div>
  );
};
