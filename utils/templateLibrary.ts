import { CommentConfig, INITIAL_CONFIG, Layer, MotionDocument } from '../types';
import { syncBackgroundLayerFromConfig } from './backgroundLayer';
import { createMotionDocument } from './motionDocument';

export type TemplateCategory =
  | 'all'
  | 'social'
  | 'text'
  | 'ads'
  | 'branding'
  | 'backgrounds';

export interface TemplatePreviewStyle {
  background: string;
  accent: string;
  foreground: string;
  label: string;
  layout: 'card' | 'headline' | 'chat' | 'poster' | 'loop';
}

export interface MotionTemplate {
  id: string;
  title: string;
  description: string;
  category: Exclude<TemplateCategory, 'all'>;
  badge?: string;
  preview: TemplatePreviewStyle;
  createConfig: () => CommentConfig;
  createDocument?: () => MotionDocument;
}

const cloneConfig = (config: CommentConfig): CommentConfig => {
  if (typeof structuredClone === 'function') {
    return structuredClone(config);
  }
  return JSON.parse(JSON.stringify(config)) as CommentConfig;
};

const configure = (mutator: (config: CommentConfig) => void): CommentConfig => {
  const config = cloneConfig(INITIAL_CONFIG);
  mutator(config);
  return syncBackgroundLayerFromConfig(config);
};

const patchLayer = (config: CommentConfig, layerId: string, patch: Partial<Layer>) => {
  config.canvas.layers = config.canvas.layers.map(layer =>
    layer.id === layerId ? ({ ...layer, ...patch } as Layer) : layer
  );
};

export const templateCategories: Array<{ id: TemplateCategory; label: string }> = [
  { id: 'all', label: 'All Templates' },
  { id: 'social', label: 'Social media' },
  { id: 'text', label: 'Text' },
  { id: 'ads', label: 'Ads' },
  { id: 'branding', label: 'Branding' },
  { id: 'backgrounds', label: 'Backgrounds' },
];

export const motionTemplates: MotionTemplate[] = [
  {
    id: 'white-social-handle',
    title: 'White Social Handle',
    description: 'Clean comment card with profile, stats, and simple pop motion.',
    category: 'social',
    preview: {
      background: '#f3f4f6',
      accent: '#7c3aed',
      foreground: '#111827',
      label: '@socialmock',
      layout: 'card',
    },
    createConfig: () => configure(config => {
      config.platform = 'twitter';
      config.theme = 'light';
      config.backgroundType = 'solid';
      config.backgroundColor = '#f5f7fb';
      config.displayName = 'SocialMock Studio';
      config.username = '@socialmock';
      config.avatarInitials = 'SM';
      config.avatarColor = '#7c3aed';
      config.content = 'Turn any comment into a polished motion graphic.';
      config.likes = '2.8K';
      config.replies = '128';
      config.animationInStyle = 'pop';
      config.animationOutStyle = 'fade-scale';
      patchLayer(config, 'layer-card-auto', { x: 80, y: 120, width: 920, height: 520 });
      patchLayer(config, 'layer-overlay-auto', {
        text: 'Clean social proof',
        y: 760,
        textColor: '#4f46e5',
        textSize: 42,
        textWeight: 'black',
      });
    }),
  },
  {
    id: 'gradient-background-loop',
    title: 'Gradient Background Loop',
    description: 'Bold looping gradient with large headline typography.',
    category: 'backgrounds',
    badge: 'new',
    preview: {
      background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
      accent: '#ffffff',
      foreground: '#ffffff',
      label: 'Love wins.',
      layout: 'headline',
    },
    createConfig: () => configure(config => {
      config.platform = 'text';
      config.backgroundType = 'gradient';
      config.backgroundColor = 'linear-gradient(135deg, #0ea5e9, #7c3aed)';
      config.content = 'Love wins.';
      config.displayName = 'Love wins.';
      config.textColor = '#ffffff';
      config.textStrokeColor = '#111827';
      config.textShadow = true;
      config.animationInStyle = 'slide-up';
      config.animationOutStyle = 'fade-scale';
      patchLayer(config, 'layer-card-auto', { visible: false });
      patchLayer(config, 'layer-overlay-auto', {
        x: 120,
        y: 330,
        width: 840,
        height: 240,
        text: 'Love wins.',
        textColor: '#ffffff',
        textSize: 84,
        textWeight: 'black',
      });
    }),
  },
  {
    id: 'dm-pop-reply',
    title: 'DM Pop Reply',
    description: 'Chat bubble motion for testimonials, replies, and customer messages.',
    category: 'social',
    preview: {
      background: '#f8fafc',
      accent: '#22c55e',
      foreground: '#111827',
      label: 'That looks great!',
      layout: 'chat',
    },
    createConfig: () => configure(config => {
      config.platform = 'dm';
      config.dmStyle = 'imessage';
      config.isMe = false;
      config.backgroundType = 'solid';
      config.backgroundColor = '#eef2ff';
      config.displayName = 'Client';
      config.username = '@client';
      config.avatarInitials = 'CL';
      config.avatarColor = '#22c55e';
      config.content = 'This looks great. Can we use it for launch?';
      config.timestamp = 'Today';
      config.animationInStyle = 'slide-up';
      config.animationOutStyle = 'fade-scale';
      patchLayer(config, 'layer-card-auto', { x: 96, y: 260, width: 880, height: 360 });
      patchLayer(config, 'layer-overlay-auto', { visible: false });
    }),
  },
  {
    id: 'product-testimonial',
    title: 'Product Testimonial',
    description: 'A testimonial style card for ads, SaaS, and launch videos.',
    category: 'ads',
    preview: {
      background: 'linear-gradient(135deg, #111827, #4f46e5)',
      accent: '#facc15',
      foreground: '#ffffff',
      label: 'The workflow feels instant.',
      layout: 'poster',
    },
    createConfig: () => configure(config => {
      config.platform = 'facebook';
      config.theme = 'dark';
      config.backgroundType = 'gradient';
      config.backgroundColor = 'linear-gradient(135deg, #111827, #4f46e5)';
      config.displayName = 'Maya Product';
      config.username = 'Product Lead';
      config.avatarInitials = 'MP';
      config.avatarColor = '#facc15';
      config.content = 'The workflow feels instant. We shipped our launch assets in one afternoon.';
      config.likes = '984';
      config.replies = '73';
      config.animationInStyle = 'zoom-blur';
      config.animationOutStyle = 'fade-scale';
      patchLayer(config, 'layer-card-auto', { x: 90, y: 220, width: 900, height: 460 });
      patchLayer(config, 'layer-overlay-auto', {
        text: 'Customer proof',
        y: 120,
        textColor: '#facc15',
        textSize: 46,
      });
    }),
  },
  {
    id: 'youtube-lower-comment',
    title: 'YouTube Lower Comment',
    description: 'Lower-third comment reveal for creators and video recaps.',
    category: 'social',
    preview: {
      background: '#111827',
      accent: '#ef4444',
      foreground: '#ffffff',
      label: 'Pinned comment',
      layout: 'card',
    },
    createConfig: () => configure(config => {
      config.platform = 'youtube';
      config.theme = 'dark';
      config.backgroundType = 'solid';
      config.backgroundColor = '#111827';
      config.displayName = 'Pinned Creator';
      config.username = '@creator';
      config.avatarInitials = 'YT';
      config.avatarColor = '#ef4444';
      config.content = 'Drop your favorite moment below.';
      config.likes = '8.4K';
      config.replies = '312';
      config.animationInStyle = 'slide-up';
      config.animationOutStyle = 'fade-scale';
      patchLayer(config, 'layer-card-auto', { x: 80, y: 560, width: 920, height: 360 });
      patchLayer(config, 'layer-overlay-auto', { visible: false });
    }),
  },
  {
    id: 'brand-title-sting',
    title: 'Brand Title Sting',
    description: 'Short brand intro with centered title and subtle motion.',
    category: 'branding',
    preview: {
      background: 'linear-gradient(135deg, #f8fafc, #dbeafe)',
      accent: '#2563eb',
      foreground: '#0f172a',
      label: 'Launch Day',
      layout: 'loop',
    },
    createConfig: () => configure(config => {
      config.platform = 'text';
      config.backgroundType = 'gradient';
      config.backgroundColor = 'linear-gradient(135deg, #f8fafc, #dbeafe)';
      config.content = 'Launch Day';
      config.displayName = 'Launch Day';
      config.textColor = '#0f172a';
      config.textShadow = false;
      config.animationInStyle = 'pop';
      config.animationOutStyle = 'fade-scale';
      patchLayer(config, 'layer-card-auto', { visible: false });
      patchLayer(config, 'layer-overlay-auto', {
        x: 120,
        y: 360,
        width: 840,
        height: 180,
        text: 'Launch Day',
        textColor: '#0f172a',
        textSize: 76,
        textWeight: 'black',
      });
    }),
  },
];

motionTemplates.forEach(template => {
  template.createDocument = () => createMotionDocument(template.createConfig(), {
    title: template.title,
    sceneName: template.title,
    sourceTemplateId: template.id,
  });
});

export const createDocumentFromTemplate = (template: MotionTemplate) => (
  template.createDocument?.() ?? createMotionDocument(template.createConfig(), {
    title: template.title,
    sceneName: template.title,
    sourceTemplateId: template.id,
  })
);
