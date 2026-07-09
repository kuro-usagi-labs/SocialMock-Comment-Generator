# SocialMock Comment Generator

SocialMock Comment Generator adalah desktop motion editor berbasis React, Electron, dan Remotion untuk membuat mockup komentar, tweet, DM, social proof, title card, dan konten animasi pendek. Aplikasi ini dikembangkan menuju workflow seperti Jitter.video: mulai dari dashboard project/template, edit layer di canvas, atur motion di timeline, lalu export ke gambar atau video.

> Status: desktop beta / active development. Fitur inti editor sudah berjalan, tetapi beberapa area seperti file workflow, timeline, export, dan UI polish masih terus dikembangkan.

## Highlights

- Dashboard project dengan Drafts, Templates, dan Recent Files.
- Editor canvas multi-layer untuk card, text, shape, image, dan background.
- Contextual inspector untuk Design dan Animate.
- Timeline dock dengan action blocks.
- Action Engine v2 berbasis property motion: `opacity`, `x`, `y`, `scale`, `rotate`, dan `blur`.
- Keyframe/property track foundation untuk motion editing lanjutan.
- Undo/redo command system.
- Template gallery berbasis `MotionDocument`.
- Real file persistence Electron dengan format `.socialmock`.
- Autosave dan recovery flow.
- Asset manager dasar untuk image/video/audio.
- Export PNG dan video melalui Electron + Remotion.
- Gemini-powered AI variations lewat Electron main process.
- Playwright smoke tests.
- Build Windows installer dan portable `.exe`.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Desktop:** Electron 35, Electron Builder
- **Motion/export:** Remotion, ffmpeg-static
- **Styling:** Tailwind CSS v4, custom CSS tokens
- **Icons:** lucide-react, react-icons
- **Testing:** Playwright
- **AI:** Gemini API via Electron main process

## Project Structure

```text
.
|-- App.tsx                     # Main renderer app and editor orchestration
|-- electron.cjs                # Electron main process, menus, IPC, file/export handlers
|-- preload.cjs                 # Safe bridge between renderer and Electron APIs
|-- RemotionRoot.tsx            # Remotion composition root
|-- components/                 # UI panels, dashboard, timeline, canvas, remotion components
|-- services/                   # Renderer-side service wrappers
|-- tests/                      # Playwright smoke tests
|-- utils/                      # Motion engine, document/file IO, assets, commands, templates
|-- DEVELOPMENT_ROADMAP.md      # Long-term product and engineering roadmap
|-- DEVELOPMENT_REPORT.md       # Implementation report / milestone summary
|-- NEXT_PHASE_PLAN.md          # Short-term UI/UX improvement plan
|-- package.json
`-- vite.config.ts
```

## Getting Started

### Requirements

- Node.js 20+ recommended
- npm
- Windows is the primary packaging target at the moment

### Install

```bash
npm install
```

### Environment

Gemini AI variations require a local API key. Create `.env` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

`.env` is ignored by Git. Do not commit real API keys.

## Development

Run the web renderer through Vite:

```bash
npm run dev
```

Default dev server:

```text
http://localhost:3000
```

Run the Electron app in development mode:

```bash
npm run electron:dev
```

This builds the Vite renderer first, then launches Electron.

## Build

Build only the web renderer:

```bash
npm run build
```

Build Windows installer and portable executable:

```bash
npm run electron:build
```

Build output is written to `release/`:

```text
release/
|-- SocialMock Comment Generator Setup 1.0.0.exe
|-- SocialMock Comment Generator Portable 1.0.0.exe
`-- win-unpacked/
    `-- SocialMock Comment Generator.exe
```

`release/` is ignored by Git.

## Testing

Typecheck:

```bash
npm run typecheck
```

Run all Playwright tests:

```bash
npm test
```

Run smoke tests only:

```bash
npm run test:smoke
```

The smoke suite currently verifies the dashboard, template entry, project creation, editor shell, timeline presence, and platform UI.

## File Format

SocialMock desktop projects use a `.socialmock` JSON envelope:

```ts
{
  schemaVersion: number;
  document: MotionDocument;
  _meta: {
    savedAt: string;
    appVersion: string;
    platform: "web" | "main" | string;
  };
}
```

The app includes validation and migration helpers so older document schemas can be upgraded safely.

## Core Concepts

### MotionDocument

`MotionDocument` is the central project model. It owns scenes, timeline settings, export settings, assets, metadata, and the active scene.

### Layer Model

The editor supports multiple layer types:

- Background
- Card
- Text
- Shape
- Image

Layer defaults, validation, summaries, rendering, and inspector behavior are being moved toward a registry-based model.

### Action Engine

Actions describe motion on a layer. Current action properties include:

- Opacity
- X / Y position
- Scale
- Rotation
- Blur

Actions can be edited through the inspector and displayed as blocks in the timeline. The longer-term direction is a full property-track/keyframe model.

### Export Pipeline

PNG export runs from the rendered preview. Video export uses Remotion through Electron, with ffmpeg support bundled for desktop builds.

## Current Product Status

Implemented foundations:

- Real file persistence and recent files
- Autosave/recovery
- Native Electron menu hooks
- Motion document schema migration foundation
- Command system
- Timeline action interactions
- Keyframe/property track foundation
- Asset manager foundation
- Template gallery
- Inspector polish components
- Motion preset gallery
- Smart guides
- Export presets
- Playwright smoke tests

Known areas that still need polish:

- Timeline editing needs more video-editor-level refinement.
- UI/UX still needs tighter parity with professional motion tools.
- Export output needs broader regression testing across formats.
- App icon and release branding should be finalized.
- Bundle splitting can still be improved as features grow.

See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for the full roadmap.

## Useful Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build renderer |
| `npm run electron:dev` | Build renderer and launch Electron |
| `npm run electron:build` | Build Windows installer and portable app |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run Playwright tests |
| `npm run test:smoke` | Run smoke test suite |

## GitHub / Contribution Notes

Recommended validation before committing:

```bash
npm run typecheck
npm run build
npm run test:smoke
```

Do not commit:

- `.env`
- `node_modules/`
- `dist/`
- `release/`
- local editor or agent settings
- generated logs

## Roadmap Snapshot

Near-term priorities:

1. UI/UX parity pass inspired by Jitter.video editor patterns.
2. Timeline drag/resize and action block polish.
3. Granular command system improvements.
4. Motion preset gallery thumbnails.
5. Export pipeline hardening.
6. App icon, native menu polish, and release branding.

## License

No license has been declared yet. Add a license before distributing publicly or accepting external contributions.
