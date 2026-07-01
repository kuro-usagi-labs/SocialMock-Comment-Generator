import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './components/remotion/Composition';
import { INITIAL_CONFIG } from './types';

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
      />
    </>
  );
};
