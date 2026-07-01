import React, { useState, useRef, useCallback } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { ChevronDown, Copy, Download, Loader2, MessageCircle, Minus, Moon, PackageCheck, Plus, RotateCcw, Sun } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { INITIAL_CONFIG, CommentConfig, BulkMessage, Platform } from './types';
import FacebookCard from './components/FacebookCard';
import YouTubeCard from './components/YouTubeCard';
import TikTokCard from './components/TikTokCard';
import TwitterCard from './components/TwitterCard';
import InstagramCard from './components/InstagramCard';
import BubbleChatCard from './components/BubbleChatCard';
import { ControlPanel } from './components/ControlPanel';
import { PreviewCanvas } from './components/PreviewCanvas';

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
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export image. Please try again.');
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
          alert('Image copied to clipboard!');
        } catch (err) {
          console.error('Clipboard write failed', err);
          alert('Failed to copy image to clipboard.');
        }
      }
    } catch (err) {
      console.error('Copy failed', err);
      alert('Failed to copy image. Please try again.');
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
    } catch (err) {
      console.error('Bulk export failed', err);
      alert('Bulk export failed. Please try again.');
    } finally {
      setIsExportingBulk(false);
      setBulkExportIndex(-1);
    }
  }, [config.bulkMessages, config.platform, config.dmStyle]);

  const hasBulkMessages = config.bulkMessages.length > 0;
  const currentPlatform = platformOptions.find(platform => platform.value === config.platform) || platformOptions[0];

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
      default: return null;
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#f0f4f8] font-sans text-slate-950 md:flex-row">
      {/* Animated Mesh Gradient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-blob absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-300/40 mix-blend-multiply blur-3xl"></div>
        <div className="animate-blob animation-delay-2000 absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-cyan-300/40 mix-blend-multiply blur-3xl"></div>
        <div className="animate-blob animation-delay-4000 absolute bottom-[-20%] left-[20%] h-[600px] w-[600px] rounded-full bg-pink-300/40 mix-blend-multiply blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTAiIGZpbGw9IiNjYmQ1ZTEiIG9wYWNpdHk9IjAuNiIgZm9udC1zaXplPSIyIj7igKIKPC90ZXh0Pjwvc3ZnPg==')] opacity-50"></div>
      </div>

      {/* Floating Control Panel */}
      <div className="relative z-20 flex h-[54vh] w-full flex-shrink-0 flex-col p-0 md:h-full md:w-auto md:p-5">
        <ControlPanel
          config={config}
          update={update}
          handleReset={handleReset}
          handleImageUpload={handleImageUpload}
          onBulkExport={handleBulkExport}
          isExportingBulk={isExportingBulk}
        />
      </div>

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-4 pr-4 pl-4 pb-0 md:py-5 md:pr-5 md:pl-0">
        
        {/* Floating Glass Header */}
        <header className="glass-panel mb-5 flex min-h-[72px] flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3 xl:flex-nowrap">
          <div className="flex min-w-0 max-w-[calc(100%-64px)] items-center gap-3 sm:max-w-none">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[16px] bg-white text-[20px] shadow-sm">
              <span className={currentPlatform.color}>{currentPlatform.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Studio Canvas</p>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                <h1 className="font-display truncate text-base font-black tracking-tight text-slate-900">{currentPlatform.label}</h1>
                <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 sm:block" />
                <span className="hidden shrink-0 text-sm font-medium text-slate-500 sm:block">{config.width}px output</span>
              </div>
            </div>
          </div>

          <div className="order-3 flex w-full items-center overflow-x-auto rounded-[20px] bg-white/40 p-1 lg:hidden">
            {platformOptions.map(platform => (
              <button
                key={platform.value}
                type="button"
                onClick={() => update('platform', platform.value)}
                className={`flex h-10 min-w-0 shrink-0 flex-1 items-center justify-center rounded-[16px] text-[20px] transition ${
                  config.platform === platform.value
                    ? 'bg-slate-900 text-white shadow-md'
                    : `${platform.color} hover:bg-white/60`
                }`}
                title={platform.label}
              >
                {platform.icon}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-[44px] items-center gap-1 rounded-[18px] bg-white/40 p-1 md:flex">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-slate-500 transition hover:bg-white/60 hover:text-slate-900"
              >
                <Minus size={16} />
              </button>
              <span className="font-display min-w-[3rem] px-1 text-center text-sm font-black text-slate-700">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-slate-500 transition hover:bg-white/60 hover:text-slate-900"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={isCopying}
              className="glass-button hidden h-[44px] min-w-0 shrink-0 items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-bold text-slate-700 disabled:opacity-60 md:flex"
            >
              {isCopying ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Copy size={16} className="shrink-0" />}
              <span className="truncate">{isCopying ? 'Copying' : 'Copy'}</span>
            </button>

            {hasBulkMessages && (
              <button
                type="button"
                onClick={handleBulkExport}
                disabled={isExportingBulk}
                className="hidden h-[44px] min-w-0 shrink-0 items-center justify-center gap-2 rounded-[18px] bg-emerald-500/10 px-4 text-sm font-bold text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-60 xl:flex"
              >
                {isExportingBulk ? <Loader2 size={16} className="animate-spin shrink-0" /> : <PackageCheck size={16} className="shrink-0" />}
                <span className="truncate">Bulk</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="glass-button hidden h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[18px] text-slate-500 sm:flex"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="fixed right-4 top-[calc(54vh+16px)] z-50 flex h-[48px] w-[48px] shrink-0 items-center justify-center gap-2 rounded-[20px] bg-slate-900 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-indigo-600 disabled:opacity-60 sm:static sm:h-[44px] sm:w-auto sm:rounded-[18px] sm:px-4 sm:shadow-md"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Download size={16} className="shrink-0" />}
              <span className="hidden truncate sm:inline">{isExporting ? 'Exporting' : 'Export PNG'}</span>
              <ChevronDown size={16} className="hidden shrink-0 opacity-70 sm:block" />
            </button>
          </div>
        </header>

        {/* Floating Platform Dock */}
        <div className="absolute right-8 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 rounded-[28px] glass-panel p-2 lg:flex">
          {platformOptions.map(platform => (
            <button
              key={platform.value}
              type="button"
              onClick={() => update('platform', platform.value)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] text-[22px] transition ${
                config.platform === platform.value
                  ? 'bg-slate-900 text-white shadow-lg'
                  : `${platform.color} hover:bg-white/60`
              }`}
              title={platform.label}
            >
              {platform.icon}
            </button>
          ))}
        </div>

        {isExportingBulk && (
          <div className="glass-panel absolute left-1/2 top-[100px] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-slate-800 shadow-lg">
            <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0" />
            <span className="truncate">Exporting {bulkExportIndex + 1} / {config.bulkMessages.length}</span>
          </div>
        )}

        {/* Preview Canvas Area */}
        <PreviewCanvas config={config} previewRef={previewRef} zoom={zoom} hasBulkMessages={hasBulkMessages}>
          {config.platform === 'facebook' && <FacebookCard config={config} />}
          {config.platform === 'youtube' && <YouTubeCard config={config} />}
          {config.platform === 'tiktok' && <TikTokCard config={config} />}
          {config.platform === 'twitter' && <TwitterCard config={config} />}
          {config.platform === 'instagram' && <InstagramCard config={config} />}
          {config.platform === 'dm' && <BubbleChatCard config={config} />}
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
      </main>
    </div>
  );
};

export default App;
