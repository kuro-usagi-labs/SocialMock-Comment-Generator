import React, { useMemo, useState } from 'react';
import { Circle, Clock3, Eye, EyeOff, GripVertical, Layers, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { BulkMessage, CommentConfig, Layer, LayerActionBlock } from '../types';
import { getLayerActionBlocks, speedToFrames } from '../utils/motionEngine';

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

type DragMode = 'move' | 'resize-start' | 'resize-end';

const actionTone: Record<LayerActionBlock['kind'], string> = {
  in: 'from-indigo-500 to-violet-500 text-white shadow-indigo-500/20',
  out: 'from-slate-800 to-slate-600 text-white shadow-slate-500/20',
  emphasis: 'from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/20',
};

const minActionFrames = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const layerLabel = (layer: Layer, platform: CommentConfig['platform']) => {
  if (layer.type === 'background') return 'Background';
  if (layer.type === 'card') return 'Mockup card';
  if (layer.type === 'text') return platform === 'text' ? 'Text layer' : 'Content';
  return layer.name;
};

const fallbackActions = (layer: Layer, config: CommentConfig, durationFrames: number): LayerActionBlock[] => {
  const inDuration = Math.min(speedToFrames[config.animationSpeed || 'medium'], Math.max(10, Math.floor(durationFrames * 0.42)));
  const outDuration = Math.min(Math.max(8, Math.round(inDuration * 0.7)), Math.max(10, Math.floor(durationFrames * 0.42)));

  return [
    {
      id: `${layer.id}-in-action`,
      kind: 'in',
      name: 'In',
      style: layer.animationInStyle || config.animationInStyle || config.animationStyle || 'none',
      startFrame: 0,
      durationFrames: inDuration,
      easingPreset: config.easingInPreset,
      customBezier: config.customBezierIn,
      intensity: 1,
    },
    {
      id: `${layer.id}-out-action`,
      kind: 'out',
      name: 'Out',
      style: layer.animationOutStyle || config.animationOutStyle || 'none',
      startFrame: Math.max(inDuration + 1, durationFrames - outDuration),
      durationFrames: outDuration,
      easingPreset: config.easingOutPreset,
      customBezier: config.customBezierOut,
      intensity: 1,
    },
  ];
};

const TimelineDockComponent: React.FC<TimelineDockProps> = ({
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
  const durationFrames = Math.max(60, Math.round(duration * 60));
  const markers = [0, 0.25, 0.5, 0.75, 1];
  const currentSecond = (duration * progress) / 100;
  const orderedLayers = [...config.canvas.layers].sort((a, b) => b.zIndex - a.zIndex);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const motionContext = useMemo(() => ({
    frame: Math.round((progress / 100) * durationFrames),
    fps: 60,
    durationInFrames: durationFrames,
    config,
  }), [config, durationFrames, progress]);

  const getRawActions = (layer: Layer) => {
    return layer.actionBlocks && layer.actionBlocks.length > 0
      ? layer.actionBlocks
      : fallbackActions(layer, config, durationFrames);
  };

  const commitAction = (layer: Layer, actionId: string, patch: Partial<LayerActionBlock>) => {
    const currentActions = getRawActions(layer);
    const nextActions = currentActions.map(action => action.id === actionId ? { ...action, ...patch } : action);
    updateLayer(layer.id, { actionBlocks: nextActions } as Partial<Layer>);
  };

  const beginActionDrag = (
    event: React.PointerEvent<HTMLElement>,
    layer: Layer,
    action: LayerActionBlock,
    mode: DragMode,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveTab('animation');
    setSelectedLayerId(layer.id);
    setSelectedActionId(action.id);
    setIsPlaying(false);

    const timeline = event.currentTarget.closest('[data-timeline-track="true"]') as HTMLElement | null;
    if (!timeline) return;

    const bounds = timeline.getBoundingClientRect();
    const startX = event.clientX;
    const startFrame = action.startFrame;
    const startDuration = action.durationFrames;
    const framesPerPx = durationFrames / Math.max(1, bounds.width);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaFrames = Math.round((moveEvent.clientX - startX) * framesPerPx);
      if (mode === 'move') {
        commitAction(layer, action.id, {
          startFrame: clamp(startFrame + deltaFrames, 0, durationFrames - minActionFrames),
        });
        return;
      }

      if (mode === 'resize-start') {
        const nextStart = clamp(startFrame + deltaFrames, 0, startFrame + startDuration - minActionFrames);
        commitAction(layer, action.id, {
          startFrame: nextStart,
          durationFrames: clamp(startDuration + (startFrame - nextStart), minActionFrames, durationFrames - nextStart),
        });
        return;
      }

      commitAction(layer, action.id, {
        durationFrames: clamp(startDuration + deltaFrames, minActionFrames, durationFrames - startFrame),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="hidden h-[224px] shrink-0 border-t border-slate-200 bg-white lg:flex">
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

        <div className="grid h-[128px] grid-cols-[168px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50">
          <div className="border-r border-slate-200 bg-white/80">
            {orderedLayers.map(layer => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex h-10 w-full items-center gap-2 px-3 text-left text-xs font-black transition ${
                  selectedLayerId === layer.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${layer.visible ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                <span className="min-w-0 flex-1 truncate">{layerLabel(layer, config.platform)}</span>
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

          <div className="relative" data-timeline-track="true">
            <div className="pointer-events-none absolute inset-x-3 top-0 z-0 flex h-full justify-between">
              {markers.map(marker => (
                <span key={marker} className="relative h-full w-px bg-slate-200">
                  <span className="absolute left-1 top-1 text-[10px] font-black text-slate-300">{(marker * duration).toFixed(marker === 0 ? 0 : 1)}s</span>
                </span>
              ))}
            </div>

            {orderedLayers.map((layer, index) => {
              const visualActions = getLayerActionBlocks(layer, motionContext);
              const offset = (layer.delayFrames || 0) + (layer.staggerFrames || 0);
              return (
                <div key={layer.id} className="absolute left-3 right-3 z-10 h-10" style={{ top: `${index * 40}px` }}>
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
                  {visualActions.map(action => {
                    const rawStart = Math.max(0, action.startFrame - offset);
                    const left = clamp((action.startFrame / durationFrames) * 100, 0, 98);
                    const width = clamp((action.durationFrames / durationFrames) * 100, 3, 100 - left);
                    const isSelected = selectedLayerId === layer.id && selectedActionId === action.id;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onPointerDown={(event) => beginActionDrag(event, layer, { ...action, startFrame: rawStart }, 'move')}
                        className={`group/action absolute top-2 flex h-6 min-w-12 items-center overflow-hidden rounded-full bg-gradient-to-r px-1 text-[10px] font-black uppercase tracking-[0.04em] shadow-sm transition ${actionTone[action.kind]} ${
                          isSelected ? 'ring-2 ring-slate-950 ring-offset-2 ring-offset-slate-50' : 'hover:shadow-md'
                        } ${layer.visible ? '' : 'opacity-40'}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                        title={`${layerLabel(layer, config.platform)} ${action.name}: ${action.style}`}
                        aria-label={`Move ${action.name} action block`}
                      >
                        <span
                          className="flex h-full w-3 shrink-0 cursor-ew-resize items-center justify-center rounded-l-full opacity-70 hover:bg-white/20"
                          onPointerDown={(event) => beginActionDrag(event, layer, { ...action, startFrame: rawStart }, 'resize-start')}
                          aria-hidden="true"
                        >
                          <GripVertical size={10} />
                        </span>
                        <span className="min-w-0 flex-1 truncate px-1">{action.kind} · {action.style}</span>
                        <span
                          className="flex h-full w-3 shrink-0 cursor-ew-resize items-center justify-center rounded-r-full opacity-70 hover:bg-white/20"
                          onPointerDown={(event) => beginActionDrag(event, layer, { ...action, startFrame: rawStart }, 'resize-end')}
                          aria-hidden="true"
                        >
                          <GripVertical size={10} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-px bg-slate-950"
              style={{ left: `calc(12px + ${progress}% - ${progress * 0.24}px)` }}
            >
              <span className="absolute -left-3 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white shadow-md">
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
            action blocks
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

export const TimelineDock = React.memo(TimelineDockComponent);
export default TimelineDock;
