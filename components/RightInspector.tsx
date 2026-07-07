import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
  Wand2,
} from 'lucide-react';
import {
  AnimationStyle,
  BulkMessage,
  CommentConfig,
  EasingPreset,
  Layer,
  LayerActionBlock,
  Platform,
  VideoExportFormat,
} from '../types';

interface RightInspectorProps {
  config: CommentConfig;
  update: (key: keyof CommentConfig, value: any) => void;
  activeTab: 'canvas' | 'animation';
  setActiveTab: (tab: 'canvas' | 'animation') => void;
  platformOptions: Array<{
    value: Platform;
    label: string;
    icon: React.ReactNode;
    color: string;
  }>;
  hasBulkMessages: boolean;
  onExportPng: () => void;
  onExportVideo: (format: VideoExportFormat) => void;
  isExportingVideo: boolean;
  activeConfig: CommentConfig;
  selectedSceneIndex: number;
  setSelectedSceneIndex: (index: number) => void;
  sceneMessages: BulkMessage[];
  updateActiveSceneMessage: (patch: Partial<BulkMessage>) => void;
  duplicateActiveScene: () => void;
  deleteActiveScene: () => void;
  selectedLayerId: string;
  setSelectedLayerId: (id: string) => void;
  setTimelineProgress: (value: number) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  resetLayerTransform: (id: string) => void;
}

const panelLabel = 'font-display text-[10px] font-black uppercase tracking-[0.18em] text-slate-500';
const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
const motionPresets: Array<{ value: AnimationStyle; label: string }> = [
  { value: 'none', label: 'Diam' },
  { value: 'pop', label: 'Pop halus' },
  { value: 'fade-scale', label: 'Fade' },
  { value: 'slide-up', label: 'Naik' },
  { value: 'slide-left', label: 'Geser kiri' },
  { value: 'slide-right', label: 'Geser kanan' },
  { value: 'elastic-spin', label: 'Putar halus' },
  { value: 'flip-in', label: 'Flip' },
  { value: 'bounce-in', label: 'Pantul' },
  { value: 'wiggle', label: 'Wiggle' },
  { value: 'zoom-blur', label: 'Blur zoom' },
  { value: 'glitch', label: 'Glitch' },
];

const easingOptions: Array<{ value: EasingPreset; label: string }> = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Cepat' },
  { value: 'ease-out', label: 'Lembut' },
  { value: 'ease-in-out', label: 'Halus' },
  { value: 'back', label: 'Overshoot' },
  { value: 'bounce', label: 'Pantul' },
  { value: 'elastic', label: 'Elastis' },
  { value: 'custom', label: 'Custom' },
];

const quickMotionPresets: Array<{
  label: string;
  inStyle: AnimationStyle;
  outStyle: AnimationStyle;
  easeIn: EasingPreset;
  easeOut: EasingPreset;
  blur: boolean;
}> = [
  { label: 'Diam', inStyle: 'none', outStyle: 'none', easeIn: 'linear', easeOut: 'linear', blur: false },
  { label: 'Pop halus', inStyle: 'pop', outStyle: 'fade-scale', easeIn: 'back', easeOut: 'ease-in', blur: false },
  { label: 'Naik lembut', inStyle: 'slide-up', outStyle: 'fade-scale', easeIn: 'ease-out', easeOut: 'ease-in', blur: false },
  { label: 'Fade clean', inStyle: 'fade-scale', outStyle: 'fade-scale', easeIn: 'ease-out', easeOut: 'ease-in', blur: false },
  { label: 'Blur masuk', inStyle: 'zoom-blur', outStyle: 'fade-scale', easeIn: 'ease-out', easeOut: 'ease-in', blur: true },
  { label: 'Pantul', inStyle: 'bounce-in', outStyle: 'fade-scale', easeIn: 'bounce', easeOut: 'ease-in', blur: false },
];

const findActionBlock = (layer: Layer, kind: LayerActionBlock['kind']) => {
  return layer.actionBlocks?.find(action => action.kind === kind);
};

const RightInspectorComponent: React.FC<RightInspectorProps> = ({
  config,
  update,
  activeTab,
  setActiveTab,
  platformOptions,
  hasBulkMessages,
  onExportPng,
  onExportVideo,
  isExportingVideo,
  activeConfig,
  selectedSceneIndex,
  setSelectedSceneIndex,
  sceneMessages,
  updateActiveSceneMessage,
  duplicateActiveScene,
  deleteActiveScene,
  selectedLayerId,
  setSelectedLayerId,
  setTimelineProgress,
  updateLayer,
  moveLayer,
  resetLayerTransform,
}) => {
  const currentPlatform = platformOptions.find(platform => platform.value === config.platform) || platformOptions[0];
  const selectedLayer = config.canvas.layers.find(layer => layer.id === selectedLayerId) || config.canvas.layers[1] || config.canvas.layers[0];
  const orderedLayers = [...config.canvas.layers].sort((a, b) => b.zIndex - a.zIndex);
  const activeBulkMessage = selectedSceneIndex > 0 ? sceneMessages[selectedSceneIndex - 1] : null;
  const activeSceneLabel = selectedSceneIndex === 0 ? 'Main artboard' : activeBulkMessage?.displayName || `Variation ${selectedSceneIndex}`;
  const isTopLayer = orderedLayers[0]?.id === selectedLayer?.id;
  const isBottomLayer = orderedLayers[orderedLayers.length - 1]?.id === selectedLayer?.id;

  const layerKindLabel = (layer: Layer) => {
    if (layer.type === 'background') return 'Background';
    if (layer.type === 'card') return config.platform === 'text' ? 'Mockup card' : 'Mockup card';
    if (layer.type === 'text') return config.platform === 'text' ? 'Text layer' : 'Content layer';
    return layer.name;
  };

  const updateLayerAction = (
    layer: Layer,
    kind: LayerActionBlock['kind'],
    patch: Partial<LayerActionBlock>,
  ) => {
    const durationFrames = kind === 'out' ? 34 : 46;
    const startFrame = kind === 'out'
      ? Math.max(48, Math.round((config.animationDuration || 2) * 60) - durationFrames)
      : 0;
    const fallbackStyle = kind === 'out'
      ? (layer.animationOutStyle || config.animationOutStyle || 'none')
      : (layer.animationInStyle || config.animationInStyle || config.animationStyle);
    const fallbackEasing = kind === 'out' ? config.easingOutPreset : config.easingInPreset;
    const currentActions = layer.actionBlocks || [];
    const existing = currentActions.find(action => action.kind === kind);
    const nextAction: LayerActionBlock = {
      id: existing?.id || `${layer.id}-${kind}-action`,
      kind,
      name: existing?.name || (kind === 'out' ? 'Out' : kind === 'in' ? 'In' : 'Emphasis'),
      style: existing?.style || fallbackStyle,
      startFrame: existing?.startFrame ?? startFrame,
      durationFrames: existing?.durationFrames ?? durationFrames,
      easingPreset: existing?.easingPreset || fallbackEasing,
      customBezier: existing?.customBezier,
      intensity: existing?.intensity ?? 1,
      ...patch,
    };
    const nextActions = existing
      ? currentActions.map(action => action.kind === kind ? nextAction : action)
      : [...currentActions, nextAction];

    updateLayer(layer.id, {
      actionBlocks: nextActions,
      ...(kind === 'in' && patch.style ? { animationInStyle: patch.style } : {}),
      ...(kind === 'out' && patch.style ? { animationOutStyle: patch.style } : {}),
    } as Partial<Layer>);

    const previewStart = patch.startFrame ?? nextAction.startFrame;
    const previewLength = patch.durationFrames ?? nextAction.durationFrames;
    const layerOffset = (layer.delayFrames || 0) + (layer.staggerFrames || 0);
    const durationFramesTotal = Math.max(60, Math.round((config.animationDuration || 2) * 60));
    const previewFrame = layerOffset + previewStart + Math.max(1, Math.round(previewLength * 0.45));
    setActiveTab('animation');
    setTimelineProgress(Math.min(96, Math.max(0, (previewFrame / durationFramesTotal) * 100)));
  };

  const buildLayerActions = (
    layer: Layer,
    inStyle: AnimationStyle,
    outStyle: AnimationStyle,
    inEasing: EasingPreset,
    outEasing: EasingPreset,
  ): LayerActionBlock[] => {
    const durationFramesTotal = Math.max(60, Math.round((config.animationDuration || 2) * 60));
    const inDuration = inStyle === 'none' ? 24 : 46;
    const outDuration = outStyle === 'none' ? 24 : 34;
    return [
      {
        id: `${layer.id}-in-action`,
        kind: 'in',
        name: 'Masuk',
        style: inStyle,
        startFrame: 0,
        durationFrames: inDuration,
        easingPreset: inEasing,
        intensity: inStyle === 'slide-up' || inStyle === 'slide-left' || inStyle === 'slide-right' ? 0.8 : 1,
      },
      {
        id: `${layer.id}-out-action`,
        kind: 'out',
        name: 'Keluar',
        style: outStyle,
        startFrame: Math.max(inDuration + 1, durationFramesTotal - outDuration),
        durationFrames: outDuration,
        easingPreset: outEasing,
        intensity: outStyle === 'slide-up' || outStyle === 'slide-left' || outStyle === 'slide-right' ? 0.8 : 1,
      },
    ];
  };

  const applyMotionPresetToAllLayers = (
    inStyle: AnimationStyle,
    outStyle: AnimationStyle,
    inEasing: EasingPreset = 'ease-out',
    outEasing: EasingPreset = 'ease-in',
    motionBlur = false,
  ) => {
    update('animationInStyle', inStyle);
    update('animationOutStyle', outStyle);
    update('easingInPreset', inEasing);
    update('easingOutPreset', outEasing);
    config.canvas.layers
      .filter(layer => layer.type !== 'background')
      .forEach(layer => updateLayer(layer.id, {
        actionBlocks: buildLayerActions(layer, inStyle, outStyle, inEasing, outEasing),
        animationInStyle: inStyle,
        animationOutStyle: outStyle,
        motionBlur,
      } as Partial<Layer>));
    setActiveTab('animation');
    setTimelineProgress(inStyle === 'none' && outStyle === 'none' ? 50 : 14);
  };

  const syncBackground = (type: CommentConfig['backgroundType'], value?: string) => {
    update('backgroundType', type);
    if (value) update('backgroundColor', value);
    if (selectedLayer?.type === 'background') {
      updateLayer(selectedLayer.id, {
        bgKind: type === 'gradient' ? 'linear-gradient' : 'solid',
        bgColor1: value || (type === 'solid' ? config.backgroundColor : '#f8fafc'),
      } as Partial<Layer>);
    }
  };

  const updateActiveContent = (content: string) => {
    if (activeBulkMessage) {
      updateActiveSceneMessage({ content });
      return;
    }
    update('content', content);
  };

  const updateActiveIdentity = (field: 'displayName' | 'username', value: string) => {
    if (activeBulkMessage) {
      updateActiveSceneMessage({ [field]: value } as Partial<BulkMessage>);
      return;
    }
    update(field, value);
  };

  return (
    <aside className="hidden h-full w-[316px] shrink-0 flex-col border-l border-slate-200 bg-white xl:flex">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={panelLabel}>Inspector</p>
            <h2 className="mt-1 truncate font-display text-lg font-black text-slate-950">
              {activeTab === 'animation' ? 'Animate' : 'Design'}
            </h2>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            {activeTab === 'animation' ? <Film size={18} /> : <Layers size={18} />}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`flex h-9 items-center justify-center gap-2 rounded-md text-xs font-black transition ${
              activeTab === 'canvas' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon size={14} />
            Design
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('animation')}
            className={`flex h-9 items-center justify-center gap-2 rounded-md text-xs font-black transition ${
              activeTab === 'animation' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Play size={14} />
            Animate
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'canvas' ? (
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette size={15} className="text-indigo-500" />
                <p className={panelLabel}>Template</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {platformOptions.map(platform => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => update('platform', platform.value)}
                    className={`flex h-12 items-center justify-center rounded-lg border text-xl transition ${
                      config.platform === platform.value
                        ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                        : `border-slate-200 bg-white ${platform.color} hover:border-slate-300 hover:bg-slate-50`
                    }`}
                    title={platform.label}
                    aria-label={platform.label}
                  >
                    {platform.icon}
                  </button>
                ))}
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-500">Current scene</p>
                  <span className={`text-lg ${currentPlatform.color}`}>{currentPlatform.icon}</span>
                </div>
                <select
                  value={selectedSceneIndex}
                  onChange={(event) => setSelectedSceneIndex(Number(event.target.value))}
                  className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  aria-label="Select artboard"
                >
                  <option value={0}>Main artboard</option>
                  {sceneMessages.map((message, index) => (
                    <option key={message.id} value={index + 1}>
                      {String(index + 1).padStart(2, '0')} - {message.displayName}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2 overflow-hidden">
                  <span className="truncate text-sm font-black text-slate-900">{activeSceneLabel}</span>
                  {activeBulkMessage && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Bulk</span>
                  )}
                </div>
                {activeBulkMessage && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={duplicateActiveScene}
                      className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50"
                    >
                      <CopyPlus size={14} />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={deleteActiveScene}
                      className="flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-indigo-500" />
                <p className={panelLabel}>Layers</p>
              </div>
              {orderedLayers.map((layer) => (
                <div
                  key={layer.id}
                  className={`flex w-full items-center gap-2 rounded-[16px] border px-2 py-2 text-left transition ${
                    selectedLayer?.id === layer.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedLayerId(layer.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-black text-slate-800">{layerKindLabel(layer)}</span>
                    <span className="block truncate text-xs font-bold capitalize text-slate-400">
                      {layer.type === 'background' ? config.backgroundType : layer.type === 'card' ? `${config.width}px` : config.platform === 'dm' ? 'Bubble' : 'Text'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLayer(layer.id, { visible: !layer.visible } as Partial<Layer>)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                      layer.visible ? 'text-slate-500 hover:bg-white' : 'bg-slate-100 text-slate-300'
                    }`}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                    aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              ))}
              {selectedLayer && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => moveLayer(selectedLayer.id, 'up')}
                    disabled={isTopLayer}
                    className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp size={14} />
                    Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLayer(selectedLayer.id, 'down')}
                    disabled={isBottomLayer}
                    className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown size={14} />
                    Back
                  </button>
                </div>
              )}
            </section>

            {selectedLayer && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-indigo-500" />
                    <p className={panelLabel}>Transform</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetLayerTransform(selectedLayer.id)}
                    disabled={selectedLayer.type === 'background'}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">X</span>
                    <input
                      type="number"
                      value={selectedLayer.x}
                      disabled={selectedLayer.type === 'background'}
                      onChange={(event) => updateLayer(selectedLayer.id, { x: Number(event.target.value) } as Partial<Layer>)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Y</span>
                    <input
                      type="number"
                      value={selectedLayer.y}
                      disabled={selectedLayer.type === 'background'}
                      onChange={(event) => updateLayer(selectedLayer.id, { y: Number(event.target.value) } as Partial<Layer>)}
                      className={fieldClass}
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Rotation</span>
                    <span className="text-xs font-black text-indigo-600">{selectedLayer.rotation}deg</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={selectedLayer.rotation}
                    disabled={selectedLayer.type === 'background'}
                    onChange={(event) => updateLayer(selectedLayer.id, { rotation: Number(event.target.value) } as Partial<Layer>)}
                    className="w-full accent-indigo-600 disabled:opacity-40"
                  />
                </label>

                <label className="block space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Opacity</span>
                    <span className="text-xs font-black text-indigo-600">{Math.round(selectedLayer.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="1"
                    step="0.05"
                    value={selectedLayer.opacity}
                    disabled={selectedLayer.type === 'background'}
                    onChange={(event) => updateLayer(selectedLayer.id, { opacity: Number(event.target.value) } as Partial<Layer>)}
                    className="w-full accent-indigo-600 disabled:opacity-40"
                  />
                </label>

                <label className="block space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Delay</span>
                    <span className="text-xs font-black text-indigo-600">{selectedLayer.delayFrames}f</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={selectedLayer.delayFrames}
                    onChange={(event) => updateLayer(selectedLayer.id, { delayFrames: Number(event.target.value) } as Partial<Layer>)}
                    className="w-full accent-indigo-600"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">In action</span>
                    <select
                      value={selectedLayer.animationInStyle || config.animationInStyle || config.animationStyle}
                      onChange={(event) => updateLayer(selectedLayer.id, { animationInStyle: event.target.value as AnimationStyle } as Partial<Layer>)}
                      className={fieldClass}
                    >
                      {motionPresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Out action</span>
                    <select
                      value={selectedLayer.animationOutStyle || config.animationOutStyle || 'none'}
                      onChange={(event) => updateLayer(selectedLayer.id, { animationOutStyle: event.target.value as AnimationStyle } as Partial<Layer>)}
                      className={fieldClass}
                    >
                      {motionPresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Type size={15} className="text-indigo-500" />
                <p className={panelLabel}>Quick Design</p>
              </div>
              {selectedLayer?.type === 'background' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(['transparent', 'solid', 'gradient'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => syncBackground(type)}
                        className={`h-9 rounded-lg border text-xs font-black capitalize transition ${
                          config.backgroundType === type ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {config.backgroundType === 'solid' && (
                    <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="text-xs font-bold text-slate-500">Color</span>
                      <input
                        type="color"
                        value={config.backgroundColor.startsWith('#') ? config.backgroundColor : '#f8fafc'}
                        onChange={(event) => syncBackground('solid', event.target.value)}
                        className="h-9 w-12 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      />
                    </label>
                  )}
                </>
              )}

              {selectedLayer?.type === 'card' && (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Theme</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['light', 'dark'] as const).map(theme => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => update('theme', theme)}
                          className={`h-10 rounded-lg border text-sm font-black capitalize transition ${
                            config.theme === theme
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Output width</span>
                    <input
                      type="range"
                      min="300"
                      max="1200"
                      step="10"
                      value={config.width}
                      onChange={(event) => update('width', parseInt(event.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="text-right text-xs font-black text-indigo-600">{config.width}px</div>
                  </label>
                </>
              )}

              {selectedLayer?.type === 'text' && (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Content</span>
                    <textarea
                      value={activeConfig.content}
                      onChange={(event) => updateActiveContent(event.target.value)}
                      className={`${fieldClass} min-h-[92px] resize-none leading-relaxed`}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-2">
                      <span className="text-xs font-bold text-slate-500">Name</span>
                      <input
                        value={activeConfig.displayName}
                        onChange={(event) => updateActiveIdentity('displayName', event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-xs font-bold text-slate-500">Handle</span>
                      <input
                        value={activeConfig.username}
                        onChange={(event) => updateActiveIdentity('username', event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Font size</span>
                    <input
                      type="range"
                      min={config.platform === 'text' ? '16' : '12'}
                      max="32"
                      value={config.fontSize}
                      onChange={(event) => update('fontSize', parseInt(event.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </label>
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-500" />
                <p className={panelLabel}>Preset cepat</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickMotionPresets.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyMotionPresetToAllLayers(
                      preset.inStyle,
                      preset.outStyle,
                      preset.easeIn,
                      preset.easeOut,
                      preset.blur,
                    )}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-black text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {selectedLayer && (
              <section className="space-y-3 rounded-[18px] border border-indigo-100 bg-indigo-50/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={panelLabel}>Layer</p>
                    <h3 className="mt-1 truncate text-sm font-black text-slate-900">{layerKindLabel(selectedLayer)}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLayerId(selectedLayer.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"
                    aria-label="Selected layer"
                  >
                    <Layers size={16} />
                  </button>
                </div>

                <label className="block space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Delay</span>
                    <span className="text-xs font-black text-indigo-600">{selectedLayer.delayFrames || 0}f</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    value={selectedLayer.delayFrames || 0}
                    onChange={(event) => updateLayer(selectedLayer.id, { delayFrames: Number(event.target.value) } as Partial<Layer>)}
                    className="w-full accent-indigo-600"
                  />
                </label>

                <label className="block space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Jeda layer</span>
                    <span className="text-xs font-black text-indigo-600">{selectedLayer.staggerFrames || 0}f</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={selectedLayer.staggerFrames || 0}
                    onChange={(event) => updateLayer(selectedLayer.id, { staggerFrames: Number(event.target.value) } as Partial<Layer>)}
                    className="w-full accent-indigo-600"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => updateLayer(selectedLayer.id, { motionBlur: !selectedLayer.motionBlur } as Partial<Layer>)}
                  className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-xs font-black transition ${
                    selectedLayer.motionBlur
                      ? 'border-indigo-200 bg-white text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white/70 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Blur gerak</span>
                  <span className={`h-5 w-9 rounded-full p-0.5 transition ${selectedLayer.motionBlur ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${selectedLayer.motionBlur ? 'translate-x-4' : ''}`} />
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Masuk</span>
                    <select
                      value={findActionBlock(selectedLayer, 'in')?.style || selectedLayer.animationInStyle || config.animationInStyle || config.animationStyle}
                      onChange={(event) => updateLayerAction(selectedLayer, 'in', { style: event.target.value as AnimationStyle })}
                      className={fieldClass}
                    >
                      {motionPresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Keluar</span>
                    <select
                      value={findActionBlock(selectedLayer, 'out')?.style || selectedLayer.animationOutStyle || config.animationOutStyle || 'none'}
                      onChange={(event) => updateLayerAction(selectedLayer, 'out', { style: event.target.value as AnimationStyle })}
                      className={fieldClass}
                    >
                      {motionPresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Rasa masuk</span>
                    <select
                      value={findActionBlock(selectedLayer, 'in')?.easingPreset || config.easingInPreset}
                      onChange={(event) => updateLayerAction(selectedLayer, 'in', { easingPreset: event.target.value as EasingPreset })}
                      className={fieldClass}
                    >
                      {easingOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Rasa keluar</span>
                    <select
                      value={findActionBlock(selectedLayer, 'out')?.easingPreset || config.easingOutPreset}
                      onChange={(event) => updateLayerAction(selectedLayer, 'out', { easingPreset: event.target.value as EasingPreset })}
                      className={fieldClass}
                    >
                      {easingOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-2 rounded-[16px] border border-indigo-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700">Timing</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-600">frames</span>
                  </div>
                  {(['in', 'out'] as const).map(kind => {
                    const action = findActionBlock(selectedLayer, kind);
                    const fallbackDuration = kind === 'in' ? 46 : 34;
                    const fallbackStart = kind === 'in' ? 0 : Math.max(48, Math.round((config.animationDuration || 2) * 60) - fallbackDuration);
                    const startFrame = action?.startFrame ?? fallbackStart;
                    const durationFrames = action?.durationFrames ?? fallbackDuration;
                    return (
                      <div key={kind} className="space-y-1.5 rounded-xl bg-slate-50 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase text-slate-500">{kind}</span>
                          <span className="text-[11px] font-black text-slate-900">{startFrame}f · {durationFrames}f</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400">Mulai</span>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(60, Math.round((config.animationDuration || 2) * 60))}
                              value={startFrame}
                              onChange={(event) => updateLayerAction(selectedLayer, kind, { startFrame: Number(event.target.value) })}
                              className="w-full accent-indigo-600"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400">Durasi</span>
                            <input
                              type="range"
                              min="8"
                              max="90"
                              value={durationFrames}
                              onChange={(event) => updateLayerAction(selectedLayer, kind, { durationFrames: Number(event.target.value) })}
                              className="w-full accent-indigo-600"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Play size={15} className="text-indigo-500" />
                <p className={panelLabel}>Playback</p>
              </div>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-slate-500">Durasi</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.25"
                  value={config.animationDuration}
                  onChange={(event) => update('animationDuration', parseFloat(event.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="text-right text-xs font-black text-indigo-600">{config.animationDuration}s</div>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-slate-500">Playback</span>
                <select
                  value={config.animationLoop}
                  onChange={(event) => update('animationLoop', event.target.value)}
                  className={fieldClass}
                >
                  <option value="once">Sekali</option>
                  <option value="loop">Loop</option>
                  <option value="ping-pong">Bolak-balik</option>
                </select>
              </label>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 size={15} className="text-indigo-500" />
                <p className={panelLabel}>Export</p>
              </div>
              <button
                type="button"
                onClick={onExportPng}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white transition hover:bg-indigo-600"
              >
                <Download size={16} />
                Export PNG
              </button>
              <div className="grid grid-cols-2 gap-2">
                {(['mp4', 'webm', 'gif', 'mov'] as VideoExportFormat[]).map(format => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => onExportVideo(format)}
                    disabled={isExportingVideo}
                    className="h-10 rounded-lg border border-slate-200 bg-white text-xs font-black uppercase text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {format}
                  </button>
                ))}
              </div>
            </section>

            {hasBulkMessages && (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Batch ready</p>
                <p className="mt-1 text-sm font-bold text-emerald-900">{config.bulkMessages.length} generated variations</p>
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export const RightInspector = React.memo(RightInspectorComponent);
export default RightInspector;
