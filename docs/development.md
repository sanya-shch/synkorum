# Development

## Scripts

| Script                             | What it does                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`  | Next.js dev server, production build, production server                                                   |
| `npm run lint`                     | ESLint                                                                                                    |
| `npm run typecheck`                | `tsc --noEmit`                                                                                            |
| `npm run format` / `format:check`  | Prettier: rewrite files / only check them (config in `.prettierrc.json`, exclusions in `.prettierignore`) |
| `npm test` / `test:watch`          | Vitest unit tests                                                                                         |
| `npm run test:e2e` / `test:e2e:ui` | Playwright end-to-end tests (see [`e2e/README.md`](../e2e/README.md))                                     |
| `npm run db:up` / `db:down`        | Start / stop the local PostgreSQL container (data is kept)                                                |
| `npm run db:migrate`               | Apply migrations in development (`prisma migrate dev`)                                                    |
| `npm run db:reset`                 | Wipe the DB volume and re-apply migrations                                                                |
| `npm run db:generate`              | Regenerate the Prisma client                                                                              |

## Project layout

| Path               | Contents                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| `app/`             | Routes: `(marketing)` landing, `(auth)`, `(dashboard)`, `board/[boardId]`    |
| `actions/`         | Server actions (boards, organizations, invites, auth)                        |
| `components/`      | Shared UI, `ui/` holds the shadcn/ui primitives, `modals/` the global modals |
| `store/`, `hooks/` | Zustand stores and shared React hooks                                        |
| `lib/`             | Framework-free helpers: JWT, permissions, rate limiting, canvas geometry     |
| `prisma/`          | Schema and migrations                                                        |
| `tests/`, `e2e/`   | Unit tests (Vitest) and end-to-end tests (Playwright)                        |
