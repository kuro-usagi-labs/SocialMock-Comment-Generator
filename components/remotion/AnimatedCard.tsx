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
import { renderLayerContent } from '../canvas/renderLayerContent';

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
  const orderedLayers = [...overriddenConfig.canvas.layers].sort((a, b) => a.zIndex - b.zIndex);
  const cardLayer = orderedLayers.find(layer => layer.id === 'layer-card-auto');
  const contentLayer = orderedLayers.find(layer => layer.id === 'layer-overlay-auto');
  const standaloneLayers = orderedLayers.filter(layer =>
    layer.type !== 'background' &&
    layer.id !== 'layer-card-auto' &&
    layer.id !== 'layer-overlay-auto'
  );
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

  const renderStandaloneLayer = (layer: typeof standaloneLayers[number]) => {
    const motion = getLayerMotion(layer, motionContext);
    return (
      <div
        key={layer.id}
        style={{
          position: 'absolute',
          left: 80,
          top: 80,
          width: layer.width,
          height: layer.height,
          opacity: (layer.opacity ?? 1) * motion.opacity,
          transform: composeLayerTransform(layer, motion),
          transformOrigin: 'center',
          filter: motion.filter || undefined,
          overflow: 'hidden',
          borderRadius: layer.type === 'shape' ? layer.borderRadius : layer.type === 'text' ? layer.borderRadius : 18,
          zIndex: layer.zIndex,
          willChange: 'transform, opacity, filter',
          backfaceVisibility: 'hidden',
        }}
      >
        <div style={{ width: layer.width, height: layer.height }}>
          {renderLayerContent(layer)}
        </div>
      </div>
    );
  };

  const canvasMinHeight = standaloneLayers.reduce((height, layer) => (
    Math.max(height, layer.y + layer.height)
  ), 0);

  return (
    <div
      style={{
        position: 'relative',
        width: config.width,
        display: 'flex',
        justifyContent: 'center',
        minHeight: canvasMinHeight > 0 ? canvasMinHeight : undefined,
      }}
    >
      <div
        style={{
          opacity: (cardLayer?.opacity ?? 1) * cardMotion.opacity,
          transform: composeLayerTransform(cardLayer, cardMotion),
          position: 'relative',
          zIndex: cardLayer?.zIndex ?? 10,
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
      {standaloneLayers.map(renderStandaloneLayer)}
    </div>
  );
};
