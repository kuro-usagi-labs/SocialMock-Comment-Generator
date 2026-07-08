export interface GenerateVariationsParams {
  baseText: string;
  count: number;
  language: 'id' | 'en';
  tone: 'casual' | 'formal' | 'slang';
}

export async function generateVariations(params: GenerateVariationsParams): Promise<string[]> {
  if (!window.electronAPI?.generateVariations) {
    throw new Error('AI generation is available in the desktop app.');
  }
  return window.electronAPI.generateVariations(params);
}
