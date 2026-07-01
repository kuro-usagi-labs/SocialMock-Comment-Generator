export type Platform = 'facebook' | 'youtube' | 'tiktok' | 'twitter' | 'instagram' | 'dm';
export type Theme = 'light' | 'dark';
export type CardWidth = number;
export type PaddingSize = 'compact' | 'normal' | 'spacious';
export type BackgroundType = 'transparent' | 'solid' | 'gradient';
export type DmStyle = 'instagram' | 'whatsapp' | 'imessage';

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
};
