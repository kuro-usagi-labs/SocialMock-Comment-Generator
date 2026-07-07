import React from 'react';
import { Circle, Clock3, Eye, EyeOff, Layers, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { BulkMessage, CommentConfig, Layer } from '../types';

interface TimelineDockProps {
  config: CommentConfig;
  activeTab: 'canvas' | 'animation';
  setActiveTab: (tab: 'canvas' | 'animation') => void;
  bulkMessages: BulkMessage[];
  progress: number;
  setProgress: (value: number) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  restartPlayback: () => void;
  update: (key: keyof CommentConfig, value: any) => void;
  selectedLayerId: string;
  setSelectedLayerId: (id: string) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  selectedSceneIndex: number;
  setSelectedSceneIndex: (index: number) => void;
}

export const TimelineDock: React.FC<TimelineDockProps> = ({
  config,
  activeTab,
  setActiveTab,
  bulkMessages,
  progress,
  setProgress,
  isPlaying,
  setIsPlaying,
  restartPlayback,
  update,
  selectedLayerId,
  setSelectedLayerId,
  updateLayer,
  selectedSceneIndex,
  setSelectedSceneIndex,
}) => {
  const duration = Math.max(1, config.animationDuration || 2);
  const markers = [0, 0.25, 0.5, 0.75, 1];
  const currentSecond = (duration * progress) / 100;
  const orderedLayers = [...config.canvas.layers].sort((a, b) => b.zIndex - a.zIndex);

  const layerLabel = (layer: Layer) => {
    if (layer.type === 'background') return 'Background';
    if (layer.type === 'card') return 'Mockup card';
    if (layer.type === 'text') return config.platform === 'text' ? 'Text layer' : 'Content';
    return layer.name;
  };

  return (
    <div className="hidden h-[188px] shrink-0 border-t border-slate-200 bg-white lg:flex">
      <div className="flex w-[220px] shrink-0 flex-col justify-between border-r border-slate-200 px-4 py-3">
        <div>
          <p className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Timeline</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-white transition hover:bg-indigo-600"
              aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
            >
              {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            </button>
            <span className="text-sm font-black text-slate-900">{currentSecond.toFixed(2)}s / {duration.toFixed(duration % 1 ? 2 : 0)}s</span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_32px] gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`h-8 rounded-md text-xs font-black transition ${activeTab === 'canvas' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
          >
            Design
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('animation')}
            className={`h-8 rounded-md text-xs font-black transition ${activeTab === 'animation' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
          >
            Animate
          </button>
          <button
            type="button"
            onClick={restartPlayback}
            className="flex h-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-950"
            aria-label="Restart timeline"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Layers size={15} className="shrink-0 text-slate-400" />
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedSceneIndex(0)}
                className={`h-8 shrink-0 rounded-full px-3 text-xs font-black transition ${
                  selectedSceneIndex === 0
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                Main
              </button>
              {bulkMessages.map((message, index) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedSceneIndex(index + 1)}
                  className={`flex h-8 max-w-[180px] shrink-0 items-center gap-2 rounded-full px-2.5 text-xs font-black transition ${
                    selectedSceneIndex === index + 1
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] text-white"
                    style={{ backgroundColor: message.avatarColor }}
                  >
                    {message.avatarInitials}
                  </span>
                  <span className="truncate">{message.displayName}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Clock3 size={14} />
            60fps
          </div>
        </div>

        <div className="grid h-[92px] grid-cols-[168px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50">
          <div className="border-r border-slate-200 bg-white/80">
            {orderedLayers.map(layer => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex h-[30px] w-full items-center gap-2 px-3 text-left text-xs font-black transition ${
                  selectedLayerId === layer.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${layer.visible ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                <span className="min-w-0 flex-1 truncate">{layerLabel(layer)}</span>
                <span
                  onClick={(event) => {
                    event.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible } as Partial<Layer>);
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                  role="button"
                  tabIndex={0}
                  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-3 top-0 z-0 flex h-full justify-between">
              {markers.map(marker => (
                <span key={marker} className="h-full w-px bg-slate-200" />
              ))}
            </div>
            {orderedLayers.map((layer, index) => {
              const left = Math.min(64, (layer.delayFrames / 60 / duration) * 100);
              const width = Math.max(18, 92 - left - index * 4);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`absolute z-10 h-5 rounded-full transition ${
                    selectedLayerId === layer.id ? 'bg-indigo-600 shadow-sm' : 'bg-slate-300 hover:bg-slate-400'
                  } ${layer.visible ? '' : 'opacity-40'}`}
                  style={{
                    top: `${6 + index * 30}px`,
                    left: `calc(12px + ${left}%)`,
                    width: `calc(${width}% - 24px)`,
                  }}
                  aria-label={`Select ${layerLabel(layer)} timeline layer`}
                />
              );
            })}
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-px bg-slate-950"
              style={{ left: `calc(12px + ${progress}% - ${progress * 0.24}px)` }}
            >
              <span className="absolute -left-3 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white shadow-md">
                <Circle size={8} fill="currentColor" />
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => {
                setIsPlaying(false);
                setProgress(Number(event.target.value));
              }}
              className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Timeline playhead"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 overflow-hidden">
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-700">
            <Sparkles size={12} />
            {config.animationInStyle}
          </span>
          {bulkMessages.length > 0 && (
            <span className="truncate rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
              {bulkMessages.length} variations queued
            </span>
          )}
          <label className="ml-auto hidden shrink-0 items-center gap-2 text-[11px] font-black text-slate-500 xl:flex">
            Duration
            <input
              type="range"
              min="1"
              max="8"
              step="0.25"
              value={duration}
              onChange={(event) => update('animationDuration', Number(event.target.value))}
              className="w-28 accent-indigo-600"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default TimelineDock;
