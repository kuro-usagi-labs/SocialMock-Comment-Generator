import React, { useCallback, useState } from 'react';
import { Image as ImageIcon, Music, Plus, Trash2, Upload, Video, X } from 'lucide-react';
import { MotionAsset, MotionDocument } from '../types';
import { toast } from 'sonner';

interface AssetLibraryPanelProps {
  document: MotionDocument;
  onUpdateDocument: (updater: (doc: MotionDocument) => MotionDocument) => void;
  onUseAsset?: (asset: MotionAsset) => void;
}

const typeIcons: Record<MotionAsset['type'], React.ReactNode> = {
  image: <ImageIcon size={14} />,
  video: <Video size={14} />,
  audio: <Music size={14} />,
};

const typeBadgeColors: Record<MotionAsset['type'], string> = {
  image: 'bg-blue-100 text-blue-700',
  video: 'bg-purple-100 text-purple-700',
  audio: 'bg-amber-100 text-amber-700',
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AssetLibraryPanel: React.FC<AssetLibraryPanelProps> = ({
  document,
  onUpdateDocument,
  onUseAsset,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [filter, setFilter] = useState<'all' | MotionAsset['type']>('all');
  const [dragOverAsset, setDragOverAsset] = useState<string | null>(null);

  const assets = document.assets || [];
  const filteredAssets = filter === 'all' ? assets : assets.filter(a => a.type === filter);

  const handleImportFile = useCallback(async () => {
    if (!window.electronAPI?.assetImportFile) {
      toast.error('Asset import is only available in the desktop app.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await window.electronAPI.assetImportFile();
      if (result.success && result.assets && result.assets.length > 0) {
        onUpdateDocument(doc => ({
          ...doc,
          assets: [...(doc.assets || []), ...result.assets!],
          metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
        }));
        toast.success(`Imported ${result.assets.length} asset${result.assets.length > 1 ? 's' : ''}`);
      } else if (!result.canceled) {
        toast.error(result.error || 'Failed to import asset');
      }
    } catch (err) {
      toast.error('Failed to import asset');
    } finally {
      setIsImporting(false);
    }
  }, [onUpdateDocument]);

  const handleRemoveAsset = useCallback((assetId: string) => {
    onUpdateDocument(doc => ({
      ...doc,
      assets: (doc.assets || []).filter(a => a.id !== assetId),
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    }));
    toast.success('Asset removed');
  }, [onUpdateDocument]);

  const handleDragStart = useCallback((e: React.DragEvent, asset: MotionAsset) => {
    e.dataTransfer.setData('application/socialmock-asset', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
    setDragOverAsset(asset.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragOverAsset(null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
          Assets
          {assets.length > 0 && (
            <span className="ml-2 text-slate-400">({assets.length})</span>
          )}
        </h3>
        <button
          type="button"
          onClick={handleImportFile}
          disabled={isImporting}
          className="flex h-7 items-center gap-1.5 rounded-md bg-violet-600 px-2.5 text-[11px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          <Upload size={12} />
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* Filter tabs */}
      {assets.length > 0 && (
        <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
          {(['all', 'image', 'video', 'audio'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                filter === tab
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
              <ImageIcon size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">No assets yet</p>
            <p className="mt-1 text-xs text-slate-300">
              Import images, videos, or audio files
            </p>
            <button
              type="button"
              onClick={handleImportFile}
              className="mt-4 flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-6 py-3 text-sm font-bold text-slate-500 transition hover:border-violet-400 hover:text-violet-600"
            >
              <Plus size={16} />
              Import files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                draggable
                onDragStart={e => handleDragStart(e, asset)}
                onDragEnd={handleDragEnd}
                className={`group relative cursor-grab rounded-lg border bg-white transition hover:shadow-md active:cursor-grabbing ${
                  dragOverAsset === asset.id ? 'border-violet-400 shadow-md' : 'border-slate-150'
                }`}
              >
                {/* Preview */}
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-t-lg bg-slate-50">
                  {asset.type === 'image' && asset.src ? (
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : asset.type === 'video' ? (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <Video size={28} />
                      <span className="text-[10px] font-bold uppercase">Video</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <Music size={28} />
                      <span className="text-[10px] font-bold uppercase">Audio</span>
                    </div>
                  )}

                  {/* Delete button (hover) */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRemoveAsset(asset.id); }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-rose-600"
                    title="Remove asset"
                  >
                    <Trash2 size={12} />
                  </button>

                  {/* Use button (hover) */}
                  {onUseAsset && (
                    <button
                      type="button"
                      onClick={() => onUseAsset(asset)}
                      className="absolute bottom-1.5 right-1.5 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-violet-700"
                    >
                      Use
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="truncate text-xs font-bold text-slate-700">{asset.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-bold uppercase ${typeBadgeColors[asset.type]}`}>
                      {typeIcons[asset.type]}
                      {asset.type}
                    </span>
                    {asset.width && asset.height && (
                      <span className="text-[10px] text-slate-400">{asset.width}×{asset.height}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetLibraryPanel;
