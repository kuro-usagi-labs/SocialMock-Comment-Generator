---
name: core-facts
description: Platform foundation — tech stack, architecture decision record (ADR), and component inventory for SocialMock.
metadata:
  type: reference
---

SocialMock is a React + TypeScript SPA built on Vite with Tailwind CSS, Zustand state, and @headlessui/react UI primitives; it renders user comment previews to the browser canvas as its core output format [[platform-architecture]]. The app exposes two entry points — `index.html` for full-page rendering in Chrome DevTools/CodePen, plus a `/comment-preview.js` endpoint serving pre-bundled vanilla JS payloads (≈10–25 KB) that can be embedded into external websites or legacy CMS comment sections. State persists via URL params so comments stay visible when navigating tabs; no server-side state exists beyond the client bundles [[state-management]]. The canvas renderer drives a motion system using GSAP for camera/scroll animations plus custom easing presets, while @headlessui/react handles collapsible UIs and overlays [[motion-system]][[ui-layer]]
