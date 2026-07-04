import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationSpeed, TextAnimationMode, TextAnimationPreset } from '../../types';

interface AnimatedTextProps {
  children: string;
  mode: TextAnimationMode;
  preset: TextAnimationPreset;
  speed: AnimationSpeed;
  className?: string;
}

const speedConfig: Record<AnimationSpeed, { stagger: number; duration: number }> = {
  slow: { stagger: 5, duration: 22 },
  medium: { stagger: 3, duration: 16 },
  fast: { stagger: 2, duration: 10 },
};

const splitText = (text: string, mode: TextAnimationMode) => {
  if (mode === 'word') return text.split(/(\s+)/);
  if (mode === 'letter') return Array.from(text);
  return [text];
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  mode,
  preset,
  speed,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (mode === 'off') {
    return <>{children}</>;
  }

  const tokens = splitText(children, mode);
  const { stagger, duration } = speedConfig[speed];
  const startFrame = 8;

  return (
    <>
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token)) {
          return (
            <span key={`${token}-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
              {token}
            </span>
          );
        }

        const tokenStart = startFrame + index * stagger;
        const progress = interpolate(frame, [tokenStart, tokenStart + duration], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const pop = spring({
          frame: Math.max(0, frame - tokenStart),
          fps,
          durationInFrames: duration,
          config: { damping: 12, mass: 0.45, stiffness: 180 },
        });

        const style: React.CSSProperties = {
          display: mode === 'letter' ? 'inline-block' : 'inline-block',
          whiteSpace: 'pre-wrap',
        };

        if (preset === 'fade-up') {
          style.opacity = progress;
          style.transform = `translateY(${(1 - progress) * 0.65}em)`;
        } else if (preset === 'typewriter') {
          style.opacity = progress >= 1 ? 1 : 0;
        } else if (preset === 'pop') {
          style.opacity = progress;
          style.transform = `scale(${0.78 + pop * 0.22})`;
        }

        return (
          <span key={`${token}-${index}`} className={className} style={style}>
            {token}
          </span>
        );
      })}
    </>
  );
};
