import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toBlob, toPng } from 'html-to-image';
import {
  Copy,
  Download,
  Image as ImageIcon,
  Layers,
  Loader2,
  MessageCircle,
  Minus,
  MousePointer2,
  PackageCheck,
  Palette,
  Plus,
  Redo2,
  RotateCcw,
  Square,
  Type as TextIcon,
  Undo2,
  Video,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { Toaster, toast } from 'sonner';
import { INITIAL_CONFIG, CommentConfig, BulkMessage, EditorSelection, Layer, LayerActionBlock, MotionDocument, Platform, VideoExportFormat } from './types';
import { PreviewCanvas } from './components/PreviewCanvas';
import { HomeDashboard } from './components/HomeDashboard';
import { RightInspector } from './components/RightInspector';
import { TimelineDock } from './components/TimelineDock';
import { CanvasLayerRenderer } from './components/canvas/CanvasLayerRenderer';
import { ResizeHandle } from './components/canvas/CanvasLayerFrame';
import { progressToFrame } from './utils/motionEngine';
import { usePreviewRuntime } from './utils/previewRuntime';
import { createMotionDocument, getActiveSceneConfig, updateActiveSceneConfig } from './utils/motionDocument';
import { syncBackgroundLayerFromConfig } from './utils/backgroundLayer';
import { MotionTemplate, createDocumentFromTemplate } from './utils/templateLibrary';
import { SavedMotionProject, deleteMotionProject, duplicateMotionProject, loadMotionProjects, saveMotionProject } from './utils/projectStore';
import { createActionSelection, createCanvasSelection, createLayerSelection, getPrimaryActionId, getPrimaryLayerId } from './utils/selection';

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

type AddLayerKind = 'text' | 'shape' | 'image';

interface DocumentHistoryEntry {
  document: MotionDocument;
  selection: EditorSelection;
  selectedSceneIndex: number;
  label: string;
}

interface DocumentCommandHistory {
  undoStack: DocumentHistoryEntry[];
  redoStack: DocumentHistoryEntry[];
}

const MAX_COMMAND_HISTORY = 80;
const COMMAND_MERGE_WINDOW_MS = 450;

const cloneMotionDocument = (document: MotionDocument): MotionDocument => {
  if (typeof structuredClone === 'function') return structuredClone(document);
  return JSON.parse(JSON.stringify(document)) as MotionDocument;
};

const cloneSelection = (selection: EditorSelection): EditorSelection => ({ ...selection, ids: [...selection.ids] });

const isSameMotionDocument = (a: MotionDocument, b: MotionDocument) => JSON.stringify(a) === JSON.stringify(b);

interface StudioRailButtonProps {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const StudioRailButton: React.FC<StudioRailButtonProps> = ({ active = false, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex h-12 w-12 items-center justify-center rounded-xl transition ${
      active
        ? 'bg-white text-slate-950 shadow-lg shadow-slate-950/15'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
    title={label}
    aria-label={label}
  >
    {icon}
  </button>
);

const clampReorderTarget = (currentIndex: number, targetIndex: number, length: number) => {
  const adjusted = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
  return Math.min(length - 1, Math.max(0, adjusted));
};

const createDefaultLayerActions = (layerId: string): LayerActionBlock[] => [
  {
    id: `${layerId}-in-action`,
    kind: 'in',
    name: 'Masuk',
    style: 'slide-up',
    startFrame: 0,
    durationFrames: 42,
    easingPreset: 'ease-out',
    intensity: 0.8,
  },
  {
    id: `${layerId}-out-action`,
    kind: 'out',
    name: 'Keluar',
    style: 'fade-scale',
    startFrame: 86,
    durationFrames: 34,
    easingPreset: 'ease-in',
    intensity: 1,
  },
];

const App: React.FC = () => {
  const initialTab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'animation'
    ? 'animation'
    : 'canvas';
  const [savedProjects, setSavedProjects] = useState<SavedMotionProject[]>(() => loadMotionProjects());
  const [motionDocument, setMotionDocument] = useState<MotionDocument>(() => (
    savedProjects[0]?.document ?? createMotionDocument(syncBackgroundLayerFromConfig(INITIAL_CONFIG))
  ));
  const config = getActiveSceneConfig(motionDocument);
  const [commandHistory, setCommandHistory] = useState<DocumentCommandHistory>({ undoStack: [], redoStack: [] });
  const [workspaceView, setWorkspaceView] = useState<'home' | 'editor'>('home');
  const [zoom, setZoom] = useState(1.15);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewLayerElementsRef = useRef(new Map<string, HTMLElement>());
  const bulkExportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isExportingBulk, setIsExportingBulk] = useState(false);
  const [bulkExportIndex, setBulkExportIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'canvas' | 'animation'>(initialTab);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportFormat, setVideoExportFormat] = useState<VideoExportFormat>('mp4');
  const [renderProgress, setRenderProgress] = useState<{ progress: number; stage: string }>({ progress: 0, stage: '' });
  const [selection, setSelection] = useState<EditorSelection>(() => createLayerSelection('layer-card-auto'));
  const [timelineProgress, setTimelineProgress] = useState(42);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [timelineDirection, setTimelineDirection] = useState(1);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [resizingLayerId, setResizingLayerId] = useState<string | null>(null);
  const [isCapturingPreview, setIsCapturingPreview] = useState(false);
  const motionDocumentRef = useRef(motionDocument);
  const selectionRef = useRef(selection);
  const selectedSceneIndexRef = useRef(selectedSceneIndex);
  const lastCommandRecordAtRef = useRef(0);
  const hasBulkMessages = config.bulkMessages.length > 0;
  const safeSelectedSceneIndex = hasBulkMessages ? Math.min(selectedSceneIndex, config.bulkMessages.length) : 0;
  const activeBulkMessage = safeSelectedSceneIndex > 0 ? config.bulkMessages[safeSelectedSceneIndex - 1] : undefined;
  const currentPlatform = platformOptions.find(platform => platform.value === config.platform) || platformOptions[0];
  const selectedLayerId = selection.type === 'canvas' ? 'layer-bg-auto' : getPrimaryLayerId(selection);
  const selectedActionId = getPrimaryActionId(selection);
  const canUndo = commandHistory.undoStack.length > 0;
  const canRedo = commandHistory.redoStack.length > 0;
  const nextUndoLabel = commandHistory.undoStack[commandHistory.undoStack.length - 1]?.label;
  const nextRedoLabel = commandHistory.redoStack[commandHistory.redoStack.length - 1]?.label;

  useEffect(() => {
    motionDocumentRef.current = motionDocument;
  }, [motionDocument]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    selectedSceneIndexRef.current = selectedSceneIndex;
  }, [selectedSceneIndex]);
  
  const waitForPreviewPaint = () => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const resetCommandHistory = useCallback(() => {
    lastCommandRecordAtRef.current = 0;
    setCommandHistory({ undoStack: [], redoStack: [] });
  }, []);

  const pushUndoSnapshot = useCallback((
    beforeDocument: MotionDocument,
    beforeSelection: EditorSelection,
    beforeSelectedSceneIndex: number,
    afterDocument: MotionDocument,
    label: string,
    force = false,
  ) => {
    if (isSameMotionDocument(beforeDocument, afterDocument)) return;
    const now = Date.now();
    const shouldMerge = !force && now - lastCommandRecordAtRef.current < COMMAND_MERGE_WINDOW_MS;
    lastCommandRecordAtRef.current = now;

    if (shouldMerge) {
      setCommandHistory(history => ({ ...history, redoStack: [] }));
      return;
    }

    const entry: DocumentHistoryEntry = {
      document: cloneMotionDocument(beforeDocument),
      selection: cloneSelection(beforeSelection),
      selectedSceneIndex: beforeSelectedSceneIndex,
      label,
    };

    setCommandHistory(history => ({
      undoStack: [...history.undoStack, entry].slice(-MAX_COMMAND_HISTORY),
      redoStack: [],
    }));
  }, []);

  const replaceMotionDocument = useCallback((document: MotionDocument, clearHistory = true) => {
    motionDocumentRef.current = document;
    setMotionDocument(document);
    if (clearHistory) resetCommandHistory();
  }, [resetCommandHistory]);

  const commitMotionDocument = useCallback((
    updater: MotionDocument | ((document: MotionDocument) => MotionDocument),
    options: { label?: string; record?: boolean; forceHistory?: boolean } = {},
  ) => {
    const { label = 'Edit document', record = true, forceHistory = false } = options;
    setMotionDocument(previousDocument => {
      const beforeDocument = previousDocument;
      const beforeSelection = selectionRef.current;
      const beforeSelectedSceneIndex = selectedSceneIndexRef.current;
      const nextDocument = typeof updater === 'function'
        ? updater(previousDocument)
        : updater;

      motionDocumentRef.current = nextDocument;
      if (record) {
        pushUndoSnapshot(
          beforeDocument,
          beforeSelection,
          beforeSelectedSceneIndex,
          nextDocument,
          label,
          forceHistory,
        );
      }
      return nextDocument;
    });
  }, [pushUndoSnapshot]);

  const undo = useCallback(() => {
    const entry = commandHistory.undoStack[commandHistory.undoStack.length - 1];
    if (!entry) return;

    const redoEntry: DocumentHistoryEntry = {
      document: cloneMotionDocument(motionDocumentRef.current),
      selection: cloneSelection(selectionRef.current),
      selectedSceneIndex: selectedSceneIndexRef.current,
      label: entry.label,
    };

    const nextDocument = cloneMotionDocument(entry.document);
    motionDocumentRef.current = nextDocument;
    setMotionDocument(nextDocument);
    setSelection(cloneSelection(entry.selection));
    setSelectedSceneIndex(entry.selectedSceneIndex);
    setIsTimelinePlaying(false);
    lastCommandRecordAtRef.current = 0;

    setCommandHistory({
      undoStack: commandHistory.undoStack.slice(0, -1),
      redoStack: [...commandHistory.redoStack, redoEntry],
    });
  }, [commandHistory]);

  const redo = useCallback(() => {
    const entry = commandHistory.redoStack[commandHistory.redoStack.length - 1];
    if (!entry) return;

    const undoEntry: DocumentHistoryEntry = {
      document: cloneMotionDocument(motionDocumentRef.current),
      selection: cloneSelection(selectionRef.current),
      selectedSceneIndex: selectedSceneIndexRef.current,
      label: entry.label,
    };

    const nextDocument = cloneMotionDocument(entry.document);
    motionDocumentRef.current = nextDocument;
    setMotionDocument(nextDocument);
    setSelection(cloneSelection(entry.selection));
    setSelectedSceneIndex(entry.selectedSceneIndex);
    setIsTimelinePlaying(false);
    lastCommandRecordAtRef.current = 0;

    setCommandHistory({
      undoStack: [...commandHistory.undoStack, undoEntry].slice(-MAX_COMMAND_HISTORY),
      redoStack: commandHistory.redoStack.slice(0, -1),
    });
  }, [commandHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCommandKey = event.ctrlKey || event.metaKey;
      if (!isCommandKey) return;
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isTyping && key !== 'z' && key !== 'y') return;

      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);

  const selectLayer = useCallback((layerId: string) => {
    setSelection(createLayerSelection(layerId));
  }, []);

  const selectCanvas = useCallback(() => {
    setSelection(createCanvasSelection());
  }, []);

  const selectAction = useCallback((layerId: string, actionId: string) => {
    setSelection(createActionSelection(layerId, actionId));
  }, []);

  const resetEditorRuntime = useCallback(() => {
    setActiveTab('canvas');
    selectLayer('layer-card-auto');
    setTimelineProgress(42);
    setSelectedSceneIndex(0);
    setIsTimelinePlaying(false);
    setTimelineDirection(1);
  }, [selectLayer]);

  const handleCreateBlankProject = useCallback(() => {
    const document = createMotionDocument(syncBackgroundLayerFromConfig(INITIAL_CONFIG), {
      title: 'Untitled SocialMock',
    });
    saveMotionProject(document);
    replaceMotionDocument(document);
    setSavedProjects(loadMotionProjects());
    resetEditorRuntime();
    setWorkspaceView('editor');
  }, [replaceMotionDocument, resetEditorRuntime]);

  const handleUseTemplate = useCallback((template: MotionTemplate) => {
    const document = createDocumentFromTemplate(template);
    saveMotionProject(document);
    replaceMotionDocument(document);
    setSavedProjects(loadMotionProjects());
    resetEditorRuntime();
    setWorkspaceView('editor');
    toast.success(`Template loaded: ${template.title}`);
  }, [replaceMotionDocument, resetEditorRuntime]);

  const handleOpenProject = useCallback((project: SavedMotionProject) => {
    replaceMotionDocument(project.document);
    resetEditorRuntime();
    setWorkspaceView('editor');
  }, [replaceMotionDocument, resetEditorRuntime]);

  const handleDuplicateProject = useCallback((project: SavedMotionProject) => {
    const copy = duplicateMotionProject(project.id);
    setSavedProjects(loadMotionProjects());
    if (copy) toast.success(`Duplicated ${project.title}`);
  }, []);

  const handleDeleteProject = useCallback((project: SavedMotionProject) => {
    if (!window.confirm(`Delete "${project.title}"?`)) return;
    deleteMotionProject(project.id);
    const nextProjects = loadMotionProjects();
    setSavedProjects(nextProjects);
    if (project.id === motionDocument.id && nextProjects[0]) {
      replaceMotionDocument(nextProjects[0].document);
    } else if (project.id === motionDocument.id) {
      replaceMotionDocument(createMotionDocument(syncBackgroundLayerFromConfig(INITIAL_CONFIG), {
        title: 'Untitled SocialMock',
      }));
    }
  }, [motionDocument.id, replaceMotionDocument]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all changes?')) {
      commitMotionDocument(createMotionDocument(syncBackgroundLayerFromConfig(INITIAL_CONFIG), {
        title: motionDocument.title,
      }), { label: 'Reset document', forceHistory: true });
      resetEditorRuntime();
    }
  }, [commitMotionDocument, motionDocument.title, resetEditorRuntime]);

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

  const setConfig = useCallback((
    updater: CommentConfig | ((config: CommentConfig) => CommentConfig),
    options: { label?: string; record?: boolean; forceHistory?: boolean } = {},
  ) => {
    commitMotionDocument(prev => updateActiveSceneConfig(prev, currentConfig => {
      return typeof updater === 'function'
        ? updater(currentConfig)
        : updater;
    }), options);
  }, [commitMotionDocument]);

  const update = useCallback((key: keyof CommentConfig, value: any) => {
    setConfig(prev => {
      const nextConfig = { ...prev, [key]: value };
      return key === 'backgroundType' || key === 'backgroundColor'
        ? syncBackgroundLayerFromConfig(nextConfig)
        : nextConfig;
    }, { label: `Update ${String(key)}` });
  }, [setConfig]);

  const registerPreviewLayerTarget = useCallback((layerId: string, element: HTMLElement | null) => {
    if (element) {
      previewLayerElementsRef.current.set(layerId, element);
      return;
    }
    previewLayerElementsRef.current.delete(layerId);
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<Layer>, options: { label?: string; record?: boolean; forceHistory?: boolean } = {}) => {
    setConfig(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        layers: prev.canvas.layers.map(layer =>
          layer.id === id ? ({ ...layer, ...patch } as Layer) : layer
        ),
      },
    }), { label: options.label || 'Update layer', record: options.record, forceHistory: options.forceHistory });
  }, [setConfig]);

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
    selectLayer(id);
    setDraggingLayerId(id);
    const beforeDocument = cloneMotionDocument(motionDocumentRef.current);
    const beforeSelection = cloneSelection(selectionRef.current);
    const beforeSelectedSceneIndex = selectedSceneIndexRef.current;

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
      updateLayer(id, { x: nextX, y: nextY } as Partial<Layer>, { record: false });
    };

    const handleUp = () => {
      pushUndoSnapshot(
        beforeDocument,
        beforeSelection,
        beforeSelectedSceneIndex,
        motionDocumentRef.current,
        'Move layer',
        true,
      );
      setDraggingLayerId(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

  const beginLayerResize = (id: string, handle: ResizeHandle, event: React.PointerEvent<Element>) => {
    const layer = config.canvas.layers.find(item => item.id === id);
    if (!layer || layer.id === 'layer-bg-auto' || layer.id === 'layer-card-auto') return;

    event.preventDefault();
    event.stopPropagation();
    selectLayer(id);
    setResizingLayerId(id);
    const beforeDocument = cloneMotionDocument(motionDocumentRef.current);
    const beforeSelection = cloneSelection(selectionRef.current);
    const beforeSelectedSceneIndex = selectedSceneIndexRef.current;

    const startPointerX = event.clientX;
    const startPointerY = event.clientY;
    const startX = layer.x;
    const startY = layer.y;
    const startW = layer.width;
    const startH = layer.height;
    const aspectRatio = startW / (startH || 1);
    const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
    const activeZoom = viewportWidth < 768
      ? Math.min(zoom, Math.max(0.25, (viewportWidth - 88) / config.width))
      : zoom;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startPointerX) / activeZoom;
      const dy = (moveEvent.clientY - startPointerY) / activeZoom;
      let newX = startX, newY = startY, newW = startW, newH = startH;

      switch (handle) {
        case 'nw': newX = startX + dx; newY = startY + dy; newW = startW - dx; newH = startH - dy; break;
        case 'ne': newY = startY + dy; newW = startW + dx; newH = startH - dy; break;
        case 'sw': newX = startX + dx; newW = startW - dx; newH = startH + dy; break;
        case 'se': newW = startW + dx; newH = startH + dy; break;
        case 'n': newY = startY + dy; newH = startH - dy; break;
        case 's': newH = startH + dy; break;
        case 'w': newX = startX + dx; newW = startW - dx; break;
        case 'e': newW = startW + dx; break;
      }

      // Aspect lock on Shift for corner handles
      if (moveEvent.shiftKey && ['nw', 'ne', 'sw', 'se'].includes(handle)) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx > absDy) {
          const sign = dx > 0 ? 1 : -1;
          if (handle === 'se' || handle === 'sw') { newH = startH + sign * (absDx / aspectRatio); }
          else { newH = startH - sign * (absDx / aspectRatio); }
        } else {
          const sign = dy > 0 ? 1 : -1;
          if (handle === 'se' || handle === 'ne') { newW = startW + sign * (absDy * aspectRatio); }
          else { newW = startW - sign * (absDy * aspectRatio); }
        }
      }

      // Clamp min size, revert position drift
      if (newW < 24) { newW = 24; if (handle === 'nw' || handle === 'sw' || handle === 'w') newX = startX + startW - 24; }
      if (newH < 24) { newH = 24; if (handle === 'nw' || handle === 'ne' || handle === 'n') newY = startY + startH - 24; }
      if (newX < 0) { newW = startW + startX; newX = 0; }
      if (newY < 0) { newH = startH + startY; newY = 0; }

      updateLayer(
        id,
        { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) } as Partial<Layer>,
        { record: false },
      );
    };

    const handleUp = () => {
      pushUndoSnapshot(
        beforeDocument,
        beforeSelection,
        beforeSelectedSceneIndex,
        motionDocumentRef.current,
        'Resize layer',
        true,
      );
      setResizingLayerId(null);
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

  const reorderLayer = useCallback((id: string, targetIndex: number) => {
    setConfig(prev => {
      const ordered = [...prev.canvas.layers].sort((a, b) => a.zIndex - b.zIndex);
      const bgLayer = ordered.find(layer => layer.id === 'layer-bg-auto');
      // Exclude background from reorderable set; background always index 0 at the back
      const reorderable = ordered.filter(layer => layer.id !== 'layer-bg-auto');
      const currentIndex = reorderable.findIndex(layer => layer.id === id);
      if (currentIndex === -1) return prev;
      const clampedTarget = clampReorderTarget(currentIndex, targetIndex, reorderable.length);
      if (clampedTarget === currentIndex) return prev;
      const [moved] = reorderable.splice(currentIndex, 1);
      reorderable.splice(clampedTarget, 0, moved);
      const merged = bgLayer ? [bgLayer, ...reorderable] : reorderable;
      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          layers: merged.map((layer, index) => ({ ...layer, zIndex: index * 10 } as Layer)),
        },
      };
    });
  }, []);

  const addCanvasLayer = useCallback((kind: AddLayerKind) => {
    const id = `layer-${kind}-${Date.now()}`;

    setConfig(prev => {
      const zIndex = Math.max(...prev.canvas.layers.map(layer => layer.zIndex), 0) + 10;
      const base = {
        id,
        visible: true,
        zIndex,
        x: 140,
        y: 140,
        rotation: 0,
        opacity: 1,
        delayFrames: 0,
        staggerFrames: 0,
        motionBlur: false,
        actionBlocks: createDefaultLayerActions(id),
      };

      let layer: Layer;
      if (kind === 'text') {
        layer = {
          ...base,
          type: 'text',
          name: 'Text Layer',
          width: Math.min(520, Math.max(260, prev.width - 160)),
          height: 140,
          text: 'New text layer',
          textFont: 'outfit',
          textWeight: 'black',
          textAlign: 'center',
          textColor: '#0f172a',
          textStrokeColor: '#ffffff',
          textStrokeWidth: 0,
          textShadow: false,
          textTemplate: 'minimal',
          textSize: 34,
          textLetterSpacing: 0,
          textLineHeight: 110,
          backgroundColor: 'rgba(255,255,255,0.86)',
          paddingX: 18,
          paddingY: 12,
          borderRadius: 18,
        } as Layer;
      } else if (kind === 'shape') {
        layer = {
          ...base,
          type: 'shape',
          name: 'Shape Layer',
          width: 220,
          height: 120,
          shapeKind: 'rectangle',
          fillColor: '#6366f1',
          strokeColor: '#312e81',
          strokeWidth: 0,
          borderRadius: 28,
          lineOrientation: 'horizontal',
        } as Layer;
      } else {
        layer = {
          ...base,
          type: 'image',
          name: 'Image Layer',
          width: 260,
          height: 180,
          src: null,
          fitMode: 'cover',
          blur: 0,
          brightness: 100,
          grayscale: 0,
        } as Layer;
      }

      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          layers: [...prev.canvas.layers, layer],
        },
      };
    });

    selectLayer(id);
    setActiveTab('canvas');
  }, []);

  const duplicateLayer = useCallback((id: string) => {
    const nextId = `${id}-copy-${Date.now()}`;
    setConfig(prev => {
      const source = prev.canvas.layers.find(layer => layer.id === id);
      if (!source || source.type === 'background') return prev;
      const zIndex = Math.max(...prev.canvas.layers.map(layer => layer.zIndex), 0) + 10;
      const clone = {
        ...source,
        id: nextId,
        name: `${source.name} Copy`,
        x: source.x + 24,
        y: source.y + 24,
        zIndex,
        actionBlocks: source.actionBlocks?.map(action => ({
          ...action,
          id: `${nextId}-${action.kind}-action`,
        })) ?? createDefaultLayerActions(nextId),
      } as Layer;

      return {
        ...prev,
        canvas: {
          ...prev.canvas,
          layers: [...prev.canvas.layers, clone],
        },
      };
    });
    selectLayer(nextId);
  }, []);

  const deleteLayer = useCallback((id: string) => {
    if (['layer-bg-auto', 'layer-card-auto', 'layer-overlay-auto'].includes(id)) {
      toast.error('Default layer cannot be deleted.');
      return;
    }

    setConfig(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        layers: prev.canvas.layers.filter(layer => layer.id !== id),
      },
    }));
    selectLayer('layer-card-auto');
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

  const layerVisible = (id: string) => config.canvas.layers.find(layer => layer.id === id)?.visible !== false;
  const isBackgroundVisible = layerVisible('layer-bg-auto');

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

  const activeConfig = useMemo(() => applyBulkMessageToConfig(activeBulkMessage), [config, activeBulkMessage]);

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
    saveMotionProject(motionDocument);
    setSavedProjects(loadMotionProjects());
  }, [motionDocument]);

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
          config: activeConfig,
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
  }, [config, activeConfig]);

  const showSelectionChrome = !isCapturingPreview;
  const previewFrame = progressToFrame(timelineProgress, config.animationDuration || 2, 60);
  const previewLayerTargets = useMemo(() => config.canvas.layers
    .filter(layer => layer.type !== 'background')
    .map(layer => ({
      layerId: layer.id,
      getElement: () => previewLayerElementsRef.current.get(layer.id) ?? null,
      transformMode: layer.id === 'layer-overlay-auto' ? 'motion-only' as const : 'composed' as const,
    })), [config.canvas.layers]);
  const pausedIds = useMemo<ReadonlySet<string>>(() => {
    const ids = new Set<string>();
    if (draggingLayerId) ids.add(draggingLayerId);
    if (resizingLayerId) ids.add(resizingLayerId);
    return ids;
  }, [draggingLayerId, resizingLayerId]);
  const motionContext = {
    frame: previewFrame,
    fps: 60,
    durationInFrames: Math.max(60, Math.round((config.animationDuration || 2) * 60)),
    config,
    pausedLayerIds: pausedIds,
  };
  const previewConfig: CommentConfig = activeConfig;

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
    pausedLayerIds: pausedIds,
    setProgress: setTimelineProgress,
    setIsPlaying: setIsTimelinePlaying,
    setDirection: setTimelineDirection,
  });

  const updateActiveSceneMessage = useCallback((patch: Partial<BulkMessage>) => {
    if (safeSelectedSceneIndex <= 0) return;
    updateBulkMessage(safeSelectedSceneIndex - 1, patch);
  }, [safeSelectedSceneIndex, updateBulkMessage]);

  if (workspaceView === 'home') {
    return (
      <>
        <Toaster position="bottom-center" toastOptions={{ className: 'font-sans' }} />
        <HomeDashboard
          currentDocument={motionDocument}
          projects={savedProjects}
          onCreateBlank={handleCreateBlankProject}
          onOpenDraft={() => setWorkspaceView('editor')}
          onOpenProject={handleOpenProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onUseTemplate={handleUseTemplate}
        />
      </>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-100 font-sans text-slate-950 md:flex-row">
      <Toaster position="bottom-center" toastOptions={{ className: 'font-sans' }} />

      <aside className="relative z-20 hidden h-full w-[72px] shrink-0 flex-col items-center border-r border-slate-800 bg-slate-950 px-2 py-3 md:flex">
        <button
          type="button"
          onClick={() => setWorkspaceView('home')}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-display text-sm font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:bg-violet-100"
          title="Back to files"
          aria-label="Back to files"
        >
          SM
        </button>
        <div className="mt-6 flex flex-col items-center gap-2">
          <StudioRailButton
            active={activeTab === 'canvas' && selectedLayerId !== 'layer-bg-auto'}
            icon={<MousePointer2 size={18} />}
            label="Select"
            onClick={() => setActiveTab('canvas')}
          />
          <StudioRailButton
            active={selectedLayerId === 'layer-card-auto'}
            icon={<MessageCircle size={18} />}
            label="Card"
            onClick={() => {
              setActiveTab('canvas');
              selectLayer('layer-card-auto');
            }}
          />
          <StudioRailButton
            active={selectedLayerId === 'layer-bg-auto'}
            icon={<Palette size={18} />}
            label="Background"
            onClick={() => {
              setActiveTab('canvas');
              selectLayer('layer-bg-auto');
            }}
          />
          <div className="my-2 h-px w-9 bg-slate-800" />
          <StudioRailButton
            icon={<TextIcon size={18} />}
            label="Add text"
            onClick={() => addCanvasLayer('text')}
          />
          <StudioRailButton
            icon={<Square size={18} />}
            label="Add shape"
            onClick={() => addCanvasLayer('shape')}
          />
          <StudioRailButton
            icon={<ImageIcon size={18} />}
            label="Add image"
            onClick={() => addCanvasLayer('image')}
          />
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <StudioRailButton
            active={activeTab === 'animation'}
            icon={<Video size={18} />}
            label="Animate"
            onClick={() => setActiveTab('animation')}
          />
          <StudioRailButton
            icon={<Layers size={18} />}
            label="Layers"
            onClick={() => {
              setActiveTab('canvas');
              selectLayer(selectedLayerId || 'layer-card-auto');
            }}
          />
        </div>
      </aside>

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        
        <header className="flex min-h-[64px] flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4">
          <div className="flex min-w-[180px] items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[19px]">
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

          <div className="order-3 flex w-full justify-center lg:order-none lg:w-auto">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('canvas')}
                className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold transition-all ${
                  activeTab === 'canvas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ImageIcon size={16} />
                <span className="hidden sm:inline">Design</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('animation')}
                className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold transition-all ${
                  activeTab === 'animation' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Video size={16} />
                <span className="hidden sm:inline">Animate</span>
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">

            <div className="hidden h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 md:flex">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
                title={nextUndoLabel ? `Undo ${nextUndoLabel}` : 'Undo'}
                aria-label="Undo"
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
                title={nextRedoLabel ? `Redo ${nextRedoLabel}` : 'Redo'}
                aria-label="Redo"
              >
                <Redo2 size={16} />
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
              onCanvasSelect={selectCanvas}
            >
              <CanvasLayerRenderer
                config={config}
                activeConfig={activeConfig}
                activeBulkMessage={activeBulkMessage}
                layers={config.canvas.layers}
                selectedLayerId={selectedLayerId}
                setSelectedLayerId={selectLayer}
                draggingLayerId={draggingLayerId}
                showSelectionChrome={showSelectionChrome}
                motionContext={motionContext}
                registerLayerTarget={registerPreviewLayerTarget}
                beginLayerDrag={beginLayerDrag}
                beginLayerResize={beginLayerResize}
              />
            </PreviewCanvas>
          </section>

          <RightInspector
            config={config}
            update={update}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            platformOptions={platformOptions}
            hasBulkMessages={hasBulkMessages}
            onAvatarUpload={handleImageUpload}
            onBulkExport={handleBulkExport}
            onExportPng={handleExport}
            onExportVideo={handleExportVideo}
            isExportingBulk={isExportingBulk}
            isExportingVideo={isExportingVideo}
            activeConfig={activeConfig}
            selectedSceneIndex={safeSelectedSceneIndex}
            setSelectedSceneIndex={setSelectedSceneIndex}
            sceneMessages={config.bulkMessages}
            updateActiveSceneMessage={updateActiveSceneMessage}
            duplicateActiveScene={duplicateActiveScene}
            deleteActiveScene={deleteActiveScene}
            selectedLayerId={selectedLayerId}
            selectedActionId={selectedActionId}
            setSelectedLayerId={selectLayer}
            selectAction={selectAction}
            setTimelineProgress={setPreviewProgress}
            updateLayer={updateLayer}
            reorderLayer={reorderLayer}
            resetLayerTransform={resetLayerTransform}
            addLayer={addCanvasLayer}
            duplicateLayer={duplicateLayer}
            deleteLayer={deleteLayer}
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
          selectedActionId={selectedActionId}
          setSelectedLayerId={selectLayer}
          selectAction={selectAction}
          updateLayer={updateLayer}
          reorderLayer={reorderLayer}
          selectedSceneIndex={safeSelectedSceneIndex}
          setSelectedSceneIndex={setSelectedSceneIndex}
        />

        {isExportingBulk && bulkExportIndex >= 0 && (
          <div
            className="fixed"
            style={{ left: '-9999px', top: '-9999px' }}
          >
            <div ref={bulkExportRef} style={{ width: config.width }}>
              <CanvasLayerRenderer
                config={config}
                activeConfig={applyBulkMessageToConfig(config.bulkMessages[bulkExportIndex])}
                activeBulkMessage={config.bulkMessages[bulkExportIndex]}
                layers={config.canvas.layers}
                selectedLayerId={selectedLayerId}
                setSelectedLayerId={selectLayer}
                draggingLayerId={null}
                showSelectionChrome={false}
                motionContext={motionContext}
                registerLayerTarget={() => undefined}
                beginLayerDrag={() => undefined}
                forExport
              />
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
