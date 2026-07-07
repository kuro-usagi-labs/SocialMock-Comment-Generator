export type Platform = 'facebook' | 'youtube' | 'tiktok' | 'twitter' | 'instagram' | 'dm' | 'text';
export type Theme = 'light' | 'dark';
export type CardWidth = number;
export type PaddingSize = 'compact' | 'normal' | 'spacious';
export type BackgroundType = 'transparent' | 'solid' | 'gradient';
export type DmStyle = 'instagram' | 'whatsapp' | 'imessage';
export type AnimationStyle = 'none' | 'pop' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'fade-scale' | 'elastic-spin' | 'flip-in' | 'bounce-in' | 'rubber-band' | 'shake' | 'wiggle' | 'zoom-blur' | 'rotate-in' | 'swipe-in' | 'glitch';
export type AnimationSpeed = 'slow' | 'medium' | 'fast';
export type VideoExportFormat = 'mp4' | 'mov' | 'gif' | 'webm';
export type ExportResolution = '720p' | '1080p' | '2k' | '4k';
export type TextAnimationMode = 'off' | 'word' | 'letter';
export type TextAnimationPreset = 'fade-up' | 'typewriter' | 'pop';
export type TextTemplate = 'subtitle' | 'hook' | 'lower-third' | 'quote' | 'sticker' | 'neon' | 'minimal';
export type TextFont = 'inter' | 'outfit' | 'system';
export type TextWeight = 'regular' | 'medium' | 'bold' | 'black';
export type TextAlign = 'left' | 'center' | 'right';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type EasingPreset = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'back' | 'spring' | 'custom';
export type AnimationLoop = 'once' | 'loop' | 'ping-pong';

export interface BezierPoints { x1: number; y1: number; x2: number; y2: number; }

// ---------------------------------------------------------------
// Phase 2C — Multi-Element Composition: Layer System
// ---------------------------------------------------------------
export type LayerType = 'background' | 'card' | 'text' | 'shape' | 'image';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  /** Z order index — higher = front */
  zIndex: number;
  /** Position & size in canvas px */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  /** Layer-level entry animation (optional — falls back to canvas-wide animation) */
  animationInStyle?: AnimationStyle;
  animationOutStyle?: AnimationStyle;
  /** Entrance delay in frames relative to canvas start */
  delayFrames: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  /** What kind of fill */
  bgKind: 'solid' | 'linear-gradient' | 'radial-gradient' | 'image';
  bgColor1: string;
  bgColor2: string;
  bgGradientAngle: number; // 0..360, used for linear-gradient
  bgImageUrl: string | null;
  bgImageFit: 'cover' | 'contain' | 'tile';
  bgBlur: number;
}

export interface CardLayer extends BaseLayer {
  type: 'card';
  /** Embed existing single-card config; null = auto-inherit */
  cardConfig: CommentConfig | null;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  textFont: TextFont;
  textWeight: TextWeight;
  textAlign: TextAlign;
  textColor: string;
  textStrokeColor: string;
  textStrokeWidth: number;
  textShadow: boolean;
  textTemplate: TextTemplate;
  textSize: number;
  textLetterSpacing: number;
  textLineHeight: number;
  backgroundColor: string; // '' for transparent
  paddingX: number;
  paddingY: number;
  borderRadius: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeKind: 'rectangle' | 'circle' | 'line';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number; // rectangle only
  /** Line: target length for the 0┬║1 axis (x or y) */
  lineOrientation: 'horizontal' | 'vertical';
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string | null;
  fitMode: 'cover' | 'contain' | 'fill';
  blur: number;
  brightness: number; // 0..200 (100 = normal)
  grayscale: number; // 0..100 (0 = full color)
}

export type Layer = BackgroundLayer | CardLayer | TextLayer | ShapeLayer | ImageLayer;

/** Ordered list of layers rendered from back to front */
export interface Canvas {
  layers: Layer[];
}

export interface BulkMessage {
  id: string;
  content: string;
  displayName: string;
  username: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl: string | null;
}

export interface CommentConfig {
  platform: Platform;
  theme: Theme;
  avatarUrl: string | null;
  avatarInitials: string;
  avatarColor: string;
  displayName: string;
  username: string; // Handle
  isVerified: boolean;
  timestamp: string;
  content: string;
  likes: string;
  replies: string;
  showStats: boolean; // Show the like/reply count row/icons
  fontSize: number; // in pixels (base)
  width: CardWidth;
  padding: PaddingSize;
  backgroundType: BackgroundType;
  backgroundColor: string;
  // DM-specific fields
  dmStyle: DmStyle;
  isMe: boolean; // bubble position: true = right (sent), false = left (received)
  bulkMessages: BulkMessage[];
  // Animation settings
  animationStyle: AnimationStyle;
  animationInStyle: AnimationStyle;
  animationOutStyle: AnimationStyle;
  animationSpeed: AnimationSpeed;
  animationDuration: number;
  animationLoop: AnimationLoop;
  easingInPreset: EasingPreset;
  easingOutPreset: EasingPreset;
  customBezierIn?: BezierPoints;
  customBezierOut?: BezierPoints;
  bulkStagger: number; // seconds between bulk messages
  greenscreen: boolean;
  textAnimationMode: TextAnimationMode;
  textAnimationPreset: TextAnimationPreset;
  textTemplate: TextTemplate;
  textFont: TextFont;
  textWeight: TextWeight;
  textAlign: TextAlign;
  textColor: string;
  textStrokeColor: string;
  textStrokeWidth: number;
  textShadow: boolean;
  textTransform: TextTransform;
  // ---------------------------------------------------------------
  // Phase 2C — Canvas (multi-element composition)
  // ---------------------------------------------------------------
  canvas: Canvas;
}

export const INITIAL_CONFIG: CommentConfig = {
  platform: 'twitter',
  theme: 'light',
  avatarUrl: null,
  avatarInitials: 'JD',
  avatarColor: '#3b82f6',
  displayName: 'John Doe',
  username: '@johndoe',
  isVerified: true,
  timestamp: '2h',
  content: 'This is an amazing tool! The preview looks exactly like the real thing. 🚀',
  likes: '1.2K',
  replies: '45',
  showStats: true,
  fontSize: 16,
  width: 600,
  padding: 'normal',
  backgroundType: 'transparent',
  backgroundColor: 'from-blue-400 to-purple-500',
  // DM defaults
  dmStyle: 'instagram',
  isMe: false,
  bulkMessages: [],
  // Animation defaults
  animationStyle: 'pop',
  animationInStyle: 'pop',
  animationOutStyle: 'fade-scale',
  animationSpeed: 'medium',
  animationDuration: 2,
  animationLoop: 'loop',
  easingInPreset: 'ease-out',
  easingOutPreset: 'ease-in',
  bulkStagger: 0.4,
  greenscreen: false,
  textAnimationMode: 'word',
  textAnimationPreset: 'fade-up',
  textTemplate: 'subtitle',
  textFont: 'outfit',
  textWeight: 'black',
  textAlign: 'center',
  textColor: '#ffffff',
  textStrokeColor: '#0f172a',
  textStrokeWidth: 0,
  textShadow: true,
  textTransform: 'none',
  // Phase 2C defaults — auto-generated starter canvas with 3 layers
  canvas: {
    layers: [
      {
        id: 'layer-bg-auto',
        type: 'background',
        name: 'Background',
        visible: true,
        zIndex: 0,
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        rotation: 0,
        opacity: 1,
        delayFrames: 0,
        bgKind: 'solid',
        bgColor1: '#0f172a',
        bgColor2: '#1e293b',
        bgGradientAngle: 135,
        bgImageUrl: null,
        bgImageFit: 'cover',
        bgBlur: 0,
      },
      {
        id: 'layer-card-auto',
        type: 'card',
        name: 'Comment Card',
        visible: true,
        zIndex: 10,
        x: 80,
        y: 80,
        width: 920,
        height: 720,
        rotation: 0,
        opacity: 1,
        delayFrames: 0,
        cardConfig: null, // null => inherit from root
      },
      {
        id: 'layer-overlay-auto',
        type: 'text',
        name: 'Header Text',
        visible: true,
        zIndex: 20,
        x: 80,
        y: 840,
        width: 920,
        height: 160,
        rotation: 0,
        opacity: 1,
        delayFrames: 6,
        text: 'New comment on your post',
        textFont: 'outfit',
        textWeight: 'medium',
        textAlign: 'center',
        textColor: '#94a3b8',
        textStrokeColor: '#0f172a',
        textStrokeWidth: 0,
        textShadow: false,
        textTemplate: 'minimal',
        textSize: 36,
        textLetterSpacing: 0,
        textLineHeight: 110,
        backgroundColor: '',
        paddingX: 16,
        paddingY: 12,
        borderRadius: 12,
      },
    ],
  },
};
