import React, { useEffect } from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedCard } from './AnimatedCard';
import { CommentConfig, BulkMessage } from '../../types';

export const MainComposition: React.FC<{ config: CommentConfig; message?: BulkMessage }> = ({ config, message }) => {
  // If greenscreen is enabled, set a bright green background
  const backgroundColor = config.greenscreen ? '#00FF00' : 'transparent';

  // Force transparent background on html/body to override compiled CSS
  // (index.css sets body { background-color: #e8edf4 } which prevents alpha in MOV export)
  useEffect(() => {
    if (!config.greenscreen) {
      document.documentElement.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty('background-color', 'transparent', 'important');
    }
  }, [config.greenscreen]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
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
};
