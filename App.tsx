import React, { useState, useRef, useCallback } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { Copy, Download, Loader2, MessageCircle, Minus, PackageCheck, Plus, RotateCcw } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { Toaster, toast } from 'sonner';
import { INITIAL_CONFIG, CommentConfig, BulkMessage, Platform, VideoExportFormat } from './types';
import FacebookCard from './components/FacebookCard';
import YouTubeCard from './components/YouTubeCard';
import TikTokCard from './components/TikTokCard';
import TwitterCard from './components/TwitterCard';
import InstagramCard from './components/InstagramCard';
import BubbleChatCard from './components/BubbleChatCard';
import TextOverlayCard from './components/TextOverlayCard';
import { PlayerRef, Thumbnail } from '@remotion/player';
import { MainComposition } from './components/remotion/Composition';
import { ControlPanel } from './components/ControlPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { AnimationTab } from './components/AnimationTab';
import { Video, Image as ImageIcon, Type as TextIcon } from 'lucide-react';

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
  const [config, setConfig] = useState<CommentConfig>(INITIAL_CONFIG);
  const [zoom, setZoom] = useState(1.15);
  const previewRef = useRef<HTMLDivElement>(null);
  const bulkExportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isExportingBulk, setIsExportingBulk] = useState(false);
  const [bulkExportIndex, setBulkExportIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'canvas' | 'animation'>('canvas');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportFormat, setVideoExportFormat] = useState<VideoExportFormat>('mp4');
  const [exportFrame, setExportFrame] = useState(0);
  const [exportTotalFrames, setExportTotalFrames] = useState(120);
  
  const playerRef = useRef<PlayerRef>(null);

  const handleReset = () => {
    if (window.confirm('Reset all changes?')) {
      setConfig(INITIAL_CONFIG);
    }
  };

  const handleExport = useCallback(async () => {
    if (previewRef.current === null) return;
    setIsExporting(true);

    try {
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
      setIsExporting(false);
    }
  }, [config.platform]);

  const handleCopy = useCallback(async () => {
    if (previewRef.current === null) return;
    setIsCopying(true);

    try {
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
      setIsCopying(false);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const update = (key: keyof CommentConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

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

  const handleExportVideo = useCallback(async (format: VideoExportFormat) => {
    setVideoExportFormat(format);
    setIsExportingVideo(true);
    try {
      if (window.electronAPI && window.electronAPI.startVideoExport && playerRef.current) {
        toast.info(`Preparing frames for ${format.toUpperCase()}...`);
        
        await window.electronAPI.startVideoExport();
        const totalFrames = Math.max(60, Math.round((config.animationDuration || 2) * 60));
        setExportTotalFrames(totalFrames);
        
        for (let f = 0; f < totalFrames; f++) {
          setExportFrame(f);
          
          // Allow React and Remotion to re-render the Thumbnail
          await new Promise(r => setTimeout(r, 60));
          
          const container = document.getElementById('export-container');
          if (!container) throw new Error('Export container not found');

          const dataUrl = await toPng(container, {
            pixelRatio: 1, // Native 1080x1080
            cacheBust: true,
          });
          
          await window.electronAPI.sendFrame(f, dataUrl);
        }

        toast.info('Stitching frames with FFMPEG...');
        const result = await window.electronAPI.finishVideo(format);
        
        if (result.success) {
          toast.success(`${format.toUpperCase()} exported successfully!`);
        } else if (!result.canceled) {
          toast.error('Failed to encode video.');
        }
      } else {
        toast.error('Video export is only supported in the desktop app.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Render failed.');
    } finally {
      setIsExportingVideo(false);
    }
  }, [config.animationDuration]);

  const hasBulkMessages = config.bulkMessages.length > 0;
  const currentPlatform = platformOptions.find(platform => platform.value === config.platform) || platformOptions[0];
  const videoExportConfig = videoExportFormat === 'mov' ? { ...config, greenscreen: false } : config;

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

  const renderCardForPlatform = (message?: BulkMessage) => {
    const overriddenConfig = applyBulkMessageToConfig(message);
    switch (config.platform) {
      case 'facebook': return <FacebookCard config={overriddenConfig} />;
      case 'youtube': return <YouTubeCard config={overriddenConfig} />;
      case 'tiktok': return <TikTokCard config={overriddenConfig} />;
      case 'twitter': return <TwitterCard config={overriddenConfig} />;
      case 'instagram': return <InstagramCard config={overriddenConfig} />;
      case 'dm': return <BubbleChatCard config={overriddenConfig} messageOverride={message?.content} />;
      case 'text': return <TextOverlayCard config={overriddenConfig} />;
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

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 md:p-4">
        
        <header className="mb-3 flex min-h-[72px] flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
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
              className="fixed right-4 top-[calc(54vh+16px)] z-50 flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-indigo-600 disabled:opacity-60 sm:static sm:h-10 sm:w-auto sm:px-4 sm:shadow-md"
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

        {/* Dynamic Main View */}
        {activeTab === 'canvas' ? (
          <>
            <PreviewCanvas config={config} previewRef={previewRef} zoom={zoom} hasBulkMessages={hasBulkMessages}>
              {config.platform === 'facebook' && <FacebookCard config={config} />}
              {config.platform === 'youtube' && <YouTubeCard config={config} />}
              {config.platform === 'tiktok' && <TikTokCard config={config} />}
              {config.platform === 'twitter' && <TwitterCard config={config} />}
              {config.platform === 'instagram' && <InstagramCard config={config} />}
              {config.platform === 'dm' && <BubbleChatCard config={config} />}
              {config.platform === 'text' && <TextOverlayCard config={config} />}
            </PreviewCanvas>

            {/* Floating Bulk Preview Dock */}
            {hasBulkMessages && !isExportingBulk && (
          <div className="glass-panel absolute bottom-6 left-6 right-6 z-20 rounded-[28px]">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
                  Bulk Preview
                  <span className="truncate font-semibold normal-case tracking-normal text-slate-400">
                    {config.bulkMessages.length} messages
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleBulkExport}
                  disabled={!hasBulkMessages}
                  className="glass-button flex min-w-0 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-50"
                >
                  <Download size={13} className="shrink-0" />
                  <span className="truncate">Export all</span>
                </button>
              </div>
              <div className="flex min-h-[108px] gap-3 overflow-x-auto pb-1">
                {config.bulkMessages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`w-[184px] shrink-0 rounded-[20px] bg-white/70 backdrop-blur-md p-3 transition hover:-translate-y-1 ${
                      index === 0 ? 'ring-2 ring-indigo-400 shadow-md' : 'border border-white/80 shadow-sm'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: msg.avatarColor }}
                      >
                        {msg.avatarInitials}
                      </span>
                      <span className="truncate text-[11px] font-bold text-slate-800">
                        {msg.displayName}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isExportingBulk && bulkExportIndex >= 0 && (
          <div
            className="fixed"
            style={{ left: '-9999px', top: '-9999px' }}
          >
            <div ref={bulkExportRef} style={{ width: config.width }}>
              {renderCardForPlatform(config.bulkMessages[bulkExportIndex])}
            </div>
          </div>
        )}
          </>
        ) : (
          <AnimationTab 
            config={config} 
            update={update} 
            onExportVideo={handleExportVideo} 
            isExportingVideo={isExportingVideo}
            videoExportFormat={videoExportFormat}
            playerRef={playerRef}
          />
        )}
      </main>

      {/* Hidden high-res export container */}
      {isExportingVideo && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-900">
          <div className="relative z-10 flex flex-col items-center">
            <Loader2 className="mb-4 animate-spin text-indigo-400" size={48} />
            <h2 className="text-xl font-bold text-white">Rendering {videoExportFormat.toUpperCase()}...</h2>
            <p className="mt-2 text-slate-400">Frame {exportFrame + 1} of {exportTotalFrames}</p>
            <div className="mt-6 h-2 w-64 overflow-hidden rounded-full bg-slate-800">
              <div 
                className="h-full bg-indigo-500 transition-all duration-75" 
                style={{ width: `${((exportFrame + 1) / exportTotalFrames) * 100}%` }}
              />
            </div>
          </div>
          
          {/* 
            The actual 1080x1080 container for html-to-image. 
            We place it offscreen visually using fixed positioning, but NOT display: none 
            so html-to-image can still read its dimensions and content accurately.
          */}
          <div 
            className="fixed" 
            style={{ left: '-9999px', top: '-9999px', width: 1080, height: 1080 }}
          >
            <div id="export-container" style={{ width: 1080, height: 1080, backgroundColor: videoExportConfig.greenscreen ? '#00FF00' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Thumbnail
                component={MainComposition}
                compositionWidth={1080}
                compositionHeight={1080}
                frameToDisplay={exportFrame}
                durationInFrames={exportTotalFrames}
                fps={60}
                inputProps={{ config: videoExportConfig, message: undefined }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
