import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedCard } from './AnimatedCard';
import { CommentConfig, BulkMessage } from '../../types';
import { resolveCanvasBackgroundStyle } from '../../utils/backgroundLayer';

export const MainComposition: React.FC<{ config: CommentConfig; message?: BulkMessage }> = ({ config, message }) => {
  // Greenscreen override — always take priority
  if (config.greenscreen) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#00FF00',
          justifyContent: 'center',
          alignItems: 'center',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'geometricPrecision',
        }}
      >
        <AnimatedCard config={config} message={message} />
      </AbsoluteFill>
    );
  }

  const background = resolveCanvasBackgroundStyle(config);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
    >
      {background.hasVisibleBackground && (
        <AbsoluteFill style={background.style} />
      )}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <AnimatedCard config={config} message={message} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
