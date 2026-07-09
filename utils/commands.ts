import { MotionDocument, EditorSelection } from '../types';
import { updateActiveSceneConfig } from './motionDocument';

// ---------------------------------------------------------------
// Command System v2 — Granular undo/redo commands
// ---------------------------------------------------------------

export interface EditorCommand {
  /** Human-readable label shown in undo/redo tooltip */
  label: string;
  /** Execute the command, returns the new document */
  execute(document: MotionDocument): MotionDocument;
  /** Undo the command, returns the previous document */
  undo(document: MotionDocument): MotionDocument;
  /** Selection to restore when this command is undone/redone */
  selectionAfter?: EditorSelection;
  /** Whether this command can be merged with the next command (for typing/slider) */
  mergeable?: boolean;
}

// ── Layer Commands ─────────────────────────────────────────────

export class AddLayerCommand implements EditorCommand {
  label: string;
  private layer: MotionDocument['scenes'][0]['config']['canvas']['layers'][0];
  private sceneId: string;
  selectionAfter?: EditorSelection;

  constructor(
    layer: MotionDocument['scenes'][0]['config']['canvas']['layers'][0],
    sceneId: string,
    selectionAfter?: EditorSelection,
  ) {
    this.label = `Add layer: ${layer.name}`;
    this.layer = layer;
    this.sceneId = sceneId;
    this.selectionAfter = selectionAfter;
  }

  execute(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene =>
        scene.id === this.sceneId
          ? {
              ...scene,
              config: {
                ...scene.config,
                canvas: {
                  ...scene.config.canvas,
                  layers: [...scene.config.canvas.layers, this.layer],
                },
              },
            }
          : scene
      ),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene =>
        scene.id === this.sceneId
          ? {
              ...scene,
              config: {
                ...scene.config,
                canvas: {
                  ...scene.config.canvas,
                  layers: scene.config.canvas.layers.filter(l => l.id !== this.layer.id),
                },
              },
            }
          : scene
      ),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

export class DeleteLayerCommand implements EditorCommand {
  label: string;
  private layerId: string;
  private sceneId: string;
  private removedLayer: MotionDocument['scenes'][0]['config']['canvas']['layers'][0] | null = null;
  private removedIndex: number = -1;
  selectionAfter?: EditorSelection;

  constructor(layerId: string, sceneId: string, layerName?: string, selectionAfter?: EditorSelection) {
    this.label = `Delete layer${layerName ? `: ${layerName}` : ''}`;
    this.layerId = layerId;
    this.sceneId = sceneId;
    this.selectionAfter = selectionAfter;
  }

  execute(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        const idx = scene.config.canvas.layers.findIndex(l => l.id === this.layerId);
        if (idx >= 0) {
          this.removedLayer = scene.config.canvas.layers[idx];
          this.removedIndex = idx;
        }
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.filter(l => l.id !== this.layerId),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    if (!this.removedLayer || this.removedIndex < 0) return document;
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        const layers = [...scene.config.canvas.layers];
        layers.splice(this.removedIndex, 0, this.removedLayer!);
        return {
          ...scene,
          config: { ...scene.config, canvas: { ...scene.config.canvas, layers } },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

export class UpdateLayerCommand implements EditorCommand {
  label: string;
  private layerId: string;
  private sceneId: string;
  private patch: Record<string, unknown>;
  private previousPatch: Record<string, unknown> | null = null;
  mergeable: boolean;
  selectionAfter?: EditorSelection;

  constructor(
    layerId: string,
    sceneId: string,
    patch: Record<string, unknown>,
    label?: string,
    mergeable = false,
    selectionAfter?: EditorSelection,
  ) {
    this.label = label ?? `Update layer`;
    this.layerId = layerId;
    this.sceneId = sceneId;
    this.patch = patch;
    this.mergeable = mergeable;
    this.selectionAfter = selectionAfter;
  }

  execute(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                // Save previous values for undo
                if (!this.previousPatch) {
                  this.previousPatch = {};
                  for (const key of Object.keys(this.patch)) {
                    (this.previousPatch as Record<string, unknown>)[key] = (layer as unknown as Record<string, unknown>)[key];
                  }
                }
                return { ...layer, ...this.patch } as MotionDocument['scenes'][0]['config']['canvas']['layers'][0];
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    if (!this.previousPatch) return document;
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                return { ...layer, ...this.previousPatch } as typeof layer;
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

export class ReorderLayerCommand implements EditorCommand {
  label: string;
  private sceneId: string;
  private layerId: string;
  private fromIndex: number;
  private toIndex: number;
  selectionAfter?: EditorSelection;

  constructor(sceneId: string, layerId: string, fromIndex: number, toIndex: number) {
    this.label = 'Reorder layer';
    this.sceneId = sceneId;
    this.layerId = layerId;
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  }

  execute(document: MotionDocument): MotionDocument {
    return this.reorder(document, this.fromIndex, this.toIndex);
  }

  undo(document: MotionDocument): MotionDocument {
    return this.reorder(document, this.toIndex, this.fromIndex);
  }

  private reorder(document: MotionDocument, from: number, to: number): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        const layers = [...scene.config.canvas.layers];
        const [moved] = layers.splice(from, 1);
        layers.splice(to, 0, moved);
        return {
          ...scene,
          config: { ...scene.config, canvas: { ...scene.config.canvas, layers } },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

// ── Action Commands ────────────────────────────────────────────

export class AddActionCommand implements EditorCommand {
  label: string;
  private sceneId: string;
  private layerId: string;
  private action: MotionDocument['scenes'][0]['config']['canvas']['layers'][0]['actionBlocks'][0];
  selectionAfter?: EditorSelection;

  constructor(
    sceneId: string,
    layerId: string,
    action: MotionDocument['scenes'][0]['config']['canvas']['layers'][0]['actionBlocks'][0],
    selectionAfter?: EditorSelection,
  ) {
    this.label = `Add action: ${action.name}`;
    this.sceneId = sceneId;
    this.layerId = layerId;
    this.action = action;
    this.selectionAfter = selectionAfter;
  }

  execute(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                return {
                  ...layer,
                  actionBlocks: [...(layer.actionBlocks ?? []), this.action],
                };
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                return {
                  ...layer,
                  actionBlocks: (layer.actionBlocks ?? []).filter(a => a.id !== this.action.id),
                };
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

export class UpdateActionCommand implements EditorCommand {
  label: string;
  private sceneId: string;
  private layerId: string;
  private actionId: string;
  private patch: Record<string, unknown>;
  private previousPatch: Record<string, unknown> | null = null;
  mergeable: boolean;
  selectionAfter?: EditorSelection;

  constructor(
    sceneId: string,
    layerId: string,
    actionId: string,
    patch: Record<string, unknown>,
    label?: string,
    mergeable = false,
  ) {
    this.label = label ?? 'Update action';
    this.sceneId = sceneId;
    this.layerId = layerId;
    this.actionId = actionId;
    this.patch = patch;
    this.mergeable = mergeable;
  }

  execute(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                return {
                  ...layer,
                  actionBlocks: (layer.actionBlocks ?? []).map(action => {
                    if (action.id !== this.actionId) return action;
                    if (!this.previousPatch) {
                      this.previousPatch = {};
                      for (const key of Object.keys(this.patch)) {
                        (this.previousPatch as Record<string, unknown>)[key] = (action as unknown as Record<string, unknown>)[key];
                      }
                    }
                    return { ...action, ...this.patch } as typeof action;
                  }),
                };
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    if (!this.previousPatch) return document;
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                return {
                  ...layer,
                  actionBlocks: (layer.actionBlocks ?? []).map(action => {
                    if (action.id !== this.actionId) return action;
                    return { ...action, ...this.previousPatch } as typeof action;
                  }),
                };
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

export class DeleteActionCommand implements EditorCommand {
  label: string;
  private sceneId: string;
  private layerId: string;
  private actionId: string;
  private removedAction: MotionDocument['scenes'][0]['config']['canvas']['layers'][0]['actionBlocks'][0] | null = null;
  private removedIndex: number = -1;
  selectionAfter?: EditorSelection;

  constructor(sceneId: string, layerId: string, actionId: string, actionName?: string) {
    this.label = `Delete action${actionName ? `: ${actionName}` : ''}`;
    this.sceneId = sceneId;
    this.layerId = layerId;
    this.actionId = actionId;
  }

  execute(document: MotionDocument): MotionDocument {
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                const idx = (layer.actionBlocks ?? []).findIndex(a => a.id === this.actionId);
                if (idx >= 0) {
                  this.removedAction = layer.actionBlocks![idx];
                  this.removedIndex = idx;
                }
                return {
                  ...layer,
                  actionBlocks: (layer.actionBlocks ?? []).filter(a => a.id !== this.actionId),
                };
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    if (!this.removedAction || this.removedIndex < 0) return document;
    return {
      ...document,
      scenes: document.scenes.map(scene => {
        if (scene.id !== this.sceneId) return scene;
        return {
          ...scene,
          config: {
            ...scene.config,
            canvas: {
              ...scene.config.canvas,
              layers: scene.config.canvas.layers.map(layer => {
                if (layer.id !== this.layerId) return layer;
                const actions = [...(layer.actionBlocks ?? [])];
                actions.splice(this.removedIndex, 0, this.removedAction!);
                return { ...layer, actionBlocks: actions };
              }),
            },
          },
        };
      }),
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

// ── Document Settings Command ──────────────────────────────────

export class UpdateDocumentSettingsCommand implements EditorCommand {
  label: string;
  private patch: Partial<MotionDocument['settings']>;
  private previousPatch: Partial<MotionDocument['settings']> | null = null;
  selectionAfter?: EditorSelection;

  constructor(patch: Partial<MotionDocument['settings']>, label?: string) {
    this.label = label ?? 'Update settings';
    this.patch = patch;
  }

  execute(document: MotionDocument): MotionDocument {
    if (!this.previousPatch) {
      this.previousPatch = {};
      for (const key of Object.keys(this.patch) as Array<keyof MotionDocument['settings']>) {
        (this.previousPatch as Record<string, unknown>)[key] = document.settings[key];
      }
    }
    return {
      ...document,
      settings: { ...document.settings, ...this.patch },
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(document: MotionDocument): MotionDocument {
    if (!this.previousPatch) return document;
    return {
      ...document,
      settings: { ...document.settings, ...this.previousPatch },
      metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

// ── Batch Command (for presets that change multiple fields) ────

export class BatchCommand implements EditorCommand {
  label: string;
  private commands: EditorCommand[];
  selectionAfter?: EditorSelection;

  constructor(label: string, commands: EditorCommand[], selectionAfter?: EditorSelection) {
    this.label = label;
    this.commands = commands;
    this.selectionAfter = selectionAfter;
  }

  execute(document: MotionDocument): MotionDocument {
    let doc = document;
    for (const cmd of this.commands) {
      doc = cmd.execute(doc);
    }
    return doc;
  }

  undo(document: MotionDocument): MotionDocument {
    let doc = document;
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      doc = this.commands[i].undo(doc);
    }
    return doc;
  }
}
