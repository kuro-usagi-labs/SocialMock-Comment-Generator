import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Clock3, Copy, Eye, EyeOff, GripVertical, Layers, Minus, Pause, Play, Plus, RotateCcw, Scissors, Sparkles, Trash2 } from 'lucide-react';
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
  selectedActionId: string | null;
  setSelectedLayerId: (id: string) => void;
  selectAction: (layerId: string, actionId: string) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  reorderLayer: (id: string, targetIndex: number) => void;
  selectedSceneIndex: number;
  setSelectedSceneIndex: (index: number) => void;
  /** Duplicate the selected action block */
  duplicateAction?: (layerId: string, actionId: string) => void;
  /** Delete the selected action block */
  deleteAction?: (layerId: string, actionId: string) => void;
  /** Split action at current playhead frame */
  splitAction?: (layerId: string, actionId: string, frame: number) => void;
}

type DragMode = 'move' | 'resize-start' | 'resize-end';

const actionTone: Record<LayerActionBlock['kind'], string> = {
  in: 'from-indigo-500 to-violet-500 text-white shadow-indigo-500/20',
  out: 'from-slate-800 to-slate-600 text-white shadow-slate-500/20',
  emphasis: 'from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/20',
};

const minActionFrames = 8;
const timelineInsetPx = 12;

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
  selectedActionId,
  setSelectedLayerId,
  selectAction,
  updateLayer,
  reorderLayer,
  selectedSceneIndex,
  setSelectedSceneIndex,
  duplicateAction,
  deleteAction,
  splitAction,
}) => {
  const duration = Math.max(1, config.animationDuration || 2);
  const durationFrames = Math.max(60, Math.round(duration * 60));
  const currentFrame = Math.round((progress / 100) * durationFrames);
  const markers = [0, 0.25, 0.5, 0.75, 1];
  const currentSecond = (duration * progress) / 100;
  const orderedLayers = useMemo(() => [...config.canvas.layers].sort((a, b) => b.zIndex - a.zIndex), [config.canvas.layers]);
  const reorderableTimelineIndices = orderedLayers
    .filter(layer => layer.id !== 'layer-bg-auto')
    .map((layer, visualIndex, items) => ({
      id: layer.id,
      visualIndex,
      modelIndex: items.length - 1 - visualIndex,
    }));
  const [tlDragRowId, setTlDragRowId] = useState<string | null>(null);
  const [tlDragOverIndex, setTlDragOverIndex] = useState<number | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string; actionId: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [contextMenu]);

  const handleActionContextMenu = useCallback((e: React.MouseEvent, layerId: string, actionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLayerId(layerId);
    selectAction(layerId, actionId);
    setContextMenu({ x: e.clientX, y: e.clientY, layerId, actionId });
  }, [setSelectedLayerId, selectAction]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Frame stepping
      if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const nextFrame = Math.min(durationFrames, currentFrame + (e.shiftKey ? 10 : 1));
        setProgress((nextFrame / durationFrames) * 100);
        return;
      }
      if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const prevFrame = Math.max(0, currentFrame - (e.shiftKey ? 10 : 1));
        setProgress((prevFrame / durationFrames) * 100);
        return;
      }
      // Delete selected action
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId && selectedActionId) {
        e.preventDefault();
        deleteAction?.(selectedLayerId, selectedActionId);
        return;
      }
      // Duplicate selected action
      if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey) && selectedLayerId && selectedActionId) {
        e.preventDefault();
        duplicateAction?.(selectedLayerId, selectedActionId);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrame, durationFrames, selectedLayerId, selectedActionId, setProgress, deleteAction, duplicateAction]);

  const tlRowOnPointerDown = (layerId: string, event: React.PointerEvent, sourceVisualIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    setTlDragRowId(layerId);
    setTlDragOverIndex(sourceVisualIndex);
    let latestVisualIndex = sourceVisualIndex;

    const handleMove = (moveEvent: PointerEvent) => {
      let bestIndex = sourceVisualIndex;
      let bestDist = Infinity;
      reorderableTimelineIndices.forEach(({ id, visualIndex }) => {
        const rowEl = document.getElementById(`tl-layer-row-${id}`);
        if (!rowEl) return;
        const rect = rowEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(moveEvent.clientY - midY);
        if (dist < bestDist) { bestDist = dist; bestIndex = visualIndex; }
      });
      latestVisualIndex = bestIndex;
      setTlDragOverIndex(bestIndex);
    };

    const handleUp = () => {
      const target = reorderableTimelineIndices.find(item => item.visualIndex === latestVisualIndex);
      if (target && latestVisualIndex !== sourceVisualIndex) {
        reorderLayer(layerId, target.modelIndex);
      }
      setTlDragRowId(null);
      setTlDragOverIndex(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

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

  const setProgressFromClientX = (clientX: number, timeline: HTMLElement) => {
    const bounds = timeline.getBoundingClientRect();
    const usableWidth = Math.max(1, bounds.width - timelineInsetPx * 2);
    const nextProgress = clamp(((clientX - bounds.left - timelineInsetPx) / usableWidth) * 100, 0, 100);
    setProgress(nextProgress);
  };

  const beginPlayheadScrub = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveTab('animation');
    setIsPlaying(false);

    const timeline = event.currentTarget.closest('[data-timeline-track="true"]') as HTMLElement | null;
    if (!timeline) return;

    setProgressFromClientX(event.clientX, timeline);

    const onPointerMove = (moveEvent: PointerEvent) => {
      setProgressFromClientX(moveEvent.clientX, timeline);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  // Snap helper — snaps to grid (every 5 frames) and to other action edges
  const snapFrame = useCallback((frame: number, excludeActionId?: string): number => {
    const SNAP_THRESHOLD = 3; // frames
    let best = frame;
    let bestDist = SNAP_THRESHOLD;

    // Snap to grid (every 5 frames)
    const gridSnap = Math.round(frame / 5) * 5;
    const gridDist = Math.abs(frame - gridSnap);
    if (gridDist < bestDist) { best = gridSnap; bestDist = gridDist; }

    // Snap to playhead
    const playheadDist = Math.abs(frame - currentFrame);
    if (playheadDist < bestDist) { best = currentFrame; bestDist = playheadDist; }

    // Snap to other action edges
    for (const layer of orderedLayers) {
      for (const a of getRawActions(layer)) {
        if (a.id === excludeActionId) continue;
        const startDist = Math.abs(frame - a.startFrame);
        if (startDist < bestDist) { best = a.startFrame; bestDist = startDist; }
        const endDist = Math.abs(frame - (a.startFrame + a.durationFrames));
        if (endDist < bestDist) { best = a.startFrame + a.durationFrames; bestDist = endDist; }
      }
    }

    return best;
  }, [currentFrame, orderedLayers]);

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
    selectAction(layer.id, action.id);
    setIsPlaying(false);
    setContextMenu(null);

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
        const raw = clamp(startFrame + deltaFrames, 0, durationFrames - minActionFrames);
        commitAction(layer, action.id, { startFrame: snapFrame(raw, action.id) });
        return;
      }

      if (mode === 'resize-start') {
        const rawStart = clamp(startFrame + deltaFrames, 0, startFrame + startDuration - minActionFrames);
        const snapped = snapFrame(rawStart, action.id);
        commitAction(layer, action.id, {
          startFrame: snapped,
          durationFrames: clamp(startDuration + (startFrame - snapped), minActionFrames, durationFrames - snapped),
        });
        return;
      }

      const rawEnd = startDuration + deltaFrames;
      const snappedEnd = snapFrame(startFrame + rawEnd, action.id) - startFrame;
      commitAction(layer, action.id, {
        durationFrames: clamp(snappedEnd, minActionFrames, durationFrames - startFrame),
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
    <div className="hidden h-[256px] shrink-0 border-t border-slate-200 bg-slate-50 lg:flex">
      <div className="flex w-[204px] shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Timeline</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm transition hover:bg-indigo-600"
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

        <div className="grid h-[160px] grid-cols-[164px_minmax(0,1fr)] overflow-hidden rounded-[16px] border border-slate-200 bg-slate-100">
          <div className="border-r border-slate-200 bg-white/80">
            {orderedLayers.map(layer => {
              const isBg = layer.id === 'layer-bg-auto';
              const ri = reorderableTimelineIndices.find(item => item.id === layer.id);
              const sourceIndex = ri !== undefined ? ri.visualIndex : -1;
              const isDragging = tlDragRowId === layer.id;
              const isDropTarget = tlDragRowId && tlDragRowId !== layer.id && tlDragOverIndex !== null && ri !== undefined && tlDragOverIndex === sourceIndex;

              return (
                <React.Fragment key={layer.id}>
                  {isDropTarget && (
                    <div className="relative mx-3 -mb-px h-0.5 bg-indigo-500 pointer-events-none rounded-full" />
                  )}
                  <div
                    id={`tl-layer-row-${layer.id}`}
                    className={`flex h-10 w-full items-center gap-1.5 pl-2 pr-2 text-left transition ${
                      selectedLayerId === layer.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    } ${isDragging ? 'opacity-60 scale-[1.04] shadow-lg bg-white' : ''}`}
                  >
                    {!isBg && (
                      <div
                        role="button"
                        aria-label={`Drag to reorder ${layerLabel(layer, config.platform)}`}
                        className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing select-none"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          tlRowOnPointerDown(layer.id, event, sourceIndex);
                        }}
                        title="Drag to reorder"
                      >
                        <GripVertical size={11} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedLayerId(layer.id)}
                      className="min-w-0 flex-1 text-left flex items-center gap-2"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${layer.visible ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                      <span className="truncate text-xs font-black">
                        {layerLabel(layer, config.platform)}
                        {isBg && <span className="ml-1 text-[9px] font-bold text-slate-400">(locked)</span>}
                      </span>
                    </button>
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
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div
            className="relative cursor-pointer bg-slate-50 overflow-x-auto overflow-y-hidden"
            data-timeline-track="true"
            onPointerDown={beginPlayheadScrub}
          >
            <div className="pointer-events-none absolute inset-x-3 top-0 z-0 h-full rounded-xl border-x border-slate-200/70 bg-white/45" />
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
                        onContextMenu={(e) => handleActionContextMenu(e, layer.id, action.id)}
                        className={`group/action absolute top-1.5 flex h-7 min-w-14 items-center overflow-hidden rounded-full bg-gradient-to-r px-1 text-[10px] font-black uppercase tracking-[0.04em] shadow-sm transition ${actionTone[action.kind]} ${
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
                          className="flex h-full w-4 shrink-0 cursor-ew-resize items-center justify-center rounded-l-full opacity-80 hover:bg-white/25"
                          onPointerDown={(event) => beginActionDrag(event, layer, { ...action, startFrame: rawStart }, 'resize-start')}
                          aria-hidden="true"
                        >
                          <GripVertical size={10} />
                        </span>
                        <span className="min-w-0 flex-1 truncate px-1">
                          {action.name || `${action.kind} · ${action.style}`}
                        </span>
                        <span
                          className="flex h-full w-4 shrink-0 cursor-ew-resize items-center justify-center rounded-r-full opacity-80 hover:bg-white/25"
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
              className="pointer-events-none absolute inset-y-0 z-30 w-px bg-indigo-600"
              style={{ left: `calc(12px + ${progress}% - ${progress * 0.24}px)` }}
            >
              <button
                type="button"
                onPointerDown={beginPlayheadScrub}
                className="pointer-events-auto absolute -left-3 top-2 flex h-6 w-6 cursor-ew-resize items-center justify-center rounded-full bg-indigo-600 text-white shadow-md ring-4 ring-white/90 transition hover:scale-110 focus:outline-none focus:ring-indigo-300"
                aria-label="Drag timeline playhead"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                role="slider"
              >
                <Circle size={8} fill="currentColor" />
              </button>
            </div>
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
          <div className="flex shrink-0 items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => setTimelineZoom(z => Math.max(0.5, z - 0.25))}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              title="Zoom out timeline"
              aria-label="Zoom out timeline"
            >
              <Minus size={12} />
            </button>
            <span className="w-10 text-center text-[10px] font-black text-slate-500">{Math.round(timelineZoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setTimelineZoom(z => Math.min(4, z + 0.25))}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              title="Zoom in timeline"
              aria-label="Zoom in timeline"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1.5 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {duplicateAction && (
            <button
              type="button"
              onClick={() => { duplicateAction(contextMenu.layerId, contextMenu.actionId); setContextMenu(null); }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs font-bold text-slate-700 hover:bg-violet-50"
            >
              <Copy size={12} /> Duplicate
            </button>
          )}
          {splitAction && (
            <button
              type="button"
              onClick={() => { splitAction(contextMenu.layerId, contextMenu.actionId, currentFrame); setContextMenu(null); }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs font-bold text-slate-700 hover:bg-violet-50"
            >
              <Scissors size={12} /> Split at playhead
            </button>
          )}
          <div className="my-1 h-px bg-slate-100" />
          {deleteAction && (
            <button
              type="button"
              onClick={() => { deleteAction(contextMenu.layerId, contextMenu.actionId); setContextMenu(null); }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const TimelineDock = React.memo(TimelineDockComponent);
export default TimelineDock;
