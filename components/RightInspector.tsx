import React from 'react';
import {
  ArrowLeftRight,
  BadgeCheck,
  CheckCircle,
  Clock,
  CopyPlus,
  Dices,
  Download,
  Eye,
  EyeOff,
  Film,
  GripVertical,
  Hash,
  Image as ImageIcon,
  Plus,
  Layers,
  MessageCircle,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  ThumbsUp,
  Trash2,
  Type,
  Upload,
  User,
  Wand2,
} from 'lucide-react';
import {
  AnimationStyle,
  BulkMessage,
  CommentConfig,
  DmStyle,
  EasingPreset,
  Layer,
  LayerActionBlock,
  LayerActionProperty,
  LayerActionPropertyValue,
  PaddingSize,
  Platform,
  VideoExportFormat,
} from '../types';
import { BulkGenerator } from './BulkGenerator';
import { BACKGROUND_GRADIENT_PRESETS } from '../utils/backgroundLayer';
import { createRandomProfiles } from '../utils/profileUtils';

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
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkExport: () => void;
  onExportPng: () => void;
  onExportVideo: (format: VideoExportFormat) => void;
  isExportingBulk: boolean;
  isExportingVideo: boolean;
  activeConfig: CommentConfig;
  selectedSceneIndex: number;
  setSelectedSceneIndex: (index: number) => void;
  sceneMessages: BulkMessage[];
  updateActiveSceneMessage: (patch: Partial<BulkMessage>) => void;
  duplicateActiveScene: () => void;
  deleteActiveScene: () => void;
  selectedLayerId: string;
  selectedActionId: string | null;
  setSelectedLayerId: (id: string) => void;
  selectAction: (layerId: string, actionId: string) => void;
  setTimelineProgress: (value: number) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  reorderLayer: (id: string, targetIndex: number) => void;
  resetLayerTransform: (id: string) => void;
  addLayer: (kind: 'text' | 'shape' | 'image') => void;
  duplicateLayer: (id: string) => void;
  deleteLayer: (id: string) => void;
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

const dmStyles: Array<{ value: DmStyle; label: string }> = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'imessage', label: 'iMessage' },
];

const paddingOptions: Array<{ value: PaddingSize; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'spacious', label: 'Spacious' },
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

const addActionPresets: Array<{
  label: string;
  description: string;
  kind: LayerActionBlock['kind'];
  style: AnimationStyle;
  easingPreset: EasingPreset;
  durationFrames: number;
  intensity: number;
  properties: LayerActionPropertyValue[];
}> = [
  { label: 'Fade in', description: 'Soft opacity and scale reveal', kind: 'in', style: 'fade-scale', easingPreset: 'ease-out', durationFrames: 36, intensity: 1, properties: [{ property: 'opacity', from: 0, to: 1 }, { property: 'scale', from: 0.97, to: 1 }] },
  { label: 'Pop in', description: 'Snappy social-card entrance', kind: 'in', style: 'pop', easingPreset: 'back', durationFrames: 42, intensity: 1, properties: [{ property: 'opacity', from: 0, to: 1 }, { property: 'y', from: 10, to: 0 }, { property: 'scale', from: 0.94, to: 1 }] },
  { label: 'Slide up', description: 'Clean lower-third motion', kind: 'in', style: 'slide-up', easingPreset: 'ease-out', durationFrames: 42, intensity: 0.8, properties: [{ property: 'opacity', from: 0, to: 1 }, { property: 'y', from: 34, to: 0 }] },
  { label: 'Fade out', description: 'Simple exit action', kind: 'out', style: 'fade-scale', easingPreset: 'ease-in', durationFrames: 34, intensity: 1, properties: [{ property: 'opacity', from: 1, to: 0 }, { property: 'scale', from: 1, to: 0.97 }] },
  { label: 'Wiggle', description: 'Attention beat in the middle', kind: 'emphasis', style: 'wiggle', easingPreset: 'elastic', durationFrames: 34, intensity: 0.9, properties: [{ property: 'rotate', from: -4, to: 4 }] },
  { label: 'Zoom blur', description: 'Fast punchy transition', kind: 'emphasis', style: 'zoom-blur', easingPreset: 'ease-out', durationFrames: 38, intensity: 1.1, properties: [{ property: 'opacity', from: 0.65, to: 1 }, { property: 'scale', from: 0.92, to: 1 }, { property: 'blur', from: 6, to: 0 }] },
];

const actionPropertyOptions: Array<{ value: LayerActionProperty; label: string }> = [
  { value: 'opacity', label: 'Opacity' },
  { value: 'x', label: 'Move X' },
  { value: 'y', label: 'Move Y' },
  { value: 'scale', label: 'Scale' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'blur', label: 'Blur' },
];

const actionPropertyLabel = (property: LayerActionProperty) => (
  actionPropertyOptions.find(option => option.value === property)?.label || property
);

const actionPropertyStep = (property: LayerActionProperty) => (
  property === 'opacity' || property === 'scale' ? 0.05 : 1
);

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
  onAvatarUpload,
  onBulkExport,
  onExportPng,
  onExportVideo,
  isExportingBulk,
  isExportingVideo,
  activeConfig,
  selectedSceneIndex,
  setSelectedSceneIndex,
  sceneMessages,
  updateActiveSceneMessage,
  duplicateActiveScene,
  deleteActiveScene,
  selectedLayerId,
  selectedActionId,
  setSelectedLayerId,
  selectAction,
  setTimelineProgress,
  updateLayer,
  reorderLayer,
  resetLayerTransform,
  addLayer,
  duplicateLayer,
  deleteLayer,
}) => {
  const currentPlatform = platformOptions.find(platform => platform.value === config.platform) || platformOptions[0];
  const selectedLayer = config.canvas.layers.find(layer => layer.id === selectedLayerId) || config.canvas.layers[1] || config.canvas.layers[0];
  const orderedLayers = [...config.canvas.layers].sort((a, b) => b.zIndex - a.zIndex);
  const activeBulkMessage = selectedSceneIndex > 0 ? sceneMessages[selectedSceneIndex - 1] : null;
  const isDm = config.platform === 'dm';
  const isText = config.platform === 'text';
  const selectedAction = selectedActionId && selectedLayer?.actionBlocks
    ? selectedLayer.actionBlocks.find(action => action.id === selectedActionId) ?? null
    : null;

  // --- Drag-reorder local state ---
  const [dragRowId, setDragRowId] = React.useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const reorderableIndices = orderedLayers
    .filter(layer => layer.id !== 'layer-bg-auto')
    .map((layer, visualIndex, items) => ({
      id: layer.id,
      visualIndex,
      modelIndex: items.length - 1 - visualIndex,
    }));

  const layerRowOnPointerDown = (layerId: string, event: React.PointerEvent, sourceVisualIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    setDragRowId(layerId);
    setDragOverIndex(sourceVisualIndex);
    let latestVisualIndex = sourceVisualIndex;

    const handleMove = (moveEvent: PointerEvent) => {
      // Find which row the pointer is closest to
      let bestIndex = sourceVisualIndex;
      let bestDist = Infinity;
      reorderableIndices.forEach(({ id, visualIndex }) => {
        const rowEl = document.getElementById(`layer-row-${id}`);
        if (!rowEl) return;
        const rect = rowEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(moveEvent.clientY - midY);
        if (dist < bestDist) { bestDist = dist; bestIndex = visualIndex; }
      });
      latestVisualIndex = bestIndex;
      setDragOverIndex(bestIndex);
    };

    const handleUp = () => {
      const target = reorderableIndices.find(item => item.visualIndex === latestVisualIndex);
      if (target && latestVisualIndex !== sourceVisualIndex) {
        reorderLayer(layerId, target.modelIndex);
      }
      setDragRowId(null);
      setDragOverIndex(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

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

  const updateActionById = (layer: Layer, actionId: string, patch: Partial<LayerActionBlock>) => {
    const currentActions = layer.actionBlocks || [];
    const existing = currentActions.find(action => action.id === actionId);
    if (!existing) return;
    const nextAction = { ...existing, ...patch };
    const nextActions = currentActions.map(action => action.id === actionId ? nextAction : action);

    updateLayer(layer.id, {
      actionBlocks: nextActions,
      ...(patch.style && nextAction.kind === 'in' ? { animationInStyle: patch.style } : {}),
      ...(patch.style && nextAction.kind === 'out' ? { animationOutStyle: patch.style } : {}),
    } as Partial<Layer>);

    const layerOffset = (layer.delayFrames || 0) + (layer.staggerFrames || 0);
    const durationFramesTotal = Math.max(60, Math.round((config.animationDuration || 2) * 60));
    const previewFrame = layerOffset + nextAction.startFrame + Math.max(1, Math.round(nextAction.durationFrames * 0.45));
    setActiveTab('animation');
    setTimelineProgress(Math.min(96, Math.max(0, (previewFrame / durationFramesTotal) * 100)));
  };

  const duplicateActionById = (layer: Layer, actionId: string) => {
    const currentActions = layer.actionBlocks || [];
    const source = currentActions.find(action => action.id === actionId);
    if (!source) return;
    const durationFramesTotal = Math.max(60, Math.round((config.animationDuration || 2) * 60));
    const nextId = `${layer.id}-${source.kind}-${Date.now()}`;
    const nextAction: LayerActionBlock = {
      ...source,
      id: nextId,
      name: `${source.name} copy`,
      properties: source.properties?.map(property => ({ ...property })),
      startFrame: Math.min(
        Math.max(0, durationFramesTotal - source.durationFrames),
        source.startFrame + source.durationFrames + 4,
      ),
    };
    updateLayer(layer.id, { actionBlocks: [...currentActions, nextAction] } as Partial<Layer>);
    selectAction(layer.id, nextId);
  };

  const deleteActionById = (layer: Layer, actionId: string) => {
    const currentActions = layer.actionBlocks || [];
    updateLayer(layer.id, {
      actionBlocks: currentActions.filter(action => action.id !== actionId),
    } as Partial<Layer>);
    setSelectedLayerId(layer.id);
  };

  const addActionToLayer = (
    layer: Layer,
    preset: (typeof addActionPresets)[number],
  ) => {
    const durationFramesTotal = Math.max(60, Math.round((config.animationDuration || 2) * 60));
    const currentActions = layer.actionBlocks || [];
    const lastEndFrame = currentActions.reduce((max, action) => (
      Math.max(max, action.startFrame + action.durationFrames)
    ), 0);
    const preferredStart = preset.kind === 'out'
      ? Math.max(0, durationFramesTotal - preset.durationFrames)
      : preset.kind === 'emphasis'
        ? Math.max(0, Math.round(durationFramesTotal * 0.45) - Math.round(preset.durationFrames / 2))
        : Math.min(Math.max(0, durationFramesTotal - preset.durationFrames), lastEndFrame + 4);
    const startFrame = Math.min(
      Math.max(0, durationFramesTotal - preset.durationFrames),
      preferredStart,
    );
    const actionId = `${layer.id}-${preset.kind}-${preset.style}-${Date.now()}`;
    const nextAction: LayerActionBlock = {
      id: actionId,
      kind: preset.kind,
      name: preset.label,
      style: preset.style,
      startFrame,
      durationFrames: preset.durationFrames,
      easingPreset: preset.easingPreset,
      intensity: preset.intensity,
      properties: preset.properties.map(property => ({ ...property })),
    };

    updateLayer(layer.id, {
      actionBlocks: [...currentActions, nextAction],
      ...(preset.kind === 'in' ? { animationInStyle: preset.style } : {}),
      ...(preset.kind === 'out' ? { animationOutStyle: preset.style } : {}),
    } as Partial<Layer>);
    selectAction(layer.id, actionId);
    setActiveTab('animation');
    const previewFrame = startFrame + Math.max(1, Math.round(preset.durationFrames * 0.45));
    setTimelineProgress(Math.min(96, Math.max(0, (previewFrame / durationFramesTotal) * 100)));
  };

  const updateActionPropertyByIndex = (
    layer: Layer,
    action: LayerActionBlock,
    propertyIndex: number,
    patch: Partial<LayerActionPropertyValue>,
  ) => {
    const properties = action.properties?.length
      ? action.properties.map(property => ({ ...property }))
      : [];
    if (!properties[propertyIndex]) return;
    properties[propertyIndex] = { ...properties[propertyIndex], ...patch };
    updateActionById(layer, action.id, { properties });
  };

  const addActionProperty = (
    layer: Layer,
    action: LayerActionBlock,
    property: LayerActionProperty,
  ) => {
    const defaults: Record<LayerActionProperty, LayerActionPropertyValue> = {
      opacity: { property: 'opacity', from: action.kind === 'out' ? 1 : 0, to: action.kind === 'out' ? 0 : 1 },
      x: { property: 'x', from: action.kind === 'out' ? 0 : 36, to: action.kind === 'out' ? -36 : 0 },
      y: { property: 'y', from: action.kind === 'out' ? 0 : 34, to: action.kind === 'out' ? 34 : 0 },
      scale: { property: 'scale', from: action.kind === 'out' ? 1 : 0.94, to: action.kind === 'out' ? 0.96 : 1 },
      rotate: { property: 'rotate', from: action.kind === 'out' ? 0 : -8, to: action.kind === 'out' ? 8 : 0 },
      blur: { property: 'blur', from: action.kind === 'out' ? 0 : 8, to: action.kind === 'out' ? 8 : 0 },
    };
    const properties = [
      ...(action.properties?.map(currentProperty => ({ ...currentProperty })) || []),
      { ...defaults[property] },
    ];
    updateActionById(layer, action.id, { properties });
  };

  const deleteActionProperty = (
    layer: Layer,
    action: LayerActionBlock,
    propertyIndex: number,
  ) => {
    const properties = (action.properties || [])
      .filter((_, index) => index !== propertyIndex)
      .map(property => ({ ...property }));
    updateActionById(layer, action.id, { properties });
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
    const gradient = BACKGROUND_GRADIENT_PRESETS.find(preset => preset.value === value) || BACKGROUND_GRADIENT_PRESETS[0];
    update('backgroundType', type);
    if (value) update('backgroundColor', value);
    if (selectedLayer?.type === 'background') {
      updateLayer(selectedLayer.id, {
        bgKind: type === 'gradient' ? 'linear-gradient' : 'solid',
        visible: type !== 'transparent',
        bgColor1: type === 'gradient' ? gradient.color1 : (value || (type === 'solid' ? config.backgroundColor : '#f8fafc')),
        bgColor2: type === 'gradient' ? gradient.color2 : selectedLayer.bgColor2,
        bgGradientAngle: type === 'gradient' ? gradient.angle : selectedLayer.bgGradientAngle,
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

  const updateActiveProfile = (patch: Partial<Pick<BulkMessage, 'avatarColor' | 'avatarInitials' | 'avatarUrl' | 'displayName' | 'username'>>) => {
    if (activeBulkMessage) {
      updateActiveSceneMessage(patch);
      return;
    }

    Object.entries(patch).forEach(([key, value]) => {
      update(key as keyof CommentConfig, value);
    });
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeBulkMessage) {
      onAvatarUpload(event);
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateActiveSceneMessage({ avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRandomizeProfile = () => {
    const profile = createRandomProfiles(1, 'id', Math.random() > 0.5 ? 'male' : 'female')[0];
    updateActiveProfile(profile);
  };

  return (
    <aside className="hidden h-full w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white xl:flex">
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => addLayer('text')}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Type size={13} />
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => addLayer('shape')}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Square size={13} />
                  Shape
                </button>
                <button
                  type="button"
                  onClick={() => addLayer('image')}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <ImageIcon size={13} />
                  Image
                </button>
              </div>
              {orderedLayers.map((layer) => {
                const isBg = layer.id === 'layer-bg-auto';
                const ri = reorderableIndices.find(item => item.id === layer.id);
                const sourceIndex = ri !== undefined ? ri.visualIndex : -1;
                const isDragging = dragRowId === layer.id;
                const isDropTarget = dragRowId && dragRowId !== layer.id && dragOverIndex !== null && ri !== undefined && dragOverIndex === sourceIndex;

                return (
                  <React.Fragment key={layer.id}>
                    {/* Insertion line above drop target */}
                    {isDropTarget && (
                      <div className="relative mx-1 -mb-px h-0.5 bg-indigo-500 pointer-events-none rounded-full" />
                    )}
                    <div
                      id={`layer-row-${layer.id}`}
                      className={`relative flex w-full items-center gap-2 rounded-[16px] border px-2 py-2 text-left transition ${
                        selectedLayer?.id === layer.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      } ${isDragging ? 'opacity-60 scale-[1.02] shadow-lg' : ''}`}
                    >
                      {!isBg && (
                        <div
                          role="button"
                          aria-label={`Drag to reorder ${layerKindLabel(layer)}`}
                          className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing select-none"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            layerRowOnPointerDown(layer.id, event, sourceIndex);
                          }}
                          title="Drag to reorder"
                        >
                          <GripVertical size={14} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId(layer.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-black text-slate-800">
                          {layerKindLabel(layer)}
                          {isBg && <span className="ml-1.5 text-[10px] font-bold text-slate-400">(locked)</span>}
                        </span>
                        <span className="block truncate text-xs font-bold capitalize text-slate-400">
                          {layer.type === 'background'
                            ? config.backgroundType
                            : layer.type === 'card'
                              ? `${config.width}px`
                              : layer.type === 'text'
                                ? (layer.id === 'layer-overlay-auto' && config.platform === 'dm' ? 'Bubble' : 'Text')
                                : layer.type}
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
                  </React.Fragment>
                );
              })}
              {selectedLayer && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateLayer(selectedLayer.id)}
                    disabled={selectedLayer.type === 'background'}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Duplicate layer"
                    aria-label="Duplicate layer"
                  >
                    <CopyPlus size={14} />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLayer(selectedLayer.id)}
                    disabled={['layer-bg-auto', 'layer-card-auto', 'layer-overlay-auto'].includes(selectedLayer.id)}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Delete layer"
                    aria-label="Delete layer"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </section>

            {selectedLayer && (selectedLayer.type === 'card' || selectedLayer.id === 'layer-overlay-auto') && (
              <section className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={15} className="text-indigo-500" />
                    <p className={panelLabel}>Content</p>
                  </div>
                  {!isText && (
                    <button
                      type="button"
                      onClick={handleRandomizeProfile}
                      className="flex h-8 items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 text-[11px] font-black text-indigo-700 transition hover:bg-indigo-100"
                      title="Randomize profile"
                    >
                      <Dices size={13} />
                      Auto
                    </button>
                  )}
                </div>

                {isDm && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <ArrowLeftRight size={14} />
                      DM style
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {dmStyles.map(style => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => update('dmStyle', style.value)}
                          className={`h-9 rounded-lg border text-[11px] font-black transition ${
                            config.dmStyle === style.value
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => update('isMe', !config.isMe)}
                      className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-black transition ${
                        config.isMe
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {config.isMe ? 'Sent bubble' : 'Received bubble'}
                    </button>
                  </div>
                )}

                {!isText && (
                  <div className="flex gap-3">
                    <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {activeConfig.avatarUrl ? (
                        <img src={activeConfig.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-2xl font-black text-white"
                          style={{ backgroundColor: activeConfig.avatarColor }}
                        >
                          {activeConfig.avatarInitials}
                        </div>
                      )}
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/65 text-white opacity-0 transition group-hover:opacity-100">
                        <Upload size={16} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                      </label>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="grid grid-cols-[48px_1fr] gap-2">
                        <input
                          type="color"
                          value={activeConfig.avatarColor}
                          onChange={(event) => updateActiveProfile({ avatarColor: event.target.value })}
                          className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                          aria-label="Avatar color"
                        />
                        <input
                          type="text"
                          value={activeConfig.avatarInitials}
                          onChange={(event) => updateActiveProfile({ avatarInitials: event.target.value.toUpperCase().slice(0, 2) })}
                          className={fieldClass}
                          placeholder="Initials"
                          maxLength={2}
                        />
                      </div>
                      <input
                        type="text"
                        value={activeConfig.avatarUrl || ''}
                        onChange={(event) => updateActiveProfile({ avatarUrl: event.target.value || null })}
                        className={fieldClass}
                        placeholder="Avatar image URL"
                      />
                    </div>
                  </div>
                )}

                {!isText && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <User size={13} />
                        Name
                      </span>
                      <input
                        value={activeConfig.displayName}
                        onChange={(event) => updateActiveIdentity('displayName', event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Hash size={13} />
                        Handle
                      </span>
                      <input
                        value={activeConfig.username}
                        onChange={(event) => updateActiveIdentity('username', event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                )}

                {!isText && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Clock size={13} />
                        Time
                      </span>
                      <input
                        value={config.timestamp}
                        onChange={(event) => update('timestamp', event.target.value)}
                        className={fieldClass}
                        placeholder={isDm ? 'Today' : '2h'}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => update('isVerified', !config.isVerified)}
                      disabled={isDm}
                      className={`mt-[22px] flex h-[42px] items-center justify-center gap-2 rounded-xl border text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        config.isVerified
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <BadgeCheck size={15} />
                      Verified
                    </button>
                  </div>
                )}

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">{isText ? 'Text' : isDm ? 'Message' : 'Comment'}</span>
                  <textarea
                    value={activeConfig.content}
                    onChange={(event) => updateActiveContent(event.target.value)}
                    className={`${fieldClass} min-h-[112px] resize-none leading-relaxed`}
                    placeholder={isText ? 'Write overlay text...' : isDm ? 'Write a DM message...' : 'Write a comment...'}
                  />
                </label>

                <label className="block space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Font size</span>
                    <span className="text-xs font-black text-indigo-600">{config.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={isText ? '16' : '12'}
                    max="32"
                    value={config.fontSize}
                    onChange={(event) => update('fontSize', parseInt(event.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </label>

                {!isDm && !isText && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <ThumbsUp size={13} />
                        Likes
                      </span>
                      <input
                        value={config.likes}
                        onChange={(event) => update('likes', event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MessageCircle size={13} />
                        Replies
                      </span>
                      <input
                        value={config.replies}
                        onChange={(event) => update('replies', event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => update('showStats', !config.showStats)}
                      className={`col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-black transition ${
                        config.showStats
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <CheckCircle size={15} />
                      Stats row
                    </button>
                  </div>
                )}
              </section>
            )}

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

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">W</span>
                    <input
                      type="number"
                      value={selectedLayer.width}
                      disabled={selectedLayer.type === 'background' || selectedLayer.type === 'card'}
                      onChange={(event) => updateLayer(selectedLayer.id, { width: Math.max(24, Number(event.target.value)) } as Partial<Layer>)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">H</span>
                    <input
                      type="number"
                      value={selectedLayer.height}
                      disabled={selectedLayer.type === 'background' || selectedLayer.type === 'card'}
                      onChange={(event) => updateLayer(selectedLayer.id, { height: Math.max(24, Number(event.target.value)) } as Partial<Layer>)}
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
                    <span className="text-xs font-bold text-slate-500">Out action</span>
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
                  {config.backgroundType === 'gradient' && (
                    <div className="grid grid-cols-4 gap-2">
                      {BACKGROUND_GRADIENT_PRESETS.map(gradient => (
                        <button
                          key={gradient.value}
                          type="button"
                          onClick={() => syncBackground('gradient', gradient.value)}
                          className={`h-12 rounded-xl border border-white shadow-sm transition hover:scale-[1.03] ${
                            config.backgroundColor === gradient.value ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                          }`}
                          style={{ backgroundImage: gradient.value }}
                          title={gradient.label}
                          aria-label={`Use ${gradient.label} gradient`}
                        />
                      ))}
                    </div>
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
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500">Padding</span>
                    <div className="grid grid-cols-3 gap-2">
                      {paddingOptions.map(padding => (
                        <button
                          key={padding.value}
                          type="button"
                          onClick={() => update('padding', padding.value)}
                          className={`h-9 rounded-xl border text-[11px] font-black transition ${
                            config.padding === padding.value
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {padding.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedLayer?.type === 'text' && (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Content</span>
                    <textarea
                      value={selectedLayer.id === 'layer-overlay-auto' ? activeConfig.content : selectedLayer.text}
                      onChange={(event) => {
                        if (selectedLayer.id === 'layer-overlay-auto') {
                          updateActiveContent(event.target.value);
                          return;
                        }
                        updateLayer(selectedLayer.id, { text: event.target.value } as Partial<Layer>);
                      }}
                      className={`${fieldClass} min-h-[92px] resize-none leading-relaxed`}
                    />
                  </label>
                  {selectedLayer.id === 'layer-overlay-auto' ? (
                    <>
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
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block space-y-2">
                          <span className="text-xs font-bold text-slate-500">Text</span>
                          <input
                            type="color"
                            value={selectedLayer.textColor}
                            onChange={(event) => updateLayer(selectedLayer.id, { textColor: event.target.value } as Partial<Layer>)}
                            className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-xs font-bold text-slate-500">Box</span>
                          <input
                            type="color"
                            value={selectedLayer.backgroundColor.startsWith('#') ? selectedLayer.backgroundColor : '#ffffff'}
                            onChange={(event) => updateLayer(selectedLayer.id, { backgroundColor: event.target.value } as Partial<Layer>)}
                            className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                          />
                        </label>
                      </div>
                      <label className="block space-y-2">
                        <div className="flex justify-between gap-3">
                          <span className="text-xs font-bold text-slate-500">Font size</span>
                          <span className="text-xs font-black text-indigo-600">{selectedLayer.textSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="96"
                          value={selectedLayer.textSize}
                          onChange={(event) => updateLayer(selectedLayer.id, { textSize: Number(event.target.value) } as Partial<Layer>)}
                          className="w-full accent-indigo-600"
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => updateLayer(selectedLayer.id, { textAlign: align } as Partial<Layer>)}
                            className={`h-9 rounded-xl border text-xs font-black capitalize transition ${
                              selectedLayer.textAlign === align ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedLayer?.type === 'shape' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(['rectangle', 'circle', 'line'] as const).map(kind => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => updateLayer(selectedLayer.id, { shapeKind: kind } as Partial<Layer>)}
                        className={`h-9 rounded-xl border text-xs font-black capitalize transition ${
                          selectedLayer.shapeKind === kind ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-2">
                      <span className="text-xs font-bold text-slate-500">Fill</span>
                      <input
                        type="color"
                        value={selectedLayer.fillColor}
                        onChange={(event) => updateLayer(selectedLayer.id, { fillColor: event.target.value } as Partial<Layer>)}
                        className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-xs font-bold text-slate-500">Stroke</span>
                      <input
                        type="color"
                        value={selectedLayer.strokeColor}
                        onChange={(event) => updateLayer(selectedLayer.id, { strokeColor: event.target.value } as Partial<Layer>)}
                        className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">Stroke width</span>
                      <span className="text-xs font-black text-indigo-600">{selectedLayer.strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={selectedLayer.strokeWidth}
                      onChange={(event) => updateLayer(selectedLayer.id, { strokeWidth: Number(event.target.value) } as Partial<Layer>)}
                      className="w-full accent-indigo-600"
                    />
                  </label>
                  <label className="block space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">Radius</span>
                      <span className="text-xs font-black text-indigo-600">{selectedLayer.borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={selectedLayer.borderRadius}
                      disabled={selectedLayer.shapeKind === 'circle'}
                      onChange={(event) => updateLayer(selectedLayer.id, { borderRadius: Number(event.target.value) } as Partial<Layer>)}
                      className="w-full accent-indigo-600 disabled:opacity-40"
                    />
                  </label>
                </>
              )}

              {selectedLayer?.type === 'image' && (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Image URL</span>
                    <input
                      value={selectedLayer.src || ''}
                      onChange={(event) => updateLayer(selectedLayer.id, { src: event.target.value || null } as Partial<Layer>)}
                      placeholder="https://..."
                      className={fieldClass}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-bold text-slate-500">Fit</span>
                    <select
                      value={selectedLayer.fitMode}
                      onChange={(event) => updateLayer(selectedLayer.id, { fitMode: event.target.value as 'cover' | 'contain' | 'fill' } as Partial<Layer>)}
                      className={fieldClass}
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="fill">Fill</option>
                    </select>
                  </label>
                  {([
                    ['blur', 0, 24, `${selectedLayer.blur}px`],
                    ['brightness', 20, 200, `${selectedLayer.brightness}%`],
                    ['grayscale', 0, 100, `${selectedLayer.grayscale}%`],
                  ] as const).map(([key, min, max, label]) => (
                    <label key={key} className="block space-y-2">
                      <div className="flex justify-between gap-3">
                        <span className="text-xs font-bold capitalize text-slate-500">{key}</span>
                        <span className="text-xs font-black text-indigo-600">{label}</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={selectedLayer[key]}
                        onChange={(event) => updateLayer(selectedLayer.id, { [key]: Number(event.target.value) } as Partial<Layer>)}
                        className="w-full accent-indigo-600"
                      />
                    </label>
                  ))}
                </>
              )}
            </section>

            {!isText && (
              <section className="space-y-3 rounded-[18px] border border-indigo-100 bg-indigo-50/70 p-3">
                <div className="flex items-center gap-2">
                  <Wand2 size={15} className="text-indigo-500" />
                  <p className={panelLabel}>AI Variations</p>
                </div>
                <BulkGenerator
                  config={config}
                  update={update}
                  onBulkExport={onBulkExport}
                  isExportingBulk={isExportingBulk}
                />
              </section>
            )}

            <section className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Download size={15} className="text-indigo-500" />
                <p className={panelLabel}>Export</p>
              </div>
              <button
                type="button"
                onClick={onExportPng}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-indigo-600"
              >
                <ImageIcon size={15} />
                Export PNG
              </button>
              <div className="grid grid-cols-4 gap-2">
                {(['mp4', 'webm', 'gif', 'mov'] as VideoExportFormat[]).map(format => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => onExportVideo(format)}
                    disabled={isExportingVideo}
                    className="h-9 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {format}
                  </button>
                ))}
              </div>
              {hasBulkMessages && (
                <button
                  type="button"
                  onClick={onBulkExport}
                  disabled={isExportingBulk}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={15} />
                  Export bulk PNG
                </button>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-5">
            {selectedLayer && selectedAction && (
              <section className="space-y-3 rounded-[18px] border border-violet-200 bg-violet-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={panelLabel}>Action</p>
                    <h3 className="mt-1 truncate text-sm font-black text-slate-900">{selectedAction.name}</h3>
                    <p className="mt-0.5 truncate text-xs font-bold text-violet-700">
                      {layerKindLabel(selectedLayer)} · {selectedAction.kind}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateActionById(selectedLayer, selectedAction.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm transition hover:bg-violet-100"
                      title="Duplicate action"
                      aria-label="Duplicate selected action"
                    >
                      <CopyPlus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteActionById(selectedLayer, selectedAction.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-100"
                      title="Delete action"
                      aria-label="Delete selected action"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Name</span>
                  <input
                    value={selectedAction.name}
                    onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { name: event.target.value })}
                    className={fieldClass}
                    aria-label="Action name"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Kind</span>
                    <select
                      value={selectedAction.kind}
                      onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { kind: event.target.value as LayerActionBlock['kind'] })}
                      className={fieldClass}
                      aria-label="Action kind"
                    >
                      <option value="in">In</option>
                      <option value="out">Out</option>
                      <option value="emphasis">Emphasis</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Effect</span>
                    <select
                      value={selectedAction.style}
                      onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { style: event.target.value as AnimationStyle })}
                      className={fieldClass}
                      aria-label="Action effect"
                    >
                      {motionPresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Easing</span>
                  <select
                    value={selectedAction.easingPreset}
                    onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { easingPreset: event.target.value as EasingPreset })}
                    className={fieldClass}
                    aria-label="Action easing"
                  >
                    {easingOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <div className="space-y-2 rounded-[16px] border border-violet-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700">Motion properties</span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-600">
                      {(selectedAction.properties || []).length} tracks
                    </span>
                  </div>

                  {(selectedAction.properties || []).length > 0 ? (
                    <div className="space-y-2">
                      {(selectedAction.properties || []).map((property, propertyIndex) => (
                        <div
                          key={`${selectedAction.id}-${propertyIndex}-${property.property}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <select
                              value={property.property}
                              onChange={(event) => updateActionPropertyByIndex(
                                selectedLayer,
                                selectedAction,
                                propertyIndex,
                                { property: event.target.value as LayerActionProperty },
                              )}
                              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                              aria-label={`Action property ${propertyIndex + 1} type`}
                            >
                              {actionPropertyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => deleteActionProperty(selectedLayer, selectedAction, propertyIndex)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-500 transition hover:bg-rose-50"
                              aria-label={`Delete action property ${actionPropertyLabel(property.property)}`}
                              title="Delete property"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <label className="block space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">From</span>
                              <input
                                type="number"
                                step={actionPropertyStep(property.property)}
                                value={property.from}
                                onChange={(event) => updateActionPropertyByIndex(
                                  selectedLayer,
                                  selectedAction,
                                  propertyIndex,
                                  { from: Number(event.target.value) },
                                )}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                aria-label={`Action property ${actionPropertyLabel(property.property)} from`}
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">To</span>
                              <input
                                type="number"
                                step={actionPropertyStep(property.property)}
                                value={property.to}
                                onChange={(event) => updateActionPropertyByIndex(
                                  selectedLayer,
                                  selectedAction,
                                  propertyIndex,
                                  { to: Number(event.target.value) },
                                )}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                aria-label={`Action property ${actionPropertyLabel(property.property)} to`}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-violet-100 bg-violet-50/60 px-3 py-2 text-[11px] font-bold leading-relaxed text-violet-700">
                      Legacy action. Add a property track to make this action editable by value.
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {actionPropertyOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => addActionProperty(selectedLayer, selectedAction, option.value)}
                        className="rounded-lg border border-violet-100 bg-violet-50 px-2 py-2 text-[10px] font-black text-violet-700 transition hover:border-violet-200 hover:bg-violet-100"
                      >
                        + {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-[16px] border border-violet-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700">Timing</span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-600">
                      {selectedAction.startFrame}f · {selectedAction.durationFrames}f
                    </span>
                  </div>
                  <label className="block space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <span className="text-[11px] font-bold text-slate-500">Start frame</span>
                      <span className="text-[11px] font-black text-violet-600">{selectedAction.startFrame}f</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(60, Math.round((config.animationDuration || 2) * 60))}
                      value={selectedAction.startFrame}
                      onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { startFrame: Number(event.target.value) })}
                      className="w-full accent-violet-600"
                      aria-label="Action start frame"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <span className="text-[11px] font-bold text-slate-500">Duration</span>
                      <span className="text-[11px] font-black text-violet-600">{selectedAction.durationFrames}f</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max={Math.max(12, Math.round((config.animationDuration || 2) * 60))}
                      value={selectedAction.durationFrames}
                      onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { durationFrames: Number(event.target.value) })}
                      className="w-full accent-violet-600"
                      aria-label="Action duration"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Intensity</span>
                    <span className="text-xs font-black text-violet-600">{Math.round((selectedAction.intensity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.8"
                    step="0.05"
                    value={selectedAction.intensity ?? 1}
                    onChange={(event) => updateActionById(selectedLayer, selectedAction.id, { intensity: Number(event.target.value) })}
                    className="w-full accent-violet-600"
                    aria-label="Action intensity"
                  />
                </label>
              </section>
            )}

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

            {selectedLayer && selectedLayer.type !== 'background' && (
              <section className="space-y-3 rounded-[18px] border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Plus size={15} className="text-indigo-500" />
                    <p className={panelLabel}>New action</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    {layerKindLabel(selectedLayer)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {addActionPresets.map(preset => (
                    <button
                      key={`${preset.kind}-${preset.style}-${preset.label}`}
                      type="button"
                      onClick={() => addActionToLayer(selectedLayer, preset)}
                      className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                    >
                      <span className="block text-xs font-black text-slate-900 group-hover:text-indigo-700">
                        {preset.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-400">
                        {preset.kind} · {preset.durationFrames}f
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

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
