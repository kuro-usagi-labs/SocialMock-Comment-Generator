import React from 'react';
import {
  ArrowLeftRight,
  BadgeCheck,
  CheckCircle,
  Clock,
  Dices,
  Hash,
  Image as ImageIcon,
  MessageCircle,
  Palette,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  Type,
  User,
  Wand2,
} from 'lucide-react';
import {
  CommentConfig,
  DmStyle,
  PaddingSize,
  TextAlign,
  TextFont,
  TextTemplate,
  TextTransform,
  TextWeight,
} from '../types';
import { BulkGenerator } from './BulkGenerator';
import { createRandomProfiles } from '../utils/profileUtils';
import { BACKGROUND_GRADIENT_PRESETS } from '../utils/backgroundLayer';

interface ControlPanelProps {
  config: CommentConfig;
  update: (key: keyof CommentConfig, value: any) => void;
  handleReset: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkExport: () => void;
  isExportingBulk: boolean;
}

const dmStyles: Array<{ value: DmStyle; label: string }> = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'imessage', label: 'iMessage' },
];

const textTemplates: Array<{ value: TextTemplate; label: string }> = [
  { value: 'subtitle', label: 'Subtitle' },
  { value: 'hook', label: 'Hook' },
  { value: 'lower-third', label: 'Lower Third' },
  { value: 'quote', label: 'Quote' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'neon', label: 'Neon' },
  { value: 'minimal', label: 'Minimal' },
];

const textFonts: Array<{ value: TextFont; label: string }> = [
  { value: 'inter', label: 'Inter' },
  { value: 'outfit', label: 'Outfit' },
  { value: 'system', label: 'System' },
];

const textWeights: Array<{ value: TextWeight; label: string }> = [
  { value: 'regular', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'bold', label: 'Bold' },
  { value: 'black', label: 'Black' },
];

const textTransforms: Array<{ value: TextTransform; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Upper' },
  { value: 'lowercase', label: 'Lower' },
  { value: 'capitalize', label: 'Title' },
];

const gradients = [
  { label: 'Blue → Purple', color1: '#60a5fa', color2: '#a855f7' },
  { label: 'Pink → Orange', color1: '#ec4899', color2: '#fb923c' },
  { label: 'Green → Cyan', color1: '#4ade80', color2: '#06b6d4' },
  { label: 'Dark', color1: '#374151', color2: '#111827' },
];

const navItems = [
  { label: 'Profile', icon: User, target: 'editor-profile' },
  { label: 'Content', icon: MessageCircle, target: 'editor-content' },
  { label: 'Text', icon: Type, target: 'editor-text-style' },
  { label: 'Style', icon: Palette, target: 'editor-appearance' },
  { label: 'AI', icon: Sparkles, target: 'editor-ai' },
];

const inputClass =
  'glass-input w-full rounded-lg px-3.5 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium';

const iconInputClass =
  'glass-input w-full rounded-lg py-3 pl-10 pr-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium';

const labelClass = 'font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 block';

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Section: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ id, title, icon, children, action }) => (
  <section id={id} className="scroll-mt-4 px-4 py-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          {icon}
        </span>
        <h2 className="font-display truncate text-[13px] font-black uppercase tracking-[0.12em] text-slate-900">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
  icon?: React.ReactNode;
}> = ({ checked, onChange, label, icon }) => (
  <button
    type="button"
    onClick={onChange}
    className="glass-button flex w-full min-w-0 items-center justify-between rounded-lg px-4 py-3 pr-5 text-left transition"
  >
    <span className="flex min-w-0 items-center gap-3 font-bold text-slate-700">
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </span>
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`}>
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
);

const ControlPanelComponent: React.FC<ControlPanelProps> = ({
  config,
  update,
  handleReset,
  handleImageUpload,
  onBulkExport,
  isExportingBulk,
}) => {
  const isDm = config.platform === 'dm';
  const isText = config.platform === 'text';
  const visibleNavItems = navItems.filter(item => {
    if (isText) {
      return ['editor-content', 'editor-text-style', 'editor-appearance'].includes(item.target);
    }
    return item.target !== 'editor-text-style';
  });

  const handleRandomizeProfile = () => {
    const isMale = Math.random() > 0.5;
    const profile = createRandomProfiles(1, 'id', isMale ? 'male' : 'female')[0];
    update('displayName', profile.displayName);
    update('username', profile.username);
    update('avatarInitials', profile.avatarInitials);
    update('avatarColor', profile.avatarColor);
    update('avatarUrl', null);
  };

  return (
    <div className="flex h-[54vh] w-full min-w-0 flex-shrink-0 flex-row overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-[0_-16px_48px_rgba(15,23,42,0.12)] md:h-full md:w-full md:rounded-none md:border-0 md:shadow-none">
      <nav className="hidden w-[72px] flex-col items-center border-r border-slate-800 bg-slate-950 px-3 py-4 md:flex">
        <button
          type="button"
          onClick={() => scrollToSection('editor-profile')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white font-display text-sm font-black tracking-tight text-slate-950 shadow-lg transition hover:bg-indigo-50"
          title="SocialMock"
        >
          SM
        </button>

        <div className="mt-7 flex flex-1 flex-col items-center gap-3">
          {visibleNavItems.map((item, index) => {
            const Icon = item.icon;
            return (
               <button
                key={item.target}
                type="button"
                onClick={() => scrollToSection(item.target)}
                className={`group flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition ${
                  index === 0 ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon size={20} strokeWidth={2} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          title="Reset"
        >
          <RotateCcw size={20} strokeWidth={2} />
        </button>
      </nav>

      <aside className="flex h-full w-full min-w-0 flex-col overflow-x-hidden md:w-[348px]">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-lg font-black tracking-tight text-slate-900">Inspector</h1>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-500">Edit content, style, and output</p>
            </div>
            <span className="hidden shrink-0 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 sm:inline-flex">
              Ready
            </span>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto pb-6">
          {!isText && (
          <Section
            id="editor-profile"
            title="Profile"
            icon={<User size={18} />}
            action={
              <button
                type="button"
                onClick={handleRandomizeProfile}
                className="glass-button hidden min-w-0 shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 sm:flex"
                title="Randomize Profile"
              >
                <Dices size={14} className="shrink-0" />
                <span className="truncate">Auto</span>
              </button>
            }
          >
            {isDm && (
              <div className="glass-card space-y-3 rounded-lg p-4">
                <div className="space-y-2">
                  <div className={labelClass}>DM Style</div>
                  <div className="segmented-control grid grid-cols-3">
                    {dmStyles.map(style => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => update('dmStyle', style.value)}
                        className={`segmented-btn ${
                          config.dmStyle === style.value
                            ? 'segmented-btn-active'
                            : 'segmented-btn-inactive'
                        }`}
                      >
                        <span className="block truncate">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Toggle
                  checked={config.isMe}
                  onChange={() => update('isMe', !config.isMe)}
                  label={config.isMe ? 'Sent (Right)' : 'Received (Left)'}
                  icon={<ArrowLeftRight size={16} />}
                />
              </div>
            )}
            <div className="flex gap-4">
              <div className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg shadow-sm">
                {config.avatarUrl ? (
                  <img src={config.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-2xl font-black text-white"
                    style={{ backgroundColor: config.avatarColor }}
                  >
                    {config.avatarInitials}
                  </div>
                )}
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/60 text-[12px] font-bold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="grid grid-cols-[48px_1fr] gap-2">
                  <input
                    type="color"
                    value={config.avatarColor}
                    onChange={(event) => update('avatarColor', event.target.value)}
                    className="glass-input h-[46px] w-full cursor-pointer rounded-lg p-1"
                    aria-label="Avatar color"
                  />
                  <input
                    type="text"
                    value={config.avatarInitials}
                    onChange={(event) => update('avatarInitials', event.target.value.toUpperCase().slice(0, 2))}
                    className={inputClass}
                    placeholder="Initials"
                    maxLength={2}
                  />
                </div>
                {config.avatarUrl?.startsWith('data:') ? (
                  <button
                    type="button"
                    onClick={() => update('avatarUrl', null)}
                    className="glass-button w-full rounded-lg px-3 py-3 text-left text-xs font-bold text-slate-500"
                  >
                    <span className="block truncate">Uploaded image. Click to remove.</span>
                  </button>
                ) : (
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={config.avatarUrl || ''}
                      onChange={(event) => update('avatarUrl', event.target.value)}
                      placeholder="Image URL"
                      className={iconInputClass}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={config.displayName}
                  onChange={(event) => update('displayName', event.target.value)}
                  className={iconInputClass}
                  placeholder="Display name"
                />
              </div>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={config.username}
                  onChange={(event) => update('username', event.target.value)}
                  className={iconInputClass}
                  placeholder="Handle / username"
                />
              </div>
            </div>

            {!isDm && (
              <Toggle
                checked={config.isVerified}
                onChange={() => update('isVerified', !config.isVerified)}
                label="Verified Badge"
                icon={<BadgeCheck size={18} className="text-blue-500" />}
              />
            )}
          </Section>
          )}

          {!isText && <hr className="border-white/60 mx-5" />}

          <Section id="editor-content" title="Content" icon={<MessageCircle size={18} />}>
            {!isText && (
              <div className="relative">
                <Clock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={config.timestamp}
                  onChange={(event) => update('timestamp', event.target.value)}
                  className={iconInputClass}
                  placeholder={isDm ? 'Timestamp, e.g. Today' : 'Timestamp, e.g. 2h'}
                />
              </div>
            )}

            <textarea
              value={config.content}
              onChange={(event) => update('content', event.target.value)}
              className={`${inputClass} min-h-[120px] resize-none leading-relaxed`}
              placeholder={isText ? 'Write overlay text...' : isDm ? 'Write a DM message...' : 'Write a comment...'}
            />

            <div className="glass-card space-y-3 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Type size={16} />
                  Font size
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-indigo-600">
                  {config.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min={isText ? '16' : '12'}
                max="32"
                value={config.fontSize}
                onChange={(event) => update('fontSize', parseInt(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </Section>

          <hr className="border-white/60 mx-5" />

          {isText && (
            <>
              <Section id="editor-text-style" title="Text Style" icon={<Type size={18} />}>
                <div className="space-y-2">
                  <div className={labelClass}>Template</div>
                  <select
                    value={config.textTemplate}
                    onChange={(event) => update('textTemplate', event.target.value as TextTemplate)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {textTemplates.map(template => (
                      <option key={template.value} value={template.value}>{template.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className={labelClass}>Font</div>
                    <select
                      value={config.textFont}
                      onChange={(event) => update('textFont', event.target.value as TextFont)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      {textFonts.map(font => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className={labelClass}>Weight</div>
                    <select
                      value={config.textWeight}
                      onChange={(event) => update('textWeight', event.target.value as TextWeight)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      {textWeights.map(weight => (
                        <option key={weight.value} value={weight.value}>{weight.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={labelClass}>Alignment</div>
                  <div className="segmented-control grid grid-cols-3">
                    {(['left', 'center', 'right'] as TextAlign[]).map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => update('textAlign', align)}
                        className={`segmented-btn ${
                          config.textAlign === align ? 'segmented-btn-active' : 'segmented-btn-inactive'
                        }`}
                      >
                        <span className="block truncate capitalize">{align}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={labelClass}>Transform</div>
                  <div className="segmented-control grid grid-cols-4">
                    {textTransforms.map(transform => (
                      <button
                        key={transform.value}
                        type="button"
                        onClick={() => update('textTransform', transform.value)}
                        className={`segmented-btn ${
                          config.textTransform === transform.value ? 'segmented-btn-active' : 'segmented-btn-inactive'
                        }`}
                      >
                        <span className="block truncate">{transform.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                <div className="glass-input flex items-center gap-3 rounded-lg px-3 py-2">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(event) => update('textColor', event.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-[12px] border-0 bg-transparent p-0"
                      aria-label="Text color"
                    />
                    <span className="truncate text-sm font-bold text-slate-700">Fill</span>
                  </div>
                <div className="glass-input flex items-center gap-3 rounded-lg px-3 py-2">
                    <input
                      type="color"
                      value={config.textStrokeColor}
                      onChange={(event) => update('textStrokeColor', event.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-[12px] border-0 bg-transparent p-0"
                      aria-label="Stroke color"
                    />
                    <span className="truncate text-sm font-bold text-slate-700">Stroke</span>
                  </div>
                </div>

                <div className="glass-card space-y-3 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Stroke width</span>
                    <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-indigo-600">
                      {config.textStrokeWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={config.textStrokeWidth}
                    onChange={(event) => update('textStrokeWidth', parseInt(event.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <Toggle
                  checked={config.textShadow}
                  onChange={() => update('textShadow', !config.textShadow)}
                  label="Text shadow"
                  icon={<Sparkles size={16} />}
                />
              </Section>

              <hr className="border-white/60 mx-5" />
            </>
          )}

          <Section id="editor-appearance" title="Appearance" icon={<Palette size={18} />}>
            <div className="space-y-2">
              <div className={labelClass}>Background</div>
              <div className="segmented-control grid grid-cols-3">
                {(['transparent', 'solid', 'gradient'] as const).map(background => (
                  <button
                    key={background}
                    type="button"
                    onClick={() => update('backgroundType', background)}
                    className={`segmented-btn ${
                      config.backgroundType === background
                        ? 'segmented-btn-active'
                        : 'segmented-btn-inactive'
                    }`}
                    title={background}
                  >
                    <span className="block truncate capitalize">{background}</span>
                  </button>
                ))}
              </div>
            </div>

            {config.backgroundType === 'solid' && (
              <div className="glass-input flex items-center gap-3 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={config.backgroundColor.startsWith('#') ? config.backgroundColor : '#e5e7eb'}
                  onChange={(event) => update('backgroundColor', event.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
                  aria-label="Background color"
                />
                <span className="truncate text-sm font-bold text-slate-700">Canvas Color</span>
              </div>
            )}

            {config.backgroundType === 'gradient' && (
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUND_GRADIENT_PRESETS.map(gradient => (
                  <button
                    key={gradient.value}
                    type="button"
                    onClick={() => update('backgroundColor', gradient.value)}
                    className={`h-12 rounded-lg shadow-sm transition-transform hover:scale-105 ${
                      config.backgroundColor === gradient.value ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                    }`}
                    style={{ backgroundImage: gradient.value }}
                    aria-label={`Use ${gradient.label} gradient`}
                  />
                ))}
              </div>
            )}

            {!isDm && !isText && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <ThumbsUp size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={config.likes}
                    onChange={(event) => update('likes', event.target.value)}
                    className={iconInputClass}
                    placeholder="Likes"
                  />
                </div>
                <div className="relative">
                  <MessageCircle size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={config.replies}
                    onChange={(event) => update('replies', event.target.value)}
                    className={iconInputClass}
                    placeholder="Replies"
                  />
                </div>
                <div className="col-span-2">
                  <Toggle
                    checked={config.showStats}
                    onChange={() => update('showStats', !config.showStats)}
                    label="Show stats row"
                    icon={<CheckCircle size={16} />}
                  />
                </div>
              </div>
            )}

            <div className="glass-card space-y-3 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Output width</span>
                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-indigo-600">
                  {config.width}px
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="1200"
                step="10"
                value={config.width}
                onChange={(event) => update('width', parseInt(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className={labelClass}>Padding</div>
              <div className="segmented-control grid grid-cols-3">
                {(['compact', 'normal', 'spacious'] as PaddingSize[]).map(padding => (
                  <button
                    key={padding}
                    type="button"
                    onClick={() => update('padding', padding)}
                    className={`segmented-btn ${
                      config.padding === padding
                        ? 'segmented-btn-active'
                        : 'segmented-btn-inactive'
                    }`}
                    title={padding}
                  >
                    <span className="block truncate capitalize">{padding}</span>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {!isText && (
            <>
              <hr className="border-white/60 mx-5" />

              <Section id="editor-ai" title="AI Generator" icon={<Wand2 size={18} />}>
                <BulkGenerator
                  config={config}
                  update={update}
                  onBulkExport={onBulkExport}
                  isExportingBulk={isExportingBulk}
                />
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export const ControlPanel = React.memo(ControlPanelComponent);
