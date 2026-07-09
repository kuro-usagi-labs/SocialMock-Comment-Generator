import React from 'react';
import {
  BarChart3,
  CopyPlus,
  FilePlus2,
  Folder,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Monitor,
  Plus,
  Search,
  Sparkles,
  Star,
  Type,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { MotionDocument } from '../types';
import { SavedMotionProject } from '../utils/projectStore';
import { MotionTemplate, TemplateCategory, motionTemplates, templateCategories } from '../utils/templateLibrary';

interface RecentFileEntry {
  id: string;
  title: string;
  filePath: string;
  lastOpenedAt: string;
}

interface HomeDashboardProps {
  currentDocument: MotionDocument;
  projects: SavedMotionProject[];
  recentFiles?: RecentFileEntry[];
  onCreateBlank: () => void;
  onOpenDraft: () => void;
  onOpenProject: (project: SavedMotionProject) => void;
  onOpenProjectFile?: () => void;
  onOpenRecentFile?: (filePath: string) => void;
  onDuplicateProject: (project: SavedMotionProject) => void;
  onDeleteProject: (project: SavedMotionProject) => void;
  onUseTemplate: (template: MotionTemplate) => void;
}

type HomeTab = 'drafts' | 'templates';

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
  all: <FilePlus2 size={17} />,
  social: <MessageSquare size={17} />,
  text: <Type size={17} />,
  ads: <Megaphone size={17} />,
  branding: <Star size={17} />,
  backgrounds: <ImageIcon size={17} />,
  devices: <Monitor size={17} />,
  logos: <Sparkles size={17} />,
  websites: <Globe size={17} />,
  ui: <LayoutGrid size={17} />,
  charts: <BarChart3 size={17} />,
};

const formatEditedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently edited';
  return `Last edited ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const TemplatePreview: React.FC<{ template: MotionTemplate }> = ({ template }) => {
  const { preview } = template;

  return (
    <div
      className="relative flex aspect-[1.48] w-full items-center justify-center overflow-hidden rounded-xl"
      style={{ background: preview.background }}
    >
      {template.badge && (
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm backdrop-blur-sm">
          {template.badge}
        </span>
      )}

      {preview.layout === 'card' && (
        <div className="w-[72%] rounded-lg bg-white/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full shadow-inner" style={{ backgroundColor: preview.accent }} />
            <div className="min-w-0 flex-1">
              <div className="h-3 w-28 rounded-full bg-slate-900/80" />
              <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-slate-200/80" />
          <div className="mt-2 h-3 w-[68%] rounded-full bg-slate-200/80" />
        </div>
      )}

      {preview.layout === 'headline' && (
        <div className="px-8 text-center font-display text-4xl font-black leading-none" style={{ color: preview.foreground || '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          {preview.label}
        </div>
      )}

      {preview.layout === 'chat' && (
        <div className="flex w-[76%] flex-col gap-3">
          <div className="mr-auto max-w-[78%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-lg shadow-black/10">
            {preview.label}
          </div>
          <div className="ml-auto h-10 w-[58%] rounded-2xl rounded-tr-md shadow-md" style={{ backgroundColor: preview.accent }} />
        </div>
      )}

      {preview.layout === 'poster' && (
        <div className="grid h-[72%] w-[72%] grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-lg shadow-2xl shadow-black/20">
          <div style={{ backgroundColor: preview.accent }} />
          <div className="flex items-center p-5 font-display text-2xl font-black leading-none" style={{ color: preview.foreground }}>
            {preview.label}
          </div>
        </div>
      )}

      {preview.layout === 'loop' && (
        <div className="relative flex h-[70%] w-[70%] items-center justify-center">
          <span className="absolute h-24 w-24 rotate-12 rounded-lg bg-white shadow-xl shadow-black/10" />
          <span className="absolute h-24 w-24 -rotate-12 rounded-lg shadow-md" style={{ backgroundColor: preview.accent }} />
          <span className="relative font-display text-3xl font-black" style={{ color: preview.foreground }}>
            {preview.label}
          </span>
        </div>
      )}
    </div>
  );
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentDocument,
  projects,
  recentFiles = [],
  onCreateBlank,
  onOpenDraft,
  onOpenProject,
  onOpenProjectFile,
  onOpenRecentFile,
  onDuplicateProject,
  onDeleteProject,
  onUseTemplate,
}) => {
  const [activeTab, setActiveTab] = React.useState<HomeTab>('drafts');
  const [activeCategory, setActiveCategory] = React.useState<TemplateCategory>('all');
  const [search, setSearch] = React.useState('');

  const filteredTemplates = motionTemplates.filter(template => {
    const categoryMatches = activeCategory === 'all' || template.category === activeCategory;
    const query = search.trim().toLowerCase();
    const searchMatches = !query || `${template.title} ${template.description} ${template.category}`.toLowerCase().includes(query);
    return categoryMatches && searchMatches;
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-950">
      <header className="flex items-center justify-between px-10 py-10">
        <div className="font-display text-4xl font-black tracking-tight">SocialMock</div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className="h-[60px] bg-slate-950 px-12 text-base font-black text-white transition hover:bg-violet-600"
          >
            My files
          </button>
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-blue-500 bg-white font-display text-sm font-black">
            SM
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] grid-cols-[260px_minmax(0,1fr)] gap-20 pb-16 pt-8">
        <aside className="pt-24">
          <div className="space-y-2">
            <p className="mb-3 text-sm font-black text-slate-400">Get started</p>
            <button
              type="button"
              onClick={() => setActiveTab('drafts')}
              className={`flex h-10 w-full items-center gap-3 px-7 text-left text-base font-bold transition ${
                activeTab === 'drafts' ? 'bg-violet-100 text-violet-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Folder size={18} className={activeTab === 'drafts' ? 'text-violet-600' : 'text-slate-400'} />
              Drafts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`flex h-10 w-full items-center gap-3 px-7 text-left text-base font-bold transition ${
                activeTab === 'templates' ? 'bg-violet-100 text-violet-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FilePlus2 size={18} className={activeTab === 'templates' ? 'text-violet-600' : 'text-slate-400'} />
              Templates
            </button>
          </div>

          {activeTab === 'templates' && (
            <div className="mt-9 border-r border-slate-200 pr-2">
              <label className="mb-8 flex h-11 items-center gap-3 rounded-full bg-slate-100 px-5 text-sm font-bold text-slate-500">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-500"
                  placeholder="Search"
                />
              </label>
              <div className="space-y-2">
                {templateCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex h-10 w-full items-center gap-4 px-7 text-left text-base font-bold transition ${
                      activeCategory === category.id ? 'bg-violet-100 text-violet-900' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={activeCategory === category.id ? 'text-violet-600' : 'text-violet-500'}>
                      {categoryIcons[category.id]}
                    </span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'drafts' && (
            <div className="mt-12 space-y-4 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
                  SM
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">Workspace</p>
                  <p className="text-[11px] font-medium text-slate-400">Personal</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="min-w-0">
          {activeTab === 'drafts' ? (
            <>
              <h1 className="mb-10 font-display text-5xl font-black tracking-tight text-slate-900">Drafts</h1>
              <div className="mb-12 grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={onCreateBlank}
                  className="group flex h-14 items-center justify-center gap-2.5 rounded-xl bg-slate-900 text-sm font-bold text-white transition-all hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/20"
                >
                  <Plus size={18} className="transition-transform group-hover:rotate-90" />
                  Create new file
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className="group flex h-14 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:border-violet-300 hover:text-violet-700 hover:shadow-md"
                >
                  <Layers size={18} className="text-slate-400 transition-colors group-hover:text-violet-500" />
                  Start from template
                </button>
                {onOpenProjectFile && (
                  <button
                    type="button"
                    onClick={onOpenProjectFile}
                    className="group flex h-14 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:border-violet-300 hover:text-violet-700 hover:shadow-md"
                  >
                    <FolderOpen size={18} className="text-slate-400 transition-colors group-hover:text-violet-500" />
                    Open file
                  </button>
                )}
              </div>

              {recentFiles.length > 0 && (
                <div className="mb-10">
                  <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-400">Recent files</h2>
                  <div className="space-y-2">
                    {recentFiles.slice(0, 8).map(entry => (
                      <button
                        key={entry.filePath}
                        type="button"
                        onClick={() => onOpenRecentFile?.(entry.filePath)}
                        className="group flex w-full items-center gap-4 rounded-md px-4 py-3 text-left transition hover:bg-violet-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                          <Folder size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900">{entry.title}</p>
                          <p className="truncate text-xs font-bold text-slate-400">{entry.filePath}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-slate-400">
                          {new Date(entry.lastOpenedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                {(projects.length > 0 ? projects : [{
                  id: currentDocument.id,
                  title: currentDocument.title,
                  createdAt: currentDocument.metadata.createdAt,
                  updatedAt: currentDocument.metadata.updatedAt,
                  sourceTemplateId: currentDocument.metadata.sourceTemplateId,
                  document: currentDocument,
                }]).map(project => (
                  <article
                    key={project.id}
                    className="group text-left"
                  >
                    <button
                      type="button"
                      onClick={() => projects.length > 0 ? onOpenProject(project) : onOpenDraft()}
                      className="block w-full text-left"
                    >
                      <div className="flex aspect-[1.48] items-center justify-center overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100 transition-all group-hover:border-violet-300 group-hover:shadow-lg group-hover:shadow-violet-500/10">
                        <div className="rounded-lg bg-white px-8 py-5 text-center shadow-md shadow-black/5">
                          <div className="font-display text-2xl font-black text-slate-800">SocialMock</div>
                          <div className="mt-1.5 text-xs font-bold text-slate-400">
                            {project.sourceTemplateId ? 'template draft' : 'motion draft'}
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-slate-900">{project.title}</h2>
                        <p className="text-xs text-slate-400">{formatEditedAt(project.updatedAt)}</p>
                      </div>
                      {projects.length > 0 && (
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => onDuplicateProject(project)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                            title="Duplicate file"
                            aria-label={`Duplicate ${project.title}`}
                          >
                            <CopyPlus size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProject(project)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete file"
                            aria-label={`Delete ${project.title}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                <button type="button" onClick={() => setActiveTab('templates')} className="group text-left">
                  <div className="flex aspect-[1.48] items-center justify-center overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100 transition-all group-hover:border-violet-300 group-hover:shadow-lg group-hover:shadow-violet-500/10">
                    <div className="grid grid-cols-5 gap-2">
                      {motionTemplates.slice(0, 10).map(template => (
                        <span
                          key={template.id}
                          className="h-10 w-14 rounded-md"
                          style={{ background: template.preview.background }}
                        />
                      ))}
                    </div>
                  </div>
                  <h2 className="mt-3 text-sm font-bold text-slate-900">Getting Started Templates</h2>
                  <p className="text-xs text-slate-400">Pick a template and customize it</p>
                </button>

                <button
                  type="button"
                  onClick={onCreateBlank}
                  className="flex aspect-[1.48] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-300 transition-all hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-500"
                  aria-label="Create new draft"
                >
                  <Plus size={32} />
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-14 font-display text-7xl font-black tracking-tight">Templates</h1>
              <div className="grid grid-cols-2 gap-x-6 gap-y-12">
                {filteredTemplates.map(template => (
                  <button key={template.id} type="button" onClick={() => onUseTemplate(template)} className="group text-left">
                    <div className="bg-slate-100 p-10 transition group-hover:bg-violet-50">
                      <TemplatePreview template={template} />
                    </div>
                    <h2 className="mt-4 text-xl font-black">{template.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-400">{template.description}</p>
                  </button>
                ))}
              </div>
              {filteredTemplates.length === 0 && (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-slate-300 text-sm font-black text-slate-400">
                  No templates found
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <button
        type="button"
        className="fixed bottom-7 right-7 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white shadow-xl"
        aria-label="Help"
      >
        ?
      </button>
    </div>
  );
};

export default HomeDashboard;
