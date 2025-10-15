# LeadsBox Webapp

LeadsBox Webapp is the customer-facing dashboard built with React, Vite, shadcn/ui, and TypeScript. It consumes the Express API, renders multi-channel inboxes, orchestrates pipeline actions, and manages billing via Paystack. This guide explains how the UI is structured and how it integrates with the backend.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Environment & Configuration](#environment--configuration)
4. [Local Development](#local-development)
5. [Feature Modules](#feature-modules)
6. [Data Layer & API Client](#data-layer--api-client)
7. [State Management](#state-management)
8. [Styling & UI Toolkit](#styling--ui-toolkit)
9. [Build & Testing](#build--testing)
10. [Operational Notes](#operational-notes)
11. [Appendix](#appendix)

---

## System Overview
- **Framework:** React + TypeScript using Vite for bundling and shadcn/ui + Tailwind CSS for components.
- **Routing:** React Router (SPA). Some legacy marketing pages live under `pages/`.
- **Data:** Axios-based client in `src/api/client.ts` wired to the backend (`VITE_API_BASE`). Socket.IO hooks (`src/lib/socket.ts`) handle real-time inbox/analytics.
- **Auth:** JWT-based auth stored in cookies; `AuthContext` coordinates login state, org selection, and invite acceptance.
- **Key experiences:** multi-channel inbox, lead pipeline, analytics dashboard, automations, invoice workflow, subscription management UI (billing).

---

## Project Structure
```
src/
 ├─ api/                # Axios client, endpoint helpers, interceptors
 ├─ components/         # Shared UI (shadcn wrappers, layout primitives)
 ├─ context/            # React contexts (Auth, Theme)
 ├─ data/               # Legacy mock fixtures (settings fallbacks only)
 ├─ features/
 │   ├─ billing/        # Subscription management UI (PaymentPlansPage)
 │   ├─ inbox/          # Inbox experience
 │   ├─ pipeline/       # Drag/drop pipeline board
 │   ├─ analytics/      # Real-time analytics dashboard
 │   ├─ automations/    # Follow-up scheduling & templates
 │   └─ settings/       # Org and user settings
 ├─ hooks/              # Custom hooks (useOrgMembers, useSocketIO…)
 ├─ lib/                # Utility modules (socket client, formatters)
 ├─ pages/              # Standalone pages (Marketing, Auth)
 ├─ App.tsx             # Route definitions + providers
 └─ main.tsx            # Vite bootstrap
```

---

## Environment & Configuration
Create `.env` by copying `.env.example`. Important keys:
- `VITE_API_BASE` – base URL for backend API (e.g., `http://localhost:3010/api`).
- `VITE_SOCKET_URL` – optional override for Socket.IO base (defaults to `API_BASE` sans `/api`).
- `VITE_APP_NAME`, `VITE_ENABLE_MOCKS` (future toggles).

For production builds, environment variables must be prefixed with `VITE_` and injected at build time (Render or CI pipeline).

---

## Local Development
```bash
# install dependencies
yarn install

# run dev server (default port 5173)
yarn dev

# run with HTTPS for secure cookies (optional)
yarn dev --https
```
Useful commands:
- `yarn lint` – ESLint + TypeScript checks.
- `yarn build` – production bundle.
- `yarn preview` – serve a production build locally.

Ensure the backend is running (`PUBLIC_APP_URL=http://localhost:5173`) so auth redirects and sockets resolve.

---

## Feature Modules
- **Billing (`features/billing/PaymentPlansPage.tsx`)** – Displays plans fetched from `/api/billing/plans`, handles choose/change/cancel workflows via new endpoints. Uses dropdown for managing current plan and surfaces plan status (pending, active, canceled, past due).
- **Inbox (`features/inbox/InboxPage.tsx`)** – Channels aggregated via API & Socket.IO, allows thread selection and message streaming.
- **Pipeline (`features/pipeline/PipelinePage.tsx`)** – Drag/drop leads across stages using `@dnd-kit`, integrates with backend move endpoints and real-time updates.
- **Analytics (`features/analytics/AnalyticsPage.tsx`)** – Subscribes to Socket.IO analytics events; fallback to HTTP fetch for dashboards.
- **Automations (`features/automations/AutomationsPage.tsx`)** – Compose templates/follow-ups, schedule jobs via API, and manage local builder flows.
- **Settings (`features/settings/`)** – Profile management, integrations tab, org plan summary.

Each feature folder typically includes layout components, modals, and hook abstractions. Reusable primitives live under `components/ui` (shadcn).

---

## Data Layer & API Client
- **Client:** [`src/api/client.ts`](src/api/client.ts) configures Axios with interceptors for auth headers (`Authorization`, `x-org-id`) and refresh handling.
- **Endpoints:** centralised in [`src/api/config.ts`](src/api/config.ts) for consistency. Billing endpoints now include:
  - `billing.plans`
  - `billing.initialize`
  - `billing.subscription`
  - `billing.cancelSubscription`
  - `billing.changePlan`
- **Error handling:** `useToast` / `toast` used to surface errors (e.g., plan changes).
- **Socket client:** [`src/lib/socket.ts`](src/lib/socket.ts) wraps Socket.IO with typed events, used by inbox/analytics features.

---

## State Management
- **AuthContext (`src/context/AuthContext.tsx`)** – stores user profile, tokens, selected organisation; persists to localStorage.
- **ThemeContext** – dark/light mode toggling.
- **Feature-level hooks** – `useOrgMembers`, `useSocketIO`, `useToast`, etc. Compose data and presentational state within features.

No global Redux; rely on contexts + hooks.

---

## Styling & UI Toolkit
- Tailwind CSS for design tokens (see `tailwind.config.ts`).
- shadcn/ui components in `src/components/ui/` for consistent UX patterns.
- `cn` utility (className merge) in `src/lib/utils.ts`.
- Animations via `framer-motion` for cards and transitions.

---

## Build & Testing
- Build pipeline: `yarn build` (Vite). Outputs to `dist/`.
- Type checking: TypeScript via build.
- Linting: `yarn lint` (ESLint).
- Testing: (roadmap) – currently minimal; plan to introduce React Testing Library and Cypress for E2E once flows stabilise.

---

## Operational Notes
- **Deployments:** Render or any Node host. Set `VITE_API_BASE` to deployed backend URL before building.
- **Auth cookies:** Browser must be served over HTTPS in production to respect `SameSite=None; Secure` cookies set by backend.
- **Billing redirects:** After Paystack checkout, the backend redirects to `/dashboard/billing` using callback URL; ensure frontend route remains available.
- **Mocks:** Dashboard tasks now consume `/api/followups` + `/api/analytics/overview`; `src/data/` remains for settings fallbacks until those views are rewritten.

---

## Appendix
- [Backend repo (leadsbox-backend)](../leadsbox-backend/README.md)
- [Socket client](src/lib/socket.ts)
- [Billing plans UI](src/features/billing/PaymentPlansPage.tsx)
- [Auth context](src/context/AuthContext.tsx)

For design or UX questions, contact the LeadsBox web team or check the product spec in Notion.
