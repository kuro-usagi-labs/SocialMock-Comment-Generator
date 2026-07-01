import React from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { MainComposition } from './remotion/Composition';
import { CommentConfig, AnimationStyle } from '../types';
import { Video, Maximize, Play, Download, Loader2 } from 'lucide-react';

interface Props {
  config: CommentConfig;
  update: (key: keyof CommentConfig, value: any) => void;
  onExportVideo: () => void;
  isExportingVideo: boolean;
  playerRef: React.RefObject<PlayerRef>;
}

const animationOptions: Array<{ value: AnimationStyle; label: string }> = [
  { value: 'none', label: 'No Animation' },
  { value: 'pop', label: 'Pop In (Bouncy)' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'fade-scale', label: 'Fade & Scale' },
];

export const AnimationTab: React.FC<Props> = ({ config, update, onExportVideo, isExportingVideo, playerRef }) => {
  return (
    <div className="flex h-full w-full flex-col p-4 md:p-8 overflow-y-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md">
          <Video size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Animation Studio</h2>
          <p className="text-sm font-medium text-slate-500">Preview and export animated comments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Animation Style</h3>
            <div className="flex flex-col gap-2">
              {animationOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update('animationStyle', opt.value)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    config.animationStyle === opt.value
                      ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white/50 text-slate-600 hover:bg-white/80'
                  }`}
                >
                  {opt.label}
                  {config.animationStyle === opt.value && <Play size={16} fill="currentColor" />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Export Settings</h3>
            
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-white/50 p-4 transition hover:bg-white/80">
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
              onClick={onExportVideo}
              disabled={isExportingVideo}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isExportingVideo ? (
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
            <p className="mt-3 text-center text-xs text-slate-500">
              Video will be exported at 60fps in 1080p resolution.
            </p>
          </div>
        </div>

        {/* Player Column */}
        <div className="lg:col-span-8">
          <div className="glass-panel relative flex flex-col items-center justify-center overflow-hidden rounded-[32px] p-4 h-[600px] bg-slate-900 shadow-2xl">
            {/* Checkerboard pattern for transparency indication */}
            {!config.greenscreen && (
              <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }} />
            )}

            <div className="remotion-player-container relative z-10 w-full h-full max-w-[800px] flex items-center justify-center shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10 bg-transparent">
              <Player
                ref={playerRef}
                component={MainComposition}
                inputProps={{ config, message: undefined }}
                durationInFrames={120} // 2 seconds
                fps={60}
                compositionWidth={1080}
                compositionHeight={1080}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                controls
                autoPlay
                loop
                spaceKeyToPlayOrPause
              />
            </div>
            
            <div className="absolute bottom-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
              <Maximize size={14} />
              1080x1080 • 60 FPS • 2 Seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
