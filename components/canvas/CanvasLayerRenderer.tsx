import React from 'react';
import { BulkMessage, CommentConfig, Layer } from '../../types';
import { getLayerMotion, MotionContext } from '../../utils/motionEngine';
import BubbleChatCard from '../BubbleChatCard';
import FacebookCard from '../FacebookCard';
import InstagramCard from '../InstagramCard';
import TextOverlayCard from '../TextOverlayCard';
import TikTokCard from '../TikTokCard';
import TwitterCard from '../TwitterCard';
import YouTubeCard from '../YouTubeCard';
import { CanvasLayerFrame } from './CanvasLayerFrame';
import { renderLayerContent } from './renderLayerContent';

import { ResizeHandle } from './CanvasLayerFrame';

interface CanvasLayerRendererProps {
  config: CommentConfig;
  activeConfig: CommentConfig;
  activeBulkMessage?: BulkMessage;
  layers: Layer[];
  selectedLayerId: string;
  setSelectedLayerId: (id: string) => void;
  draggingLayerId: string | null;
  showSelectionChrome: boolean;
  motionContext: MotionContext;
  registerLayerTarget: (layerId: string, element: HTMLElement | null) => void;
  beginLayerDrag: (id: string, event: React.PointerEvent<HTMLElement>) => void;
  beginLayerResize?: (id: string, handle: ResizeHandle, event: React.PointerEvent<Element>) => void;
  forExport?: boolean;
}

const embeddedContentLayerId = 'layer-overlay-auto';
const cardLayerId = 'layer-card-auto';

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

export const CanvasLayerRenderer: React.FC<CanvasLayerRendererProps> = ({
  config,
  activeConfig,
  activeBulkMessage,
  layers,
  selectedLayerId,
  setSelectedLayerId,
  draggingLayerId,
  showSelectionChrome,
  motionContext,
  registerLayerTarget,
  beginLayerDrag,
  beginLayerResize,
  forExport = false,
}) => {
  const orderedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const cardLayer = orderedLayers.find(layer => layer.id === cardLayerId);
  const contentLayer = orderedLayers.find(layer => layer.id === embeddedContentLayerId);
  const standaloneLayers = orderedLayers.filter(layer =>
    layer.type !== 'background' &&
    layer.id !== cardLayerId &&
    layer.id !== embeddedContentLayerId
  );
  const canvasMinHeight = standaloneLayers.reduce((height, layer) => (
    Math.max(height, layer.y + layer.height)
  ), 0);

  const renderContentNode = (content: string) => {
    if (!contentLayer?.visible) return '';

    const contentMotion = getLayerMotion(contentLayer, motionContext);
    return (
      <span
        ref={(element) => registerLayerTarget(embeddedContentLayerId, element)}
        className="inline-block max-w-full"
        style={{
          opacity: (contentLayer.opacity ?? 1) * contentMotion.opacity,
          transform: contentMotion.transform,
          filter: contentMotion.filter || undefined,
          transformOrigin: 'center',
          transition: 'none',
          willChange: 'transform, opacity, filter',
          backfaceVisibility: 'hidden',
          overflowWrap: 'anywhere',
        }}
      >
        {content}
      </span>
    );
  };

  const renderCardForPlatform = (message?: BulkMessage) => {
    const overriddenConfig = applyBulkMessageToConfig(activeConfig, message);
    const contentNode = renderContentNode(overriddenConfig.content);

    switch (config.platform) {
      case 'facebook': return <FacebookCard config={overriddenConfig} contentNode={contentNode} />;
      case 'youtube': return <YouTubeCard config={overriddenConfig} contentNode={contentNode} />;
      case 'tiktok': return <TikTokCard config={overriddenConfig} contentNode={contentNode} />;
      case 'twitter': return <TwitterCard config={overriddenConfig} contentNode={contentNode} />;
      case 'instagram': return <InstagramCard config={overriddenConfig} contentNode={contentNode} />;
      case 'dm': return <BubbleChatCard config={overriddenConfig} messageOverride={message?.content} />;
      case 'text': return <TextOverlayCard config={overriddenConfig} contentNode={contentNode} />;
      default: return null;
    }
  };

  const renderCardLayer = () => {
    if (!cardLayer) return null;

    return (
      <CanvasLayerFrame
        layer={cardLayer}
        selected={selectedLayerId === cardLayer.id}
        showSelectionChrome={showSelectionChrome && !forExport}
        dragging={draggingLayerId === cardLayer.id}
        motionContext={motionContext}
        registerLayerTarget={registerLayerTarget}
        onPointerDown={(event) => beginLayerDrag(cardLayer.id, event)}
        onSelect={() => setSelectedLayerId(cardLayer.id)}
        className="relative inline-flex max-w-full justify-center rounded-[26px]"
      >
        {cardLayer.visible ? renderCardForPlatform(activeBulkMessage) : (
          <div className="flex min-h-[220px] w-full items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-8 text-center text-sm font-bold text-slate-400">
            Mockup card layer hidden
          </div>
        )}
      </CanvasLayerFrame>
    );
  };

  return (
    <div
      className="relative flex w-full justify-center"
      style={{ minHeight: canvasMinHeight > 0 ? canvasMinHeight : undefined }}
    >
      {renderCardLayer()}

      {standaloneLayers.map(layer => (
        <CanvasLayerFrame
          key={layer.id}
          layer={layer}
          selected={selectedLayerId === layer.id}
          showSelectionChrome={showSelectionChrome && !forExport}
          dragging={draggingLayerId === layer.id}
          motionContext={motionContext}
          registerLayerTarget={registerLayerTarget}
          onPointerDown={(event) => beginLayerDrag(layer.id, event)}
          onSelect={() => setSelectedLayerId(layer.id)}
          onResizeHandlePointerDown={beginLayerResize ? (handle, event) => beginLayerResize(layer.id, handle, event) : undefined}
          className="absolute overflow-hidden rounded-[inherit]"
          baseStyle={{ left: 80, top: 80, width: layer.width, height: layer.height }}
        >
          <div
            className="h-full w-full"
            style={{
              width: layer.width,
              height: layer.height,
              borderRadius: layer.type === 'shape' ? layer.borderRadius : layer.type === 'text' ? layer.borderRadius : 18,
            }}
          >
            {renderLayerContent(layer)}
          </div>
        </CanvasLayerFrame>
      ))}
    </div>
  );
};
