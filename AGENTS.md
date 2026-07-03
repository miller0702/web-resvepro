# AGENTS.md — egw-admin

Guía para agentes de IA en el panel administrativo **EGW Writings** (React + Vite + TypeScript).

## Contexto

Panel web de gestión editorial para administradores. Consume **egw-api** vía REST con JWT. No comparte código con egw-mobile. Arquitectura, contrato API y permisos en **egw-docs**.

## Stack y requisitos

| Tecnología | Versión / nota |
|------------|----------------|
| Node.js | 20+ |
| pnpm | 10.24.0 (`corepack enable`; `.npmrc` exige pnpm) |
| React | 19 |
| Vite | 6 |
| React Router | 7 |
| TanStack Query | 5 |
| Tailwind CSS | 3.4 |
| react-hook-form + zod | formularios |

Requiere **egw-api** corriendo en `http://localhost:8000/api/v1`.

## Comandos esenciales

```bash
pnpm install
pnpm dev          # http://localhost:8002
pnpm build        # producción
```

## Estructura del código

```
src/
├── main.tsx              # QueryClient + BrowserRouter
├── App.tsx               # rutas
├── api/
│   ├── client.ts         # axios + JWT + refresh automático en 401
│   ├── auth.ts
│   └── admin.ts          # stats, listados, createBook
├── components/
│   ├── Layout.tsx        # sidebar + outlet
│   ├── DataTable.tsx
│   └── ui/               # Button, Input, Badge, Loading, PageHeader, StatCard
├── config/environments/  # apiUrl, appName (development / production)
├── lib/auth.ts           # tokens y user en localStorage
├── pages/                # una página por feature
│   └── books/            # BooksList, BookForm, BookEdit
└── routes/
    └── ProtectedRoute.tsx
```

Alias: `@/` → `src/` (Vite + tsconfig).

## Rutas

| Ruta | Estado | Descripción |
|------|--------|-------------|
| `/login` | Completo | Login email/password |
| `/` | Completo | Dashboard (stats de admin) |
| `/books` | Completo | Listado libros |
| `/books/new` | Completo | Crear libro (POST) |
| `/books/:id` | Stub | Edición pendiente |
| `/categories` | Solo lectura | Tabla categorías |
| `/collections` | Solo lectura | Tabla colecciones |
| `/users` | Solo lectura | Tabla usuarios |
| `/roles` | Solo lectura | Tabla roles |

## Convenciones de código

- **Datos:** TanStack Query (`useQuery` / `useMutation`); respuestas API en `res.data.data`.
- **Auth:** JWT en `localStorage`; interceptor axios refresca token en 401.
- **Formularios:** react-hook-form + zod con `@hookform/resolvers`.
- **UI:** Tailwind con paleta editorial (`ink`, `parchment`, `gold`, `sage`, `ember`); fuentes Instrument Serif + Plus Jakarta Sans; patrón `.glass-card`.
- **Páginas:** composición con `PageHeader` + `DataTable` o formulario; textos en **español**.
- **TypeScript:** `strict`, `noUnusedLocals`, `noUnusedParameters`.
- **Config:** `src/config/environments/`; dev apunta a `http://localhost:8000/api/v1`.
- Vite respeta `import.meta.env.MODE` en build de producción.

## Permisos del panel

Solo usuarios con roles admin (`SUPER_ADMIN`, `ADMIN_GENERAL`, `ADMIN_MODULAR` con permisos asignados) deben acceder. Credencial seed:

- `admin@egw.local` / `Admin123!`

Matriz en [ROLES.md](https://github.com/tu-org/egw-docs/blob/main/ROLES.md).

## Reglas para agentes

1. **No duplicar lógica de negocio** que pertenece a la API; el admin es cliente delgado.
2. Respetar el contrato en [openapi.yaml](https://github.com/tu-org/egw-docs/blob/main/openapi.yaml); si falta un endpoint, implementarlo primero en egw-api.
3. Nuevas páginas CRUD: seguir patrón existente (`PageHeader`, `DataTable`, `adminApi`, TanStack Query).
4. Usar **pnpm**; no `npm install`.
5. Commits: Conventional Commits (ej. `feat(admin): add category create form`).
6. No commitear secretos de producción en `production.ts` si el repo es público.
7. Mantener coherencia visual con la paleta y componentes `ui/` existentes.

## Trabajo pendiente (referencia ROADMAP)

- CRUD completo conectado a API (edición libros, categorías, colecciones, usuarios).
- Dashboard con más métricas si la API las expone.

## Documentación externa

- [ROLES.md](https://github.com/tu-org/egw-docs/blob/main/ROLES.md)
- [API.md](https://github.com/tu-org/egw-docs/blob/main/API.md)
- [ENV.md](https://github.com/tu-org/egw-docs/blob/main/ENV.md)
