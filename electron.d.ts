import { VideoExportFormat, CommentConfig } from './types';

interface RenderVideoOptions {
  config: CommentConfig;
  format: VideoExportFormat;
  fps: number;
  durationInFrames: number;
}

interface RenderResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
  alphaValidation?: {
    ok: boolean;
    codecName?: string;
    pixelFormat?: string;
    warning?: string;
  } | null;
}

interface RenderProgressData {
  progress: number;
  stage: string;
}

interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  renderVideo: (options: RenderVideoOptions) => Promise<RenderResult>;
  onRenderProgress: (callback: (data: RenderProgressData) => void) => () => void;
  // Legacy
  startVideoExport: () => Promise<boolean>;
  sendFrame: (frameIndex: number, dataUrl: string) => Promise<boolean>;
  finishVideo: (format?: string) => Promise<RenderResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
