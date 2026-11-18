---
paths:
  - "apps/kpilote-webapp/**"
---

# kpilote-webapp

Les règles `kpilote-common.md` et `kpilote-react.md` s'appliquent aussi.

## Structure

`src/routes/` (file-based TanStack Router, segments en kebab-case et en français), `api/` (client `ky` `apiClient`, appels directs à l'API avec Bearer), `queries/` (lecture), `mutations/` (écriture), `components/<domaine>/`, `lib/` (logique pure), `server/` (BFF Hono, auth uniquement), `tests/` (factories et serveur MSW). Alias `@/*` vers `src/*`.

## Routes

### Le composant de page est une fonction locale du fichier de route
`function IndicateurComponent()` passée à `component:` ; `errorComponent: RouteError`, `pendingComponent` quand le chargement se voit.

### Les loaders appellent des fonctions `loadX({ queryClient, ... })`
Définies dans `queries/` à côté des query options (`loadIndicateur({ queryClient, indicateurId })`), elles appellent `fetchQuery` ou `ensureQueryData`.
Pourquoi : le loader et le composant partagent la même définition de requête.

## Mutations

### Un hook par écriture dans `mutations/`
`useMutation` + invalidation des clés concernées + toast `onError` en français (`mutations/niveauConfiance.ts`).

## Tests

MSW est global (`vitest.setup.ts`, `tests/server.ts`) ; les données viennent des factories `buildX` de `tests/factories/`.
