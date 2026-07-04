import React from 'react';
import { CommentConfig } from '../types';

interface Props {
  config: CommentConfig;
  contentNode?: React.ReactNode;
}

const fontFamilyMap = {
  inter: '"Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif',
  outfit: '"Outfit Variable", "Outfit", ui-sans-serif, system-ui, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const fontWeightMap = {
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
};

const templateClass = {
  subtitle: 'tracking-tight leading-[1.08]',
  hook: 'tracking-tight leading-[0.95]',
  'lower-third': 'leading-[1.05]',
  quote: 'leading-[1.15]',
  sticker: 'inline-block rounded-[28px] bg-white px-7 py-4 text-slate-950 shadow-2xl',
  neon: 'tracking-tight leading-[1.02]',
  minimal: 'leading-[1.18]',
};

const templateStyle = (config: CommentConfig): React.CSSProperties => {
  if (config.textTemplate === 'neon') {
    return {
      textShadow: `0 0 12px ${config.textColor}, 0 0 28px ${config.textColor}`,
    };
  }

  if (config.textTemplate === 'sticker') {
    return {
      color: config.textColor === '#ffffff' ? '#0f172a' : config.textColor,
      textShadow: 'none',
    };
  }

  return {};
};

export const TextOverlayCard: React.FC<Props> = ({ config, contentNode }) => {
  const text = contentNode ?? config.content;

  const style: React.CSSProperties = {
    color: config.textColor,
    fontFamily: fontFamilyMap[config.textFont],
    fontSize: config.fontSize * 2.4,
    fontWeight: fontWeightMap[config.textWeight],
    textAlign: config.textAlign,
    textTransform: config.textTransform === 'none' ? undefined : config.textTransform,
    WebkitTextStroke: config.textStrokeWidth > 0 ? `${config.textStrokeWidth}px ${config.textStrokeColor}` : undefined,
    textShadow: config.textShadow ? '0 12px 34px rgba(15,23,42,0.45)' : 'none',
    overflowWrap: 'anywhere',
    ...templateStyle(config),
  };

  const alignment = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end',
  }[config.textAlign];

  return (
    <div className="flex h-full w-full items-center justify-center bg-transparent p-8">
      <div className={`flex w-full flex-col ${alignment}`} style={{ width: config.width }}>
        <div className={templateClass[config.textTemplate]} style={style}>
          {config.textTemplate === 'quote' && <span className="opacity-60">“</span>}
          {text}
          {config.textTemplate === 'quote' && <span className="opacity-60">”</span>}
        </div>
      </div>
    </div>
  );
};

export default TextOverlayCard;
