# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a desktop trading journal application built with Electron, React, and TypeScript. It allows traders to log their trades, manage trading accounts, strategies, and analyze performance.

**Architecture:** Electron main process + React renderer process
**Database:** SQLite with better-sqlite3
**Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
**Backend:** Electron main process with IPC communication

## Development Commands

### Development

```bash
npm run dev                    # Start development (main + renderer)
npm run dev:renderer          # Start only Vite dev server (port 5173)
npm run dev:main              # Build main process and start Electron
```

### Building

```bash
npm run build                 # Build both renderer and main process
npm run build:renderer        # Build React app with Vite
npm run build:main            # Compile TypeScript main process + copy database files
```

### Distribution

```bash
npm run package              # Package app with electron-builder
npm run dist                 # Build and package (no publish)
```

### Linting

```bash
cd renderer && npm run lint   # Run ESLint on React code
```

## Architecture Overview

### Main Process (`main/`)

- **main.ts**: Electron main process entry point, handles window creation and IPC
- **preload.ts**: Preload script for secure renderer communication
- **database/db-manager.ts**: SQLite database operations and migrations
- **database/schema.sql**: Database schema definition
- **database/migration-*.sql**: Database migration scripts

### Renderer Process (`renderer/`)

- **src/App.tsx**: Main React application with HashRouter
- **src/pages/**: Page components (Dashboard, TradeLog, TradingAccounts, Strategies, Settings)
- **src/components/**: Reusable UI components organized by type
  - `forms/`: Trade, account, and strategy forms
  - `layout/`: Layout components (Layout.tsx with navigation)
  - `ui/`: shadcn/ui components
- **src/lib/utils.ts**: Utility functions and helpers

### Key Features

- **Trade Management**: Create, edit, delete trades with attachments
- **Account Management**: Track multiple trading accounts with balances
- **Strategy Management**: Organize trades by trading strategies
- **Database**: SQLite with automatic migrations and data persistence
- **File Attachments**: Store and view trade screenshots/files

## Database Structure

### Core Tables

- `trades`: Main trading records with P&L, dates, strategies
- `trading_accounts`: Trading account information and balances
- `strategies`: Trading methodologies and rules
- `attachments`: File attachments linked to trades
- `user_settings`: Application configuration

### Database Operations

All database operations go through `DatabaseManager` class with IPC handlers:

- Trades: `db:create-trade`, `db:get-trades`, `db:update-trade`, `db:delete-trade`
- Accounts: `db:create-trading-account`, `db:get-trading-accounts`, etc.
- Strategies: `db:create-strategy`, `db:get-strategies`, etc.
- Attachments: `db:save-attachment`, `db:get-attachments`, `db:read-attachment-file`

## Development Notes

### IPC Communication

The app uses Electron IPC for secure database communication. All database operations are handled in the main process and exposed via `ipcMain.handle()`.

### File Structure

```
├── main/                    # Electron main process
│   ├── database/           # Database files and migrations
│   ├── main.ts            # Main process entry
│   └── preload.ts         # Preload script
├── renderer/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   └── types/         # TypeScript definitions
│   └── dist/             # Built renderer files
└── dist/                 # Built main process files
```

### Database Migrations

The app includes automatic database migration system. New migrations should be added to `main/database/` and handled in the `DatabaseManager.initializeDatabase()` method.

### Styling

Uses Tailwind CSS with shadcn/ui components. The app has a professional blue/slate theme with responsive design and mobile navigation.

### Build Process

- Main process: TypeScript compilation to `dist/main/`
- Renderer: Vite build to `renderer/dist/`
- Database files are copied during build
- Electron Builder packages everything into distributable format
