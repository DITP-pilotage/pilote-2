---
paths:
  - "apps/kpilote-admin/**"
---

# kpilote-admin

Back-office multi-environnement. Les règles `kpilote-common.md` et `kpilote-react.md` s'appliquent aussi.

## Structure

`src/routes/` (file-based, segments en kebab-case et en français), `api/` (client `ky` `bffClient`), `queries/`, `components/`, `lib/` (logique pure testée : `arbre.ts`, `arbreDnd.ts`), `context/`, `server/` (BFF Hono : proxy `/api/*` vers kpilote-api avec une allowlist par regex, clé API par environnement). Alias `@/*` vers `src/*`.

## Lectures et écritures : même découpage que la webapp

### Les loaders appellent des fonctions `loadX({ queryClient, ... })`
Définies dans `queries/` à côté des query options ; pas de `context.queryClient.fetchQuery(...)` écrit directement dans `loader:`.

### Un hook par écriture dans `mutations/`
`useMutation` + invalidation des clés concernées dans un hook de `mutations/<ressource>.ts`, appelé par le composant. Pas de `useMutation` écrit directement dans une route ou un formulaire.
Pourquoi : l'admin suit le découpage de la webapp (`queries/` en lecture, `mutations/` en écriture) ; l'existant écrit autrement migre au fil des PR qui le touchent.

## BFF

### Toute nouvelle route d'API appelée par l'admin entre dans l'allowlist du proxy
`server/api/router.ts`. Sans entrée, le BFF refuse l'appel.

## Environnement de prod

### Le verrou d'édition prod désactive, il ne cache pas
`useProdEditUnlock` renvoie `locked` ; les contrôles d'édition prennent `disabled={locked}`. C'est un état transitoire (on peut déverrouiller), pas une permission.

## Formulaires

Les formulaires d'édition (axe, référentiel, indicateur, collection) sont en react-hook-form + `zodResolver`, `useFieldArray` pour les listes et `FormProvider` pour les sous-formulaires. Le schéma de formulaire vit dans un fichier dédié quand il dépasse quelques lignes (`indicateurFormSchema.ts`).
