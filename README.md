# EGW Admin

Panel administrativo web para gestión editorial (Plan Plata).

**Repositorio independiente** — documentación en [egw-docs](https://github.com/tu-org/egw-docs).

## Stack

- React 19 + Vite + TypeScript
- TanStack Query + React Router
- Tailwind CSS

## Requisitos

- Node.js 20+
- pnpm 10+ (`corepack enable`)
- API [egw-api](https://github.com/tu-org/egw-api) en ejecución

## Entornos

Config en `src/config/environments/`. Edita `development.ts` o `production.ts`.

| Comando | Ambiente |
|---------|----------|
| `pnpm dev` | development |
| `pnpm build` | production |

## Credenciales (API con seed)

- `admin@egw.local` / `Admin123!`

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard estadísticas |
| `/books` | Listado y CRUD libros |
| `/categories` | Categorías |
| `/collections` | Colecciones |
| `/users` | Usuarios |
| `/roles` | Roles y permisos |

## Repos relacionados

| Repo | Uso |
|------|-----|
| [egw-api](https://github.com/tu-org/egw-api) | Backend (requerido) |
| [egw-docs](https://github.com/tu-org/egw-docs) | Contrato API y roles |
| [egw-mobile](https://github.com/tu-org/egw-mobile) | App lectores |

## Documentación

- [ROLES.md](https://github.com/tu-org/egw-docs/blob/main/ROLES.md) — permisos del panel
