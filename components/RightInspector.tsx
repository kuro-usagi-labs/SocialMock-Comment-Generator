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
import { AnimationStyle, BulkMessage, CommentConfig, Layer, Platform, VideoExportFormat } from '../types';

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
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  resetLayerTransform: (id: string) => void;
}

const panelLabel = 'font-display text-[10px] font-black uppercase tracking-[0.18em] text-slate-500';
const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
const motionPresets: Array<{ value: AnimationStyle; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade-scale', label: 'Fade scale' },
  { value: 'slide-up', label: 'Slide up' },
  { value: 'slide-left', label: 'Slide left' },
  { value: 'slide-right', label: 'Slide right' },
  { value: 'elastic-spin', label: 'Elastic spin' },
  { value: 'flip-in', label: 'Flip in' },
  { value: 'bounce-in', label: 'Bounce in' },
  { value: 'wiggle', label: 'Wiggle' },
  { value: 'zoom-blur', label: 'Zoom blur' },
  { value: 'glitch', label: 'Glitch' },
];

export const RightInspector: React.FC<RightInspectorProps> = ({
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
                <p className={panelLabel}>Motion</p>
              </div>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-slate-500">In preset</span>
                <select
                  value={config.animationInStyle}
                  onChange={(event) => update('animationInStyle', event.target.value)}
                  className={fieldClass}
                >
                  <option value="pop">Pop</option>
                  <option value="fade-scale">Fade scale</option>
                  <option value="slide-up">Slide up</option>
                  <option value="slide-left">Slide left</option>
                  <option value="flip-in">Flip in</option>
                  <option value="glitch">Glitch</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-slate-500">Duration</span>
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
                <span className="text-xs font-bold text-slate-500">Loop</span>
                <select
                  value={config.animationLoop}
                  onChange={(event) => update('animationLoop', event.target.value)}
                  className={fieldClass}
                >
                  <option value="once">Once</option>
                  <option value="loop">Loop</option>
                  <option value="ping-pong">Ping-pong</option>
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

export default RightInspector;
