# mb-admin — Plan 1 : Foundation (whoami + app + BFF + parcours auth)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser les fondations de l'app admin : un endpoint `GET /auth/whoami` côté mb-api, l'app `apps/mb-admin` (front React + BFF Hono), l'authentification par clé API stockée en session httpOnly avec sélection d'environnement, et le parcours jusqu'au choix de fonctionnalité.

**Architecture :** Le navigateur ne parle qu'au BFF de mb-admin. On choisit un environnement (Local/Dev/Prod), on saisit la clé de cet environnement, le BFF la valide via `whoami` contre le bon mb-api puis stocke `{ environment, apiKey, label }` dans une session iron-session chiffrée. Tous les appels data passent ensuite par un proxy `/api/*` du BFF qui relaie vers le mb-api de l'environnement en injectant le Bearer.

**Tech Stack :** Hono + @hono/node-server, iron-session, ky, React 19, TanStack Router, Vite, Tailwind v4, Zod, @pilote/mb-shared.

**Convention de nommage (rappel projet) :** verbes/technique en anglais, noms d'entités métier en français. Pas de `export default`. Pas de plan de tests front (seul le backend `whoami` est testé).

---

## Référence : flux & contrats

- **Environnements** : `'local' | 'dev' | 'prod'`. URLs serveur : `API_BASE_URL_LOCAL`, `API_BASE_URL_DEV`, `API_BASE_URL_PROD`.
- **Session** (iron-session, cookie `mbadmin_session`, httpOnly) : `{ environment: Environment, apiKey: string, label: string }`.
- **whoami** : `GET {mbApiUrl}/auth/whoami` avec `Authorization: Bearer <apiKey>` → `200 { kind, label }` si valide, `401` sinon.
- **Endpoints front → BFF** :
  - `GET  /auth/session` → `{ environment, label } | null` (jamais la clé).
  - `POST /auth/confirm` body `{ environment, apiKey }` → `200 { environment, label }` ou `401`.
  - `POST /auth/logout` → `204`, détruit la session.
  - `ALL  /api/*` → proxy authentifié vers le mb-api de l'environnement en session.

---

## Task 0 : Pré-requis local (manuel)

**Files:** aucun (configuration machine).

- [ ] **Step 1 : Ajouter le domaine local**

Ajouter à `/etc/hosts` :

```
127.0.0.1 mb-admin.localhost
```

- [ ] **Step 2 : Vérifier portless**

`portless` est déjà une devDependency du monorepo (cf. mb-webapp). Le champ `"portless": "mb-admin"` dans le `package.json` (Task 2) suffira à exposer `https://mb-admin.localhost` via `portless run vite`.

---

## Task 1 : Endpoint `GET /auth/whoami` (mb-api)

**Files:**
- Create: `apps/mb-api/src/authentication/routes/whoami.ts`
- Create: `apps/mb-api/src/authentication/routes/whoami.test.ts`
- Modify: `apps/mb-api/src/app.ts` (enregistrement de la route)
- Référence : `apps/mb-api/src/authentication/routes/me.ts`, `apps/mb-api/src/framework/auth/userContext.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

`apps/mb-api/src/authentication/routes/whoami.test.ts` :

```typescript
import { testClient } from 'hono/testing'
import { describe, expect, it } from 'vitest'

import { app } from '@/app'
import { env } from '@/framework/env'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('GET /auth/whoami', () => {
  it(
    'renvoie 200 + label quand la clé API est valide',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'pilote_live_whoami_valid_key_value_ok',
        label: 'clé-ops',
      })

      const response = await app.request('/auth/whoami', {
        headers: { Authorization: 'Bearer pilote_live_whoami_valid_key_value_ok' },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ kind: 'apiKey', label: 'clé-ops' })
    }),
  )

  it(
    'renvoie 401 quand aucune clé n’est fournie',
    integrationTest(async () => {
      const response = await app.request('/auth/whoami')
      expect(response.status).toBe(401)
    }),
  )

  it(
    'renvoie 401 quand la clé est inconnue',
    integrationTest(async () => {
      const response = await app.request('/auth/whoami', {
        headers: { Authorization: 'Bearer pilote_live_unknown_key_value_xxxxxx' },
      })
      expect(response.status).toBe(401)
    }),
  )
})
```

> Note : vérifier le chemin d'import de `env` (`@/framework/env`) et de `integrationTest`/`fixtures` en s'alignant sur un test existant (`verifyApiKey.test.ts`). Adapter si l'alias diffère.

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run : `pnpm -F @pilote/mb-api test -- whoami`
Expected : FAIL (route `/auth/whoami` inexistante → 404, et/ou import manquant).

- [ ] **Step 3 : Implémenter la route**

`apps/mb-api/src/authentication/routes/whoami.ts` :

```typescript
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requirePrincipal } from '@/framework/auth/userContext'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'

const WhoamiOkSchema = z
  .object({
    kind: z.enum(['user', 'apiKey']),
    label: z.string(),
  })
  .openapi('Whoami')

const whoamiRoute = createRoute({
  method: 'get',
  path: '/auth/whoami',
  tags: ['Authentication'],
  summary: "Valider l'authentification courante (utilisateur ou API key)",
  description:
    "Renvoie l'identité du principal courant. Contrairement à `/me`, accepte aussi les " +
    'API keys. Sert de validation de clé : 200 si la clé est valide (non révoquée, non ' +
    'expirée), 401 sinon.',
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: WhoamiOkSchema } },
      description: 'Principal authentifié',
    },
  },
})

export const whoami = new OpenAPIHono()

whoami.openapi(whoamiRoute, (context) => {
  const principal = requirePrincipal()
  const label = principal.kind === 'user' ? `${principal.user.prenom} ${principal.user.nom}` : principal.apiKey.label
  return jsonResponseOk({
    context,
    data: { kind: principal.kind, label },
    schema: WhoamiOkSchema,
    status: 200,
  })
})
```

> `requireAuthentication` lève `UnauthorizedError` (→ 401) si aucun principal. Vérifier que le mapping global d'erreur de mb-api transforme bien `UnauthorizedError` en 401 (c'est le cas pour `/me`).

- [ ] **Step 4 : Enregistrer la route dans `app.ts`**

Dans `apps/mb-api/src/app.ts`, à côté de `app.route('/', me)` :

```typescript
import { whoami } from '@/authentication/routes/whoami'
// ...
app.route('/', whoami)
```

- [ ] **Step 5 : Lancer le test, vérifier le succès**

Run : `pnpm -F @pilote/mb-api test -- whoami`
Expected : PASS (3 tests verts).

- [ ] **Step 6 : Lint + commit**

```bash
pnpm -F @pilote/mb-api lint
git add apps/mb-api/src/authentication/routes/whoami.ts apps/mb-api/src/authentication/routes/whoami.test.ts apps/mb-api/src/app.ts
git commit -m "feat(mb-api): ajoute GET /auth/whoami compatible API key"
```

---

## Task 2 : Scaffolder l'app `apps/mb-admin` (squelette front)

**Files (création) :**
- `apps/mb-admin/package.json`, `.nvmrc`, `.prettierrc`, `tsconfig.json`, `eslint.config.mjs`
- `apps/mb-admin/vite.config.ts`, `vite.server.config.ts`, `index.html`
- `apps/mb-admin/.env.example`, `.gitignore`, `.slugignore`
- `apps/mb-admin/deploy-prepare.sh`, `deploy-bundle.sh`, `start.sh`
- `apps/mb-admin/src/main.tsx`, `apps/mb-admin/src/index.css`
- `apps/mb-admin/src/lib/clsxm.ts`

Modèle à recopier/adapter : les fichiers homonymes de `apps/mb-webapp`.

- [ ] **Step 1 : `package.json`**

```json
{
  "name": "@pilote/mb-admin",
  "portless": "mb-admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "files": ["dist"],
  "engines": { "node": "24.9.0" },
  "scripts": {
    "dev": "portless run vite",
    "deploy:prepare": "bash deploy-prepare.sh",
    "routes:generate": "tsr generate",
    "build": "rm -rf dist && tsr generate && tsc --noEmit && vite build && vite build -c vite.server.config.ts",
    "deploy:bundle": "bash deploy-bundle.sh",
    "start": "node dist/server/index.js",
    "lint": "tsr generate && eslint src && tsc --noEmit && prettier --check .",
    "lint:fix": "tsr generate && eslint src --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@hono/node-server": "^1.19.13",
    "@pilote/mb-shared": "workspace:*",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@tanstack/react-query": "^5.62.7",
    "@tanstack/react-router": "^1.168.26",
    "@tanstack/react-router-devtools": "^1.166.13",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dotenv": "16.4.5",
    "hono": "^4.12.18",
    "hono-rate-limiter": "^0.5.3",
    "iron-session": "^8.0.4",
    "ky": "^1.7.5",
    "lucide-react": "^1.14.0",
    "neverthrow": "^8.2.0",
    "pino": "^10.3.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.0",
    "@hono/vite-dev-server": "^0.25.3",
    "@tailwindcss/vite": "^4.2.4",
    "@tanstack/router-cli": "^1.166.38",
    "@tanstack/router-plugin": "^1.167.29",
    "@types/node": "^22.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "pino-pretty": "^13.1.3",
    "portless": "^0.11.1",
    "prettier": "^3.6.2",
    "tailwindcss": "^4.2.4",
    "typescript": "5.9.3",
    "typescript-eslint": "^8.53.0",
    "vite": "^8.0.10"
  }
}
```

- [ ] **Step 2 : Copier les configs telles quelles depuis mb-webapp**

Copier puis adapter à l'identique :
- `.nvmrc` (`24.9.0`), `.prettierrc` (copie exacte).
- `tsconfig.json` : copie de mb-webapp, retirer `"@testing-library/jest-dom"` de `types` → `"types": ["vite/client", "node"]`, et retirer `vitest.setup.ts` de `include`.
- `eslint.config.mjs` : copie de mb-webapp (garder les exceptions TanStack Redirect et l'interdiction de `export default`).
- `vite.server.config.ts` : copie exacte.
- `src/lib/clsxm.ts` : copie exacte.

- [ ] **Step 3 : `vite.config.ts`** (adapter l'exclude du dev-server pour router `/auth` et `/api` vers le BFF)

```typescript
import { fileURLToPath, URL } from 'node:url'

import devServer from '@hono/vite-dev-server'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { cors: false },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    devServer({
      entry: 'src/server/app.ts',
      export: 'app',
      exclude: [
        /^\/@.+$/,
        /.*\.(ts|tsx|js|jsx|css|svg|png|jpg|jpeg|gif|webp|woff2?)($|\?)/,
        /^\/(public|assets|static|src|node_modules)\/.+/,
        /^\/(?!auth(\/|$)|healthz(\/|$)|api(\/|$)).*/,
      ],
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist/client', emptyOutDir: true },
})
```

- [ ] **Step 4 : `index.html`** (copie de mb-webapp, titre adapté)

Reprendre l'`index.html` de mb-webapp en changeant le `<title>` :

```html
<title>Pilote MB — Console d'administration</title>
```

(garder le preconnect Inter + `<div id="root">` + `<script type="module" src="/src/main.tsx">`).

- [ ] **Step 5 : `src/index.css`** (copie exacte du thème DSFR de mb-webapp)

Copier `apps/mb-webapp/src/index.css` à l'identique (couleurs Bleu République, surfaces, Inter, échelle typographique).

- [ ] **Step 6 : Scripts de déploiement**

`deploy-prepare.sh` : copie de mb-webapp (message adapté).
`deploy-bundle.sh` : copie, remplacer `mb-webapp` → `mb-admin` (filtre `@pilote/mb-admin`, dossier `mb-admin-deploy`).
`start.sh` : `exec node mb-admin-deploy/dist/server/index.js`.
`.slugignore` : copie de mb-webapp en ajoutant `apps/mb-webapp` et en retirant `apps/mb-admin` de la liste des exclusions.
`.gitignore` : copie de mb-webapp (dist, node_modules, .env, .tanstack…).

- [ ] **Step 7 : `.env.example`**

```
PORT=4001
API_BASE_URL_LOCAL=https://mb-api.localhost
API_BASE_URL_DEV=https://mb-api-dev.example
API_BASE_URL_PROD=https://mb-api-prod.example
SESSION_SECRET=
PUBLIC_BASE_URL=https://mb-admin.localhost
LOG_LEVEL=info
```

- [ ] **Step 8 : `src/main.tsx`** (bootstrap router + query, charge l'état de session avant rendu)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { session } from '@/session'
import '@/index.css'
import { routeTree } from '@/routeTree.gen'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root introuvable')

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient, session },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = createRoot(rootElement)
void session.bootstrap().then(() => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
```

(`@/session` est créé en Task 6 ; `routeTree.gen` est généré par `tsr generate`.)

- [ ] **Step 9 : Installer & commit**

```bash
pnpm install
git add apps/mb-admin
git commit -m "chore(mb-admin): scaffold app (configs, vite, theme, html)"
```

---

## Task 3 : BFF — env, session, app, serveur

**Files (création) :**
- `apps/mb-admin/src/server/env.ts`
- `apps/mb-admin/src/server/environments.ts`
- `apps/mb-admin/src/server/session.ts`
- `apps/mb-admin/src/server/app.ts`
- `apps/mb-admin/src/server/index.ts`

Référence : `apps/mb-webapp/src/server/{env,app,index}.ts` et `src/server/auth/session.ts`.

- [ ] **Step 1 : `src/server/env.ts`**

```typescript
import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4001),
  API_BASE_URL_LOCAL: z.url(),
  API_BASE_URL_DEV: z.url(),
  API_BASE_URL_PROD: z.url(),
  SESSION_SECRET: z
    .string()
    .min(32)
    .refine(
      (value) => !value.toLowerCase().startsWith('change-me'),
      'SESSION_SECRET utilise encore la valeur placeholder — définis un vrai secret.',
    ),
  PUBLIC_BASE_URL: z.url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export const serverEnv = envSchema.parse(process.env)
```

- [ ] **Step 2 : `src/server/environments.ts`** (mapping env → URL, source unique de vérité)

```typescript
import { serverEnv } from '@/server/env'

export const ENVIRONMENTS = ['local', 'dev', 'prod'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

export const isEnvironment = (value: unknown): value is Environment =>
  typeof value === 'string' && (ENVIRONMENTS as readonly string[]).includes(value)

const URL_BY_ENVIRONMENT: Record<Environment, string> = {
  local: serverEnv.API_BASE_URL_LOCAL,
  dev: serverEnv.API_BASE_URL_DEV,
  prod: serverEnv.API_BASE_URL_PROD,
}

export const mbApiUrlFor = (environment: Environment): string => URL_BY_ENVIRONMENT[environment]
```

- [ ] **Step 3 : `src/server/session.ts`** (iron-session, stocke env + clé + label)

```typescript
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'

import { serverEnv } from '@/server/env'
import type { Environment } from '@/server/environments'

const SESSION_COOKIE = 'mbadmin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8h

export type AdminSession = {
  environment: Environment
  apiKey: string
  label: string
}

const sealOptions = { password: serverEnv.SESSION_SECRET }

export const writeSession = async (context: Context, payload: AdminSession) => {
  const sealed = await sealData(payload, { ...sealOptions, ttl: SESSION_TTL_SECONDS })
  setCookie(context, SESSION_COOKIE, sealed, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export const readSession = async (context: Context): Promise<AdminSession | null> => {
  const raw = getCookie(context, SESSION_COOKIE)
  if (!raw) return null
  try {
    return await unsealData<AdminSession>(raw, sealOptions)
  } catch {
    return null
  }
}

export const clearSession = (context: Context) => {
  deleteCookie(context, SESSION_COOKIE, { path: '/' })
}
```

- [ ] **Step 4 : `src/server/app.ts`** (Hono + secureHeaders ; CSP connectSrc = self uniquement, le navigateur ne parle qu'au BFF)

```typescript
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { apiRouter } from '@/server/api/router'
import { authRouter } from '@/server/auth/router'

export const app = new Hono()

app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
  }),
)

app.get('/healthz', (context) => context.text('ok\n'))
app.route('/auth', authRouter)
app.route('/api', apiRouter)
```

(`authRouter` → Task 4, `apiRouter` → Task 5.)

- [ ] **Step 5 : `src/server/index.ts`** (serveur prod : statiques + SPA fallback)

Copier `apps/mb-webapp/src/server/index.ts` à l'identique (sert `./client`, compress, fallback `index.html`), en important `serverEnv` depuis `@/server/env`.

- [ ] **Step 6 : Lint + commit**

```bash
pnpm -F @pilote/mb-admin exec tsc --noEmit
git add apps/mb-admin/src/server
git commit -m "feat(mb-admin): BFF env, session iron-session, app Hono"
```

(`tsc` échouera tant que les routers ne sont pas créés — enchaîner Tasks 4 & 5 avant de committer si besoin, ou créer des stubs vides.)

---

## Task 4 : BFF — routes d'authentification

**Files:**
- Create: `apps/mb-admin/src/server/auth/router.ts`
- Create: `apps/mb-admin/src/server/mbApi.ts` (helper d'appel au mb-api)

- [ ] **Step 1 : `src/server/mbApi.ts`** (appel whoami contre un env donné)

```typescript
import ky, { HTTPError } from 'ky'

import type { Environment } from '@/server/environments'
import { mbApiUrlFor } from '@/server/environments'

export type WhoamiResult = { kind: 'user' | 'apiKey'; label: string }

export const fetchWhoami = async (
  environment: Environment,
  apiKey: string,
): Promise<WhoamiResult | null> => {
  try {
    const json = await ky
      .get(`${mbApiUrlFor(environment)}/auth/whoami`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        retry: 0,
        timeout: 5000,
      })
      .json<WhoamiResult>()
    return json
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) return null
    throw error
  }
}
```

- [ ] **Step 2 : `src/server/auth/router.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'

import { fetchWhoami } from '@/server/mbApi'
import { ENVIRONMENTS } from '@/server/environments'
import { clearSession, readSession, writeSession } from '@/server/session'

const apiKeySchema = z.string().regex(/^pilote_live_[A-Za-z0-9_-]+$/)

const confirmBodySchema = z.object({
  environment: z.enum(ENVIRONMENTS),
  apiKey: apiKeySchema,
})

export const authRouter = new Hono()

authRouter.get('/session', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json(null)
  return context.json({ environment: session.environment, label: session.label })
})

authRouter.post('/confirm', async (context) => {
  const parsed = confirmBodySchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) return context.json({ error: 'invalid_request' }, 400)

  const { environment, apiKey } = parsed.data
  let whoami: Awaited<ReturnType<typeof fetchWhoami>>
  try {
    whoami = await fetchWhoami(environment, apiKey)
  } catch {
    return context.json({ error: 'environment_unreachable' }, 502)
  }
  if (!whoami) return context.json({ error: 'invalid_key' }, 401)

  await writeSession(context, { environment, apiKey, label: whoami.label })
  context.header('Cache-Control', 'no-store')
  return context.json({ environment, label: whoami.label })
})

authRouter.post('/logout', (context) => {
  clearSession(context)
  return context.body(null, 204)
})
```

- [ ] **Step 3 : Vérif type + commit**

```bash
pnpm -F @pilote/mb-admin exec tsc --noEmit
git add apps/mb-admin/src/server
git commit -m "feat(mb-admin): BFF routes auth (confirm/session/logout) + whoami"
```

---

## Task 5 : BFF — proxy authentifié `/api/*`

**Files:** Create `apps/mb-admin/src/server/api/router.ts`

Le front appelle `/api/indicateurs`, `/api/referentiels/REF-X`, etc. Le BFF lit la session et relaie vers `mbApiUrlFor(environment)` en injectant le Bearer. Aucune méthode d'écriture n'est bloquée ici (la sécurité repose sur la clé) ; on ne relaie que les chemins connus.

- [ ] **Step 1 : `src/server/api/router.ts`**

```typescript
import { Hono } from 'hono'

import { mbApiUrlFor } from '@/server/environments'
import { readSession } from '@/server/session'

// Liste blanche des préfixes relayables (lecture + upsert indicateurs/référentiels).
const ALLOWED_PATHS = [/^indicateurs(\/.*)?$/, /^referentiels(\/.*)?$/, /^individus(\/.*)?$/]

const isAllowed = (path: string): boolean => ALLOWED_PATHS.some((re) => re.test(path))

export const apiRouter = new Hono()

apiRouter.all('/*', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)

  // chemin après /api/
  const subPath = context.req.path.replace(/^\/api\//, '')
  if (!isAllowed(subPath)) return context.json({ error: 'forbidden' }, 403)

  const url = new URL(`${mbApiUrlFor(session.environment)}/${subPath}`)
  url.search = new URL(context.req.url).search

  const init: RequestInit = {
    method: context.req.method,
    headers: {
      Authorization: `Bearer ${session.apiKey}`,
      ...(context.req.method !== 'GET' && context.req.method !== 'HEAD'
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    ...(context.req.method !== 'GET' && context.req.method !== 'HEAD'
      ? { body: await context.req.text() }
      : {}),
  }

  const upstream = await fetch(url, init)
  const headers = new Headers()
  const contentType = upstream.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  headers.set('Cache-Control', 'no-store')
  return new Response(upstream.body, { status: upstream.status, headers })
})
```

- [ ] **Step 2 : Vérif type + commit**

```bash
pnpm -F @pilote/mb-admin exec tsc --noEmit
git add apps/mb-admin/src/server/api/router.ts
git commit -m "feat(mb-admin): BFF proxy authentifié /api/* vers le mb-api de l'env"
```

---

## Task 6 : Front — module session + client API

**Files:**
- Create: `apps/mb-admin/src/session.ts`
- Create: `apps/mb-admin/src/api/client.ts`

- [ ] **Step 1 : `src/api/client.ts`** (ky vers le BFF, même origine, cookies inclus)

```typescript
import ky from 'ky'

export const bffClient = ky.create({
  prefixUrl: new URL('/api/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
})

export const authClient = ky.create({
  prefixUrl: new URL('/auth/', location.origin).toString(),
  credentials: 'include',
  retry: 0,
})
```

- [ ] **Step 2 : `src/session.ts`** (état d'auth côté client, jamais la clé)

```typescript
import { z } from 'zod'

import { authClient } from '@/api/client'

const ENVIRONMENTS = ['local', 'dev', 'prod'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

const sessionSchema = z
  .object({ environment: z.enum(ENVIRONMENTS), label: z.string() })
  .nullable()

export type SessionState = { environment: Environment; label: string } | null

export type SessionStore = {
  current: SessionState
  bootstrap: () => Promise<void>
  confirm: (environment: Environment, apiKey: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const state: { current: SessionState } = { current: null }

export const session: SessionStore = {
  get current() {
    return state.current
  },
  async bootstrap() {
    try {
      const json = await authClient.get('session').json()
      state.current = sessionSchema.parse(json)
    } catch {
      state.current = null
    }
  },
  async confirm(environment, apiKey) {
    try {
      const json = await authClient.post('confirm', { json: { environment, apiKey } }).json()
      state.current = sessionSchema.parse(json)
      return { ok: true }
    } catch (error) {
      const status = (error as { response?: Response }).response?.status
      if (status === 401) return { ok: false, error: 'invalid_key' }
      if (status === 502) return { ok: false, error: 'environment_unreachable' }
      return { ok: false, error: 'unknown' }
    }
  },
  async logout() {
    try {
      await authClient.post('logout')
    } finally {
      state.current = null
    }
  },
}
```

- [ ] **Step 3 : Vérif type + commit**

```bash
git add apps/mb-admin/src/session.ts apps/mb-admin/src/api/client.ts
git commit -m "feat(mb-admin): module session client + client BFF"
```

---

## Task 7 : Front — composants UI partagés (depuis mb-webapp) + carte « à barre » + header Marianne

**Files:**
- Copier depuis `apps/mb-webapp/src/components/ui/` vers `apps/mb-admin/src/components/ui/` : `Marianne.tsx`, `Button.tsx`, `Typography.tsx`, `Card.tsx`, `Table.tsx`, `FormField.tsx`, `SearchField.tsx`, `Select.tsx`, `EmptyState.tsx`, `Page.tsx`, `Section.tsx` (et leurs dépendances directes).
- Create: `apps/mb-admin/src/components/ui/BarCard.tsx` (carte signature à barre)
- Create: `apps/mb-admin/src/components/AdminHeader.tsx` (header Marianne + rappel env/clé)
- Create: `apps/mb-admin/src/components/ui/FadeIn.tsx` (animation d'entrée)

- [ ] **Step 1 : Copier les composants UI réutilisés**

Copier les fichiers listés à l'identique. Adapter uniquement les imports cassés (ils utilisent `@/lib/clsxm`, déjà présent). Retirer toute dépendance non copiée (ex. `cmdk`, `echarts`) si un composant copié en importe — ne copier que les composants réellement utilisés par les écrans de ce plan (`Button`, `Marianne`, `Typography`, `Table`, `Card`, `FormField`, `SearchField`, `Select`, `EmptyState`, `Page`).

- [ ] **Step 2 : `src/components/ui/FadeIn.tsx`** (fade-in / stagger via Tailwind)

```tsx
import type { ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type FadeInProps = { children: ReactNode; delayMs?: number; className?: string }

export function FadeIn({ children, delayMs = 0, className }: FadeInProps) {
  return (
    <div
      className={clsxm('motion-safe:animate-[fadeInUp_.4s_ease-out_both]', className)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
```

Ajouter le keyframe dans `src/index.css` (sous le `@theme`) :

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 3 : `src/components/ui/BarCard.tsx`** (carte cliquable, contenu centré, flèche à droite, barre signature)

```tsx
import { ArrowRight } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type BarCardProps = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: ReactNode
  tone?: 'primary' | 'danger'
  topRibbon?: ReactNode
  onClick?: () => void
}

export function BarCard({
  icon: Icon,
  title,
  description,
  tone = 'primary',
  topRibbon,
  onClick,
}: BarCardProps) {
  const danger = tone === 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsxm(
        'group flex w-full max-w-[280px] flex-col overflow-hidden border bg-surface text-left',
        'transition-all duration-150 hover:-translate-y-0.5',
        danger ? 'border-[#f0d2d2] hover:border-accent' : 'border-border hover:border-primary',
      )}
    >
      {topRibbon ? (
        <div className="flex items-center justify-center gap-1.5 bg-accent px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
          {topRibbon}
        </div>
      ) : (
        <div className="h-[30px]" />
      )}
      <div className="flex flex-1 flex-col items-center px-6 pt-1.5 text-center">
        <span
          className={clsxm(
            'flex size-14 items-center justify-center rounded-full',
            danger ? 'bg-[#fdecec]' : 'bg-surface-tinted',
          )}
        >
          <Icon className={clsxm('size-6', danger ? 'text-accent' : 'text-primary')} />
        </span>
        <span className={clsxm('mt-4 text-lg font-extrabold', danger && 'text-accent')}>
          {title}
        </span>
        <span className={clsxm('mt-2.5 text-sm leading-relaxed', danger ? 'text-[#a01419]' : 'text-text-muted')}>
          {description}
        </span>
      </div>
      <div className="flex justify-end px-6 pb-4 pt-6">
        <ArrowRight className={clsxm('size-5', danger ? 'text-accent' : 'text-primary')} />
      </div>
      <div className={clsxm('h-[5px]', danger ? 'bg-accent' : 'bg-primary')} />
    </button>
  )
}
```

> Vérifier dans `index.css` la présence d'un token `--color-accent` rouge (`#c9191e`) ; sinon, l'ajouter au `@theme` (`--color-accent: #c9191e;`).

- [ ] **Step 4 : `src/components/AdminHeader.tsx`** (header Marianne sticky + rappel env/clé)

```tsx
import { Link } from '@tanstack/react-router'

import { Marianne } from '@/components/ui/Marianne'
import { clsxm } from '@/lib/clsxm'
import type { SessionState } from '@/session'

const ENV_LABEL: Record<string, string> = { local: 'Local', dev: 'Dev', prod: 'Prod' }

export function AdminHeader({ session, onLogout }: { session: SessionState; onLogout?: () => void }) {
  const isProd = session?.environment === 'prod'
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3 sm:px-10">
        <Link to="/" className="flex items-stretch gap-5 transition-opacity hover:opacity-80">
          <Marianne />
          <span className="hidden w-px bg-border sm:block" aria-hidden />
          <span className="hidden flex-col justify-center gap-0.5 sm:flex">
            <span className="text-xl font-bold uppercase leading-none tracking-tight">Pilote MB</span>
            <span className="text-sm text-text-muted">Console d'administration</span>
          </span>
        </Link>
        {session ? (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={clsxm(
                'rounded-full px-3 py-1 font-extrabold uppercase tracking-wide',
                isProd ? 'bg-accent text-white' : 'border border-border text-text-muted',
              )}
            >
              {isProd ? '⚠ Prod' : ENV_LABEL[session.environment]}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-text-muted">
              🔑 {session.label}
            </span>
            <button type="button" onClick={onLogout} className="rounded-md border border-primary/30 px-3 py-1 font-semibold text-primary">
              Changer
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
```

- [ ] **Step 5 : Vérif type + commit**

```bash
pnpm -F @pilote/mb-admin exec tsc --noEmit
git add apps/mb-admin/src/components apps/mb-admin/src/index.css
git commit -m "feat(mb-admin): UI partagés + BarCard + header Marianne + FadeIn"
```

---

## Task 8 : Front — routing, layout racine, garde de session

**Files:**
- Create: `apps/mb-admin/src/routes/__root.tsx`
- Create: `apps/mb-admin/src/routes/index.tsx` (landing / choix d'env)
- Create: `apps/mb-admin/src/routes/cle.$environment.tsx` (saisie clé par env)
- Create: `apps/mb-admin/src/routes/_authed.tsx` (garde : session requise)
- Create: `apps/mb-admin/src/routes/_authed/fonctionnalites.tsx`

Contexte routeur : `{ queryClient, session }` (typé via `createRootRouteWithContext`).

- [ ] **Step 1 : `__root.tsx`**

```tsx
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, useNavigate } from '@tanstack/react-router'

import { AdminHeader } from '@/components/AdminHeader'
import type { SessionStore } from '@/session'

export type RouterContext = { queryClient: QueryClient; session: SessionStore }

export const Route = createRootRouteWithContext<RouterContext>()({ component: RootComponent })

function RootComponent() {
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <AdminHeader
        session={session.current}
        onLogout={() => {
          void session.logout().then(() => navigate({ to: '/' }))
        }}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2 : `_authed.tsx`** (garde : redirige vers `/` si pas de session)

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.session.current) throw redirect({ to: '/' })
  },
  component: () => <Outlet />,
})
```

- [ ] **Step 3 : `index.tsx`** (landing + tuiles env, cf. maquette `env-select-v4`)

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FlaskConical, Laptop, Siren } from 'lucide-react'

import { BarCard } from '@/components/ui/BarCard'
import { FadeIn } from '@/components/ui/FadeIn'

export const Route = createFileRoute('/')({ component: LandingComponent })

function LandingComponent() {
  const navigate = useNavigate()
  const go = (environment: 'local' | 'dev' | 'prod') =>
    navigate({ to: '/cle/$environment', params: { environment } })

  return (
    <div className="flex flex-col items-center">
      <FadeIn>
        <h1 className="max-w-xl text-center text-3xl font-extrabold leading-tight">
          Sur quel environnement souhaitez-vous travailler ?
        </h1>
        <p className="mt-3 text-center text-text-muted">Sélectionnez la cible de vos modifications.</p>
      </FadeIn>
      <div className="mt-9 flex flex-wrap justify-center gap-6">
        <FadeIn delayMs={60}>
          <BarCard icon={Laptop} title="Local" description="Votre machine de développement. Idéal pour tester sans risque." onClick={() => go('local')} />
        </FadeIn>
        <FadeIn delayMs={120}>
          <BarCard icon={FlaskConical} title="Dev" description="Environnement de recette partagé par l'équipe." onClick={() => go('dev')} />
        </FadeIn>
        <FadeIn delayMs={180}>
          <BarCard
            icon={Siren}
            tone="danger"
            topRibbon="⚠ Données réelles"
            title="Prod"
            description={<>Production. Toute modification est appliquée <b>immédiatement</b> en réel.</>}
            onClick={() => go('prod')}
          />
        </FadeIn>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : `cle.$environment.tsx`** (écran de saisie de clé par env, design split-B)

```tsx
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Route as RootRoute } from '@/routes/__root'

const ENV_LABEL = { local: 'Local', dev: 'Dev', prod: 'Prod' } as const

export const Route = createFileRoute('/cle/$environment')({
  beforeLoad: ({ params }) => {
    if (!['local', 'dev', 'prod'].includes(params.environment)) {
      throw new Error('Environnement inconnu')
    }
  },
  component: KeyComponent,
})

function KeyComponent() {
  const { environment } = useParams({ from: '/cle/$environment' })
  const env = environment as 'local' | 'dev' | 'prod'
  const { session } = RootRoute.useRouteContext()
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isProd = env === 'prod'

  const submit = async () => {
    setPending(true)
    setError(null)
    const result = await session.confirm(env, apiKey.trim())
    setPending(false)
    if (result.ok) {
      void navigate({ to: '/fonctionnalites' })
      return
    }
    setError(
      result.error === 'invalid_key'
        ? `Clé invalide pour l'environnement ${ENV_LABEL[env]}.`
        : result.error === 'environment_unreachable'
          ? `Environnement ${ENV_LABEL[env]} injoignable.`
          : 'Une erreur est survenue.',
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl overflow-hidden rounded-xl border border-border sm:grid-cols-2">
      <div className={`flex flex-col justify-center p-8 text-white ${isProd ? 'bg-accent' : 'bg-primary'}`}>
        <div className="text-xs font-bold uppercase tracking-widest opacity-70">Environnement</div>
        <div className="mt-2 text-2xl font-extrabold">{ENV_LABEL[env]}</div>
        <p className="mt-3 text-sm opacity-90">
          {isProd
            ? 'Attention : vous configurez la PRODUCTION. Les modifications seront appliquées sur les données réelles.'
            : 'Saisissez la clé API de cet environnement pour démarrer.'}
        </p>
      </div>
      <div className="flex flex-col justify-center gap-3 p-8">
        <label htmlFor="apiKey" className="text-xs font-semibold">Clé API</label>
        <input
          id="apiKey"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="pilote_live_…"
          className="rounded-md border border-border px-3 py-2.5 font-mono text-sm focus:border-primary focus:outline-none"
        />
        {error ? <p className="text-sm font-medium text-accent">{error}</p> : null}
        <Button type="button" disabled={pending || apiKey.trim().length === 0} onClick={() => void submit()}>
          {pending ? 'Validation…' : 'Confirmer la clé'}
        </Button>
        <p className="text-xs text-text-subtle">🔒 La clé est validée puis stockée chiffrée côté serveur, jamais exposée au navigateur.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : `_authed/fonctionnalites.tsx`** (choix de fonctionnalité)

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BarChart3, FolderTree } from 'lucide-react'

import { BarCard } from '@/components/ui/BarCard'
import { FadeIn } from '@/components/ui/FadeIn'

export const Route = createFileRoute('/_authed/fonctionnalites')({ component: FeaturesComponent })

function FeaturesComponent() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center">
      <FadeIn>
        <h1 className="text-center text-3xl font-extrabold">Que souhaitez-vous gérer ?</h1>
      </FadeIn>
      <div className="mt-9 flex flex-wrap justify-center gap-6">
        <FadeIn delayMs={60}>
          <BarCard
            icon={BarChart3}
            title="Gérer les indicateurs"
            description="Créer ou modifier un indicateur et ses référentiels liés."
            onClick={() => navigate({ to: '/indicateurs' })}
          />
        </FadeIn>
        <FadeIn delayMs={120}>
          <BarCard
            icon={FolderTree}
            title="Gérer les référentiels"
            description="Créer ou modifier un référentiel et ses individus."
            onClick={() => navigate({ to: '/referentiels' })}
          />
        </FadeIn>
      </div>
    </div>
  )
}
```

> Les routes `/indicateurs` et `/referentiels` sont créées dans les Plans 2 et 3. En attendant, le `tsr generate` peut signaler des cibles de navigation inconnues : créer des stubs vides `_authed/indicateurs/index.tsx` et `_authed/referentiels/index.tsx` rendant un `EmptyState` « À venir », à remplacer par les Plans 2/3.

- [ ] **Step 6 : Générer les routes, lint, commit**

```bash
pnpm -F @pilote/mb-admin routes:generate
pnpm -F @pilote/mb-admin lint
git add apps/mb-admin/src
git commit -m "feat(mb-admin): routing, layout Marianne, landing env, saisie clé, fonctionnalités"
```

---

## Task 9 : Vérification manuelle de bout en bout

**Files:** aucun (validation).

- [ ] **Step 1 : Lancer mb-api en local**

Run : `pnpm -F @pilote/mb-api dev` (avec une base locale seedée + au moins une clé API générée via `scripts/generate-api-key.ts`).

- [ ] **Step 2 : Configurer `.env` de mb-admin**

Copier `.env.example` → `.env`, renseigner `SESSION_SECRET` (≥32 car., non « change-me »), `API_BASE_URL_LOCAL=https://mb-api.localhost`.

- [ ] **Step 3 : Lancer mb-admin**

Run : `pnpm -F @pilote/mb-admin dev` → ouvrir `https://mb-admin.localhost`.

- [ ] **Step 4 : Parcours**

Vérifier : landing affiche les 3 tuiles (fade-in) → clic « Local » → écran clé → saisir une clé valide → arrivée sur « Que souhaitez-vous gérer ? », header affiche l'env + label. Tester une clé invalide → message d'erreur, pas de session. Tester « Changer » → retour landing, session détruite. Recharger après login → toujours connecté (bootstrap lit la session).

- [ ] **Step 5 : Vérifs sécu**

- Le cookie `mbadmin_session` est `HttpOnly` (DevTools → Application → Cookies).
- Aucune trace de la clé API dans le HTML, le JS, le state ou les réponses `/auth/session` (elle ne doit jamais sortir du BFF).
- `GET /api/indicateurs` sans session → 401.

---

## Self-review (auteur)

- **Couverture spec §2** (app, BFF, env vars, session) : Tasks 2–6. **§3.1 whoami** : Task 1. **§4 parcours (1–3)** : Tasks 8. **§5 design** (Marianne, layout centré, BarCard, Lucide, fade-in) : Tasks 7–8. **§7 erreurs** (clé invalide, env injoignable, session expirée) : Tasks 4, 6, 8. **§8 tests** : Task 1 (back), pas de tests front (convention).
- **Non couvert ici (volontaire)** : listing + formulaires indicateurs (Plan 2), référentiels (Plan 3), garde-fou Prod (Plan 2, optionnel).
- **Dépendances inter-tâches** : `tsc` ne passera vraiment qu'une fois Tasks 4 et 5 présents (routers importés par `app.ts`) → committer Task 3 après stubs ou enchaîner 3→4→5 avant vérif type. Idem Task 8 dépend de Task 6 (`session`) et Task 7 (composants).
- **Cohérence des noms** : `session` (store) / `SessionStore` / `AdminSession` (payload serveur) distincts et cohérents ; `Environment`/`ENVIRONMENTS` partagés conceptuellement entre serveur (`src/server/environments.ts`) et client (`src/session.ts`) — dupliqués volontairement (pas de partage code client/serveur), valeurs identiques.
