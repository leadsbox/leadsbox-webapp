# Automation Builder (Front-end only)

This directory contains the visual automation flow builder used inside the LeadsBox Automations page. The implementation is front-end only and stores data in `localStorage` until the real API is available.

## Architecture

- **AutomationBuilder.tsx** – full-screen workspace wired to palette, canvas, inspector, minimap, and toolbar.
- **Palette.tsx** – draggable trigger/condition/action blocks powered by `@dnd-kit/core`.
- **Canvas.tsx** – central grid surface with pan/zoom, node dragging, and connection creation.
- **Node.*.tsx** – individual node renderers styled with shadcn `Card` components.
- **Inspector.tsx** – contextual editor driven by `react-hook-form` + shadcn inputs.
- **Toolbar.tsx** – top controls (undo/redo, zoom, validate, preview, save, exit).
- **minimap/Minimap.tsx** – optional overview displayed on large screens.
- **types.ts / serializers.ts / utils.ts** – shared types, zod schemas, persistence helpers, and undo/redo utilities.
- **modals/NewAutomationModal.tsx** – shadcn dialog wrapper that mounts the builder in a full-screen overlay.

## Local development

```bash
# install dependencies (adds framer-motion if missing)
npm install

# start the web app
npm run dev
```

Visit `/dashboard/automations`, open the **Build automation** button, and interact with the visual builder.

## Key behaviours

- Drag blocks from the palette onto the canvas to create nodes.
- Connect nodes by dragging from output ports to input ports.
- Edit node properties via the inspector (right column on desktop, drawer on mobile).
- Autosaves draft state to `localStorage` (`automation_draft`) and stores saved flows in `leadsbox_flows`.
- Validation ensures a single trigger and at least one reachable action before saving.

The builder intentionally avoids back-end calls. The `onSave` callback prepares the flow object that will later POST to `/api/automations`.
