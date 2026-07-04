import React from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { MainComposition } from './remotion/Composition';
import {
  AnimationSpeed,
  CommentConfig,
  AnimationStyle,
  TextAnimationMode,
  TextAnimationPreset,
  TextFont,
  TextTemplate,
  TextWeight,
  VideoExportFormat,
} from '../types';
import { Video, Maximize, Play, Download, Loader2, Layers, Gauge, Timer, Pause, RotateCcw } from 'lucide-react';

interface Props {
  config: CommentConfig;
  update: (key: keyof CommentConfig, value: any) => void;
  onExportVideo: (format: VideoExportFormat) => void;
  isExportingVideo: boolean;
  videoExportFormat: VideoExportFormat;
  playerRef: React.RefObject<PlayerRef>;
}

const animationOptions: Array<{ value: AnimationStyle; label: string }> = [
  { value: 'none', label: 'No Animation' },
  { value: 'pop', label: 'Pop In (Bouncy)' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'fade-scale', label: 'Fade & Scale' },
  { value: 'elastic-spin', label: 'Elastic Spin' },
  { value: 'flip-in', label: 'Flip In' },
];

const speedOptions: Array<{ value: AnimationSpeed; label: string }> = [
  { value: 'slow', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'fast', label: 'Fast' },
];

const textModeOptions: Array<{ value: TextAnimationMode; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'word', label: 'Word' },
  { value: 'letter', label: 'Letter' },
];

const textPresetOptions: Array<{ value: TextAnimationPreset; label: string }> = [
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'pop', label: 'Pop' },
];

const textTemplateOptions: Array<{ value: TextTemplate; label: string }> = [
  { value: 'subtitle', label: 'Subtitle' },
  { value: 'hook', label: 'Hook' },
  { value: 'lower-third', label: 'Lower Third' },
  { value: 'quote', label: 'Quote' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'neon', label: 'Neon' },
  { value: 'minimal', label: 'Minimal' },
];

const textFontOptions: Array<{ value: TextFont; label: string }> = [
  { value: 'inter', label: 'Inter' },
  { value: 'outfit', label: 'Outfit' },
  { value: 'system', label: 'System' },
];

const textWeightOptions: Array<{ value: TextWeight; label: string }> = [
  { value: 'regular', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'bold', label: 'Bold' },
  { value: 'black', label: 'Black' },
];

const formatTime = (frame: number, fps: number) => {
  const seconds = Math.max(0, frame / fps);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const AnimationTab: React.FC<Props> = ({ config, update, onExportVideo, isExportingVideo, videoExportFormat, playerRef }) => {
  const durationInFrames = Math.max(60, Math.round((config.animationDuration || 2) * 60));
  const fps = 60;
  const [currentFrame, setCurrentFrame] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const currentTimeLabel = formatTime(currentFrame, fps);
  const durationLabel = formatTime(durationInFrames, fps);
  const progress = Math.min(100, Math.max(0, (currentFrame / Math.max(1, durationInFrames - 1)) * 100));

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const syncFrame = (event?: { detail?: { frame?: number } }) => {
      setCurrentFrame(event?.detail?.frame ?? player.getCurrentFrame());
    };
    const syncPlay = () => setIsPlaying(true);
    const syncPause = () => setIsPlaying(false);
    const syncEnded = () => {
      setCurrentFrame(durationInFrames - 1);
      setIsPlaying(false);
    };

    player.addEventListener('frameupdate', syncFrame);
    player.addEventListener('seeked', syncFrame);
    player.addEventListener('play', syncPlay);
    player.addEventListener('pause', syncPause);
    player.addEventListener('ended', syncEnded);
    setCurrentFrame(player.getCurrentFrame());
    setIsPlaying(player.isPlaying());

    return () => {
      player.removeEventListener('frameupdate', syncFrame);
      player.removeEventListener('seeked', syncFrame);
      player.removeEventListener('play', syncPlay);
      player.removeEventListener('pause', syncPause);
      player.removeEventListener('ended', syncEnded);
    };
  }, [durationInFrames, playerRef]);

  const playFromStart = () => {
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  };

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekToProgress = (value: string) => {
    const nextFrame = Math.round((Number(value) / 100) * (durationInFrames - 1));
    playerRef.current?.seekTo(nextFrame);
    setCurrentFrame(nextFrame);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-md">
          <Video size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-slate-900">Animation Studio</h2>
          <p className="truncate text-sm font-medium text-slate-500">Motion presets, text animation, and alpha export</p>
        </div>
        </div>
        <div className="hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 md:block">
          {durationLabel} timeline
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Controls Column */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Motion Presets</h3>
            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Animation In</span>
                <select
                  value={config.animationInStyle || config.animationStyle}
                  onChange={(event) => {
                    const value = event.target.value as AnimationStyle;
                    update('animationInStyle', value);
                    update('animationStyle', value);
                    playerRef.current?.seekTo(0);
                    playerRef.current?.play();
                  }}
                  className="glass-input h-11 w-full cursor-pointer rounded-lg px-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40"
                >
                  {animationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Animation Out</span>
                <select
                  value={config.animationOutStyle}
                  onChange={(event) => {
                    update('animationOutStyle', event.target.value as AnimationStyle);
                    playerRef.current?.seekTo(Math.max(0, durationInFrames - 50));
                    playerRef.current?.play();
                  }}
                  className="glass-input h-11 w-full cursor-pointer rounded-lg px-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-900/20"
                >
                  {animationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Text Animation</h3>
            <div className="space-y-4">
              <div className="segmented-control grid grid-cols-3">
                {textModeOptions.map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      update('textAnimationMode', mode.value);
                      playerRef.current?.seekTo(0);
                      playerRef.current?.play();
                    }}
                    disabled={config.platform === 'dm'}
                    className={`segmented-btn ${
                      config.textAnimationMode === mode.value
                        ? 'segmented-btn-active'
                        : 'segmented-btn-inactive'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Text Preset</span>
                <select
                  value={config.textAnimationPreset}
                  onChange={(event) => {
                    update('textAnimationPreset', event.target.value as TextAnimationPreset);
                    playerRef.current?.seekTo(0);
                    playerRef.current?.play();
                  }}
                  disabled={config.platform === 'dm'}
                  className="glass-input h-11 w-full cursor-pointer rounded-lg px-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {textPresetOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              {config.platform === 'text' && (
                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Template</span>
                    <select
                      value={config.textTemplate}
                      onChange={(event) => update('textTemplate', event.target.value as TextTemplate)}
                      className="glass-input h-11 w-full cursor-pointer rounded-lg px-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {textTemplateOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Font</span>
                      <select
                        value={config.textFont}
                        onChange={(event) => update('textFont', event.target.value as TextFont)}
                        className="glass-input h-11 w-full cursor-pointer rounded-lg px-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40"
                      >
                        {textFontOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Weight</span>
                      <select
                        value={config.textWeight}
                        onChange={(event) => update('textWeight', event.target.value as TextWeight)}
                        className="glass-input h-11 w-full cursor-pointer rounded-lg px-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40"
                      >
                        {textWeightOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {config.platform === 'dm' && (
                <p className="text-xs font-semibold leading-relaxed text-slate-500">
                  Text animation applies to Text Overlay and feed cards. DM support will come later.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Timing</h3>
            <div className="space-y-5">
              <div className="glass-card rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Gauge size={16} />
                    Speed
                  </span>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-indigo-600 capitalize">
                    {config.animationSpeed || 'medium'}
                  </span>
                </div>
                <div className="segmented-control grid grid-cols-3">
                  {speedOptions.map(speed => (
                    <button
                      key={speed.value}
                      type="button"
                      onClick={() => {
                        update('animationSpeed', speed.value);
                        playerRef.current?.seekTo(0);
                        playerRef.current?.play();
                      }}
                      className={`segmented-btn ${
                        (config.animationSpeed || 'medium') === speed.value
                          ? 'segmented-btn-active'
                          : 'segmented-btn-inactive'
                      }`}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Timer size={16} />
                    Duration
                  </span>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-indigo-600">
                    {(config.animationDuration || 2).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={config.animationDuration || 2}
                  onChange={(event) => {
                    update('animationDuration', Number(event.target.value));
                    playerRef.current?.seekTo(0);
                  }}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Export Settings</h3>
            
            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 p-4 transition hover:bg-slate-100">
              <div>
                <span className="block text-sm font-bold text-slate-700">Greenscreen</span>
                <span className="block text-xs text-slate-500">For chroma keying in video editors</span>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={config.greenscreen}
                  onChange={(e) => update('greenscreen', e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </div>
            </label>

            <button
              onClick={() => onExportVideo('mp4')}
              disabled={isExportingVideo}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isExportingVideo && videoExportFormat === 'mp4' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Rendering MP4...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export as MP4
                </>
              )}
            </button>
            <button
              onClick={() => onExportVideo('mov')}
              disabled={isExportingVideo}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isExportingVideo && videoExportFormat === 'mov' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Rendering MOV...
                </>
              ) : (
                <>
                  <Layers size={18} />
                  Export MOV with Alpha
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              MP4 uses solid video output. MOV preserves alpha for transparent backgrounds.
            </p>
          </div>
        </div>

        {/* Player Column */}
        <div className="lg:col-span-8">
          <div className="relative flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Focused Preview</p>
                <h3 className="mt-1 text-sm font-black text-white">Overlay Card View</h3>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200">
                <Maximize size={14} />
                <span>1080x1080 - 60 FPS - {(config.animationDuration || 2).toFixed(1)}s</span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="relative aspect-square w-full max-w-[min(72vh,820px)] overflow-hidden rounded-lg border border-white/15 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                {!config.greenscreen && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: '#f8fafc',
                      backgroundImage: 'linear-gradient(45deg, rgba(148,163,184,0.24) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.24) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.24) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.24) 75%)',
                      backgroundSize: '24px 24px',
                      backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
                    }}
                  />
                )}

                <div className="remotion-player-container absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="h-full w-full origin-center scale-[1.48]">
                    <Player
                      ref={playerRef}
                      component={MainComposition}
                      inputProps={{ config, message: undefined }}
                      durationInFrames={durationInFrames}
                      initialFrame={Math.min(24, durationInFrames - 1)}
                      fps={fps}
                      compositionWidth={1080}
                      compositionHeight={1080}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      controls={false}
                      autoPlay
                      loop
                      spaceKeyToPlayOrPause
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/10 p-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950 shadow-md transition hover:scale-105"
                  aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
                <button
                  type="button"
                  onClick={playFromStart}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Restart preview"
                >
                  <RotateCcw size={17} />
                </button>
                <span className="min-w-[84px] text-center text-xs font-black tabular-nums text-slate-200">
                  {currentTimeLabel} / {durationLabel}
                </span>
                <label className="flex min-w-0 flex-1 items-center">
                  <span className="sr-only">Preview progress</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={(event) => seekToProgress(event.target.value)}
                    className="w-full accent-indigo-400"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
