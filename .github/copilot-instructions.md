# Copilot Instructions for Trading Journal Desktop

## Project Overview

- **Stack:** Electron (main process), React + TypeScript (renderer), TailwindCSS, shadcn/ui, SQLite (better-sqlite3)
- **Purpose:** Local-first desktop app for traders to log, analyze, and optimize trading performance. All data is stored locally for privacy.

## Architecture & Data Flow

- **Electron main process** (`main/`): Handles window creation, database access, and IPC. Exposes database operations via IPC channels and a secure preload script.
- **Renderer process** (`renderer/src/`): React SPA. UI logic, state, and user interaction. Communicates with main process via `window.electronAPI` (see `preload.ts`).
- **Database**: SQLite file stored in Electron's userData path. Schema and migrations in `main/database/`.
- **Attachments**: Media files are stored in a userData subfolder, only the path is saved in the DB.
- **MT5 Integration**: Python executable (`main/mt5-integration/mt5_fetch.exe`) for importing MetaTrader 5 data via `child_process` calls.

## Key Workflows

- **Build:**
  - `npm run build` (builds both main and renderer)
  - `npm run package` or `npm run dist` (uses electron-builder, output in `dist_electron/`)
- **Development:**
  - `npm run dev` (concurrently runs Vite dev server and Electron)
- **Database migrations:**
  - On app start, migrations in `main/database/migration-*.sql` are auto-applied if needed.
- **Adding features:**
  - Main process: Add IPC handlers in `main.ts` and methods in `db-manager.ts`.
  - Renderer: Use hooks/components in `renderer/src/`, access backend via `window.electronAPI`.

## Project Conventions

- **TypeScript everywhere** (strict, no `any` unless justified)
- **Functional React components** only, hooks for logic/state
- **Explicit prop and state types**; use interfaces for objects, types for unions
- **File structure:**
  - Components: `renderer/src/components/` (by domain: `forms/`, `ui/`, `mt5/`, `layout/`)
  - Pages: `renderer/src/pages/`
  - Types: `renderer/src/types/electron.ts` (comprehensive ElectronAPI interface)
  - Hooks: `renderer/src/hooks/` (custom hooks like `useMT5Data.ts`, `useMT5AutoUpdate.ts`)
  - Database: `main/database/`
- **Styling:** TailwindCSS utility classes, shadcn/ui for accessible UI primitives
- **IPC/Preload:** All backend access via `window.electronAPI` (see `preload.ts` for API surface)
- **State Management:** React useState/useEffect with custom hooks for complex logic

## Critical Patterns

### IPC Communication Pattern

```typescript
// 1. Add handler in main.ts
ipcMain.handle("db:get-trades", () => dbManager.getTrades());

// 2. Expose in preload.ts
getTrades: () => ipcRenderer.invoke("db:get-trades"),

// 3. Use in React components
const trades = await window.electronAPI.getTrades();
```

### Component Organization

- **Table Wrappers**: Components like `MT5TradesTableWrapper.tsx` handle data fetching and auto-updates
- **Form Components**: Located in `components/forms/` with validation and submission logic
- **UI Primitives**: shadcn/ui components in `components/ui/` for consistency

### Data Filtering & State

- Dashboard uses filter states (`period`, `strategy`, `account`) with `useEffect` dependencies
- MT5 components use filter objects with comprehensive typing in `types/electron.ts`
- Prefer `Record<number, string>` for ID-to-name mappings (accounts, strategies)

## Integration Points

- **IPC:** All DB and file operations are exposed via IPC and `window.electronAPI`. Never access Node APIs directly from the renderer.
- **Attachments:** Use `saveAttachment`/`getAttachments`/`readAttachmentFile` via `window.electronAPI`.
- **MT5 Data:** Separate database tables (`mt5_accounts`, `mt5_trades`) with import/export functionality via Python executable.
- **Auto-updates:** MT5 data can auto-refresh using `useMT5AutoUpdate` hook with configurable intervals.

## Examples

- **Add DB method**: implement in `db-manager.ts`, expose via IPC in `main.ts`, add to `preload.ts`, type in `types/electron.ts`.
- **Add UI page**: create in `renderer/src/pages/`, add route in main app component.
- **MT5 features**: Follow the pattern in `MT5Import.tsx` and `MT5TradesTable.tsx` for MT5-specific functionality.

## References

- See `documents/` for MVP, stack, wireframes, and MT5 integration flow.
- See `.github/instructions/typescript-react.instructions.md` for detailed TypeScript/React code standards.
- See `trading-journal-app/CLAUDE.md` for development commands and architecture details.
- Database schema in `main/database/schema.sql` with migrations in `migration-*.sql`.

---

For questions or unclear patterns, review the MVP and stack docs in `documents/` or examine existing component patterns in `renderer/src/components/`.
