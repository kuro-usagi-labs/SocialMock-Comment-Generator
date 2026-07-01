import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedCard } from './AnimatedCard';
import { CommentConfig, BulkMessage } from '../../types';

export const MainComposition: React.FC<{ config: CommentConfig; message?: BulkMessage }> = ({ config, message }) => {
  // If greenscreen is enabled, set a bright green background
  const backgroundColor = config.greenscreen ? '#00FF00' : 'transparent';

  return (
    <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <AnimatedCard config={config} message={message} />
    </AbsoluteFill>
  );
};
