# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the Odoo Educativo landing page, post-install admin panel with real API, and the unattended Odoo 17 installation scripts for Spanish educational centers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Key Files (root)
- `README.md` — Full documentation with features, installation instructions, troubleshooting
- `bootstrap.sh` — One-line bootstrap script (updates server, installs git/curl, clones repo, runs installer)
- `odoo_install.sh` — Main unattended installation script (includes admin panel deployment)

## Project: Odoo Educativo

### Landing Page (`artifacts/odoo-edu`)
React + Vite landing page in Spanish for the Odoo Edu Installer project. Showcases features, installation instructions (GitHub clone + bash), OCA modules, and educator tools.

- **URL**: `/` (root)
- **Framework**: React + Vite + Tailwind CSS + Framer Motion
- **Key files**: `src/pages/Landing.tsx`, `src/pages/AdminPanel.tsx`, `src/components/StudentLogin.tsx`, `src/components/CodeBlock.tsx`
- **Routes**:
  - `/` — Landing page with GitHub install instructions and student login
  - `/admin` — Post-install admin panel with login (superadmin or professor)
- **Vite proxy**: `/api` → `http://localhost:8080` (API server)
- **GitHub repo**: https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish

### Admin Panel (`/admin`)
Role-based post-installation admin panel for managing the Odoo educational environment. Connected to real API with persistent configuration.

- **Superadmin role**: Full access — manages all groups, professors, branding, and updates
- **Professor role**: Limited access — only sees and manages their own group's students
- **Auth**: Token-based auth via API with session persistence in localStorage
- **API Endpoints**:
  - `POST /api/auth/login` — Login (returns token)
  - `POST /api/auth/logout` — Logout
  - `GET /api/auth/me` — Session info
  - `POST /api/auth/student-lookup` — Student login: maps username to database for redirect
  - `GET /api/groups` — List groups (filtered by role)
  - `PUT /api/groups/bulk` — Save all groups at once
  - `POST /api/groups` — Create single group
  - `PUT /api/groups/:nombre` — Update group
  - `DELETE /api/groups/:nombre` — Delete group
  - `POST /api/groups/:nombre/create-databases` — Create student databases via odoo-bin
  - `POST /api/groups/:nombre/reset-databases` — Reset student databases
  - `GET /api/branding` — Get branding config
  - `PUT /api/branding` — Save branding config
  - `GET /api/status` — System status (Odoo, PostgreSQL, Nginx)
- **Config persistence**: JSON file at `/opt/odoo17/admin-config.json`
- **Default credentials**: superadmin / SuperAdmin2024!

### API Server (`artifacts/api-server`)
Express 5 API with real endpoints for admin panel operations.

- **Routes**: `src/routes/auth.ts`, `src/routes/groups.ts`, `src/routes/branding.ts`, `src/routes/status.ts`, `src/routes/install.ts`
- **Auth middleware**: `src/lib/auth-middleware.ts` (token-based, requireAuth, requireSuperadmin)
- **Config**: `src/lib/config.ts` (reads/writes admin-config.json)
- **Production**: Serves static files + handles SPA routing

### Installation Scripts (root directory)
- `odoo_install.sh` — Main unattended installer for Odoo 17 CE with:
  - Spanish localization (OCA/l10n-spain)
  - Multi-company support for educational use
  - Multi-group model with per-group professor
  - Admin panel web deployment (Node.js + Nginx integration)
  - Full branding/marca blanca
  - 40+ OCA module repositories
  - PostgreSQL, Nginx, systemd, UFW, logrotate
  - Compatible with Ubuntu 22.04/24.04 LTS and 25.04 (Python 3.13 support)
  - User creation via Odoo ORM (not raw SQL) — ensures partner_id, password hashing
  - Module list (36 modules): base,base_setup,mail,contacts,account,account_payment,l10n_es,sale_management,purchase,stock,hr,hr_holidays,hr_expense,hr_recruitment,hr_attendance,hr_timesheet,project,calendar,board,crm,mrp,point_of_sale,website,website_sale,website_blog,website_event,website_slides,event,survey,note,mass_mailing,im_livechat,fleet,maintenance,lunch,membership
  - After DB creation, hides uninstallable Enterprise modules from Apps menu

### Server Deployment Architecture
After installation, the server serves:
- `http://server-ip/` — Landing page (static)
- `http://server-ip/admin` — Admin panel (static SPA)
- `http://server-ip/api/` — API server (proxied to Node.js on port 3001)
- `http://server-ip/web` — Odoo ERP (proxied to port 8069)

Systemd services:
- `odoo17.service` — Odoo ERP
- `odoo-edu-admin.service` — Admin panel API (Node.js)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── routes/     # auth.ts, groups.ts, branding.ts, status.ts, install.ts
│   │       └── lib/        # config.ts, auth-middleware.ts
│   └── odoo-edu/           # Landing page + Admin panel (React + Vite)
│       └── src/pages/      # Landing.tsx, AdminPanel.tsx
├── lib/                    # Shared libraries
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema
├── odoo_install.sh         # Main Odoo installer (includes admin panel deploy)
├── bootstrap.sh            # One-line bootstrap
├── README.md               # Full documentation
└── package.json
```
