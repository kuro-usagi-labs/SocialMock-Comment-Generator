import React, { useState } from 'react';
import { Download, Loader2, Mars, Sparkles, Trash2, Venus } from 'lucide-react';
import { CommentConfig, BulkMessage } from '../types';
import { generateVariations } from '../services/geminiService';
import { NameLocale, NameGender, createRandomProfiles } from '../utils/profileUtils';

interface BulkGeneratorProps {
  config: CommentConfig;
  update: (key: keyof CommentConfig, value: any) => void;
  onBulkExport: () => void;
  isExportingBulk: boolean;
}

const labelClass = 'font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 block';

export const BulkGenerator: React.FC<BulkGeneratorProps> = ({ config, update, onBulkExport, isExportingBulk }) => {
  const [baseText, setBaseText] = useState('apa kabar');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [tone, setTone] = useState<'casual' | 'formal' | 'slang'>('casual');
  const [nameLocale, setNameLocale] = useState<NameLocale>('id');
  const [nameGender, setNameGender] = useState<NameGender>('female');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const variations = await generateVariations({
        baseText,
        count,
        language,
        tone,
      });

      const profiles = createRandomProfiles(variations.length, nameLocale, nameGender);
      const generatedAt = Date.now();

      const bulkMessages: BulkMessage[] = variations.map((content, index) => ({
        id: `bulk-${generatedAt}-${index}`,
        content,
        ...profiles[index],
      }));

      update('bulkMessages', bulkMessages);
    } catch (err: any) {
      setError(err.message || 'Failed to generate variations');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeMessage = (id: string) => {
    update('bulkMessages', config.bulkMessages.filter(message => message.id !== id));
  };

  const clearAll = () => {
    update('bulkMessages', []);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className={labelClass}>Teks Dasar</label>
        <textarea
          value={baseText}
          onChange={(event) => setBaseText(event.target.value)}
          placeholder="contoh: apa kabar, kapan upload lagi, dll..."
          className="glass-input min-h-[82px] w-full resize-none rounded-[16px] p-3 text-sm font-bold leading-relaxed text-slate-800 placeholder:font-medium placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass} style={{ marginBottom: 0 }}>Jumlah variasi</label>
          <span className="rounded-[10px] bg-white/60 px-2.5 py-1 font-display text-xs font-black text-indigo-600 shadow-sm">{count}</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={count}
          onChange={(event) => setCount(parseInt(event.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between font-display text-[10px] font-bold text-slate-400">
          <span>1</span>
          <span>20</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className={labelClass}>Bahasa</label>
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`segmented-btn ${language === 'id' ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
            >
              Indo
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`segmented-btn ${language === 'en' ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
            >
              English
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Gaya</label>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as 'casual' | 'formal' | 'slang')}
            className="glass-input w-full rounded-[14px] p-2 text-xs font-bold text-slate-700"
          >
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="slang">Slang/Gaul</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className={labelClass}>Nama</label>
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setNameLocale('id')}
              className={`segmented-btn ${nameLocale === 'id' ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
            >
              Indo
            </button>
            <button
              type="button"
              onClick={() => setNameLocale('en')}
              className={`segmented-btn ${nameLocale === 'en' ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
            >
              English
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Gender</label>
          <div className="segmented-control w-full">
            <button
              type="button"
              onClick={() => setNameGender('female')}
              className={`segmented-btn ${nameGender === 'female' ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
              title="Cewe"
            >
              <Venus size={16} />
            </button>
            <button
              type="button"
              onClick={() => setNameGender('male')}
              className={`segmented-btn ${nameGender === 'male' ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
              title="Cowo"
            >
              <Mars size={16} />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !baseText.trim()}
        className="glass-button flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-[20px] bg-indigo-600/90 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(79,70,229,0.25)] transition hover:bg-indigo-600 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span className="truncate">Generating {count}...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} className="shrink-0" />
            <span className="truncate">Generate {count} variasi AI</span>
          </>
        )}
      </button>

      {error && (
        <div className="rounded-[16px] border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {config.bulkMessages.length > 0 && (
        <div className="glass-card space-y-3 rounded-[24px] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-600">
              {config.bulkMessages.length} Hasil
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="flex min-w-0 shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-100"
            >
              <Trash2 size={11} className="shrink-0" />
              <span className="truncate">Hapus</span>
            </button>
          </div>

          <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {config.bulkMessages.map((msg, index) => (
              <div
                key={msg.id}
                className="group flex items-start gap-2 rounded-[16px] bg-white/60 p-2.5 shadow-sm transition hover:bg-white/90"
              >
                <span className="mt-0.5 w-4 shrink-0 font-display text-[10px] font-black text-indigo-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: msg.avatarColor }}
                    >
                      {msg.avatarInitials}
                    </span>
                    <span className="truncate text-[11px] font-bold text-slate-800">
                      {msg.displayName}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{msg.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMessage(msg.id)}
                  className="shrink-0 rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onBulkExport}
            disabled={isExportingBulk}
            className="flex w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isExportingBulk ? (
              <>
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span className="truncate">Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} className="shrink-0" />
                <span className="truncate">Export ({config.bulkMessages.length})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
