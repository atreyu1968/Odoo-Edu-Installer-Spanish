# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the Odoo Educativo landing page, post-install admin panel, and the unattended Odoo 17 installation scripts for Spanish educational centers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Files (root)
- `README.md` — Full documentation with features, installation instructions, troubleshooting
- `bootstrap.sh` — One-line bootstrap script (updates server, installs git/curl, clones repo, runs installer)
- `odoo_install.sh` — Main unattended installation script

## Project: Odoo Educativo

### Landing Page (`artifacts/odoo-edu`)
React + Vite landing page in Spanish for the Odoo Edu Installer project. Showcases features, installation instructions (GitHub clone + bash), OCA modules, and educator tools. Links to GitHub repo for download — no configurator buttons.

- **URL**: `/` (root)
- **Framework**: React + Vite + Tailwind CSS + Framer Motion
- **Key files**: `src/pages/Landing.tsx`, `src/pages/AdminPanel.tsx`, `src/components/CodeBlock.tsx`, `src/components/SectionHeading.tsx`
- **Routes**:
  - `/` — Landing page with GitHub install instructions
  - `/admin` — Post-install admin panel with login (superadmin or professor)
- **Vite proxy**: `/api` → `http://localhost:8080` (API server)
- **GitHub repo**: https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish

### Admin Panel (`/admin`)
Role-based post-installation admin panel for managing the Odoo educational environment.

- **Superadmin role**: Full access — manages all groups, professors, branding, and updates
- **Professor role**: Limited access — only sees and manages their own group's students
- **Auth**: Client-side auth with hardcoded defaults for demo (superadmin/SuperAdmin2024!)
- **Tabs (superadmin only)**:
  - Grupos y Profesores — CRUD for groups with embedded professor management
  - Branding — Company data, logo, favicon, corporate colors
  - Actualizaciones — Odoo and OCA module update status
- **Default credentials**: superadmin / SuperAdmin2024!

### Installation Scripts (root directory)
- `odoo_install.sh` — Main unattended installer for Odoo 17 CE with:
  - Spanish localization (OCA/l10n-spain)
  - Multi-company support for educational use
  - **Multi-group model with per-group professor**: each group has its own assigned professor (1:1 relationship). Professor only has admin access to their own group's databases.
    - Serialized as pipe-delimited fields, semicolon-delimited entries: `EDU_GRUPOS="nombre|numAlumnos|dbPrefix|pwdPrefix|profNombre|profUsuario|profPassword;..."`
  - **Superadmin credentials**: `SUPERADMIN_USER` / `SUPERADMIN_PASSWORD` variables for admin panel access
  - Full branding/marca blanca: logo (PNG 200×60px), favicon (32×32px), corporate colors, company data (name, tagline, website, email, phone, address)
  - Rebranding via OCA brand/server-brand modules
  - 40+ OCA module repositories
  - PostgreSQL, Nginx, systemd, UFW, logrotate
  - Automatic backup cron job
  - Educational scripts for student/teacher management (with branding propagation)
  - Post-install summary: shows admin panel URL (adapts for Nginx vs direct) and superadmin credentials

- Auxiliary scripts created by installer at `/usr/local/bin/`:
  - `odoo_crear_alumnos.sh` — Mass student account creation (iterates all groups, creates each professor only in their group's DBs)
  - `odoo_reset_alumno.sh` — Reset a student's database (takes DB name directly)
  - `odoo_backup.sh` — Manual backup of all databases
  - `odoo_restaurar_alumno.sh` — Restore database from backup

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── odoo-edu/           # Landing page + Admin panel (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── odoo_install.sh         # Main Odoo installer script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health`; `src/routes/install.ts` provides Odoo installation management
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)

### `artifacts/odoo-edu` (`@workspace/odoo-edu`)

React + Vite app with landing page and admin panel for Odoo Educativo.

- Entry: `src/main.tsx`
- Pages: `src/pages/Landing.tsx` (landing), `src/pages/AdminPanel.tsx` (admin panel with login)
- Components: `src/components/CodeBlock.tsx`, `src/components/SectionHeading.tsx`
- Styling: `src/index.css` (Tailwind + custom CSS vars, blue tech theme)
- Images: `public/images/hero-bg.png`, `public/images/educator-dashboard.png`, `public/images/asd-logo.png`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Run scripts via `pnpm --filter @workspace/scripts run <script>`.
