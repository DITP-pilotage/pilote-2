# Socle analytics Matomo KPilote — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le socle d'analytics de KPilote — un noyau de mesure pur et partagé, un émetteur navigateur sans `matomo.js`, et l'envoi automatique des page views et des erreurs de mutation vers Matomo.

**Architecture :** Un noyau pur dans `packages/kpilote-shared/src/analytics/` traduit des événements typés en requêtes de l'API de tracking HTTP de Matomo, sans jamais toucher aux globales du navigateur. `apps/kpilote-webapp` le consomme via un émetteur `sendBeacon` d'environ 1 Ko, branché sur deux sources automatiques : la résolution de navigation du router TanStack pour les page views, et le `MutationCache` de React Query pour les erreurs.

**Tech Stack :** TypeScript 5.9, Vitest 4, TanStack Router 1.170, TanStack Query 5.101, ky 2, pnpm 10.

**Spec :** `docs/architecture/decisions/0001-analytics-matomo-kpilote.md` (ADR — à lire avant de commencer, il porte le *pourquoi* de chaque décision ci-dessous).

**Ticket :** PIL-1712 « Lot 1 - Mettre en place le socle Matomo ».

## Global Constraints

- **Le noyau est pur.** Aucun `window`, `navigator`, `document` ni `import.meta.env` dans `packages/kpilote-shared/src/analytics/schema.ts`, `buildRequest.ts` et `events.ts`. La configuration arrive en argument.
- **`track()` ne jette jamais et n'attend jamais.** Retour `void`, corps enveloppé dans un `try/catch` qui avale tout.
- **Aucune écriture dans le terminal.** Ni cookie, ni `localStorage`, ni `sessionStorage`.
- **Aucune donnée personnelle.** Pas d'e-mail, pas de nom, pas de texte saisi, pas de contenu importé, pas d'identifiant utilisateur.
- **TypeScript strict.** `strict`, `noUncheckedIndexedAccess` et `exactOptionalPropertyTypes` sont actifs dans `packages/kpilote-shared/tsconfig.json` : un accès indexé rend `T | undefined`, et une propriété optionnelle n'accepte pas `undefined` explicite. Utiliser le spread conditionnel plutôt que d'affecter `undefined`.
- **Nommage.** Verbes et termes techniques en anglais, noms d'entités métier en français.
- **Gestionnaire de paquets.** `pnpm` uniquement, jamais `npm`.
- **Avant chaque commit :** lancer le lint du paquet concerné.
- **Messages de commit :** pas de ligne `Co-Authored-By`.

## Hors périmètre — décidé, à ne pas improviser

- **Aucun moteur Node**, aucun middleware dans `kpilote-api`, aucune catégorie `kpilote.api`, aucun batching, aucune interface `AnalyticsTransport` abstraite.
- **Aucun événement des Lots 2 à 5.** Ce plan livre le mécanisme et `kpilote.error` seulement. Les événements métier arriveront dans leurs tickets et n'auront plus qu'à ajouter une entrée au catalogue et un `meta` sur leur mutation.
- **`kpilote-admin` est exclu**, contrairement à ce que suggère le libellé du Lot 1. Raison : l'app n'a aucun fichier `src/env.ts` ni aucune variable `VITE_*` — tout passe par sa configuration serveur — et surtout elle bascule entre trois environnements d'API (`API_BASE_URL_LOCAL` / `_DEV` / `_PROD`) depuis une même instance, ce qui rendrait la dimension `environment` fausse. À traiter dans un ticket dédié, une fois tranché ce que `environment` doit signifier côté admin.

---

## Structure des fichiers

**Créés**

| Fichier | Responsabilité |
| --- | --- |
| `packages/kpilote-shared/vitest.config.ts` | Configuration Vitest du paquet (environnement `node`) |
| `packages/kpilote-shared/src/analytics/schema.ts` | Types, catégories et actions autorisées |
| `packages/kpilote-shared/src/analytics/buildRequest.ts` | Traduction événement → query string Matomo |
| `packages/kpilote-shared/src/analytics/buildRequest.test.ts` | Tests du builder |
| `packages/kpilote-shared/src/analytics/events.ts` | Catalogue typé des événements |
| `packages/kpilote-shared/src/analytics/events.test.ts` | Garde-fou sur le catalogue |
| `packages/kpilote-shared/src/analytics/index.ts` | Barrel du noyau pur |
| `packages/kpilote-shared/src/analytics/browser.ts` | Émetteur navigateur |
| `packages/kpilote-shared/src/analytics/browser.test.ts` | Tests de l'émetteur |
| `apps/kpilote-webapp/src/analytics.ts` | Instance applicative et câblage des interrupteurs |

**Modifiés**

| Fichier | Modification |
| --- | --- |
| `packages/kpilote-shared/package.json` | Script `test`, devDependency `vitest`, exports `./analytics` et `./analytics/browser` |
| `.github/workflows/testAndLint.yml` | Job `test-kpilote-shared` |
| `apps/kpilote-webapp/src/env.ts` | Variables Matomo optionnelles |
| `apps/kpilote-webapp/.env.example` | Documentation des variables |
| `apps/kpilote-webapp/src/main.tsx` | Souscription au router, `MutationCache` |
| `apps/kpilote-webapp/src/server/app.ts` | `connect-src` de la CSP |

---

## Task 1: Outillage de test de `kpilote-shared`

**Contexte —** `packages/kpilote-shared` n'a aujourd'hui aucun script `test` et aucune configuration Vitest. Les deux configurations existantes (`apps/kpilote-webapp/vite.config.ts` et `apps/kpilote-api/vitest.config.ts`) ne globent que dans leur propre dossier d'app. Conséquence vérifiée : `packages/kpilote-shared/src/error.test.ts` existe et n'est **jamais exécuté**. Sans cette tâche, tous les tests écrits par les tâches suivantes seraient décoratifs.

**Files:**
- Create: `packages/kpilote-shared/vitest.config.ts`
- Modify: `packages/kpilote-shared/package.json`
- Modify: `.github/workflows/testAndLint.yml`

**Interfaces:**
- Consumes: rien
- Produces: la commande `pnpm -F @pilote/kpilote-shared test`, utilisée par toutes les tâches suivantes.

- [ ] **Step 1: Créer la configuration Vitest**

Environnement `node` : le noyau est pur et l'émetteur se teste par injection, donc aucun besoin de `jsdom`.

```ts
// packages/kpilote-shared/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 2: Ajouter le script et la dépendance**

Dans `packages/kpilote-shared/package.json`, ajouter `"test": "vitest run"` et `"test:watch": "vitest"` au bloc `scripts`, et `"vitest": "^4.1.9"` au bloc `devDependencies` (aligné sur la version utilisée par `apps/kpilote-webapp`).

```bash
pnpm install
```

- [ ] **Step 3: Vérifier que le test orphelin tourne enfin**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: PASS, et la sortie mentionne `src/error.test.ts`. Si aucun fichier n'est trouvé, la configuration n'est pas prise en compte.

- [ ] **Step 4: Ajouter le job CI**

Le filtre `kpilote-shared` existe déjà dans `.github/workflows/testAndLint.yml`, mais aucun job de test n'y est branché. Insérer ce job juste avant le job `lint-kpilote-shared`, en suivant le patron de `test-kpilote-webapp` :

```yaml
  test-kpilote-shared:
    name: Run tests for kpilote-shared
    needs: changes
    if: needs.changes.outputs['kpilote-shared'] == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node and packages
        uses: ./.github/actions/setupNodeAndPackages
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Run test command
        run: pnpm test
        env:
          APP_PACKAGE: '@pilote/kpilote-shared'
```

- [ ] **Step 5: Vérifier le lint et commiter**

```bash
APP_PACKAGE=@pilote/kpilote-shared pnpm lint
git add packages/kpilote-shared/vitest.config.ts packages/kpilote-shared/package.json .github/workflows/testAndLint.yml pnpm-lock.yaml
git commit -m "chore(kpilote-shared): execute les tests du package en local et en CI"
```

---

## Task 2: Schéma et builder de requête

**Contexte —** Matomo n'offre que quatre champs pour un événement (`e_c`, `e_a`, `e_n`, `e_v`), et le quota de dimensions custom disponible sur le site KPilote de `stats.beta.gouv.fr` est inconnu à ce jour. Le builder résout ça avec une table de correspondance `clé de contexte → numéro de slot` : une clé qui a un slot part en `dimensionN`, une clé sans slot est repliée dans `e_n` de façon déterministe. On démarre donc avec une table vide, et la remplir plus tard ne touchera aucun site d'appel.

**Files:**
- Create: `packages/kpilote-shared/src/analytics/schema.ts`
- Create: `packages/kpilote-shared/src/analytics/buildRequest.ts`
- Create: `packages/kpilote-shared/src/analytics/index.ts`
- Test: `packages/kpilote-shared/src/analytics/buildRequest.test.ts`
- Modify: `packages/kpilote-shared/package.json`

**Interfaces:**
- Consumes: `pnpm -F @pilote/kpilote-shared test` (Task 1)
- Produces:
  - `type AnalyticsCategory`, `type AnalyticsAction`, `type AnalyticsContexte`, `type AnalyticsEvent`, `type AnalyticsPageView`, `type AnalyticsConfig`
  - `buildEventRequest(event: AnalyticsEvent, config: AnalyticsConfig): string`
  - `buildPageViewRequest(pageView: AnalyticsPageView, config: AnalyticsConfig): string`
  - Le sous-chemin d'import `@pilote/kpilote-shared/analytics`

- [ ] **Step 1: Écrire le schéma**

```ts
// packages/kpilote-shared/src/analytics/schema.ts
export const ANALYTICS_CATEGORIES = [
  'kpilote.dashboard',
  'kpilote.indicateur',
  'kpilote.collection',
  'kpilote.commentaire',
  'kpilote.import',
  'kpilote.command_palette',
  'kpilote.admin',
  'kpilote.error',
] as const

export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number]

export const ANALYTICS_ACTIONS = [
  'view',
  'open',
  'select',
  'switch',
  'filter',
  'search',
  'submit',
  'success',
  'error',
] as const

export type AnalyticsAction = (typeof ANALYTICS_ACTIONS)[number]

export type AnalyticsContexte = Record<string, string | number | boolean | undefined>

export type AnalyticsEvent = {
  category: AnalyticsCategory
  action: AnalyticsAction
  name: string
  value?: number
  contexte?: AnalyticsContexte
}

export type AnalyticsPageView = {
  path: string
  title?: string
  contexte?: AnalyticsContexte
}

export type AnalyticsConfig = {
  matomoUrl: string
  siteId: string
  appUrl: string
  dimensionSlots?: Record<string, number>
  globalContexte?: AnalyticsContexte
}
```

- [ ] **Step 2: Écrire les tests du builder (ils doivent échouer)**

```ts
// packages/kpilote-shared/src/analytics/buildRequest.test.ts
import { describe, expect, it } from 'vitest'

import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig } from './schema'

const config: AnalyticsConfig = {
  matomoUrl: 'https://stats.beta.gouv.fr',
  siteId: '42',
  appUrl: 'https://kpilote.example',
}

const params = (query: string): URLSearchParams => new URLSearchParams(query)

describe('buildEventRequest', () => {
  it('envoie les paramètres obligatoires de Matomo', () => {
    const resultat = params(
      buildEventRequest({ category: 'kpilote.error', action: 'error', name: 'mutation' }, config),
    )

    expect(resultat.get('idsite')).toBe('42')
    expect(resultat.get('rec')).toBe('1')
    expect(resultat.get('apiv')).toBe('1')
    expect(resultat.get('e_c')).toBe('kpilote.error')
    expect(resultat.get('e_a')).toBe('error')
    expect(resultat.get('e_n')).toBe('mutation')
  })

  it("replie le contexte sans slot dans e_n, trié par clé", () => {
    const resultat = params(
      buildEventRequest(
        {
          category: 'kpilote.indicateur',
          action: 'open',
          name: 'indicateur.open',
          contexte: { source: 'dashboard', entity_id: 'IND-506' },
        },
        config,
      ),
    )

    expect(resultat.get('e_n')).toBe('indicateur.open?entity_id=IND-506&source=dashboard')
  })

  it('envoie une clé en dimension quand elle a un slot, et la retire de e_n', () => {
    const resultat = params(
      buildEventRequest(
        {
          category: 'kpilote.indicateur',
          action: 'open',
          name: 'indicateur.open',
          contexte: { source: 'dashboard', entity_id: 'IND-506' },
        },
        { ...config, dimensionSlots: { source: 3 } },
      ),
    )

    expect(resultat.get('dimension3')).toBe('dashboard')
    expect(resultat.get('e_n')).toBe('indicateur.open?entity_id=IND-506')
  })

  it('fusionne le contexte global sous le contexte de l’événement', () => {
    const resultat = params(
      buildEventRequest(
        { category: 'kpilote.error', action: 'error', name: 'mutation', contexte: { app_area: 'admin' } },
        { ...config, globalContexte: { app_area: 'webapp', environment: 'production' } },
      ),
    )

    expect(resultat.get('e_n')).toBe('mutation?app_area=admin&environment=production')
  })

  it('ignore les valeurs indéfinies du contexte', () => {
    const resultat = params(
      buildEventRequest(
        { category: 'kpilote.dashboard', action: 'search', name: 'dashboard.search', contexte: { has_query: true, source: undefined } },
        config,
      ),
    )

    expect(resultat.get('e_n')).toBe('dashboard.search?has_query=true')
  })

  it("n’envoie e_v que si une valeur numérique est fournie", () => {
    expect(
      params(buildEventRequest({ category: 'kpilote.error', action: 'error', name: 'mutation' }, config)).has('e_v'),
    ).toBe(false)

    expect(
      params(
        buildEventRequest({ category: 'kpilote.error', action: 'error', name: 'mutation', value: 500 }, config),
      ).get('e_v'),
    ).toBe('500')
  })
})

describe('buildPageViewRequest', () => {
  it("construit l’URL depuis l’URL applicative et le motif de route", () => {
    const resultat = params(buildPageViewRequest({ path: '/indicateurs/$id' }, config))

    expect(resultat.get('url')).toBe('https://kpilote.example/indicateurs/$id')
    expect(resultat.get('idsite')).toBe('42')
    expect(resultat.get('rec')).toBe('1')
  })

  it("n’envoie action_name que si un titre est fourni", () => {
    expect(params(buildPageViewRequest({ path: '/' }, config)).has('action_name')).toBe(false)
    expect(params(buildPageViewRequest({ path: '/', title: 'Accueil' }, config)).get('action_name')).toBe('Accueil')
  })

  it("replie le contexte sans slot dans la query string de l’URL", () => {
    const resultat = params(
      buildPageViewRequest({ path: '/indicateurs/$id' }, { ...config, globalContexte: { app_area: 'webapp' } }),
    )

    expect(resultat.get('url')).toBe('https://kpilote.example/indicateurs/$id?app_area=webapp')
  })
})
```

- [ ] **Step 3: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: FAIL — `Failed to resolve import "./buildRequest"`.

- [ ] **Step 4: Écrire le builder**

```ts
// packages/kpilote-shared/src/analytics/buildRequest.ts
import type { AnalyticsConfig, AnalyticsContexte, AnalyticsEvent, AnalyticsPageView } from './schema'

type ContexteSepare = {
  dimensions: Record<string, string>
  reste: Array<[string, string]>
}

const separerContexte = (
  contexte: AnalyticsContexte,
  slots: Record<string, number>,
): ContexteSepare => {
  const dimensions: Record<string, string> = {}
  const reste: Array<[string, string]> = []

  for (const [cle, valeur] of Object.entries(contexte)) {
    if (valeur === undefined) continue
    const slot = slots[cle]
    if (slot === undefined) reste.push([cle, String(valeur)])
    else dimensions[`dimension${slot}`] = String(valeur)
  }

  reste.sort(([gauche], [droite]) => gauche.localeCompare(droite))
  return { dimensions, reste }
}

const encoderReste = (reste: Array<[string, string]>): string =>
  reste.map(([cle, valeur]) => `${cle}=${valeur}`).join('&')

const parametresDeBase = (config: AnalyticsConfig): Record<string, string> => ({
  idsite: config.siteId,
  rec: '1',
  apiv: '1',
})

export const buildEventRequest = (event: AnalyticsEvent, config: AnalyticsConfig): string => {
  const { dimensions, reste } = separerContexte(
    { ...config.globalContexte, ...event.contexte },
    config.dimensionSlots ?? {},
  )
  const suffixe = encoderReste(reste)

  const params = new URLSearchParams({
    ...parametresDeBase(config),
    ...dimensions,
    e_c: event.category,
    e_a: event.action,
    e_n: suffixe ? `${event.name}?${suffixe}` : event.name,
  })

  if (event.value !== undefined) params.set('e_v', String(event.value))

  return params.toString()
}

export const buildPageViewRequest = (
  pageView: AnalyticsPageView,
  config: AnalyticsConfig,
): string => {
  const { dimensions, reste } = separerContexte(
    { ...config.globalContexte, ...pageView.contexte },
    config.dimensionSlots ?? {},
  )
  const suffixe = encoderReste(reste)

  const params = new URLSearchParams({
    ...parametresDeBase(config),
    ...dimensions,
    url: suffixe
      ? `${config.appUrl}${pageView.path}?${suffixe}`
      : `${config.appUrl}${pageView.path}`,
  })

  if (pageView.title !== undefined) params.set('action_name', pageView.title)

  return params.toString()
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: PASS — les 9 tests de `buildRequest.test.ts` passent (le fichier `src/error.test.ts` du paquet tourne aussi, c'est normal).

- [ ] **Step 6: Créer le barrel et l'export du paquet**

```ts
// packages/kpilote-shared/src/analytics/index.ts
export * from './schema'
export * from './buildRequest'
```

Dans `packages/kpilote-shared/package.json`, ajouter au bloc `exports` :

```json
    "./analytics": {
      "types": "./src/analytics/index.ts",
      "default": "./src/analytics/index.ts"
    }
```

- [ ] **Step 7: Vérifier le lint et commiter**

```bash
APP_PACKAGE=@pilote/kpilote-shared pnpm lint
git add packages/kpilote-shared/src/analytics packages/kpilote-shared/package.json
git commit -m "feat(analytics): schema d'evenements et builder de requete Matomo"
```

---

## Task 3: Catalogue d'événements

**Contexte —** Le catalogue est la seule source de vérité du plan de taggage : l'appelant ne choisit jamais la catégorie, l'action ni le nom d'un événement, il appelle une fabrique. Ce lot ne peuple que `kpilote.error` ; les Lots 2 à 5 ajouteront leurs entrées ici sans rien changer d'autre.

**Files:**
- Create: `packages/kpilote-shared/src/analytics/events.ts`
- Test: `packages/kpilote-shared/src/analytics/events.test.ts`
- Modify: `packages/kpilote-shared/src/analytics/index.ts`

**Interfaces:**
- Consumes: `AnalyticsEvent`, `AnalyticsCategory`, `AnalyticsAction` (Task 2)
- Produces: `analyticsEvents.error.mutation({ mutation: string; status: string }): AnalyticsEvent`

- [ ] **Step 1: Écrire le test (il doit échouer)**

```ts
// packages/kpilote-shared/src/analytics/events.test.ts
import { describe, expect, it } from 'vitest'

import { analyticsEvents } from './events'
import { ANALYTICS_ACTIONS, ANALYTICS_CATEGORIES } from './schema'

describe('analyticsEvents', () => {
  it('décrit une erreur de mutation', () => {
    expect(
      analyticsEvents.error.mutation({ mutation: 'creerCommentaire', status: '500' }),
    ).toEqual({
      category: 'kpilote.error',
      action: 'error',
      name: 'mutation.error',
      contexte: { mutation: 'creerCommentaire', status: '500' },
    })
  })

  it("n'expose que des catégories et des actions du schéma", () => {
    const evenements = Object.values(analyticsEvents).flatMap((groupe) =>
      Object.values(groupe).map((fabrique) =>
        (fabrique as (contexte: Record<string, string>) => ReturnType<typeof analyticsEvents.error.mutation>)({}),
      ),
    )

    expect(evenements.length).toBeGreaterThan(0)
    for (const evenement of evenements) {
      expect(ANALYTICS_CATEGORIES).toContain(evenement.category)
      expect(ANALYTICS_ACTIONS).toContain(evenement.action)
      expect(evenement.name.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: FAIL — `Failed to resolve import "./events"`.

- [ ] **Step 3: Écrire le catalogue**

```ts
// packages/kpilote-shared/src/analytics/events.ts
import type { AnalyticsEvent } from './schema'

export type ErreurMutationContexte = {
  mutation: string
  status: string
}

export const analyticsEvents = {
  error: {
    mutation: (contexte: ErreurMutationContexte): AnalyticsEvent => ({
      category: 'kpilote.error',
      action: 'error',
      name: 'mutation.error',
      contexte: { ...contexte },
    }),
  },
} as const
```

Ajouter `export * from './events'` à `packages/kpilote-shared/src/analytics/index.ts`.

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: PASS — les 2 tests de `events.test.ts` s'ajoutent aux 9 précédents.

- [ ] **Step 5: Vérifier le lint et commiter**

```bash
APP_PACKAGE=@pilote/kpilote-shared pnpm lint
git add packages/kpilote-shared/src/analytics
git commit -m "feat(analytics): catalogue type des evenements"
```

---

## Task 4: Émetteur navigateur

**Contexte —** On ne charge pas `matomo.js` (22 à 46 Ko gzip, signature connue des bloqueurs). L'émetteur envoie lui-même en `sendBeacon` — qui survit à la fermeture d'onglet — avec repli sur `fetch(keepalive)`. Il ne fait aucune écriture dans le terminal : pas de `_id` client, c'est Matomo qui regroupe les actions en visites côté serveur.

Point clé du design : `createBrowserAnalytics` décide **une seule fois au démarrage** s'il rend un émetteur réel ou un émetteur mort. Aucun code appelant ne teste jamais si l'analytics est branché.

Attention : `donnees-personnelles.tsx` promet aux utilisateurs que le Do Not Track sera respecté. C'est normalement `matomo.js` qui l'implémente — en ne le chargeant pas, cette responsabilité devient la nôtre.

**Files:**
- Create: `packages/kpilote-shared/src/analytics/browser.ts`
- Test: `packages/kpilote-shared/src/analytics/browser.test.ts`
- Modify: `packages/kpilote-shared/package.json`

**Interfaces:**
- Consumes: `buildEventRequest`, `buildPageViewRequest`, `AnalyticsConfig`, `AnalyticsEvent`, `AnalyticsPageView` (Task 2)
- Produces:
  - `type Analytics = { trackPageView(p: AnalyticsPageView): void; trackEvent(e: AnalyticsEvent): void }`
  - `createBrowserAnalytics(options: BrowserAnalyticsOptions): Analytics`
  - `type BrowserAnalyticsOptions = { config: AnalyticsConfig | null; enabled: boolean; doNotTrack: boolean; send?: (url: string) => void }`
  - Le sous-chemin d'import `@pilote/kpilote-shared/analytics/browser`

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

```ts
// packages/kpilote-shared/src/analytics/browser.test.ts
import { describe, expect, it, vi } from 'vitest'

import { createBrowserAnalytics } from './browser'
import type { AnalyticsConfig } from './schema'

const config: AnalyticsConfig = {
  matomoUrl: 'https://stats.beta.gouv.fr',
  siteId: '42',
  appUrl: 'https://kpilote.example',
}

const options = (surcharges: Partial<Parameters<typeof createBrowserAnalytics>[0]>) => ({
  config,
  enabled: true,
  doNotTrack: false,
  ...surcharges,
})

describe('createBrowserAnalytics', () => {
  it('émet vers matomo.php avec la query string construite', () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send })).trackPageView({ path: '/indicateurs/$id' })

    expect(send).toHaveBeenCalledTimes(1)
    const [url] = send.mock.calls[0] as [string]
    expect(url.startsWith('https://stats.beta.gouv.fr/matomo.php?')).toBe(true)
    expect(new URL(url).searchParams.get('url')).toBe('https://kpilote.example/indicateurs/$id')
  })

  it("supprime la barre oblique finale de l’URL Matomo", () => {
    const send = vi.fn()
    createBrowserAnalytics(
      options({ send, config: { ...config, matomoUrl: 'https://stats.beta.gouv.fr/' } }),
    ).trackEvent({ category: 'kpilote.error', action: 'error', name: 'mutation' })

    const [url] = send.mock.calls[0] as [string]
    expect(url.startsWith('https://stats.beta.gouv.fr/matomo.php?')).toBe(true)
  })

  it("n’émet rien sans configuration", () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send, config: null })).trackPageView({ path: '/' })
    expect(send).not.toHaveBeenCalled()
  })

  it("n’émet rien quand l’analytics est désactivé", () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send, enabled: false })).trackPageView({ path: '/' })
    expect(send).not.toHaveBeenCalled()
  })

  it("n’émet rien quand le Do Not Track est actif", () => {
    const send = vi.fn()
    createBrowserAnalytics(options({ send, doNotTrack: true })).trackPageView({ path: '/' })
    expect(send).not.toHaveBeenCalled()
  })

  it("n’expose jamais une erreur d’envoi à l’appelant", () => {
    const send = vi.fn(() => {
      throw new Error('réseau indisponible')
    })
    const analytics = createBrowserAnalytics(options({ send }))

    expect(() => analytics.trackPageView({ path: '/' })).not.toThrow()
    expect(() => analytics.trackEvent({ category: 'kpilote.error', action: 'error', name: 'mutation' })).not.toThrow()
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: FAIL — `Failed to resolve import "./browser"`.

- [ ] **Step 3: Écrire l'émetteur**

`sendBeacon` envoie une requête POST ; Matomo lit indifféremment les paramètres de la query string, ce qui évite tout preflight CORS.

```ts
// packages/kpilote-shared/src/analytics/browser.ts
import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig, AnalyticsEvent, AnalyticsPageView } from './schema'

export type Analytics = {
  trackPageView: (pageView: AnalyticsPageView) => void
  trackEvent: (event: AnalyticsEvent) => void
}

export type BrowserAnalyticsOptions = {
  config: AnalyticsConfig | null
  enabled: boolean
  doNotTrack: boolean
  send?: (url: string) => void
}

const ANALYTICS_ETEINT: Analytics = {
  trackPageView: () => {},
  trackEvent: () => {},
}

const envoyer = (url: string): void => {
  if (navigator.sendBeacon(url)) return
  void fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {})
}

export const createBrowserAnalytics = (options: BrowserAnalyticsOptions): Analytics => {
  const { config, enabled, doNotTrack } = options
  if (!config || !enabled || doNotTrack) return ANALYTICS_ETEINT

  const send = options.send ?? envoyer
  const endpoint = `${config.matomoUrl.replace(/\/$/, '')}/matomo.php`

  const emettre = (query: string): void => {
    try {
      send(`${endpoint}?${query}`)
    } catch {
      // L'analytics ne peut pas casser l'application.
    }
  }

  return {
    trackPageView: (pageView) => emettre(buildPageViewRequest(pageView, config)),
    trackEvent: (event) => emettre(buildEventRequest(event, config)),
  }
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/kpilote-shared test`
Expected: PASS — les 6 tests de `browser.test.ts` s'ajoutent aux 11 précédents.

- [ ] **Step 5: Exposer le sous-chemin**

Dans `packages/kpilote-shared/package.json`, ajouter au bloc `exports` :

```json
    "./analytics/browser": {
      "types": "./src/analytics/browser.ts",
      "default": "./src/analytics/browser.ts"
    }
```

Ne pas ré-exporter `browser.ts` depuis `index.ts` : le noyau doit rester importable sans rien de spécifique au navigateur.

- [ ] **Step 6: Vérifier le lint et commiter**

```bash
APP_PACKAGE=@pilote/kpilote-shared pnpm lint
git add packages/kpilote-shared/src/analytics packages/kpilote-shared/package.json
git commit -m "feat(analytics): emetteur navigateur sendBeacon sans matomo.js"
```

---

## Task 5: Branchement webapp — configuration et page views

**Contexte —** Le critère de validation du Lot 1 est atteint à la fin de cette tâche : les page views sont visibles dans Matomo, les URLs envoyées sont normalisées, et sans configuration aucun appel externe ne sort.

Deux détails qui comptent :

- On envoie le **motif de route** (`/indicateurs/$id`), pas le pathname réel. C'est ce qui satisfait « URLs normalisées, sans paramètre sensible » et donne un rapport *Pages* où chaque route est une ligne au lieu d'une par indicateur.
- `apps/kpilote-webapp/src/main.tsx` configure `defaultPreload: 'intent'` : le préchargement au survol ne déclenche pas d'événement `onResolved`, donc pas de faux page view.

**Files:**
- Create: `apps/kpilote-webapp/src/analytics.ts`
- Modify: `apps/kpilote-webapp/src/env.ts`
- Modify: `apps/kpilote-webapp/.env.example`
- Modify: `apps/kpilote-webapp/src/main.tsx`
- Modify: `apps/kpilote-webapp/src/server/app.ts`

**Interfaces:**
- Consumes: `createBrowserAnalytics`, `type Analytics` (Task 4)
- Produces: `analytics` — l'instance applicative, importable partout via `@/analytics`.

- [ ] **Step 1: Ajouter les variables d'environnement**

Dans `apps/kpilote-webapp/src/env.ts`, ajouter deux entrées optionnelles au schéma Zod. Le fichier utilise `z.object({ ... }).parse(import.meta.env)` : des champs optionnels n'invalident aucun environnement existant.

```ts
const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_MATOMO_URL: z.url().optional(),
  VITE_MATOMO_SITE_ID: z.string().min(1).optional(),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  apiUrl: parsed.VITE_API_URL,
  matomoUrl: parsed.VITE_MATOMO_URL,
  matomoSiteId: parsed.VITE_MATOMO_SITE_ID,
}
```

La valeur de `VITE_MATOMO_SITE_ID` se récupère dans l'administration Matomo — **procédure au point A de l'annexe**.

Dans `apps/kpilote-webapp/.env.example`, ajouter sous la ligne `VITE_API_URL` :

```
# Analytics Matomo — laisser vide pour désactiver totalement l'envoi
VITE_MATOMO_URL=https://stats.beta.gouv.fr
VITE_MATOMO_SITE_ID=
```

- [ ] **Step 2: Créer l'instance applicative**

Les trois conditions d'extinction sont évaluées ici, une fois, au chargement du module. La dimension `auth_state` du plan de taggage n'est volontairement pas renseignée : elle vaudrait `authenticated` y compris sur `/login` et `/mentions-legales`. Elle viendra avec le lot qui en a besoin.

```ts
// apps/kpilote-webapp/src/analytics.ts
import { createBrowserAnalytics } from '@pilote/kpilote-shared/analytics/browser'
import type { AnalyticsConfig } from '@pilote/kpilote-shared/analytics'

import { env } from '@/env'

const respecteDoNotTrack = (): boolean =>
  typeof navigator !== 'undefined' &&
  (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes')

const config: AnalyticsConfig | null =
  env.matomoUrl && env.matomoSiteId
    ? {
        matomoUrl: env.matomoUrl,
        siteId: env.matomoSiteId,
        appUrl: window.location.origin,
        globalContexte: {
          app_area: 'webapp',
          environment: import.meta.env.MODE,
        },
      }
    : null

export const analytics = createBrowserAnalytics({
  config,
  enabled: import.meta.env.PROD,
  doNotTrack: respecteDoNotTrack(),
})
```

- [ ] **Step 3: Autoriser Matomo dans la CSP**

Dans `apps/kpilote-webapp/src/server/app.ts`, la directive `connectSrc` vaut aujourd'hui `["'self'", apiOrigin]`. Ajouter l'origine Matomo, lue depuis l'environnement serveur pour ne pas coder en dur une URL d'instance :

```ts
const matomoOrigin = process.env.VITE_MATOMO_URL
  ? new URL(process.env.VITE_MATOMO_URL).origin
  : undefined

// puis dans contentSecurityPolicy :
connectSrc: ["'self'", apiOrigin, ...(matomoOrigin ? [matomoOrigin] : [])],
```

Ne toucher ni `scriptSrc` ni `imgSrc` : on ne charge aucun script tiers et aucune image de tracking.

- [ ] **Step 4: Souscrire au router**

Dans `apps/kpilote-webapp/src/main.tsx`, après la création du `router` et avant `root.render`. Les identifiants de route contiennent les segments de mise en page sans chemin (`/_authenticated/indicateurs/$id`) : on les retire pour obtenir le motif public.

```ts
import { analytics } from '@/analytics'

const motifDeRoute = (): string => {
  const matches = router.state.matches
  const derniere = matches[matches.length - 1]
  if (!derniere || derniere.routeId === '__root__') return '/'
  return derniere.routeId.replace(/\/_[^/]+/g, '') || '/'
}

router.subscribe('onResolved', () => {
  analytics.trackPageView({ path: motifDeRoute(), title: document.title })
})
```

- [ ] **Step 5: Vérifier la compilation et le lint**

Run: `APP_PACKAGE=@pilote/kpilote-webapp pnpm lint`
Expected: PASS. `pnpm lint` de la webapp enchaîne `tsr generate`, `eslint`, `tsc --noEmit` et `prettier --check`.

Run: `APP_PACKAGE=@pilote/kpilote-webapp pnpm test`
Expected: PASS — aucun test existant ne doit régresser.

- [ ] **Step 6: Commiter**

```bash
git add apps/kpilote-webapp/src/analytics.ts apps/kpilote-webapp/src/env.ts apps/kpilote-webapp/.env.example apps/kpilote-webapp/src/main.tsx apps/kpilote-webapp/src/server/app.ts
git commit -m "feat(webapp): envoie les page views normalises a Matomo"
```

---

## Task 6: Branchement webapp — `MutationCache` et `kpilote.error`

**Contexte —** C'est le branchement qui rendra les Lots 2 à 5 quasi gratuits : une fois le `MutationCache` en place, un événement de succès métier ne coûtera qu'une ligne `meta` dans le fichier de mutation, sans toucher un composant. Ce lot ne câble que le mécanisme et les erreurs.

Le handler est protégé : une exception à cet endroit ferait tomber des mutations métier.

**Files:**
- Modify: `apps/kpilote-webapp/src/main.tsx`

**Interfaces:**
- Consumes: `analytics` (Task 5), `analyticsEvents` (Task 3)
- Produces: le type de `meta` des mutations — `{ analyticsName?: string; analyticsSuccess?: AnalyticsEvent }`, que les Lots 2 à 5 renseigneront.

- [ ] **Step 1: Déclarer le type de `meta`**

Dans `apps/kpilote-webapp/src/main.tsx`, à côté de la déclaration `declare module '@tanstack/react-router'` déjà présente. Le type enregistré doit étendre `Record<string, unknown>`.

```ts
import type { AnalyticsEvent } from '@pilote/kpilote-shared/analytics'

type AnalyticsMutationMeta = Record<string, unknown> & {
  analyticsName?: string
  analyticsSuccess?: AnalyticsEvent
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: AnalyticsMutationMeta
  }
}
```

- [ ] **Step 2: Remplacer la création du `QueryClient`**

`apps/kpilote-webapp/src/main.tsx` fait aujourd'hui `const queryClient = new QueryClient()`. Le client `ky` lève une `HTTPError` porteuse de la réponse, ce qui permet de qualifier l'échec sans jamais envoyer le corps de l'erreur.

```ts
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HTTPError } from 'ky'

import { analyticsEvents } from '@pilote/kpilote-shared/analytics'
import { analytics } from '@/analytics'

const statutErreur = (error: unknown): string =>
  error instanceof HTTPError ? String(error.response.status) : 'network'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _onMutateResult, mutation) => {
      try {
        const event = mutation.meta?.analyticsSuccess
        if (event) analytics.trackEvent(event)
      } catch {
        // L'analytics ne peut pas casser une mutation.
      }
    },
    onError: (error, _variables, _onMutateResult, mutation) => {
      try {
        analytics.trackEvent(
          analyticsEvents.error.mutation({
            mutation: mutation.meta?.analyticsName ?? 'inconnue',
            status: statutErreur(error),
          }),
        )
      } catch {
        // L'analytics ne peut pas casser une mutation.
      }
    },
  }),
})
```

- [ ] **Step 3: Vérifier la compilation et le lint**

Run: `APP_PACKAGE=@pilote/kpilote-webapp pnpm lint`
Expected: PASS. Si `tsc` se plaint de la signature des callbacks du `MutationCache`, aligner l'ordre des paramètres sur la version de `@tanstack/react-query` installée — les noms sont libres, seule la position compte, `mutation` étant le dernier.

Run: `APP_PACKAGE=@pilote/kpilote-webapp pnpm test`
Expected: PASS.

- [ ] **Step 4: Commiter**

```bash
git add apps/kpilote-webapp/src/main.tsx
git commit -m "feat(webapp): trace les erreurs de mutation via le MutationCache"
```

---

## Vérification finale

- [ ] `pnpm -F @pilote/kpilote-shared test` : les 17 tests d'analytics au vert, plus ceux de `src/error.test.ts` qui tournent enfin.
- [ ] `APP_PACKAGE=@pilote/kpilote-shared pnpm lint` : au vert.
- [ ] `APP_PACKAGE=@pilote/kpilote-webapp pnpm lint` : au vert.
- [ ] `APP_PACKAGE=@pilote/kpilote-webapp pnpm test` : au vert.
- [ ] Sans `VITE_MATOMO_URL` ni `VITE_MATOMO_SITE_ID`, lancer la webapp et confirmer dans l'onglet réseau qu'**aucune** requête ne part vers un domaine externe — c'est le critère de validation explicite du Lot 1.
- [ ] Avec les deux variables renseignées et un build de production, confirmer que les page views apparaissent dans Matomo et que les URLs affichées contiennent bien `$id` et non un identifiant réel — **mode d'emploi pas à pas au point D de l'annexe**.

## Ce qu'il restera à faire après ce plan

- Remplir `dimensionSlots` une fois connu le nombre de slots de dimensions custom disponibles sur le site KPilote, et vérifier que l'anonymisation d'IP CNIL est active. **Les deux vérifications sont détaillées pas à pas aux points B et C de l'annexe.** Aucun site d'appel ne changera.
- Ouvrir un ticket pour `kpilote-admin`, en tranchant d'abord ce que la dimension `environment` doit signifier pour une app qui cible trois environnements d'API depuis une même instance.
- Lots PIL-1713 à PIL-1716 : ajouter les entrées au catalogue et les `meta` sur les mutations.
- Le moteur Node, dont les décisions d'accueil sont consignées dans l'ADR.

---

## Annexe — Vérifications dans l'administration Matomo

Instance : `https://stats.beta.gouv.fr`. Les libellés sont donnés en français puis en anglais, l'interface pouvant être dans l'une ou l'autre langue.

Aucune de ces vérifications ne bloque l'implémentation : le plan est conçu pour démarrer avec `dimensionSlots` vide. Elles conditionnent le confort des rapports, pas la faisabilité.

### A. Trouver l'identifiant du site KPilote

C'est la valeur de `VITE_MATOMO_SITE_ID`.

1. Se connecter à `https://stats.beta.gouv.fr`.
2. Cliquer sur l'engrenage **Administration** en haut à droite.
3. Menu de gauche → **Sites web** (*Websites*) → **Gérer** (*Manage*).
4. Repérer la ligne « KPilote ». La colonne **ID** donne le nombre à reporter dans `.env`.

Repère : `apps/pilote-ppg/.env` utilise le site `103` — KPilote doit avoir le sien, distinct.

Si le menu **Sites web** n'apparaît pas, le compte n'a pas les droits nécessaires : voir le point E.

### B. Compter les slots de dimensions custom disponibles

C'est ce qui remplira `dimensionSlots` dans `apps/kpilote-webapp/src/analytics.ts`.

1. **Administration** → **Sites web** (*Websites*) → **Dimensions personnalisées** (*Custom Dimensions*).
2. Sélectionner le site KPilote dans le sélecteur de site en haut de page.
3. La page présente deux blocs, **Visite** (*Visit*) et **Action**, chacun listant les dimensions déjà configurées.
4. Compter les dimensions existantes de chaque bloc et les soustraire au quota du scope (5 par défaut) : la différence donne les slots libres. Si le bouton d'ajout d'une dimension personnalisée est absent ou désactivé dans un bloc, c'est qu'il n'en reste aucun dans ce scope.

Droits requis : **Write** ou **Admin** sur le site KPilote.

Par défaut Matomo offre **5 slots par scope**. En ajouter davantage n'est pas faisable depuis l'interface : cela passe par une commande console exécutée sur le serveur Matomo (`./console customdimensions:add-custom-dimension --scope=visit --count=10`), donc par l'exploitant de l'instance mutualisée — voir le point E.

**Deux pièges à connaître avant de créer quoi que ce soit :**

- Une dimension custom **ne peut jamais être supprimée**, seulement désactivée. Une erreur de nommage reste visible à vie.
- **L'index d'une dimension est figé à sa création** et c'est lui qui devient le `dimensionN` envoyé à Matomo. Il faut donc noter l'index affiché en face de chaque dimension créée : c'est exactement la valeur à mettre dans `dimensionSlots`.

Priorisation proposée si le quota est le quota par défaut :

| Scope | Dimensions | Pourquoi celles-là |
| --- | --- | --- |
| Visite | `app_area`, `environment`, `auth_state` | Constantes sur toute une visite, et ce sont elles qui servent à segmenter tous les rapports. |
| Action | `entity_type`, `source` | Varient d'une action à l'autre et servent à reconstituer les parcours. |

Le reste du contexte (`entity_id`, `referentiel_id`, `has_individu`, `onglet`…) reste replié dans `e_n` — c'est le comportement par défaut du builder, aucune action requise.

### C. Vérifier l'anonymisation des adresses IP

Condition de l'exemption de consentement CNIL : au moins les deux derniers octets masqués avant stockage.

**Chemin officiel :** **Administration** → **Confidentialité** (*Privacy*) → **Anonymiser les données** (*Anonymize data*). Le réglage « Anonymiser les adresses IP des visiteurs » doit être actif avec « Supprimer les 2 derniers octets ».

Cette page est réservée au **Super User** de l'instance. Sur une instance mutualisée comme `stats.beta.gouv.fr`, ce droit n'est pas le nôtre.

**Vérification sans droits, qui donne la réponse aussi sûrement :**

1. **Visiteurs** (*Visitors*) → **Journal des visites** (*Visits Log*), sur le site KPilote.
2. Ouvrir n'importe quelle visite.
3. Regarder l'adresse IP affichée.
   - Elle se termine par `.0.0` → les deux derniers octets sont bien masqués, la condition CNIL est remplie.
   - L'adresse complète apparaît → l'anonymisation n'est pas conforme, il faut la demander à l'exploitant (point E).

Cette vérification suppose que du trafic est déjà remonté : elle se fait donc **après** la tâche 5, pas avant.

### D. Vérifier que les hits arrivent bien

Après le déploiement de la tâche 5, avec les deux variables d'environnement renseignées :

1. **Visiteurs** → **Journal des visites** : une visite doit apparaître dans les secondes qui suivent une navigation.
2. **Comportement** (*Behaviour*) → **Pages** : les entrées doivent afficher le motif de route, `/indicateurs/$id`, et **jamais** un identifiant réel comme `/indicateurs/IND-506`. Si un identifiant réel apparaît, la normalisation d'URL de la tâche 5 est cassée.
3. Après la tâche 6, **Comportement** → **Événements** (*Events*) : la catégorie `kpilote.error` doit apparaître dès qu'une mutation échoue.

### E. S'il manque un droit ou un slot

Ces trois demandes s'adressent à l'équipe qui exploite `stats.beta.gouv.fr`, pas à l'équipe produit :

1. droit **Write** sur le site KPilote pour les personnes qui gèreront le plan de taggage ;
2. création de slots de dimensions custom supplémentaires, en précisant le scope et le nombre, si le point B montre qu'il n'en reste pas assez ;
3. confirmation que l'anonymisation d'IP est réglée sur « 2 derniers octets » et que les durées de conservation respectent les conditions CNIL (cookie de mesure ≤ 13 mois, données brutes ≤ 25 mois).
