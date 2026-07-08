import { EditorSelection } from '../types';

export const createCanvasSelection = (): EditorSelection => ({
  type: 'canvas',
  ids: [],
});

export const createSceneSelection = (sceneId: string): EditorSelection => ({
  type: 'scene',
  ids: [sceneId],
  sceneId,
});

export const createLayerSelection = (layerId: string): EditorSelection => ({
  type: 'layer',
  ids: [layerId],
  layerId,
});

export const createActionSelection = (layerId: string, actionId: string): EditorSelection => ({
  type: 'action',
  ids: [actionId],
  layerId,
});

export const getPrimaryLayerId = (selection: EditorSelection, fallbackLayerId = 'layer-card-auto') => {
  if (selection.type === 'action' && selection.layerId) return selection.layerId;
  if (selection.type === 'layer' && selection.ids[0]) return selection.ids[0];
  return fallbackLayerId;
};

export const getPrimaryActionId = (selection: EditorSelection) => {
  return selection.type === 'action' ? selection.ids[0] ?? null : null;
};
