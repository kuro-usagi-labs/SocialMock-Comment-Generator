import { MotionDocument } from '../types';

const PROJECT_STORE_KEY = 'socialmock.motion.projects.v1';

export interface SavedMotionProject {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  sourceTemplateId?: string;
  document: MotionDocument;
}

const cloneDocument = (document: MotionDocument): MotionDocument => {
  if (typeof structuredClone === 'function') {
    return structuredClone(document);
  }
  return JSON.parse(JSON.stringify(document)) as MotionDocument;
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const sortProjects = (projects: SavedMotionProject[]) => (
  [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
);

export const loadMotionProjects = (): SavedMotionProject[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(PROJECT_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedMotionProject[];
    if (!Array.isArray(parsed)) return [];
    return sortProjects(parsed.filter(project => project?.document?.id));
  } catch (error) {
    console.warn('Failed to load SocialMock projects', error);
    return [];
  }
};

const persistProjects = (projects: SavedMotionProject[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(sortProjects(projects)));
};

export const saveMotionProject = (document: MotionDocument): SavedMotionProject => {
  const cloned = cloneDocument(document);
  const nextProject: SavedMotionProject = {
    id: cloned.id,
    title: cloned.title,
    createdAt: cloned.metadata.createdAt,
    updatedAt: cloned.metadata.updatedAt,
    sourceTemplateId: cloned.metadata.sourceTemplateId,
    document: cloned,
  };
  const projects = loadMotionProjects();
  const nextProjects = [nextProject, ...projects.filter(project => project.id !== nextProject.id)];
  persistProjects(nextProjects);
  return nextProject;
};

export const deleteMotionProject = (projectId: string) => {
  persistProjects(loadMotionProjects().filter(project => project.id !== projectId));
};

export const renameMotionProject = (projectId: string, title: string) => {
  const now = new Date().toISOString();
  const nextProjects = loadMotionProjects().map(project => {
    if (project.id !== projectId) return project;
    return {
      ...project,
      title,
      updatedAt: now,
      document: {
        ...project.document,
        title,
        metadata: {
          ...project.document.metadata,
          updatedAt: now,
        },
      },
    };
  });
  persistProjects(nextProjects);
};

export const duplicateMotionProject = (projectId: string): SavedMotionProject | null => {
  const project = loadMotionProjects().find(item => item.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const copyId = `motion-doc-${Date.now()}`;
  const document: MotionDocument = {
    ...cloneDocument(project.document),
    id: copyId,
    title: `${project.title} Copy`,
    metadata: {
      ...project.document.metadata,
      createdAt: now,
      updatedAt: now,
    },
  };

  return saveMotionProject(document);
};
