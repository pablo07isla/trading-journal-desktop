# Copilot Instructions for Trading Journal Desktop

## Project Overview

- **Stack:** Electron (main process), React + TypeScript (renderer), TailwindCSS, shadcn/ui, SQLite (better-sqlite3)
- **Purpose:** Local-first desktop app for traders to log, analyze, and optimize trading performance. All data is stored locally for privacy.

## Architecture & Data Flow

- **Electron main process** (`main/`): Handles window creation, database access, and IPC. Exposes database operations via IPC channels and a secure preload script.
- **Renderer process** (`renderer/src/`): React SPA. UI logic, state, and user interaction. Communicates with main process via `window.electronAPI` (see `preload.ts`).
- **Database**: SQLite file stored in Electron's userData path. Schema and migrations in `main/database/`.
- **Attachments**: Media files are stored in a userData subfolder, only the path is saved in the DB.

## Key Workflows

- **Build:**
  - `npm run build` (builds both main and renderer)
  - `npm run package` or `npm run dist` (uses electron-builder, output in `dist_electron/`)
- **Development:**
  - `npm run dev` (concurrently runs Vite dev server and Electron)
- **Database migrations:**
  - On app start, migrations in `main/database/` are auto-applied if needed.
- **Adding features:**
  - Main process: Add IPC handlers in `main.ts` and methods in `db-manager.ts`.
  - Renderer: Use hooks/components in `renderer/src/`, access backend via `window.electronAPI`.

## Project Conventions

- **TypeScript everywhere** (strict, no `any` unless justified)
- **Functional React components** only, hooks for logic/state
- **Explicit prop and state types**; use interfaces for objects, types for unions
- **File structure:**
  - Components: `renderer/src/components/` (by domain, e.g. `forms/`, `ui/`)
  - Pages: `renderer/src/pages/`
  - Types: `renderer/src/types/`
  - Database: `main/database/`
- **Styling:** TailwindCSS utility classes, shadcn/ui for accessible UI primitives
- **IPC/Preload:** All backend access via `window.electronAPI` (see `preload.ts` for API surface)
- **Testing:** (Manual for MVP; see docs for future plans)

## Integration Points

- **IPC:** All DB and file operations are exposed via IPC and `window.electronAPI`. Never access Node APIs directly from the renderer.
- **Attachments:** Use `saveAttachment`/`getAttachments`/`readAttachmentFile` via `window.electronAPI`.
- **Settings:** User preferences are stored in the `user_settings` table.

## Examples

- To add a new DB method: implement in `db-manager.ts`, expose via IPC in `main.ts`, and add to `preload.ts`.
- To add a new UI page: create a file in `renderer/src/pages/`, add a route in the main app component.

## References

- See `documents/` for MVP, stack, and wireframes.
- See `.github/instructions/typescript-react.instructions.md` for detailed TypeScript/React code standards.
- See `trading-journal-app\CLAUDE.md` for guidance.
- See `documents\mt5-integration-flow.md` for integracion MT5.

---

For questions or unclear patterns, review the MVP, and stack docs in `documents/` or ask for clarification.
