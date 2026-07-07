import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toBlob, toPng } from 'html-to-image';
import { Copy, Download, Loader2, MessageCircle, Minus, PackageCheck, Plus, RotateCcw } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { Toaster, toast } from 'sonner';
import { INITIAL_CONFIG, CommentConfig, BulkMessage, Layer, Platform, VideoExportFormat } from './types';
import FacebookCard from './components/FacebookCard';
import YouTubeCard from './components/YouTubeCard';
import TikTokCard from './components/TikTokCard';
import TwitterCard from './components/TwitterCard';
import InstagramCard from './components/InstagramCard';
import BubbleChatCard from './components/BubbleChatCard';
import TextOverlayCard from './components/TextOverlayCard';
import { ControlPanel } from './components/ControlPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { RightInspector } from './components/RightInspector';
import { TimelineDock } from './components/TimelineDock';
import { Video, Image as ImageIcon, Type as TextIcon } from 'lucide-react';
import { composeLayerTransform, getLayerMotion, progressToFrame } from './utils/motionEngine';
import { usePreviewRuntime } from './utils/previewRuntime';

const platformOptions: Array<{
  value: Platform;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { value: 'twitter', label: 'X / Twitter', icon: <FaXTwitter />, color: 'text-slate-950' },
  { value: 'facebook', label: 'Facebook', icon: <FaFacebookF />, color: 'text-[#1877f2]' },
  { value: 'instagram', label: 'Instagram', icon: <FaInstagram />, color: 'text-[#e4405f]' },
  { value: 'tiktok', label: 'TikTok', icon: <FaTiktok />, color: 'text-slate-950' },
  { value: 'youtube', label: 'YouTube', icon: <FaYoutube />, color: 'text-[#ff0033]' },
  { value: 'dm', label: 'Chat Bubble', icon: <MessageCircle size={17} strokeWidth={2.4} />, color: 'text-slate-950' },
  { value: 'text', label: 'Text Overlay', icon: <TextIcon size={18} strokeWidth={2.4} />, color: 'text-indigo-600' },
];

const App: React.FC = () => {
  const initialTab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'animation'
    ? 'animation'
    : 'canvas';
  const [config, setConfig] = useState<CommentConfig>(INITIAL_CONFIG);
  const [zoom, setZoom] = useState(1.15);
  const previewRef = useRef<HTMLDivElement>(null);
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const contentPreviewRef = useRef<HTMLSpanElement>(null);
  const bulkExportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isExportingBulk, setIsExportingBulk] = useState(false);
  const [bulkExportIndex, setBulkExportIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'canvas' | 'animation'>(initialTab);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportFormat, setVideoExportFormat] = useState<VideoExportFormat>('mp4');
  const [renderProgress, setRenderProgress] = useState<{ progress: number; stage: string }>({ progress: 0, stage: '' });
  const [selectedLayerId, setSelectedLayerId] = useState('layer-card-auto');
  const [timelineProgress, setTimelineProgress] = useState(42);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [timelineDirection, setTimelineDirection] = useState(1);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [isCapturingPreview, setIsCapturingPreview] = useState(false);
  const hasBulkMessages = config.bulkMessages.length > 0;
  const safeSelectedSceneIndex = hasBulkMessages ? Math.min(selectedSceneIndex, config.bulkMessages.length) : 0;
  const activeBulkMessage = safeSelectedSceneIndex > 0 ? config.bulkMessages[safeSelectedSceneIndex - 1] : undefined;
  const currentPlatform = platformOptions.find(platform => platform.value === config.platform) || platformOptions[0];
  
  const waitForPreviewPaint = () => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all changes?')) {
      setConfig(INITIAL_CONFIG);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (previewRef.current === null) return;
    setIsExporting(true);

    try {
      setIsCapturingPreview(true);
      await waitForPreviewPaint();
      const node = previewRef.current.firstElementChild as HTMLElement;
      if (!node) return;

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `social-mock-${config.platform}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Image exported successfully!');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export image. Please try again.');
    } finally {
      setIsCapturingPreview(false);
      setIsExporting(false);
    }
  }, [config.platform]);

  const handleCopy = useCallback(async () => {
    if (previewRef.current === null) return;
    setIsCopying(true);

    try {
      setIsCapturingPreview(true);
      await waitForPreviewPaint();
      const node = previewRef.current.firstElementChild as HTMLElement;
      if (!node) return;

      const blob = await toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Image copied to clipboard!');
        } catch (err) {
          console.error('Clipboard write failed', err);
          toast.error('Failed to copy image to clipboard.');
        }
      }
    } catch (err) {
      console.error('Copy failed', err);
      toast.error('Failed to copy image. Please try again.');
    } finally {
      setIsCapturingPreview(false);
      setIsCopying(false);
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const update = useCallback((key: keyof CommentConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setConfig(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        layers: prev.canvas.layers.map(layer =>
          layer.id === id ? ({ ...layer, ...patch } as Layer) : layer
        ),
      },
    }));
  }, []);

  const resetLayerTransform = useCallback((id: string) => {
    updateLayer(id, {
      x: id === 'layer-card-auto' ? 80 : 0,
      y: id === 'layer-card-auto' ? 80 : 0,
      rotation: 0,
      opacity: 1,
    } as Partial<Layer>);
  }, [updateLayer]);

  const beginLayerDrag = (id: string, event: React.PointerEvent<HTMLElement>) => {
    const layer = config.canvas.layers.find(item => item.id === id);
    if (!layer || layer.type === 'background') return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedLayerId(id);
    setDraggingLayerId(id);

    const startX = event.clientX;
    const startY = event.clientY;
    const originX = layer.x;
    const originY = layer.y;
    const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
    const activeZoom = viewportWidth < 768
      ? Math.min(zoom, Math.max(0.25, (viewportWidth - 88) / config.width))
      : zoom;

    const handleMove = (moveEvent: PointerEvent) => {
      const nextX = Math.round(originX + (moveEvent.clientX - startX) / activeZoom);
      const nextY = Math.round(originY + (moveEvent.clientY - startY) / activeZoom);
      updateLayer(id, { x: nextX, y: nextY } as Partial<Layer>);
    };

    const handleUp = () => {
      setDraggingLayerId(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const layers = [...prev.canvas.layers].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = layers.findIndex(layer => layer.id === id);
      if (currentIndex === -1) return prev;

      const nextIndex = direction === 'up'
        ? Math.min(layers.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

      if (nextIndex === currentIndex) return prev;

      const nextLayers = [...layers];
      [nextLayers[currentIndex], nextLayers[nextIndex]] = [nextLayers[nextIndex], nextLayers[currentIndex]];

      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          layers: nextLayers.map((layer, index) => ({ ...layer, zIndex: index * 10 } as Layer)),
        },
      };
    });
  }, []);

  const updateBulkMessage = useCallback((index: number, patch: Partial<BulkMessage>) => {
    setConfig(prev => ({
      ...prev,
      bulkMessages: prev.bulkMessages.map((message, messageIndex) =>
        messageIndex === index ? { ...message, ...patch } : message
      ),
    }));
  }, []);

  const duplicateActiveScene = useCallback(() => {
    if (safeSelectedSceneIndex <= 0 || !activeBulkMessage) return;
    const nextMessage: BulkMessage = {
      ...activeBulkMessage,
      id: `${activeBulkMessage.id}-copy-${Date.now()}`,
      displayName: `${activeBulkMessage.displayName} Copy`,
    };
    setConfig(prev => {
      const insertIndex = safeSelectedSceneIndex;
      const nextMessages = [...prev.bulkMessages];
      nextMessages.splice(insertIndex, 0, nextMessage);
      return { ...prev, bulkMessages: nextMessages };
    });
    setSelectedSceneIndex(safeSelectedSceneIndex + 1);
    toast.success('Artboard duplicated');
  }, [activeBulkMessage, safeSelectedSceneIndex]);

  const deleteActiveScene = useCallback(() => {
    if (safeSelectedSceneIndex <= 0) return;
    setConfig(prev => ({
      ...prev,
      bulkMessages: prev.bulkMessages.filter((_, index) => index !== safeSelectedSceneIndex - 1),
    }));
    setSelectedSceneIndex(Math.max(0, safeSelectedSceneIndex - 1));
    toast.success('Artboard deleted');
  }, [safeSelectedSceneIndex]);

  const handleBulkExport = useCallback(async () => {
    if (config.bulkMessages.length === 0) return;
    setIsExportingBulk(true);

    try {
      for (let i = 0; i < config.bulkMessages.length; i++) {
        setBulkExportIndex(i);
        await new Promise(resolve => setTimeout(resolve, 300));

        const container = bulkExportRef.current;
        if (!container) continue;

        const node = container.firstElementChild as HTMLElement;
        if (!node) continue;

        const dataUrl = await toPng(node, {
          pixelRatio: 2,
          cacheBust: true,
        });

        const link = document.createElement('a');
        link.download = `bulk-${config.platform}${config.platform === 'dm' ? '-' + config.dmStyle : ''}-${i + 1}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        await new Promise(resolve => setTimeout(resolve, 200));
      }
      toast.success('All messages exported successfully!');
    } catch (err) {
      console.error('Bulk export failed', err);
      toast.error('Bulk export failed. Please try again.');
    } finally {
      setIsExportingBulk(false);
      setBulkExportIndex(-1);
    }
  }, [config.bulkMessages, config.platform, config.dmStyle]);

  // Listen for render progress updates from Electron main process
  useEffect(() => {
    if (!window.electronAPI?.onRenderProgress) return;
    const cleanup = window.electronAPI.onRenderProgress((data: { progress: number; stage: string }) => {
      setRenderProgress(data);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    setSelectedSceneIndex(index => Math.min(index, config.bulkMessages.length));
  }, [config.bulkMessages.length]);


  const handleExportVideo = useCallback(async (format: VideoExportFormat) => {
    setVideoExportFormat(format);
    setIsExportingVideo(true);
    setRenderProgress({ progress: 0, stage: 'Starting...' });
    try {
      if (window.electronAPI?.renderVideo) {
        // New Remotion native rendering pipeline
        toast.info(`Rendering ${format.toUpperCase()} with Remotion...`);
        const durationInFrames = Math.max(60, Math.round((config.animationDuration || 2) * 60));
        
        const result = await window.electronAPI.renderVideo({
          config,
          format,
          fps: 60,
          durationInFrames,
        });

        if (result.success) {
          if (result.alphaValidation?.warning) {
            toast.warning(result.alphaValidation.warning);
          }
          toast.success(`${format.toUpperCase()} exported successfully!`);
        } else if (!result.canceled) {
          toast.error(result.error || 'Failed to render video.');
        }
      } else if (window.electronAPI?.startVideoExport) {
        // Legacy fallback for older builds
        toast.error('Legacy export not supported. Please update the app.');
      } else {
        toast.error('Video export is only supported in the desktop app.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Render failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsExportingVideo(false);
      setRenderProgress({ progress: 0, stage: '' });
    }
  }, [config]);

  const layerVisible = (id: string) => config.canvas.layers.find(layer => layer.id === id)?.visible !== false;
  const isBackgroundVisible = layerVisible('layer-bg-auto');
  const isCardVisible = layerVisible('layer-card-auto');
  const isContentVisible = layerVisible('layer-overlay-auto');

  const applyBulkMessageToConfig = (message?: BulkMessage): CommentConfig => {
    if (!message) return config;

    return {
      ...config,
      content: message.content,
      displayName: message.displayName,
      username: message.username,
      avatarInitials: message.avatarInitials,
      avatarColor: message.avatarColor,
      avatarUrl: message.avatarUrl,
    };
  };

  const activeConfig = applyBulkMessageToConfig(activeBulkMessage);
  const selectedLayer = config.canvas.layers.find(layer => layer.id === selectedLayerId);
  const cardLayer = config.canvas.layers.find(layer => layer.id === 'layer-card-auto');
  const contentLayer = config.canvas.layers.find(layer => layer.id === 'layer-overlay-auto');
  const previewLayerTargets = useMemo(() => [
    {
      layerId: 'layer-card-auto',
      ref: cardPreviewRef,
      transformMode: 'composed' as const,
    },
    {
      layerId: 'layer-overlay-auto',
      ref: contentPreviewRef,
      transformMode: 'motion-only' as const,
    },
  ], []);
  const showSelectionChrome = !isCapturingPreview;
  const previewFrame = progressToFrame(timelineProgress, config.animationDuration || 2, 60);
  const motionContext = {
    frame: previewFrame,
    fps: 60,
    durationInFrames: Math.max(60, Math.round((config.animationDuration || 2) * 60)),
    config,
  };
  const cardMotion = getLayerMotion(cardLayer, motionContext);
  const contentMotion = getLayerMotion(contentLayer, motionContext);
  const previewConfig: CommentConfig = isBackgroundVisible
    ? activeConfig
    : { ...activeConfig, backgroundType: 'transparent' };

  const {
    setPreviewProgress,
    setPreviewPlaying,
    restartPlayback: restartTimelinePlayback,
  } = usePreviewRuntime({
    config,
    layers: config.canvas.layers,
    targets: previewLayerTargets,
    progress: timelineProgress,
    isPlaying: isTimelinePlaying,
    direction: timelineDirection,
    setProgress: setTimelineProgress,
    setIsPlaying: setIsTimelinePlaying,
    setDirection: setTimelineDirection,
  });

  const updateActiveSceneMessage = useCallback((patch: Partial<BulkMessage>) => {
    if (safeSelectedSceneIndex <= 0) return;
    updateBulkMessage(safeSelectedSceneIndex - 1, patch);
  }, [safeSelectedSceneIndex, updateBulkMessage]);

  const renderContentNode = (content: string, attachRuntimeRef = true) => {
    if (!isContentVisible) return '';
    if (!contentLayer) return undefined;
    return (
      <span
        ref={attachRuntimeRef ? contentPreviewRef : undefined}
        className="inline-block max-w-full"
        style={{
          opacity: (contentLayer.opacity ?? 1) * contentMotion.opacity,
          transform: contentMotion.transform,
          filter: contentMotion.filter || undefined,
          transformOrigin: 'center',
          transition: 'none',
          willChange: 'transform, opacity, filter',
          backfaceVisibility: 'hidden',
          overflowWrap: 'anywhere',
        }}
      >
        {content}
      </span>
    );
  };

  const renderCardForPlatform = (message?: BulkMessage, forceContentVisible = true, attachRuntimeRef = true) => {
    const overriddenConfig = applyBulkMessageToConfig(message);
    const contentNode = forceContentVisible ? renderContentNode(overriddenConfig.content, attachRuntimeRef) : '';
    switch (config.platform) {
      case 'facebook': return <FacebookCard config={overriddenConfig} contentNode={contentNode} />;
      case 'youtube': return <YouTubeCard config={overriddenConfig} contentNode={contentNode} />;
      case 'tiktok': return <TikTokCard config={overriddenConfig} contentNode={contentNode} />;
      case 'twitter': return <TwitterCard config={overriddenConfig} contentNode={contentNode} />;
      case 'instagram': return <InstagramCard config={overriddenConfig} contentNode={contentNode} />;
      case 'dm': return <BubbleChatCard config={overriddenConfig} messageOverride={forceContentVisible ? message?.content : ''} />;
      case 'text': return <TextOverlayCard config={overriddenConfig} contentNode={contentNode} />;
      default: return null;
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#e8edf4] font-sans text-slate-950 md:flex-row">
      <Toaster position="bottom-center" toastOptions={{ className: 'font-sans' }} />

      {/* Attached Control Panel */}
      <div className="relative z-20 flex h-[54vh] w-full flex-shrink-0 flex-col border-slate-200 bg-white p-0 md:h-full md:w-[420px] md:border-r">
        <ControlPanel
          config={config}
          update={update}
          handleReset={handleReset}
          handleImageUpload={handleImageUpload}
          onBulkExport={handleBulkExport}
          isExportingBulk={isExportingBulk}
        />
      </div>

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        
        <header className="flex min-h-[64px] flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4">
          <div className="flex min-w-[180px] items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[20px]">
              <span className={currentPlatform.color}>{currentPlatform.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SocialMock Studio</p>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                <h1 className="font-display truncate text-base font-black tracking-tight text-slate-900">{currentPlatform.label}</h1>
                <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 sm:block" />
                <span className="hidden shrink-0 text-sm font-medium text-slate-500 sm:block">{config.width}px output</span>
              </div>
            </div>
          </div>

          <div className="order-3 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:order-none lg:w-[220px]">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mode</span>
            <select
              value={config.platform}
              onChange={(event) => update('platform', event.target.value as Platform)}
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-black text-slate-900 outline-none"
              aria-label="Select platform mode"
            >
              {platformOptions.map(platform => (
                <option key={platform.value} value={platform.value}>{platform.label}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="mr-1 flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('canvas')}
                className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold transition-all ${
                  activeTab === 'canvas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ImageIcon size={16} />
                <span className="hidden sm:inline">Image</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('animation')}
                className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold transition-all ${
                  activeTab === 'animation' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Video size={16} />
                <span className="hidden sm:inline">Animation</span>
              </button>
            </div>

            <div className="hidden h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 md:flex">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Minus size={16} />
              </button>
              <span className="font-display min-w-[3rem] px-1 text-center text-sm font-black text-slate-700">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={isCopying}
              className="glass-button hidden h-10 min-w-0 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-700 disabled:opacity-60 md:flex"
            >
              {isCopying ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Copy size={16} className="shrink-0" />}
              <span className="truncate">{isCopying ? 'Copying' : 'Copy'}</span>
            </button>

            {hasBulkMessages && (
              <button
                type="button"
                onClick={handleBulkExport}
                disabled={isExportingBulk}
                className="hidden h-10 min-w-0 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 xl:flex"
              >
                {isExportingBulk ? <Loader2 size={16} className="animate-spin shrink-0" /> : <PackageCheck size={16} className="shrink-0" />}
                <span className="truncate">Bulk</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="glass-button hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 sm:flex"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-bold text-white shadow-md transition hover:-translate-y-1 hover:bg-indigo-600 disabled:opacity-60 sm:w-auto sm:px-4"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Download size={16} className="shrink-0" />}
              <span className="hidden truncate sm:inline">{isExporting ? 'Exporting' : 'Export PNG'}</span>
            </button>
          </div>
        </header>

        {isExportingBulk && (
          <div className="glass-panel absolute left-1/2 top-[100px] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-slate-800 shadow-lg">
            <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0" />
            <span className="truncate">Exporting {bulkExportIndex + 1} / {config.bulkMessages.length}</span>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1">
          <section className="relative flex min-h-0 min-w-0 flex-1 flex-col p-3 md:p-4">
            <PreviewCanvas
              config={previewConfig}
              previewRef={previewRef}
              zoom={zoom}
              hasBulkMessages={hasBulkMessages}
              selectedLayerId={selectedLayerId}
              showSelectionChrome={showSelectionChrome}
              mode={activeTab}
              isPlaying={isTimelinePlaying}
              progress={timelineProgress}
              duration={config.animationDuration}
              onCanvasSelect={() => setSelectedLayerId('layer-bg-auto')}
            >
              <div
                ref={cardPreviewRef}
                onPointerDown={(event) => beginLayerDrag('layer-card-auto', event)}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedLayerId('layer-card-auto');
                }}
                className={`group/layer relative inline-flex max-w-full touch-none justify-center rounded-[26px] ${
                  draggingLayerId === 'layer-card-auto' ? 'cursor-grabbing' : 'cursor-grab'
                } ${
                  showSelectionChrome && selectedLayerId === 'layer-card-auto' ? 'ring-2 ring-indigo-400 ring-offset-4 ring-offset-white' : ''
                }`}
                style={{
                  transform: composeLayerTransform(cardLayer, cardMotion),
                  opacity: (cardLayer?.opacity ?? 1) * cardMotion.opacity,
                  filter: cardMotion.filter || undefined,
                  transformOrigin: 'center',
                  transition: 'none',
                  willChange: 'transform, opacity, filter',
                  backfaceVisibility: 'hidden',
                }}
              >
                {showSelectionChrome && selectedLayerId === 'layer-card-auto' && (
                  <div className="pointer-events-none absolute -top-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
                    <span>Mockup card</span>
                    <span className="h-1 w-1 rounded-full bg-slate-500" />
                    <span>{selectedLayer?.x ?? cardLayer?.x}px, {selectedLayer?.y ?? cardLayer?.y}px</span>
                  </div>
                )}
                {isCardVisible ? renderCardForPlatform(activeBulkMessage, isContentVisible) : (
                  <div className="flex min-h-[220px] w-full items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-8 text-center text-sm font-bold text-slate-400">
                    Mockup card layer hidden
                  </div>
                )}
              </div>
            </PreviewCanvas>
          </section>

          <RightInspector
            config={config}
            update={update}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            platformOptions={platformOptions}
            hasBulkMessages={hasBulkMessages}
            onExportPng={handleExport}
            onExportVideo={handleExportVideo}
            isExportingVideo={isExportingVideo}
            activeConfig={activeConfig}
            selectedSceneIndex={safeSelectedSceneIndex}
            setSelectedSceneIndex={setSelectedSceneIndex}
            sceneMessages={config.bulkMessages}
            updateActiveSceneMessage={updateActiveSceneMessage}
            duplicateActiveScene={duplicateActiveScene}
            deleteActiveScene={deleteActiveScene}
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
            setTimelineProgress={setPreviewProgress}
            updateLayer={updateLayer}
            moveLayer={moveLayer}
            resetLayerTransform={resetLayerTransform}
          />
        </div>

        <TimelineDock
          config={config}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          bulkMessages={config.bulkMessages}
          progress={timelineProgress}
          setProgress={setPreviewProgress}
          isPlaying={isTimelinePlaying}
          setIsPlaying={setPreviewPlaying}
          restartPlayback={restartTimelinePlayback}
          update={update}
          selectedLayerId={selectedLayerId}
          setSelectedLayerId={setSelectedLayerId}
          updateLayer={updateLayer}
          selectedSceneIndex={safeSelectedSceneIndex}
          setSelectedSceneIndex={setSelectedSceneIndex}
        />

        {isExportingBulk && bulkExportIndex >= 0 && (
          <div
            className="fixed"
            style={{ left: '-9999px', top: '-9999px' }}
          >
            <div ref={bulkExportRef} style={{ width: config.width }}>
              {isCardVisible ? renderCardForPlatform(config.bulkMessages[bulkExportIndex], isContentVisible, false) : null}
            </div>
          </div>
        )}
      </main>

      {/* Rendering overlay — Remotion renders in background via Electron */}
      {isExportingVideo && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-900/95 backdrop-blur-sm">
          <div className="relative z-10 flex flex-col items-center">
            <Loader2 className="mb-4 animate-spin text-indigo-400" size={48} />
            <h2 className="text-xl font-bold text-white">Rendering {videoExportFormat.toUpperCase()}...</h2>
            <p className="mt-2 text-sm text-slate-400">{renderProgress.stage || 'Preparing...'}</p>
            <div className="mt-6 h-2.5 w-72 overflow-hidden rounded-full bg-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" 
                style={{ width: `${Math.round(renderProgress.progress * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">{Math.round(renderProgress.progress * 100)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
