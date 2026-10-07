# Employee Management System

React 18 + Vite app for projects, tasks, teams, finance, and an in-app AI assistant. Data lives in Firebase Auth and Cloud Firestore. UI is JSX with colocated SCSS (Bootstrap for layout primitives).

## Commands

- `npm run dev` — Vite dev server (`--mode development`)
- `npm run build` — production build
- `npm run lint` — ESLint on `js`/`jsx`, zero warnings
- `npm run deploy:firebase` — build, then hosting and Firestore rules
- `npm run deploy:vercel` — sync env, build, then production deploy

## Layout

- `src/pages/` — route screens. Each page folder has `index.jsx` plus a matching `.scss` file.
- `src/components/` — shared UI. Same folder pattern as pages.
- `src/contexts/` — `AuthContext`, `TaskContext`, `ThemeContext`, `NotificationContext`. Providers wrap the app in `src/main.jsx`.
- `src/services/` — Firestore, email, notifications, and AI chat. Prefer these over calling Firebase from a page.
- `src/utils/permissionUtils.js` — roles and route access. Check permissions here; do not hard-code role strings in pages.
- `src/firebase.js` — Firebase app init. Config comes from `VITE_FIREBASE_*` env vars.
- `firestore.rules` — security rules. Update them when a collection or role check changes.

## Auth and routes

Roles: `super_manager`, `manager`, `designer`, `developer`, `bd`. `super_manager` has every permission. Managers can be typed as designer, developer, or BD.

Public routes: `/`, `/login`, `/signup` (signup only when the `users` collection is empty), `/setup-password`. Everything else sits behind `ProtectedRoute` and `RouteGuard` in `src/App.jsx`. A denied route redirects to `/dashboard`.

App routes: `/dashboard`, `/projects`, `/project/:projectId/board`, `/users`, `/analytics`, `/employee-performance`, `/finance/overview`, `/finance/commissions`, `/calculator`. `/payments` redirects to `/finance/overview`.

## Conventions

- Functional components. Page bodies are lazy-loaded from `src/App.jsx`.
- Read auth with `useAuth()` and tasks with `useTask()`.
- Gate UI and navigation with `permissionUtils`, not ad-hoc `user.role` checks.
- Keep styles in the component's SCSS file. Shared tokens live in `src/styles/_shared.scss` and `src/index.scss`.
- Theme is applied before paint (`data-theme` on the document). Preserve that bootstrap when touching `index.html` or `ThemeContext`.
- Do not commit secrets. Copy `.env.example` to `.env.local`. Never print or commit API keys, including `VITE_OPENAI_API_KEY`.

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- Dirty `graphify-out/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
