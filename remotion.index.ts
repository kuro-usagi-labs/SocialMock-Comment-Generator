/**
 * Remotion entry point for server-side rendering.
 * 
 * This file is bundled by @remotion/bundler (webpack) separately from the
 * main Vite app. It imports the pre-compiled Tailwind CSS from the Vite
 * build output so all card component styles are available during rendering.
 */
import './remotion-styles.css';
import { registerRoot } from 'remotion';
import { RemotionRoot } from './RemotionRoot';

// Force transparent background for alpha-channel video export (MOV/ProRes 4444).
// The compiled Vite CSS sets body { background-color: #e8edf4 } which makes
// the page opaque. We must override it here since this entry point is only
// used by Remotion's headless renderer, not the main Electron app.
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root, #remotion-canvas, #container, div[data-remotion-canvas] {
      background: transparent !important;
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

registerRoot(RemotionRoot);
