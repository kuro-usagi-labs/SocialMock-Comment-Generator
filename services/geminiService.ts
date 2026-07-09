export interface GenerateVariationsParams {
  baseText: string;
  count: number;
  language: 'id' | 'en';
  tone: 'casual' | 'formal' | 'slang';
}

export interface AIError {
  message: string;
  code: 'UNAVAILABLE' | 'RATE_LIMITED' | 'INVALID_KEY' | 'NETWORK' | 'UNKNOWN';
  retryable: boolean;
}

/**
 * Generate message variations using the Gemini API.
 * The actual API call happens in the Electron main process.
 * This function handles error classification for the renderer.
 */
export async function generateVariations(params: GenerateVariationsParams): Promise<string[]> {
  if (!window.electronAPI?.generateVariations) {
    const error: AIError = {
      message: 'AI generation is only available in the desktop app.',
      code: 'UNAVAILABLE',
      retryable: false,
    };
    throw error;
  }

  try {
    return await window.electronAPI.generateVariations(params);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('429') || message.includes('rate')) {
      const error: AIError = {
        message: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
        retryable: true,
      };
      throw error;
    }

    if (message.includes('API_KEY') || message.includes('key')) {
      const error: AIError = {
        message: 'Invalid or missing API key. Check your settings.',
        code: 'INVALID_KEY',
        retryable: false,
      };
      throw error;
    }

    if (message.includes('network') || message.includes('fetch')) {
      const error: AIError = {
        message: 'Network error. Check your internet connection.',
        code: 'NETWORK',
        retryable: true,
      };
      throw error;
    }

    const error: AIError = {
      message: message || 'An unexpected error occurred.',
      code: 'UNKNOWN',
      retryable: false,
    };
    throw error;
  }
}

/**
 * Prompt templates for common comment generation tasks.
 */
export const PROMPT_TEMPLATES = {
  dmVariation: {
    label: 'DM Variations',
    description: 'Generate variations of a direct message',
    defaultParams: { count: 5, language: 'id' as const, tone: 'casual' as const },
  },
  commentReply: {
    label: 'Comment Replies',
    description: 'Generate social media comment replies',
    defaultParams: { count: 5, language: 'en' as const, tone: 'casual' as const },
  },
  testimonial: {
    label: 'Testimonials',
    description: 'Generate product testimonial variations',
    defaultParams: { count: 5, language: 'en' as const, tone: 'formal' as const },
  },
} as const;
