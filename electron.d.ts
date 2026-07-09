import { VideoExportFormat, CommentConfig, SocialMockFile, MotionAsset } from './types';
import { GenerateVariationsParams } from './services/geminiService';

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

interface ProjectOpenResult {
  success: boolean;
  file?: SocialMockFile;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

interface ProjectSaveResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

interface RecentFileEntry {
  id: string;
  title: string;
  filePath: string;
  lastOpenedAt: string;
}

interface AutosaveCheckResult {
  hasAutosave: boolean;
  savedAt?: string;
  documentId?: string;
}

interface AutosaveLoadResult {
  success: boolean;
  file?: SocialMockFile;
  error?: string;
}

interface AssetImportResult {
  success: boolean;
  assets?: MotionAsset[];
  canceled?: boolean;
  error?: string;
}

interface AssetReadResult {
  success: boolean;
  dataUrl?: string;
  mimeType?: string;
  error?: string;
}

interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  renderVideo: (options: RenderVideoOptions) => Promise<RenderResult>;
  onRenderProgress: (callback: (data: RenderProgressData) => void) => () => void;
  generateVariations: (params: GenerateVariationsParams) => Promise<string[]>;
  // Project File Persistence
  projectOpen: () => Promise<ProjectOpenResult>;
  projectOpenPath: (filePath: string) => Promise<ProjectOpenResult>;
  projectSave: (data: { filePath: string; file: SocialMockFile }) => Promise<ProjectSaveResult>;
  projectSaveAs: (data: { file: SocialMockFile }) => Promise<ProjectSaveResult>;
  projectGetRecent: () => Promise<RecentFileEntry[]>;
  projectSetDirty: (isDirty: boolean) => Promise<{ success: boolean }>;
  projectAutosave: (data: SocialMockFile) => Promise<{ success: boolean; path?: string; error?: string }>;
  projectCheckAutosave: () => Promise<AutosaveCheckResult>;
  projectLoadAutosave: () => Promise<AutosaveLoadResult>;
  projectClearAutosave: () => Promise<{ success: boolean; error?: string }>;
  projectCloseWindow: () => Promise<void>;
  onRequestSave: (callback: () => void) => () => void;
  onMenuAction: (callback: (action: string) => void) => () => void;
  // Asset Manager
  assetImportFile: () => Promise<AssetImportResult>;
  assetReadFileAsDataUrl: (filePath: string) => Promise<AssetReadResult>;
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
