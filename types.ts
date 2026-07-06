export type Platform = 'facebook' | 'youtube' | 'tiktok' | 'twitter' | 'instagram' | 'dm' | 'text';
export type Theme = 'light' | 'dark';
export type CardWidth = number;
export type PaddingSize = 'compact' | 'normal' | 'spacious';
export type BackgroundType = 'transparent' | 'solid' | 'gradient';
export type DmStyle = 'instagram' | 'whatsapp' | 'imessage';
export type AnimationStyle = 'none' | 'pop' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'fade-scale' | 'elastic-spin' | 'flip-in';
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
};
