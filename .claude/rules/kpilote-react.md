---
paths:
  - "apps/kpilote-webapp/**"
  - "apps/kpilote-admin/**"
  - "packages/kpilote-ui/**"
---

# kpilote : React (webapp, admin, ui)

React 19, Vite, TanStack Router et Query, Tailwind, react-hook-form. Les règles communes (`kpilote-common.md`) s'appliquent aussi.

## Composants

### Un composant est une `function` aux props typées dans la signature
`export function CommentaireCard({ commentaire, canWrite }: { commentaire: CommentaireApiModel; canWrite: boolean })`. Type `XxxProps` nommé seulement quand la liste est longue. Jamais `FC<Props>` / `FunctionComponent`, jamais d'`export default`.
Pourquoi : forme constante des trois projets (aucun `FC`, aucun composant fléché) ; `FC` n'apporte rien depuis React 18.

### Un fichier `.tsx` par composant, en PascalCase ; dossiers en kebab-case
`components/import-valeurs/ImportValeursModal.tsx`. Les fichiers `.ts` sont en camelCase.

### UI partagée, classes et couleurs
Les composants génériques viennent de `@pilote/kpilote-ui/<Composant>` (import par sous-chemin). Les classes se combinent avec `clsxm(base, className)`. Pas de couleur en dur (`bg-[#fdecec]`) : tokens du thème (`text-text-muted`, `red-marianne`).
Pourquoi : une seule source pour le thème ; une couleur en dur échappe au design system.

### Cacher plutôt que désactiver quand une permission manque
Si le principal n'a pas le droit, le composant renvoie `null`. `disabled` reste pour un état transitoire (mutation en cours, formulaire invalide).
Pourquoi : un bouton grisé dit « possible plus tard » ; pour un droit absent, c'est trompeur.
- À faire : `canWrite ? <Button ...>Ajouter</Button> : null`, puis `disabled={creer.isPending}` sur le bouton visible.

## Hooks et dérivation d'état

### Un hook ne fait que lire les requêtes ; la dérivation va dans une fonction pure testée
Le hook appelle `useQuery` / `useSuspenseQuery` et passe les données brutes à une fonction pure (`undefined` = pas encore chargé) qui calcule l'état. La fonction pure a son `*.test.ts`.
Pourquoi : la logique se teste sans rendu ni mock de requête ; le hook reste du câblage lisible.
- À faire (`queries/mePermissions.ts`) :
  ```ts
  export const useCanWriteDataIndicateur = (indicateurId: string): boolean => {
    const { data } = useSuspenseQuery(mePermissionsQueryOptions())
    return canWriteDataIndicateur({ permissions: data, indicateurId })
  }
  ```
- À éviter : de la dérivation dans le hook (`useImportValeurs.ts` calcule `parseResult` par un ternaire imbriqué au lieu de le laisser à `deriverEtatImport`, `useCentreAideCommands.ts` enchaîne quatre `useMemo` de filtrage et de construction).

## Data fetching

### Appels API dans `api/`, query options dans `queries/`
`api/<ressource>.ts` exporte des `fetchX` / `upsertX` qui valident la réponse avec le schéma zod de `@pilote/kpilote-shared`. `queries/<ressource>.ts` exporte des factories `xQueryOptions(...)` construites avec `queryOptions` (clé, `queryFn`, `staleTime`).
Pourquoi : une seule définition de clé et de fetch par lecture, réutilisée par les loaders et les composants.

### `useSuspenseQuery` par défaut
`useQuery` seulement quand la requête est conditionnelle (`enabled:`).

### Formulaires avec react-hook-form et zod
`useForm({ resolver: zodResolver(schema) })` ; un champ contrôlé se branche par `Controller`, jamais par un `input` caché. Les champs viennent de `@pilote/kpilote-ui/Field*`.

## Tests

### Vitest colocalisé, priorité aux fonctions pures
`x.test.ts` à côté de `x.ts` ; on teste d'abord les fonctions pures de dérivation. Intitulés `it(...)` en français.
