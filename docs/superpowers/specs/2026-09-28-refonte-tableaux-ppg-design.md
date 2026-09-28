# Refonte des tableaux de pilote-ppg — primitives `Table` et briques `DataTable`

Date : 2026-09-28
Ticket : PIL-1822 (lié : PIL-1818 accessibilité, PIL-1828 filtres de l'accueil)
Branche : `refactor/ppg-PIL-1822-refonte-tableaux` (remplace `fix/tableaux-dsfr-vers-tailwind`, à supprimer)

## Contexte

pilote-ppg affiche une trentaine de tableaux, construits de cinq façons différentes :

| Famille | Nombre | Exemples |
|---|---|---|
| `.fr-table` + `_commons/Tableau(New)` (en-tête, pagination) + hook tanstack propre | 5 | accueil chantiers, rapport détaillé, admin indicateurs, admin utilisateurs, `IndicateurBloc` (rapport détaillé) |
| `.fr-table` direct, statiques | 4 | rapports hebdomadaires ×2, ChatUI ×2 |
| `_commons/TableauAdmin` (Tailwind gris, `<table>` brut) | 7 pages | axes, chantiers, engagements, périmètres, porteurs, PPG, zonegroups |
| `<table>` brut + hook tanstack propre | 3 | Evaluation, utilisateurs PiloteEval, logs |
| `<table>` brut sans tanstack | 11 | `IndicateurBloc` (chantier) et ses tuiles, `TableauEvolution`, `TableauNoteCollective`, pondérations, Albert, token API, 3 écrans d'import |

Problèmes constatés :

- **Duplication** : `_commons/Tableau` et `_commons/TableauNew` sont deux copies (en-tête, pagination DSFR, tri) ; `TableauNew/Contenu` est mort. Le générique `_commons/Tableau` n'a qu'un consommateur ; les autres recopient l'assemblage (wrapper, état vide `fr-notice`, caption, en-tête, corps, pagination). La boucle d'en-tête + `aria-sort` existe 4 fois, la boucle `rows → cells → flexRender` une dizaine de fois, 5 paginations et 4 UI de tri sont faites main.
- **Nommage** : tout s'appelle `Tableau*` (générique, `TableauNew`, `TableauAdmin`, pages), sans primitive partagée. La branche `fix/tableaux-dsfr-vers-tailwind`, abandonnée, avait introduit `shared/Tableau.tsx` et l'alias `Tableau as TableauHtml` ; ils n'existent pas sur `dev`.
- **DSFR** : 5 fichiers portent encore `fr-table`, les états vides utilisent `fr-notice`, les paginations `fr-pagination`, plusieurs en-têtes des `fr-text--sm`/`fr-mb-0`.
- **Accessibilité** (mesures axe-core de PIL-1818, 33 pages) : 126 liens vides (chaque cellule de `TableauChantiersContenu` est un `<a tabindex="-1">` vide, 38 par page d'accueil ; 20 liens icônes seules sur l'admin indicateurs), 39 cibles < 24 px, 5 `<th>` vides, 6 tableaux sur 24 ont une `<caption>`, 2 un `scope`.
- **Typage v9** : un composant partagé ne peut pas typer sa prop sur `Table<TFeatures, TData>` (jeux de features incompatibles entre eux, `Table<any>` = intersection des 16 features). `typesTableau.ts` contourne par des contrats structurels faits main. L'augmentation globale de `ColumnMeta` (`react-table.d.ts`) est typée `Column<any, any>`/`Table<any, any>`, donc fausse pour toute table réelle.
- **État d'URL** : 6 tableaux synchronisent leur état avec nuqs, chacun avec son format (page base 0 ou 1, tri `sortBy`+`sortDir` ou JSON, `shallow` et `history` variables) et ~150 lignes de plomberie recopiées.
- **Bug** : `useTableauChantiers` calcule `pageCount` avec un modulo 10 alors que `pageSize` vaut 50 (60 chantiers → 1 page, 10 chantiers inaccessibles).

## Objectifs

1. Des **primitives `Table.*`** en API composée façon Radix (Radix Primitives n'a pas de Table : on reprend le nommage de Radix Themes), qui recodent `.fr-table` en Tailwind **au rendu identique**, sans classe `fr-*` ni CSS DSFR importé. Premier pas de la sortie progressive du DSFR.
2. Une **couche `DataTable`** au-dessus de `@tanstack/react-table` v9, bâtie sur `createTableHook`, qui mutualise en-tête, corps, tri, pagination, état vide, filtres, annonces, vue tuile et état d'URL.
3. **Migrer tous les tableaux** (hors exclusions) et supprimer les implémentations dupliquées.
4. Porter par construction les **exigences d'accessibilité de PIL-1818** : elles doivent tenir sans hypothèse sur le contenu, puisque les futurs tableaux (tableaux alternatifs des graphiques, lot 3 de PIL-1818) se feront sur ces briques.

### Non-objectifs

- PagePilotage (dépréciée, grille CSS, pas de `<table>`).
- `TableauFicheTerritoriale` et `TableauUtilisateur` : nommés « Tableau » mais ce ne sont pas des tableaux.
- Les filtres globaux de l'accueil (`split(",")`/`join(",")`) : PIL-1828.
- Pilote Eval (`Evaluation/`, `PageUtilisateursPiloteEval/`) : décommissionné, jamais vraiment en prod. Migration **minimale** (voir plus bas), pas de refacto.
- Une vitrine (page de présentation des composants) : pas pour l'instant.

## Conventions

- Termes techniques en anglais (`Table`, `DataTable`, `SortButtons`, `Pagination`, `useDataTable`…), noms d'entités métier en français (`chantier`, `indicateur`…).
- `clsxm` pour fusionner les classes, la classe de l'appelant l'emporte.
- Couleurs via la config Tailwind (`dsfr-*`, `primary`), jamais de couleur en dur.
- Composés via `Object.assign(Root, { … })`.

## Architecture

```
src/client/components/shared/
  Table.tsx                     # niveau 1 : primitives HTML, zéro tanstack
  Table.unit.test.tsx
  DataTable/
    createDataTableHook.tsx     # niveau 2 : factory, contextes partagés, seul cast
    urlState.ts                 # synchronisation nuqs
    filterFns.ts                # oneOf, search
    Root.tsx  Header.tsx  Body.tsx  Empty.tsx  Pagination.tsx
    SortButtons.tsx  Filters.tsx  LiveRegion.tsx  TileList.tsx
    types.ts                    # DataTableColumnMeta
    *.unit.test.tsx
```

Niveau 3 : chaque page déclare ses features et ses colonnes, et assemble les briques.

### Niveau 1 — `Table.*`

```tsx
export const Table = Object.assign(Root, {
  Caption, Header, Body, Footer, Row, ColumnHeaderCell, RowHeaderCell, Cell,
});
```

| Partie | Élément | Comportement |
|---|---|---|
| `Root` | `<div>` défilant + `<table>` | Conteneur `overflow-x-auto` avec `role="region"`, `tabIndex={0}`, `aria-labelledby` vers la caption (WCAG 2.1.1). Prop `caption: ReactNode` **obligatoire** (RGAA 5.4), `captionHidden` pour la passer en `sr-only`. Applique aussi la neutralisation des marges de texte DSFR (`[--text-spacing:0] [--title-spacing:0]`) tant que le CSS global DSFR est chargé. |
| `Caption` | `<caption>` | Rendue par `Root` ; exportée pour les cas où l'appelant veut la composer. |
| `Header` / `Body` / `Footer` | `thead` / `tbody` / `tfoot` | Styles `.fr-table`. |
| `Row` | `<tr>` | Zébrage par défaut (`zebra`, désactivable). |
| `ColumnHeaderCell` | `<th scope="col">` | `scope` par défaut. Contenu obligatoire : une colonne d'actions ou de pictos reçoit un libellé `sr-only` (plus aucun `<th>` vide). |
| `RowHeaderCell` | `<th scope="row">` | Cellule principale d'une ligne. |
| `Cell` | `<td>` | Styles `.fr-table`. |

**Fidélité DSFR.** La référence est le rendu actuel sur `dev` (DSFR 1.15.2 appliqué au balisage existant). Les valeurs (couleurs, paddings, typographie, bordure basse de l'en-tête, zébrage) sont relevées dans `@gouvfr/dsfr/dist/component/table/table.css` pour les sélecteurs qui s'appliquent à ce balisage, et reportées en Tailwind.

**Interactifs en cellule** : cible de 24 × 24 px minimum (WCAG 2.5.8) et focus toujours visible (`focus-visible:outline`, jamais d'`outline-none` sans remplacement, RGAA 10.7).

### Niveau 2 — `createDataTableHook`

```ts
const { useDataTable, createColumnHelper } = createDataTableHook(
  tableFeatures({ rowSortingFeature, rowPaginationFeature, sortedRowModel: createSortedRowModel(), paginatedRowModel: createPaginatedRowModel() }),
);
```

Le factory appelle `createTableHook` avec :

- **un seul jeu de contextes partagés** pour toute l'app (`createTableHookContexts()`), que lisent les briques ;
- `columnVisibilityFeature` **forcée** : `Header`/`Body` utilisent `getVisibleCells`/`getHeaderGroups` (constat de la preuve de concept : sans elle, `row.getVisibleCells is not a function`) ;
- `columnMeta: metaHelper<DataTableColumnMeta>()` : meta typées pour toutes les tables ;
- `filterFns: { oneOf, … }` ;
- `defaultColumn: { enableSorting: false }` : le tri est **opt-in par colonne** ;
- l'enregistrement **conditionnel** des briques : `Pagination` seulement si `rowPaginationFeature`, `Filters` seulement si `columnFilteringFeature` ou `globalFilteringFeature`. Côté page, `table.Pagination` n'existe au typage que si la pagination est déclarée.

Le cast `as unknown as` nécessaire (TypeScript ne réduit pas les options avec un `TFeatures` générique) est **confiné au factory**. Côté page, le typage est exact.

**Règle pour les briques** : les contextes sont typés `any` (toutes les features), donc une méthode absente compile. Une brique n'appelle que des méthodes des features que le factory garantit pour elle (core, `columnVisibilityFeature`, et la feature qui conditionne son enregistrement). Cette règle est couverte par les tests des briques (une table minimale par brique).

**Preuve de concept** (jetable, supprimée) : deux `createTableHook` aux jeux de features différents, partageant les contextes et les briques, rendus côte à côte ; tri et pagination fonctionnels ; `tsc` propre ; `@ts-expect-error` confirmés sur `table.Pagination` et `table.setSorting` absents.

#### `useDataTable`

```ts
const table = useDataTable({
  data, columns,
  rowHeader: "nom",                             // colonne principale → <th scope="row">
  getRowHref: (row) => `/chantier/${row.original.id}`,
  tile: (row) => <CarteChantier row={row} />,   // vue tuile sous sm
  search: (row) => [row.email, row.nom],        // recherche globale
  urlState: { … },                              // voir « État d'URL »
  // + toutes les options tanstack (state, initialState, manualPagination, pageCount…)
});
```

Il enveloppe `useAppTable`. L'instance retournée porte `Root`, `Header`, `Body`, `Pagination`, `Filters`, et les méthodes `hasActiveFilters()` et `resetFilters()`.

**Re-renders** : `useDataTable` s'abonne à tout l'état, comme `useTable` par défaut ; `Pagination` s'abonne à sa tranche via `table.Subscribe`. Pas d'optimisation plus fine tant qu'aucune page migrée n'en a besoin.

#### Usage type

```tsx
<table.Filters />
<table.Root caption="Liste des chantiers" captionHidden empty={{ noData: "Aucun chantier", noResults: "Aucun chantier ne correspond aux filtres" }}>
  <table.Header />
  <table.Body />
</table.Root>
<table.Pagination />
```

La page ne voit **jamais** `Table.*` pour un tableau tanstack : les primitives servent aux tableaux statiques et à l'intérieur des briques. `Pagination` et `Filters` sont hors de `Root` (une `<nav>` ne peut pas être enfant de `<table>`) : `useDataTable` les lie à l'instance, sans provider extérieur.

### Briques

**`Root`** : `AppTable` (provider) + `Table.Root` + caption + `LiveRegion`. Sans ligne, rend à la place du tableau le bloc d'état vide. Sous `sm` avec `tile`, rend `TileList` à la place du tableau.

**`Header`** : boucle sur `getHeaderGroups()`, `Table.ColumnHeaderCell` par en-tête, largeur depuis `meta.width`, `aria-sort` (`ascending` | `descending` | `none`) sur chaque colonne triable, `SortButtons` si la colonne est triable et que `meta.sortButton !== false`.

**`SortButtons`** : les deux boutons actuels (croissant, décroissant) au visuel identique, nommés « Trier par {libellé}, ordre croissant|décroissant », avec `aria-pressed` ; le sens courant est aussi porté par `aria-sort` sur le `<th>`. Libellé depuis `meta.label`, sinon `header` s'il s'agit d'une chaîne.

**`Body`** : boucle `getRowModel().rows` → `getVisibleCells()` → `table.FlexRender`. La colonne `rowHeader` est rendue en `Table.RowHeaderCell`.

- **Lignes cliquables** (`getRowHref`) : un **seul** `<a>` nommé, dans la cellule `rowHeader`, dont la zone s'étend à toute la ligne via `::after` (`<tr>` en `relative`). Les autres cellules restent des `<td>` simples. Remplace les ancres vides en `tabindex="-1"` et les `onClick`/`router.push` sur `<tr>`. Les éléments interactifs d'autres cellules passent au-dessus du pseudo-élément (`relative z-10`).
- **Lignes de groupe** (grouping/expanding) : `<button aria-expanded>` dans la première cellule pour déplier, cellules agrégées via `aggregatedCell`.

**`Empty`** (interne à `Root`, option `empty` : `ReactNode` ou `{ noData, noResults }`) : bloc `role="status"` qui recode `fr-notice--info` (le cas simple) ; `noResults` s'affiche quand `hasActiveFilters()`, avec un bouton « Réinitialiser les filtres » branché sur `resetFilters()` (généralise l'`EtatVide` de l'admin).

**`Pagination`** : recode `fr-pagination` au rendu identique. `<nav aria-label="Pagination du tableau">`, première / précédente / numéros avec ellipses / suivante / dernière, `aria-current="page"` sur la page active, boutons de bord **désactivés** (pas masqués), nommés. Option `pageSizeOptions` (sélecteur de taille de page, utilisé par l'admin). `pageCount` = `Math.ceil(total / pageSize)` en pagination manuelle. Remplace les 5 paginations existantes (`_commons/Tableau`, `TableauNew`, `PaginationCompacte` de l'admin, `PaginationPages` des logs, celle d'Albert).

**`Filters`** : panneau généré depuis les colonnes (`meta.filter`), repris de `FiltresTableauEvaluation` :

- recherche globale si `search` est fourni ;
- filtres portés par des colonnes masquées (filtres « techniques ») autorisés ;
- types `checkboxes` et `multiselect` à options statiques `{ value, label }` (ceux des référentiels admin) ; `tags`, `resets` et `hidden` ne sont pas repris tant que Pilote Eval, seul à les utiliser, n'est pas migré ;
- bouton « Réinitialiser les filtres » (désactivé sans filtre actif).

**`LiveRegion`** : `aria-live="polite"`, `sr-only`, dans `Root`. Annonce « Trié par {libellé}, ordre croissant|décroissant », « Page {n} sur {total} », « {n} résultats » / « Aucun résultat » après un filtre ou une recherche.

**`TileList`** : sous le point de rupture `tileBreakpoint` (défaut `sm`, `lg` pour l'accueil ; store `useLargeurDÉcranStore` existant), `<ul>` / `<li>` de cartes rendues par `tile(row)`, nom accessible = caption. La sémantique de liste remplace l'actuel « tableau d'une seule colonne sans en-tête ». Pagination et état vide inchangés. `tile` reçoit la `row` : il peut distinguer lignes de groupe et lignes feuilles (tuiles chantier / ministère de l'accueil).

### `DataTableColumnMeta`

```ts
type DataTableColumnMeta = {
  label?: string;                 // libellé texte (tri, annonces) quand header n'est pas une chaîne
  sortButton?: boolean;           // false : triable depuis l'extérieur, pas de bouton, aria-sort conservé
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  filter?: FilterDescriptor;      // checkboxes | multiselect
};
```

L'augmentation globale de `ColumnMeta` dans `react-table.d.ts` est **supprimée** (Evaluation garde son propre slot `columnMeta`, déjà en place).

### Fonctions fournies

- `filterFn: "oneOf"` : la valeur de la ligne ∈ valeurs sélectionnées ; sélection vide = pas de filtre (recopié 3 fois aujourd'hui dans Evaluation).
- Recherche globale `search: (row) => string[]` : insensible à la casse, sur les champs renvoyés (PiloteEval, `TableauAdmin`).

### Tri

- Sans `rowSortingFeature` : pas de tri du tout (pas de bouton, pas d'`aria-sort`, `table.setSorting` ne compile pas).
- Avec : opt-in par colonne (`enableSorting: true`).
- Tri **client** (admin…) : `sortedRowModel` + boutons d'en-tête.
- Tri **serveur** (accueil chantiers) : `manualSorting: true`, `urlState.sorting` en `shallow: false` ; le sélecteur « Trier par » + sens de l'accueil, propre à la page, appelle `table.setSorting` ; colonnes en `meta.sortButton: false`.

### État d'URL (`urlState`)

```ts
urlState: {
  sorting: { default: [{ id: "updatedAt", desc: true }] },
  pagination: { pageSize: 20 },
  globalFilter: true,
  columnFilters: [{ param: "statut", columnId: "statut", default: ["actif"] }],
  shallow: false,   // false : relance getServerSideProps (données serveur) ; true : client seul
}
```

- Chaque état absent de `urlState` reste en state local tanstack.
- **Formats harmonisés** partout : `?sort=colonne.asc|desc`, `?page=` en **base 1**, `?pageSize=`, `?q=`, un paramètre par filtre de colonne en `parseAsArrayOf(parseAsString)`. `clearOnDefault`. **Rupture des anciens formats acceptée** (liens existants, dont l'accueil chantiers : `pageIndex`, tri JSON).
- Toute modification de filtre ou de recherche remet la page à 1.
- Les écritures nuqs sont **fonctionnelles** (calculées sur l'état le plus récent) : deux mises à jour successives ne s'écrasent plus. Supprime le contournement `setTimeout(0)` des filtres « tags ».
- `hasActiveFilters()` / `resetFilters()` sur l'instance (remplacent `aDesFiltresActifs` / `reinitialiserLesFiltres` de l'admin).

## Migration

| Tableau | Cible |
|---|---|
| Rapports hebdomadaires ×2, ChatUI ×2, `TableauEvolution` (+ TA/VA), `TableauNoteCollective`, pondérations, token API, 3 écrans d'import, `IndicateurBloc` (chantier) et les 2 tuiles `indicateurBlocIndicateurTuile` | `Table.*` (statiques) |
| Accueil chantiers (grouping, expanding, pagination et tri serveur, tuiles chantier/ministère) | `DataTable` |
| Rapport détaillé (chantiers) | `DataTable` |
| Rapport détaillé (`IndicateurBloc`, une seule ligne) | `Table.*` (statique) |
| Admin indicateurs, admin utilisateurs | `DataTable` |
| `TableauAdmin` et ses 7 pages | `DataTable` ; `TableauAdmin` devient une composition de briques, `useEtatTableauAdmin` et `useFiltreColonne` disparaissent au profit de `urlState` et `Filters` |
| Logs, Albert | `Table.*` + `PaginationView` partagée (lignes de détail en `colSpan` pour les logs, données tRPC paginées et triées côté serveur pour Albert) |
| Evaluation, utilisateurs PiloteEval | **Minimal** : balisage `<table>` → `Table.*` ; hooks, filtres et `setTimeout` inchangés |

Au passage :

- les 2 fichiers `indicateurBlocIndicateurTuile.tsx` restent distincts (sources de données et variantes différentes) mais passent sur les primitives ;
- la clé manquante du fragment dans `TableauNoteCollective` est corrigée ;
- la caption tronquée d'`IndicateurBloc` (« Un tableau de l'indicateur :' ») reçoit le nom de l'indicateur ;
- le `pageCount` de l'accueil est corrigé par construction.

**Suppressions** : `_commons/Tableau` (dont `typesTableau.ts`, `BoutonsDeTri`, `FlècheDeTri`), `_commons/TableauNew`, les `…EnTête` / `…Contenu` dupliqués, les imports `@gouvfr/dsfr/dist/component/table/table.min.css` (y compris les 3 devenus morts dans `PageUtilisateur`, `PageIndicateur`, `FicheIndicateur`), l'augmentation globale de `ColumnMeta`.

**Effets visibles assumés** :

- les paginations des logs, d'Albert et le style gris Tailwind de `TableauAdmin` passent au rendu DSFR ;
- en mobile, les tuiles deviennent une vraie liste (mêmes cartes) ;
- les formats d'URL changent.

## Accessibilité (PIL-1818)

Correspondance avec les 11 exigences transmises par la session accessibilité :

| # | Exigence | Porté par |
|---|---|---|
| 1 | Titre de tableau (RGAA 5.4 / 5.6) | `caption` obligatoire sur `Table.Root`, `captionHidden` |
| 2 | `scope`, jamais de `<th>` vide | `ColumnHeaderCell` / `RowHeaderCell` |
| 3 | `aria-sort` + `<button>` « Trier par » | `Header`, `SortButtons` |
| 4 | Annonces | `LiveRegion` |
| 5 | Pagination nommée, `aria-current`, bords désactivés | `Pagination` |
| 6 | Un seul lien nommé par ligne | `Body` + `getRowHref` / `rowHeader` |
| 7 | Cibles 24 × 24 px | primitives |
| 8 | Focus visible | primitives |
| 9 | Conteneur défilant atteignable au clavier | `Table.Root` |
| 10 | Sémantique en vue tuile | `TileList` (`<ul>`/`<li>`) |
| 11 | État vide annoncé | `Empty` (`role="status"`) |

Les icônes des tableaux passent par le wrapper `_commons/Icones` (dont `aria-hidden` est corrigé par PIL-1818), rien à gérer côté tableau. PIL-1818 mesure le delta axe avant/après sur l'accueil chantiers NAT-FR (53 nœuds aujourd'hui, dont 38 `link-name`) : lui transmettre les chemins des primitives dès qu'elles sont posées.

## Vérification

- **Tests Vitest** (`*.unit.test.tsx`, projet `client`) sur `Table.*` et `DataTable/*` uniquement : sémantique (`scope`, caption, région défilante), `aria-sort` et tri, pagination (`aria-current`, bords désactivés, `pageCount`), état vide (`noData`/`noResults`), annonces, lien unique par ligne, filtres (`oneOf`, panneau généré), enregistrement conditionnel des briques (`@ts-expect-error`), `urlState` (formats, remise à la page 1, mises à jour successives). Pas de tests de pages.
- Tests existants adaptés : `TableauPagination.integration.test.tsx` (remplacé par ceux de `Pagination`), `filtreColonne.unit.test.tsx`.
- `pnpm lint` (oxlint + tsc + format) avant chaque commit.
- **Rendu** : vérifié par l'utilisateur dans le navigateur (fidélité DSFR).
- **E2E** : lancement proposé en fin de chantier ; des sélecteurs vont bouger (liens de lignes, formats d'URL, pagination) et seront adaptés.

## Livraison

Une seule PR, commits ordonnés :

1. `shared/Table.tsx` (primitives) + tests.
2. `shared/DataTable/` (factory, `urlState`, briques) + tests.
3. Tableaux statiques → `Table.*`.
4. Tableaux tanstack → `DataTable` (accueil, rapport détaillé, admin indicateurs/utilisateurs, `IndicateurBloc`, logs, Albert) ; Pilote Eval en minimal.
5. `TableauAdmin` et ses 7 pages.
6. Suppressions (`_commons/Tableau`, `TableauNew`, `typesTableau`, CSS DSFR morts, augmentation `ColumnMeta`).

Préalables : confirmation de l'utilisateur avant de supprimer `fix/tableaux-dsfr-vers-tailwind` (locale et distante, et sa PR si elle est ouverte). La correction `textdsfr-grey-200` → `text-dsfr-grey-200` de `shared/Select.tsx` est reportée sur la nouvelle branche.

## Risques

- **Brique qui appelle une méthode d'une feature absente** : compile (contextes `any`) mais plante au runtime. Mitigé par l'enregistrement conditionnel, le forçage de `columnVisibilityFeature` et une table minimale par brique dans les tests.
- **Accueil chantiers** (grouping + expanding + pagination et tri serveur + tuiles) : le tableau le plus complexe, migré en dernier dans le commit 4 ; vérifié à la main par l'utilisateur.
- **Fidélité DSFR** : écarts de quelques pixels possibles ; la référence est le rendu de `dev`, vérifié par l'utilisateur.
- **Liens cassés** par l'harmonisation des URL : assumé.
