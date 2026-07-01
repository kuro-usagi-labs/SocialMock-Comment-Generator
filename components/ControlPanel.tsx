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
import { CommentConfig, DmStyle, PaddingSize } from '../types';
import { BulkGenerator } from './BulkGenerator';
import { createRandomProfiles } from '../utils/profileUtils';

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

const gradients = [
  'from-blue-400 to-purple-500',
  'from-pink-500 to-orange-400',
  'from-green-400 to-cyan-500',
  'from-gray-700 to-gray-900',
];

const navItems = [
  { label: 'Profile', icon: User, target: 'editor-profile' },
  { label: 'Content', icon: MessageCircle, target: 'editor-content' },
  { label: 'Style', icon: Palette, target: 'editor-appearance' },
  { label: 'AI', icon: Sparkles, target: 'editor-ai' },
];

const inputClass =
  'glass-input w-full rounded-[16px] px-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium';

const iconInputClass =
  'glass-input w-full rounded-[16px] py-3 pl-10 pr-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium';

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
  <section id={id} className="scroll-mt-5 px-5 py-6">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-900 text-white shadow-md">
          {icon}
        </span>
        <h2 className="font-display truncate text-[14px] font-black uppercase tracking-[0.1em] text-slate-900">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="space-y-5">{children}</div>
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
    className="glass-button flex w-full min-w-0 items-center justify-between rounded-[18px] px-4 py-3 text-left transition"
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

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  update,
  handleReset,
  handleImageUpload,
  onBulkExport,
  isExportingBulk,
}) => {
  const isDm = config.platform === 'dm';

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
    <div className="glass-panel flex h-[54vh] w-full flex-shrink-0 flex-row overflow-hidden rounded-t-[32px] md:h-full md:w-auto md:rounded-[32px]">
      <nav className="hidden w-[80px] flex-col items-center bg-white/40 px-3 py-6 md:flex border-r border-white/60">
        <button
          type="button"
          onClick={() => scrollToSection('editor-profile')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-indigo-600 font-display text-base font-black tracking-tight text-white shadow-lg transition hover:bg-indigo-500 hover:-translate-y-1"
          title="SocialMock"
        >
          SM
        </button>

        <div className="mt-8 flex flex-1 flex-col items-center gap-4">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
               <button
                key={item.target}
                type="button"
                onClick={() => scrollToSection(item.target)}
                className={`group flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] transition ${
                  index === 0 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-slate-400 transition hover:bg-white/60 hover:text-slate-900"
          title="Reset"
        >
          <RotateCcw size={20} strokeWidth={2} />
        </button>
      </nav>

      <aside className="flex h-full w-full flex-col md:w-[320px] xl:w-[350px]">
        <header className="border-b border-white/60 px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-xl font-black tracking-tight text-slate-900">SocialMock</h1>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-500">Creative Studio</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-600">
              Ready
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pb-8 relative">
          <Section 
            id="editor-profile" 
            title="Profile" 
            icon={<User size={18} />}
            action={
              <button
                type="button"
                onClick={handleRandomizeProfile}
                className="glass-button flex min-w-0 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-indigo-600"
                title="Randomize Profile"
              >
                <Dices size={14} className="shrink-0" />
                <span className="truncate">Auto</span>
              </button>
            }
          >
            {isDm && (
              <div className="space-y-3 glass-card rounded-[20px] p-4">
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
              <div className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-[24px] shadow-sm">
                {config.avatarUrl ? (
                  <img src={config.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-3xl font-black text-white"
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
                    className="glass-input h-[46px] w-full cursor-pointer rounded-[16px] p-1"
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
                    className="glass-button w-full rounded-[16px] px-3 py-3 text-left text-xs font-bold text-slate-500"
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

          <hr className="border-white/60 mx-5" />

          <Section id="editor-content" title="Content" icon={<MessageCircle size={18} />}>
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

            <textarea
              value={config.content}
              onChange={(event) => update('content', event.target.value)}
              className={`${inputClass} min-h-[120px] resize-none leading-relaxed`}
              placeholder={isDm ? 'Write a DM message...' : 'Write a comment...'}
            />

            <div className="glass-card space-y-3 rounded-[20px] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Type size={16} />
                  Font size
                </span>
                <span className="rounded-[10px] bg-white/60 px-2.5 py-1 text-xs font-black text-indigo-600">
                  {config.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="32"
                value={config.fontSize}
                onChange={(event) => update('fontSize', parseInt(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </Section>

          <hr className="border-white/60 mx-5" />

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
              <div className="glass-input flex items-center gap-3 rounded-[16px] px-3 py-2">
                <input
                  type="color"
                  value={config.backgroundColor.startsWith('#') ? config.backgroundColor : '#e5e7eb'}
                  onChange={(event) => update('backgroundColor', event.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-[12px] border-0 bg-transparent p-0"
                  aria-label="Background color"
                />
                <span className="truncate text-sm font-bold text-slate-700">Canvas Color</span>
              </div>
            )}

            {config.backgroundType === 'gradient' && (
              <div className="grid grid-cols-4 gap-2">
                {gradients.map(gradient => (
                  <button
                    key={gradient}
                    type="button"
                    onClick={() => update('backgroundColor', gradient)}
                    className={`h-12 rounded-[14px] bg-gradient-to-r shadow-sm transition-transform hover:scale-105 ${gradient} ${
                      config.backgroundColor === gradient ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                    }`}
                    aria-label={`Use ${gradient} gradient`}
                  />
                ))}
              </div>
            )}

            {!isDm && (
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

            <div className="glass-card space-y-3 rounded-[20px] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Output width</span>
                <span className="rounded-[10px] bg-white/60 px-2.5 py-1 text-xs font-black text-indigo-600">
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

          <hr className="border-white/60 mx-5" />

          <Section id="editor-ai" title="AI Generator" icon={<Wand2 size={18} />}>
            <BulkGenerator
              config={config}
              update={update}
              onBulkExport={onBulkExport}
              isExportingBulk={isExportingBulk}
            />
          </Section>
        </div>
      </aside>
    </div>
  );
};
