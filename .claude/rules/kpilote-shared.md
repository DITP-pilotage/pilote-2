---
paths:
  - "packages/kpilote-shared/**"
---

# kpilote-shared

Schémas zod et logique pure partagés entre l'API et les fronts. Pas de build : chaque fichier est exposé tel quel. Les règles communes (`kpilote-common.md`) s'appliquent aussi.

## Structure

### Un fichier par domaine, exposé par sous-chemin
`src/collection.ts` est déclaré dans `package.json` (`"./collection": { "types": ..., "default": "./src/collection.ts" }`) et s'importe par `@pilote/kpilote-shared/collection`. Pas de barrel ni d'`index.ts`. Un nouveau fichier public ajoute son entrée dans `exports`.

### Rien de spécifique à un runtime
Pas d'import de Prisma, Hono, React ni de `node:*` : le code tourne côté serveur et côté navigateur.

## Schémas zod

### Schéma en camelCase suffixé `Schema`, type en PascalCase sans suffixe, juste en dessous
- À faire :
  ```ts
  export const collectionApiModelSchema = z.object({ ... })
  export type CollectionApiModel = z.infer<typeof collectionApiModelSchema>
  ```
Suffixes : `ApiModelSchema` (réponse), `BodySchema` (corps), `QuerySchema` (query string). Les schémas de params de route restent dans l'API.

### Champs documentés par `.describe()` en français
Pourquoi : la description alimente l'OpenAPI et les outils de l'assistant.

### `.openapi(...)` côté API seulement
Shared ne dépend pas de `@hono/zod-openapi` ; l'API enveloppe le schéma dans `routes.ts`.

## Logique pure

### Fonctions fléchées exportées, type de retour explicite, test colocalisé
`export const buildEventRequest = (...): EventRequest => ...` ; `x.test.ts` à côté de `x.ts` pour toute logique non triviale.
