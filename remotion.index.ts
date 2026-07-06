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

registerRoot(RemotionRoot);
