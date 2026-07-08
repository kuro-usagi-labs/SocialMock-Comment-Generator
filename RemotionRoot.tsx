import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './components/remotion/Composition';
import { INITIAL_CONFIG, CommentConfig } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SocialMock"
        component={MainComposition}
        durationInFrames={120}
        fps={60}
        width={1080}
        height={1080}
        defaultProps={{
          config: INITIAL_CONFIG,
        }}
        // Allow dynamic overrides from renderMedia() inputProps
        calculateMetadata={async ({ props }) => {
          const config = (props as { config: CommentConfig }).config;
          return {
            durationInFrames: Math.max(60, Math.round((config.animationDuration || 2) * 60)),
            fps: 60,
            width: config.width || 1080,
            height: config.height || config.width || 1080,
          };
        }}
      />
    </>
  );
};
