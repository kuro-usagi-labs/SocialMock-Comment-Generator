import { useState, useCallback, useEffect, useRef } from 'react';
import { MotionDocument } from '../types';
import { saveMotionProject, loadMotionProjects, SavedMotionProject } from '../utils/projectStore';
import { wrapDocumentForSave, unwrapLoadedFile } from '../utils/fileIO';
import { createMotionDocument, getActiveSceneConfig } from '../utils/motionDocument';
import { syncBackgroundLayerFromConfig } from '../utils/backgroundLayer';
import { INITIAL_CONFIG } from '../types';
import { toast } from 'sonner';

interface RecentFile {
  id: string;
  title: string;
  filePath: string;
  lastOpenedAt: string;
}

interface UseFilePersistenceOptions {
  motionDocument: MotionDocument;
  motionDocumentRef: React.MutableRefObject<MotionDocument>;
  replaceMotionDocument: (document: MotionDocument, clearHistory?: boolean) => void;
  resetEditorRuntime: () => void;
  setWorkspaceView: (view: 'home' | 'editor') => void;
  setSavedProjects: React.Dispatch<React.SetStateAction<SavedMotionProject[]>>;
}

export function useFilePersistence({
  motionDocument,
  motionDocumentRef,
  replaceMotionDocument,
  resetEditorRuntime,
  setWorkspaceView,
  setSavedProjects,
}: UseFilePersistenceOptions) {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  const isDirtyRef = useRef(isDirty);
  const currentFilePathRef = useRef(currentFilePath);

  // Keep refs in sync
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { currentFilePathRef.current = currentFilePath; }, [currentFilePath]);

  // ── Recent files ────────────────────────────────────────────────
  const refreshRecentFiles = useCallback(async () => {
    if (!window.electronAPI?.projectGetRecent) return;
    const files = await window.electronAPI.projectGetRecent();
    if (Array.isArray(files)) setRecentFiles(files);
  }, []);

  // Load recent files on mount
  useEffect(() => {
    if (!window.electronAPI?.projectGetRecent) return;
    window.electronAPI.projectGetRecent().then(files => {
      if (Array.isArray(files)) setRecentFiles(files);
    });
  }, []);

  // ── Save ────────────────────────────────────────────────────────
  const handleSaveProject = useCallback(async () => {
    if (!window.electronAPI?.projectSave) {
      toast.error('File save is only supported in the desktop app.');
      return;
    }
    if (currentFilePathRef.current) {
      const result = await window.electronAPI.projectSave({
        filePath: currentFilePathRef.current,
        file: wrapDocumentForSave(motionDocumentRef.current),
      });
      if (result.success) {
        setIsDirty(false);
        await refreshRecentFiles();
        toast.success('Project saved');
      } else if (!result.canceled) {
        toast.error(result.error || 'Failed to save project');
      }
    } else {
      await handleSaveAsProject();
    }
  }, [refreshRecentFiles]);

  const handleSaveAsProject = useCallback(async () => {
    if (!window.electronAPI?.projectSaveAs) {
      toast.error('File save is only supported in the desktop app.');
      return;
    }
    const result = await window.electronAPI.projectSaveAs({
      file: wrapDocumentForSave(motionDocumentRef.current),
    });
    if (result.success && result.filePath) {
      setCurrentFilePath(result.filePath);
      setIsDirty(false);
      await refreshRecentFiles();
      toast.success('Project saved');
    } else if (!result.canceled) {
      toast.error(result.error || 'Failed to save project');
    }
  }, [refreshRecentFiles]);

  // ── Open ────────────────────────────────────────────────────────
  const applyOpenedFile = useCallback(async (result: {
    success: boolean;
    file?: any;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }) => {
    if (result.success && result.file && result.filePath) {
      const unwrapped = unwrapLoadedFile(result.file);
      if (unwrapped.valid && unwrapped.document) {
        setCurrentFilePath(result.filePath);
        replaceMotionDocument(unwrapped.document);
        resetEditorRuntime();
        setWorkspaceView('editor');
        setIsDirty(false);
        await refreshRecentFiles();
        toast.success(`Opened: ${unwrapped.document.title}`);
      } else {
        toast.error(unwrapped.error || 'Invalid project file');
      }
    } else if (!result.canceled) {
      toast.error(result.error || 'Failed to open file');
    }
  }, [replaceMotionDocument, resetEditorRuntime, refreshRecentFiles]);

  const handleOpenProjectFile = useCallback(async () => {
    if (!window.electronAPI?.projectOpen) {
      toast.error('File open is only supported in the desktop app.');
      return;
    }
    await applyOpenedFile(await window.electronAPI.projectOpen());
  }, [applyOpenedFile]);

  const handleOpenRecentFile = useCallback(async (filePath: string) => {
    if (!window.electronAPI?.projectOpenPath) {
      toast.error('File open is only supported in the desktop app.');
      return;
    }
    await applyOpenedFile(await window.electronAPI.projectOpenPath(filePath));
  }, [applyOpenedFile]);

  // ── Mark dirty on document change ────────────────────────────────
  useEffect(() => {
    setIsDirty(true);
  }, [motionDocument]);

  // Sync dirty state to Electron main process
  useEffect(() => {
    window.electronAPI?.projectSetDirty(isDirty);
  }, [isDirty]);

  // ── Autosave to file every 30 seconds ────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.projectAutosave) return;
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        window.electronAPI?.projectAutosave(wrapDocumentForSave(motionDocumentRef.current));
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Autosave recovery on mount ───────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.projectCheckAutosave) return;
    window.electronAPI.projectCheckAutosave().then(async (result) => {
      if (!result.hasAutosave) return;
      const shouldRecover = window.confirm(
        `An autosave from ${new Date(result.savedAt || '').toLocaleString()} was found. Restore it?`
      );
      if (shouldRecover) {
        const loadResult = await window.electronAPI.projectLoadAutosave();
        if (loadResult.success && loadResult.file) {
          const unwrapped = unwrapLoadedFile(loadResult.file);
          if (unwrapped.valid && unwrapped.document) {
            replaceMotionDocument(unwrapped.document);
            resetEditorRuntime();
            setWorkspaceView('editor');
            toast.success('Autosave restored');
          }
        }
        await window.electronAPI.projectClearAutosave();
      }
    });
  }, []);

  // ── Window close guard ───────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.onRequestSave) return;
    const cleanup = window.electronAPI.onRequestSave(async () => {
      saveMotionProject(motionDocumentRef.current);
      if (currentFilePathRef.current) {
        await window.electronAPI?.projectSave({
          filePath: currentFilePathRef.current,
          file: wrapDocumentForSave(motionDocumentRef.current),
        });
      }
      setIsDirty(false);
      setTimeout(() => window.electronAPI?.projectCloseWindow(), 100);
    });
    return cleanup;
  }, []);

  // ── Create new project helper ────────────────────────────────────
  const handleCreateNewProject = useCallback(() => {
    const document = createMotionDocument(syncBackgroundLayerFromConfig(INITIAL_CONFIG), {
      title: 'Untitled SocialMock',
    });
    saveMotionProject(document);
    replaceMotionDocument(document);
    setCurrentFilePath(null);
    setIsDirty(false);
    setSavedProjects(loadMotionProjects());
    resetEditorRuntime();
    setWorkspaceView('editor');
  }, [replaceMotionDocument, resetEditorRuntime, setSavedProjects, setWorkspaceView]);

  // ── Handle save request from main process ─────────────────────────
  const handleSaveRequest = useCallback(async () => {
    saveMotionProject(motionDocumentRef.current);
    if (currentFilePathRef.current) {
      await window.electronAPI?.projectSave({
        filePath: currentFilePathRef.current,
        file: wrapDocumentForSave(motionDocumentRef.current),
      });
    }
    setIsDirty(false);
    setTimeout(() => window.electronAPI?.projectCloseWindow(), 100);
  }, []);

  // ── Handle menu actions ──────────────────────────────────────────
  const handleMenuAction = useCallback((action: string) => {
    switch (action) {
      case 'menu:save':
        handleSaveProject();
        break;
      case 'menu:save-as':
        handleSaveAsProject();
        break;
      case 'menu:open':
        handleOpenProjectFile();
        break;
    }
  }, [handleSaveProject, handleSaveAsProject, handleOpenProjectFile]);

  return {
    // State
    currentFilePath,
    setCurrentFilePath,
    isDirty,
    setIsDirty,
    recentFiles,

    // Handlers
    handleSaveProject,
    handleSaveAsProject,
    handleOpenProjectFile,
    handleOpenRecentFile,
    handleCreateNewProject,
    handleSaveRequest,
    handleMenuAction,
    refreshRecentFiles,
    applyOpenedFile,
  };
}
