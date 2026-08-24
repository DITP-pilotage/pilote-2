# Refacto — Réutiliser le `Picker` pour la sélection de référentiels et dans les panels permission

Date : 2026-07-16
App concernée : `apps/kpilote-admin`
Branche : `refacto/picker-referentiels-permissions`

## Objectif

Unifier trois implémentations de « sélection dans une liste » derrière le composant
générique `Picker` déjà présent (`src/components/ui/Picker.tsx`) :

1. Sélection des **référentiels** liés lors de l'édition/création d'un indicateur.
2. Sélection d'un **indicateur** dans le panel permission (clé API + utilisateur).
3. Sélection d'un **panier** dans le même panel permission.

## Décisions actées

- **Préchargement en mémoire** (pas de recherche serveur asynchrone dans le `Picker`).
  Le `Picker` reste un composant à filtrage client sur `items: T[]`. On aligne les
  données sur le pattern « tout charger » déjà utilisé pour `referentiels` et
  `utilisateurs` (`fetchAllPages` + `xAllQueryOptions` avec queryKey `['x','all-pages']`).
- **Périmètre du panel** : on refactore **indicateurs ET paniers** (les deux modales
  redondantes `IndicateurSearchModal` et `PanierSearchModal` sont remplacées).
- **Pas de plan de tests front** (conforme aux préférences projet).

## Compromis assumé

Le préchargement remplace la recherche serveur paginée (`useInfiniteQuery`) par un
chargement complet en mémoire. C'est cohérent avec ce qui existe déjà pour référentiels
et utilisateurs. Si le volume d'indicateurs devient très important, ce choix devra être
revisité (retour à une recherche serveur, éventuellement via une extension async du `Picker`).

## Architecture

### 1. Wrappers métier autour de `Picker` (modèle `EndpointPicker`)

Trois composants focalisés, chacun encapsulant sa query, l'exclusion des éléments déjà
sélectionnés, et le trio `getKey` / `getSearchText` / `renderItem` :

- `ReferentielPicker` — source `referentielsAllQueryOptions()` (déjà existante).
- `IndicateurPicker` — source `indicateursAllQueryOptions()` (à créer).
- `PanierPicker` — source `paniersAllQueryOptions()` (à créer).

Props communes (indicatif) :
```ts
type Props = {
  excludedIds: string[]       // ids/publicId déjà sélectionnés à masquer
  onSelect: (item: T) => void
  disabled?: boolean
  triggerLabel?: ReactNode    // ex. « Ajouter un indicateur »
}
```

Chaque wrapper charge via `useSuspenseQuery`, filtre `items` pour retirer les
`excludedIds`, et délègue le rendu au `Picker`. `getSearchText` inclut l'identifiant +
le nom (garantit l'unicité de la `value` cmdk et un filtrage pertinent).

### 2. Query options « tout charger » à créer

Miroir de `api/referentiels.ts` / `queries/referentiels.ts` :

- `api/indicateurs.ts` : `fetchAllIndicateurs()` = `fetchAllPages((cursor) => fetchIndicateurs({ cursor }))`.
- `queries/indicateurs.ts` : `indicateursAllQueryOptions()` → queryKey `['indicateurs','all-pages']`.
- `api/paniers.ts` : `fetchAllPaniers()` = `fetchAllPages((cursor) => fetchPaniers({ cursor }))`.
- `queries/paniers.ts` (**nouveau fichier**) : `paniersAllQueryOptions()` → queryKey `['paniers','all-pages']`.

## Partie A — `AdminReferentiels`

Fichier : `src/components/indicateurs/AdminReferentiels.tsx`

État actuel : bouton « Ajouter » qui `append({ id: '', fonctionAgregation: 'SUM' })`, puis
chaque ligne = `<FieldSelect>` natif listant tous les référentiels + `<FieldSelect>`
fonction d'agrégation + corbeille.

Cible :
- Le bouton « Ajouter » devient un `ReferentielPicker` (trigger « Ajouter un référentiel »).
- À la sélection : `append({ id: referentiel.id, fonctionAgregation: 'SUM' })`.
- Le Picker **exclut les référentiels déjà présents** dans le field array (plus de doublons).
- Chaque ligne : nom du référentiel **en lecture seule** (résolu depuis `options` par id,
  format `id · nom` conservé) + `<FieldSelect>` fonction d'agrégation + corbeille.
- On retire le `<select>` natif de choix du référentiel. L'id reste porté par le field
  array (`referentiels.${index}.id`), renseigné à l'append.
- La bannière « replace-all » et la sémantique de suppression restent inchangées.

## Partie B — `PrincipalPermissions`

Fichier : `src/components/PrincipalPermissions.tsx`
Monté dans : `src/routes/_authed/api-keys/$id.tsx` et `src/routes/_authed/utilisateurs/$id.tsx`.

Cible :
- Suppression de l'état `modal` et des rendus `<IndicateurSearchModal>` / `<PanierSearchModal>`.
- `renderSection` : le bouton « Ajouter » est remplacé par le wrapper Picker correspondant.
  Adapter la signature pour recevoir un contrôle d'ajout (ReactNode) plutôt qu'un `onAdd`.
- Exclusions :
  - Indicateurs : `data.indicateurs[].publicId` + `data.indicateursHerites[].publicId`.
  - Paniers : `data.paniers[].publicId`.
- `onSelect` conserve la logique existante (grant `READ` par défaut via les mutations).
- Le `disabled` actuel (verrou PROD / mutation en cours) est propagé au `disabled` du Picker.
- **Suppression des fichiers** `src/components/IndicateurSearchModal.tsx` et
  `src/components/PanierSearchModal.tsx` après vérification (grep) qu'ils ne sont utilisés
  nulle part ailleurs.
- Préchargement : les loaders de `api-keys/$id.tsx` et `utilisateurs/$id.tsx` ajoutent
  `ensureQueryData(indicateursAllQueryOptions())` et `ensureQueryData(paniersAllQueryOptions())`,
  pour que les `useSuspenseQuery` des wrappers résolvent sans état de chargement (comme
  `indicateurs/$id.tsx` le fait déjà pour référentiels/utilisateurs).

## Points de vigilance

- `Command.Item value` = `getSearchText` : inclure l'identifiant garantit l'unicité.
- Vérifier que `IndicateurSearchModal` / `PanierSearchModal` ne sont plus référencés avant
  suppression (et leurs éventuelles query options dédiées type `search...InfiniteQueryOptions`
  si elles ne servent plus qu'à ces modales).
- `pnpm lint` avant commit.

## Hors périmètre

- Extension async / recherche serveur du `Picker`.
- Refonte des autres écrans utilisant des `<select>` natifs.
