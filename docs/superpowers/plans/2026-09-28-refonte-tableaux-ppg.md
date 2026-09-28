# Refonte des tableaux de pilote-ppg — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (exécution inline dans la session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** remplacer les ~30 tableaux de pilote-ppg par des primitives `Table.*` fidèles au rendu `.fr-table` (sans DSFR) et une couche `DataTable` sur `@tanstack/react-table` v9, accessibles par construction (PIL-1818), avec un état d'URL nuqs harmonisé.

**Architecture:** niveau 1 `shared/Table.tsx` (primitives HTML, zéro tanstack) ; niveau 2 `shared/DataTable/` (factory `createDataTableHook(features)` qui enveloppe `createTableHook`, briques liées à l'instance : `Root`, `Header`, `Body`, `Pagination`, `Filters`) ; niveau 3 les pages (features + colonnes + assemblage). Les briques reçoivent l'instance typée `AnyTable` (seul endroit non typé, confiné à `shared/DataTable/`) ; côté page le typage est exact et conditionnel aux features.

**Tech Stack:** React 19, Next.js (pages router), TypeScript, Tailwind v4 (config JS, `important: true`), `@tanstack/react-table` 9.2.4, nuqs 2.10.1, Vitest + Testing Library (projet `client`, jsdom).

**Spec:** `docs/superpowers/specs/2026-09-28-refonte-tableaux-ppg-design.md`

## Global Constraints

- Branche `refactor/ppg-PIL-1822-refonte-tableaux`, ticket PIL-1822, commits via le skill `commit-billable` (client `DITP-pilotage`, catégorie `refactor`), jamais de trace de Claude.
- `pnpm lint` (depuis `apps/pilote-ppg`) avant **chaque** commit ; pnpm uniquement, jamais npm.
- Termes techniques en anglais, noms d'entités métier en français (`chantier`, `indicateur`…) ; libellés UI en français.
- Aucune classe `fr-*` ni import de CSS DSFR dans le code ajouté ou migré ; couleurs uniquement via la config Tailwind (`dsfr-*`, `primary`), jamais de couleur en dur.
- `clsxm` (`@/utils/clsxm`) pour fusionner les classes, la classe de l'appelant l'emporte.
- Pas de commentaires explicatifs superflus ; tests nommés par le comportement durable ; `expect(x).toEqual([...])` plutôt que `toHaveLength` + index ; pas de variable de 1-2 caractères.
- Breakpoints DSFR ≠ Tailwind : DSFR `sm` = 36em → `min-[576px]:`, DSFR `lg` = 62em → `min-[992px]:` ; DSFR `md` = 48em = Tailwind `md`.
- Formats d'URL : `?sort=colonne.asc|desc` (plusieurs séparés par `,`), `?page=` en base 1, `?pageSize=`, `?q=`, un paramètre par filtre de colonne (`parseAsArrayOf(parseAsString)`). Rupture des anciens formats acceptée.
- Pilote Eval (`Evaluation/`, `PageUtilisateursPiloteEval/`) : migration minimale uniquement (balisage → `Table.*`).
- Hors périmètre : PagePilotage, `TableauFicheTerritoriale`, `TableauUtilisateur`, filtres globaux de l'accueil (PIL-1828).
- Rendu : l'utilisateur vérifie lui-même dans le navigateur ; ne pas piloter de navigateur.
- Tests : uniquement sur `shared/Table.tsx` et `shared/DataTable/*` (`*.unit.test.tsx`). Lancer : `pnpm exec vitest run --project client <chemin>` depuis `apps/pilote-ppg`.

## Review Focus

- **Colonne dont l'id contient un point** (`rattachement.code`) dans `?sort=` : le parser découpe sur le **dernier** point ; un id invalide ou un sens inconnu → tri par défaut, pas d'exception. Testé dans la tâche 7.
- **Brique appelée sur une table sans la feature** (ex. `Body` sur une table sans groupement, `LiveRegion` sans filtrage) : aucune méthode de feature absente ne doit être appelée ; chaque brique teste `hasFeature(table, …)`. Testé dans les tâches 3, 4 et 6 avec une table minimale `tableFeatures({})`.
- **Lien de ligne + autre élément interactif dans la même ligne** (boutons d'action admin) : le pseudo-élément étendu ne doit pas intercepter les clics des autres contrôles (`relative z-10`). Testé dans la tâche 4 (classes posées) ; vérification visuelle par l'utilisateur.
- **Filtre vidé alors que sa valeur par défaut est non vide** (admin : `statut` par défaut `["actif"]`) : décocher tout doit donner `[]` dans l'URL et non revenir au défaut ; `resetFilters()` revient au défaut. Testé dans la tâche 7.
- **Cadre gris du tableau** (bordure 1 px `dsfr-grey-625` posée par le JS DSFR sur `.fr-table` en 1.15.2) : à confirmer visuellement contre `dev` ; si absent sur `dev`, retirer la bordure de `Table.Root` (prop `bordered`, défaut à ajuster). Point de contrôle explicite dans la tâche 1.

---

## Structure des fichiers

```
apps/pilote-ppg/
  tailwind.config.js                          # + couleur dsfr-focus (tâche 1)
  src/client/components/shared/
    Table.tsx                                 # primitives (tâche 1)
    Table.unit.test.tsx
    DataTable/
      types.ts                                # AnyTable, DataTableColumnMeta, FilterDescriptor, EmptyConfig (tâche 2)
      features.ts                             # hasFeature, getColumnMeta, getColumnLabel, toAriaSort (tâche 2)
      filterFns.ts / filterFns.unit.test.ts   # filterFnOneOf, createSearchFilterFn (tâche 2)
      config.ts                               # DataTableConfig lu dans table.options.meta (tâches 3, 5, 7)
      SortButtons.tsx  Header.tsx             # (tâche 3)
      Body.tsx / Body.unit.test.tsx           # (tâches 3-4)
      Root.tsx / Root.unit.test.tsx           # (tâches 3, 5)
      Empty.tsx  LiveRegion.tsx  TileList.tsx # (tâche 5)
      Pagination.tsx / Pagination.unit.test.tsx   # (tâche 6)
      urlParsers.ts                           # parseAsSorting, parseAsTablePage — importables côté serveur (tâche 7)
      urlState.ts / urlState.unit.test.tsx    # (tâche 7)
      Filters.tsx / Filters.unit.test.tsx     # (tâche 8)
      createDataTableHook.tsx / createDataTableHook.unit.test.tsx   # factory (tâches 3, 5-8)
    _commons/TableauAdmin/tableauAdmin.ts     # instance DataTable des référentiels (tâche 14)
```

Les tâches 9 à 16 migrent les pages (fichiers listés dans chaque tâche) ; la tâche 17 supprime `_commons/Tableau`, `_commons/TableauNew`, `react-table.d.ts` et les CSS DSFR morts.

## Écarts assumés par rapport au spec

- **Filtres** : seuls `checkboxes` et `multiselect` à options statiques ; `tags`, `resets` et `hidden` ne sont pas implémentés (seul Pilote Eval, non migré, en aurait l'usage). La correction du cumul de mises à jour de filtres est portée par les écritures fonctionnelles de `urlState` (testée).
- **Tri** : on garde le visuel des deux boutons croissant/décroissant (`BoutonsDeTri`), avec des noms accessibles « Trier par {colonne}, ordre croissant|décroissant » et `aria-pressed`, plutôt qu'un bouton unique — rendu identique exigé.
- **Re-rendus** : `useDataTable` s'abonne à tout l'état (comme `useTable` par défaut) ; `Pagination` s'abonne à sa tranche. Pas d'optimisation plus fine sans page qui en ait besoin (Pilote Eval non migré).
- **Tuiles d'indicateur** : les deux `indicateurBlocIndicateurTuile.tsx` restent distincts (sources de données et variantes différentes).
- **Logs et Albert** : primitives `Table.*` + `PaginationView`, pas `DataTable` (lignes de détail en `colSpan` ; données tRPC paginées et triées côté serveur).
- **`IndicateurBloc` du rapport détaillé** : tableau statique (une seule ligne), plus de tanstack.

---

### Task 10 : blocs indicateur (`IndicateurBloc` ×2 et leurs tuiles)

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc.tsx`
- Delete: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/useIndicateurBloc.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/indicateurBlocIndicateurTuile.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile.tsx`
- Modify (fr-* des lignes de proposition) : `…/LignesPropositionValeurAvancementV2.tsx`, `…/BaseLignesPropositionValeurAvancement.tsx` (chemins exacts : `grep -rl "LignesPropositionValeurAvancementV2\|BaseLignesPropositionValeurAvancement" src/client`)

**Interfaces:**
- Consumes : `Table.*` (tâche 1) ; `estLargeurDÉcranActuelleMoinsLargeQue` (store existant).
- Produces : plus aucun import de `_commons/Tableau` depuis le rapport détaillé.

Le bloc du rapport détaillé n'affiche **qu'une ligne** (le territoire sélectionné) : tanstack ne lui apporte rien. Il devient un tableau statique ; la pagination (jamais affichée pour une ligne) et `useIndicateurBloc` disparaissent.

- [ ] **Step 1 : bloc du rapport détaillé en tableau statique**

Dans `PageRapportDétaillé/.../Bloc/IndicateurBloc.tsx`, remplacer l'appel à `useIndicateurBloc` et le rendu `<Tableau tableau={tableau} titre=… />` par un rendu direct. Reprendre depuis `useIndicateurBloc.tsx` : la construction de la ligne (`{ territoireNom: territoireSélectionné.nomAffiché, données: détailsIndicateur[code] }`, sans le `useState`/`useEffect` : la calculer directement depuis les mêmes sources), le `jalon` et les rendus de cellule (`ValeurEtDate`, `BarreDeProgression afficherTexte fond="gris-clair" positionTexte="dessus" taille="md" variante="secondaire"`). Squelette :

```tsx
const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue("sm");
const titre = `Tableau de l'indicateur : ${indicateur.nom}`;

return estVueTuile ? (
  <IndicateurBlocIndicateurTuile
    indicateurDétailsParTerritoire={ligne}
    typeDeRéforme="chantier"
    unité={indicateur.unité}
  />
) : (
  <Table.Root caption={titre} captionHidden containerClassName="m-0 p-0">
    <Table.Header className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925">
      <Table.Row>
        {["Territoire(s)", "Valeur initiale", "Valeur actuelle", `Cible ${jalon}`, `Avancement ${jalon}`].map((libellé) => (
          <Table.ColumnHeaderCell
            className="py-2 px-1 min-[992px]:px-4 first:rounded-tl-lg last:rounded-tr-lg max-[49rem]:!text-xs"
            key={libellé}
          >
            {libellé}
          </Table.ColumnHeaderCell>
        ))}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.RowHeaderCell className="md:py-2 px-1 min-[992px]:px-4">{ligne.territoireNom}</Table.RowHeaderCell>
        {/* 3 cellules ValeurEtDate + 1 cellule BarreDeProgression, reprises à l'identique de useIndicateurBloc.tsx */}
      </Table.Row>
    </Table.Body>
  </Table.Root>
);
```

Les cellules reprennent les classes de l'ancien `TableauContenu` (`fr-py-0 fr-py-md-1w fr-px-1v fr-px-lg-2w` → `py-0 md:py-2 px-1 min-[992px]:px-4`). Supprimer `useIndicateurBloc.tsx`.

- [ ] **Step 2 : bloc de la page chantier**

`_commons/IndicateursChantier/Bloc/IndicateurBloc.tsx` (lignes 188-376) : supprimer l'import CSS DSFR ; `table.fr-table w-full border-collapse fr-mb-0` → `<Table.Root caption={`Tableau de l'indicateur : ${…nom de l'indicateur…}`} captionHidden className="w-full border-collapse" containerClassName="mb-0">` (corrige la légende tronquée « Un tableau de l'indicateur :' ») ; en-tête à deux niveaux : `thead.fr-background-transparent text-center` → `Table.Header className="bg-transparent text-center"`, les deux `Table.Row`, les `th` → `Table.ColumnHeaderCell` avec la table de correspondance de la tâche 9 ; les deux `th` vides de la première ligne reçoivent `<span className="sr-only">Territoire</span>` et `<span className="sr-only">Valeur initiale</span>` ; le `th colSpan={3}` garde son `colSpan`. Corps : `tbody.bg-none` → `Table.Body zebra={false} className="bg-none"` ; lignes et cellules → `Table.Row` / `Table.Cell` (première cellule de chaque ligne de territoire → `Table.RowHeaderCell` avec les classes existantes, dont `font-bold text-primary`). Dans `LignesPropositionValeurAvancementV2` et `BaseLignesPropositionValeurAvancement`, remplacer `tr`/`td` par `Table.Row`/`Table.Cell` (garder `colSpan`) et `fr-text--sm` par `text-sm/6`. Le `<strong>{indicateur.id}</strong>` utilisé par l'e2e `tests/components/pva-indicateur.component.ts` reste inchangé.

- [ ] **Step 3 : tuiles**

Dans les deux `indicateurBlocIndicateurTuile.tsx`, remplacer `table`/`thead`/`tbody`/`tr`/`th`/`td` par les primitives (`Table.Root` avec `caption={`Indicateur pour ${territoireNom}`} captionHidden bordered={false}`, `Table.Body zebra={false}`), `th` → `Table.ColumnHeaderCell` (« Territoire », nom du territoire), libellés de ligne → `Table.RowHeaderCell` (`font-bold`), et les classes `fr-*` via la table de la tâche 9 (`fr-p-0 fr-pb-2w` → `p-0 pb-4`, `fr-py-1v` → `py-1`, `fr-pt-1w fr-pb-0 fr-pr-0` → `pt-2 pb-0 pr-0`). `texte-gris` (classe maison) est conservée. Les deux fichiers restent distincts : ils n'ont ni la même source de données (props / contexte) ni les mêmes variantes (`rose` pour les réformes non-chantier) — les fusionner sort du périmètre (le spec prévoyait la fusion ; écart signalé dans le rapport de fin).

- [ ] **Step 4 : vérifier et committer**

Run : `grep -rn "_commons/Tableau/Tableau\"\|useIndicateurBloc\"" src/client` → plus d'import du générique ni du hook supprimé.
Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): passe les blocs indicateur sur les primitives Table`.

---

### Task 11 : rapport détaillé — liste des chantiers

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/RapportDétailléTableauChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/useRapportDétailléTableauChantiers.tsx`
- Delete: `…/RapportDétailléTableauChantiers/EnTête/RapportDétailléTableauChantiersEnTête.tsx`
- Delete: `…/RapportDétailléTableauChantiers/Contenu/RapportDétailléTableauChantiersContenu.tsx`

**Interfaces:**
- Consumes : `createDataTableHook` (tâches 3-5).
- Les features déclarées aujourd'hui (filtrage, groupement, expansion, tri) sont inertes (aucun modèle de lignes, aucune UI) : la table devient **minimale** (`tableFeatures({})`). L'ancre de ligne `#chantier-{id}` (définie par `htmlId.chantier` dans `PageRapportDétaillé.tsx`) devient un vrai lien.

- [ ] **Step 1 : hook**

Dans `useRapportDétailléTableauChantiers.tsx`, remplacer les features, le helper et `useTable` :

```tsx
const rapportDétailléTableauChantiers = createDataTableHook(tableFeatures({}));
const reactTableColonnesHelper =
  rapportDétailléTableauChantiers.createColumnHelper<DonnéesTableauChantiers>();

export default function useRapportDétailléTableauChantiers(
  données: RapportDétailléTableauChantiersProps["données"],
  chantiersSontArchives: boolean,
) {
  const colonnesTableauChantiers = reactTableColonnesHelper.columns([
    /* colonnes existantes inchangées, en retirant enableSorting / enableGlobalFilter / enableGrouping
       (sans feature correspondante ces options n'existent plus au typage) */
  ]);

  const tableau = rapportDétailléTableauChantiers.useDataTable({
    data: données,
    columns: colonnesTableauChantiers,
    rowHeader: "nom",
    getRowHref: (row) => `#chantier-${row.original.id}`,
  });

  return { tableau };
}
```

Supprimer l'export `featuresTableauChantiers` (vérifier par `grep -rn featuresTableauChantiers src` qu'il n'a pas d'autre importeur). Si `htmlId.chantier` est exporté par `PageRapportDétaillé.tsx`, l'utiliser à la place du gabarit en dur.

- [ ] **Step 2 : wrapper**

`RapportDétailléTableauChantiers.tsx` :

```tsx
const RapportDétailléTableauChantiers: FunctionComponent<
  RapportDétailléTableauChantiersProps
> = ({ données, chantiersSontArchives }) => {
  const { tableau } = useRapportDétailléTableauChantiers(
    données,
    chantiersSontArchives,
  );

  return (
    <tableau.Root
      caption="Liste des chantiers"
      captionHidden
      containerClassName="m-0 p-0 [&_tbody_a]:no-underline [&_tbody_a]:bg-none"
      empty={{ title: "Aucun chantier à afficher." }}
    >
      <tableau.Header
        cellClassName="first:rounded-tl-lg last:rounded-tr-lg"
        className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925"
      />
      <tableau.Body rowClassName="even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover" />
    </tableau.Root>
  );
};
```

Supprimer les imports CSS DSFR (`table.min.css`, `notice.min.css`), `EnTête/` et `Contenu/`.

- [ ] **Step 3 : vérifier et committer**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): passe la liste des chantiers du rapport détaillé sur DataTable`.

---

### Task 12 : admin indicateurs

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAdminIndicateurs/TableauAdminIndicateurs/TableauAdminIndicateurs.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminIndicateurs/TableauAdminIndicateurs/useTableauAdminIndicateurs.tsx`
- Delete: `…/TableauAdminIndicateurs/Contenu/TableauAdminIndicateursContenu.tsx`

**Interfaces:**
- Consumes : `createDataTableHook`, `urlState` (tâches 3-7).
- Tri, page et recherche passent dans l'URL (client, `shallow: true`) : `?sort=`, `?page=`, `?pageSize=` (défaut 20), `?q=`. Les filtres zustand et la requête tRPC restent inchangés.
- Toutes les colonnes restent triables (`enableSorting: true` sur chacune, les boutons croissant/décroissant sont conservés).
- L'e2e (`tests/pages/admin/page-admin-indicateurs.ts`) reste compatible : navigation « Pagination » (correspondance partielle de Playwright avec « Pagination du tableau »), boutons « Page suivante » et numéros, `row.filter({hasText: id}).getByRole("link").first()`.

- [ ] **Step 1 : hook**

Dans `useTableauAdminIndicateurs.tsx` :

```tsx
const adminIndicateurs = createDataTableHook(featuresTableauAdminIndicateurs);
const reactTableColonnesHelper =
  adminIndicateurs.createColumnHelper<MetadataParametrageIndicateurInformationContrat>();
```

Ajouter `enableSorting: true` à chaque colonne existante. Colonne « Actif / Inactif » : ajouter dans le `div` de la cellule un texte masqué `<span className="sr-only">{estMasqué ? "Inactif" : "Actif"}</span>` à côté de l'icône (reprendre la condition existante qui choisit `CloseCircleIcon`/`SuccessIcon`) et `header: "Actif / Inactif"` inchangé.

Remplacer le `useState` de recherche et `useTable` par :

```tsx
  const tableau = adminIndicateurs.useDataTable({
    data: metadataIndicateurs,
    columns: colonnes,
    rowHeader: "indicNom",
    getRowHref: (row) =>
      `/panel-administrateur/indicateurs/${row.original.indicId}`,
    globalFilterFn: (ligne, colonneId, texteRecherché) => {
      const valeurCellule = ligne.getValue<Chantier>(colonneId);
      return (
        valeurCellule !== null &&
        rechercheUnTexteContenuDansUnContenant(
          texteRecherché,
          valeurCellule.toString(),
        )
      );
    },
    urlState: {
      sorting: { default: [{ id: "Dernière modification", desc: true }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
    },
  });

  const changementDeLaRechercheCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      tableau.setGlobalFilter(event.target.value),
    [tableau],
  );
  const valeurDeLaRecherche = tableau.store.state.globalFilter ?? "";
```

Supprimer `changementDePageCallback` du hook et de son retour.

- [ ] **Step 2 : composant**

Dans `TableauAdminIndicateurs.tsx`, remplacer le bloc `div.fr-table > table … + TableauPagination` par :

```tsx
          <tableau.Root
            caption="Tableau des indicateurs"
            captionHidden
            className="m-0 p-0 w-full"
          >
            <tableau.Header
              cellClassName="py-2 px-1 min-[992px]:px-4 first:rounded-tl-lg last:rounded-tr-lg max-[49rem]:!text-xs"
              className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925"
            />
            <tableau.Body
              cellClassName="p-2 max-w-[20px] overflow-hidden text-ellipsis whitespace-nowrap"
              cellTitle
              rowClassName="even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
            />
          </tableau.Root>
          <tableau.Pagination />
```

Retirer les imports de `_commons/Tableau/EnTête/TableauEnTête`, `_commons/Tableau/Pagination/TableauPagination` et du contenu supprimé. Le reste de la page (grille `fr-*`, import CSV, export, titre) est hors périmètre et reste tel quel.

- [ ] **Step 3 : vérifier et committer**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): passe le tableau admin des indicateurs sur DataTable (état dans l'URL)`.

---

### Task 13 : admin utilisateurs (pagination, tri et recherche serveur)

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs.tsx`
- Delete: `…/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale.tsx` (remise à la page 1)
- Modify: `apps/pilote-ppg/src/client/searchParams/adminUtilisateursSearchParams.ts`
- Modify: `apps/pilote-ppg/src/pages/admin/utilisateurs.tsx`
- Modify (si plus utilisé) : `apps/pilote-ppg/src/client/constants/constantes.ts` (`PAGE_INDEX_DEFAUT`)

**Interfaces:**
- Consumes : `createDataTableHook`, `urlState`, `parseAsSorting`, `parseAsTablePage` (tâches 3-7).
- URL : `?page=` (base 1), `?pageSize=` (défaut `TAILLE_DEFAUT_PAGINATION_UTILISATEUR` = 50, partout — corrige l'écart 20/50), `?sort=colonne.asc|desc` (corrige le désaccord client `parseAsArrayOf(parseAsJson)` / serveur tableau JSON), `?q=` (throttle 400 ms). `shallow: false`, `history: "push"`.
- Tri serveur (`manualSorting: true`, corrige le re-tri client) ; seules les colonnes que le serveur sait trier le sont : `email`, `nom`, `prénom`, `profil`, `fonction`, `Dernière modification` (mapping `convertirEnIdPrisma` inchangé).
- Ligne : lien unique sur `email` vers `/admin/utilisateur/{id}` (l'e2e `tableau.getByRole("row").filter({hasText: email}).click()` clique au centre de la ligne, couvert par le lien étendu).

- [ ] **Step 1 : parsers serveur**

`adminUtilisateursSearchParams.ts` : remplacer `pageIndex` et `sort` :

```ts
  page: parseAsTablePage,
  pageSize: parseAsInteger.withDefault(TAILLE_DEFAUT_PAGINATION_UTILISATEUR),
  sort: parseAsSorting.withDefault([
    { id: "Dernière modification", desc: true },
  ]),
```

(import `{ parseAsSorting, parseAsTablePage } from "@/components/shared/DataTable/urlParsers"` ; supprimer `sortingArraySchema`, `parseAsJson`, `z` et `PAGE_INDEX_DEFAUT` s'ils ne servent plus.)

`pages/admin/utilisateurs.tsx` : destructurer `page` au lieu de `pageIndex` ; passer `sorting` tel quel (`run({ sorting, valeurDeLaRecherche })`, c'est déjà un tableau) ; remplacer `.splice((pageIndex - 1) * pageSize, pageSize)` par `.splice(page * pageSize, pageSize)`.

- [ ] **Step 2 : hook**

Dans `useTableauAdminUtilisateurs.tsx`, remplacer `useQueryStates`/`useQueryState`/`ZodSchemaSorting`/`useTable` par :

```tsx
const adminUtilisateurs = createDataTableHook(featuresTableauAdminUtilisateurs);
const reactTableColonnesHelper =
  adminUtilisateurs.createColumnHelper<UtilisateurListeGestionContrat>();
```

(`featuresTableauAdminUtilisateurs` garde `rowSortingFeature` et `rowPaginationFeature`, retire `sortedRowModel` : le tri est serveur.) Ajouter `enableSorting: true` aux colonnes `email`, `nom`, `prénom`, `profil`, `fonction`, `Dernière modification`. Colonne « Actif » : texte masqué `Actif`/`Désactivé` à côté de l'icône, comme à la tâche 12.

```tsx
  const tableau = adminUtilisateurs.useDataTable({
    data: utilisateurs,
    columns: colonnes,
    rowHeader: "email",
    getRowHref: (row) => `/admin/utilisateur/${row.original.id}`,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: nombreUtilisateur,
    state: {
      columnVisibility: { territoire: estAutoriseAVoirLaColonneTerritoire },
    },
    urlState: {
      sorting: { default: [{ id: "Dernière modification", desc: true }] },
      pagination: { pageSize: TAILLE_DEFAUT_PAGINATION_UTILISATEUR },
      globalFilter: true,
      shallow: false,
      history: "push",
      throttleMs: 400,
    },
  });

  const changementDeLaRechercheCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      tableau.setGlobalFilter(event.target.value),
    [tableau],
  );

  return {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche: tableau.store.state.globalFilter ?? "",
  };
```

(`manualFiltering` requiert `columnFilteringFeature`/`globalFilteringFeature` : ajouter `globalFilteringFeature` aux features.)

- [ ] **Step 3 : composant**

Dans `TableauAdminUtilisateurs.tsx` : supprimer l'import CSS DSFR ; `modifierFiltre` remet la page à 1 par `tableau.setPageIndex(0)` (au lieu de `setPagination({ pageIndex: 1 })`) avant `setTypeCompte(…)` ; remplacer `div.fr-table > table … + TableauPagination` par :

```tsx
      <tableau.Root
        caption="Tableau des utilisateurs"
        captionHidden
        className="m-0 p-0"
        empty={{ title: "Aucun compte ne correspond à votre recherche." }}
      >
        <tableau.Header
          cellClassName="py-2 px-1 min-[992px]:px-4 first:rounded-tl-lg last:rounded-tr-lg"
          className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925"
        />
        <tableau.Body
          cellClassName="py-2 max-w-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
          cellTitle
          rowClassName="even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
        />
      </tableau.Root>
      <tableau.Pagination />
```

- [ ] **Step 4 : barre latérale**

Dans `AdminUtilisateursBarreLatérale.tsx`, les filtres qui remettaient `pageIndex` à 1 (lignes ~58-96) remettent désormais `page` au défaut : `setPagination({ pageIndex: 1 })` → écriture `{ page: null }` via un `useQueryStates({ page: parseAsTablePage }, { shallow: false, history: "push" })` ; supprimer la déclaration de `pageSize` à 20 qui n'y sert plus.

- [ ] **Step 5 : vérifier et committer**

Run : `grep -rn "pageIndex" src/client/components/PageAdminUtilisateurs src/client/searchParams/adminUtilisateursSearchParams.ts src/pages/admin/utilisateurs.tsx` → aucune occurrence.
Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): passe le tableau admin des utilisateurs sur DataTable (URL harmonisée, tri serveur)`.

---

### Task 14 : `TableauAdmin` et les 7 pages de référentiels

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/TableauAdmin/tableauAdmin.ts`
- Modify: `apps/pilote-ppg/src/client/components/_commons/TableauAdmin/TableauAdmin.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/TableauAdmin/constants.ts`
- Delete: `_commons/TableauAdmin/useEtatTableauAdmin.ts`, `_commons/TableauAdmin/FiltresTableauAdmin.tsx`, `_commons/TableauAdmin/utils.ts` (garder `statutReferentielDe` en le déplaçant dans `constants.ts`), `_commons/TableauAdmin/filtreColonne.unit.test.tsx` (couvert par `filterFns.unit.test.ts`), `_commons/PaginationCompacte/` (seul consommateur : `TableauAdmin`)
- Modify, pour chacune des pages `PageAdminAxes`, `PageAdminChantiers`, `PageAdminEngagements`, `PageAdminPerimetres`, `PageAdminPorteurs`, `PageAdminPpgs`, `PageAdminZonegroups` : `PageAdminXxx.tsx` et `useTableauAdminXxx.tsx` ; Delete `PageAdminChantiers/FiltresAdminChantiers.tsx`

**Interfaces:**
- Consumes : `createDataTableHook`, `filterFnOneOf`, `urlState`, `table.Filters`, `table.Pagination` (tâches 2-8).
- Produces :
  - `tableauAdmin = createDataTableHook(featuresTableauAdmin)` et `urlStateAdmin(filtres: UrlStateConfig["columnFilters"]): UrlStateConfig` (tri `updatedAt` desc, `pageSize` 10, recherche, filtres ; client `shallow: true`, `history: "replace"` — comportement actuel) ;
  - `TableauAdmin<TRow>({ table, isLoading, caption, libelles })`, `table: DataTable<…, TRow>` issu de `tableauAdmin.useDataTable` ;
  - `FILTRE_STATUT_REFERENTIEL = { param: "statut", columnId: "statut", default: ["ACTIF"] }` et `filtreStatutReferentiel` (descripteur `checkboxes` « Statut : » sur `OPTIONS_STATUT_REFERENTIEL`).
- URL : `?sort=updatedAt.desc`, `?page=` (base 1, était base 0), `?pageSize=`, `?q=`, `?statut=`, `?perimetre=`, `?porteur=`, `?type=` ; rupture acceptée (aucun lecteur serveur).
- Visuel : l'en-tête gris en capitales et la pagination compacte passent au rendu DSFR (validé par l'utilisateur) ; le conteneur blanc arrondi est conservé.

- [ ] **Step 1 : socle admin**

`_commons/TableauAdmin/tableauAdmin.ts` :

```ts
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import type { UrlStateConfig } from "@/components/shared/DataTable/urlState";
import { featuresTableauAdmin } from "./featuresTableauAdmin";

export const tableauAdmin = createDataTableHook(featuresTableauAdmin);

export const urlStateAdmin = (
  filtres: UrlStateConfig["columnFilters"],
): UrlStateConfig => ({
  sorting: { default: [{ id: "updatedAt", desc: true }] },
  pagination: { pageSize: 10 },
  globalFilter: true,
  columnFilters: filtres,
});
```

Dans `featuresTableauAdmin.ts`, corriger le commentaire (« quatre tableaux » → les sept pages de référentiels).

Dans `constants.ts`, remplacer `FILTRE_STATUT_REFERENTIEL` et ajouter le descripteur et `statutReferentielDe` (déplacé depuis `utils.ts`, corps inchangé) :

```ts
export const FILTRE_STATUT_REFERENTIEL = {
  param: "statut",
  columnId: "statut",
  default: ["ACTIF"],
};

export const filtreStatutReferentiel = {
  type: "checkboxes",
  label: "Statut :",
  options: OPTIONS_STATUT_REFERENTIEL.map((option) => ({
    value: option.valeur,
    label: option.label,
  })),
} as const satisfies FilterDescriptor;
```

(import `type FilterDescriptor` depuis `@/components/shared/DataTable/types`.)

- [ ] **Step 2 : `TableauAdmin`**

Réécrire `TableauAdmin.tsx` :

```tsx
import type { ReactNode } from "react";
import Loader from "@/components/_commons/Loader/Loader";
import type { tableauAdmin } from "./tableauAdmin";

export type LibellesTableauAdmin = {
  aucun: string;
  aucunResultat: string;
  invitationCreation?: string;
  iconeVide?: string;
};

type TableAdmin<TRow> = ReturnType<typeof tableauAdmin.useDataTable<TRow>>;

export function TableauAdmin<TRow>({
  table,
  isLoading,
  caption,
  libelles,
}: {
  table: TableAdmin<TRow>;
  isLoading: boolean;
  caption: string;
  libelles: LibellesTableauAdmin;
}) {
  const recherche = table.store.state.globalFilter ?? "";
  const descriptionSansResultat: ReactNode = recherche ? (
    <>
      {libelles.aucunResultat} «&nbsp;{recherche}&nbsp;».
    </>
  ) : (
    "Aucun élément ne correspond aux filtres sélectionnés."
  );

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925 overflow-hidden">
      {isLoading ? (
        <div className="relative py-20">
          <Loader />
        </div>
      ) : (
        <>
          <table.Filters />
          <table.Root
            bordered={false}
            caption={caption}
            captionHidden
            empty={{
              noData: {
                title: libelles.aucun,
                description: libelles.iconeVide ? (
                  <>
                    <span aria-hidden="true">{libelles.iconeVide}</span>{" "}
                    {libelles.invitationCreation}
                  </>
                ) : (
                  libelles.invitationCreation
                ),
              },
              noResults: {
                title: "Aucun résultat",
                description: descriptionSansResultat,
              },
            }}
          >
            <table.Header />
            <table.Body />
          </table.Root>
          <table.Pagination className="my-0 px-6 py-3" pageSizeOptions={[10, 20, 50]} />
        </>
      )}
    </div>
  );
}
```

(`ring-gray-200` → `ring-dsfr-grey-925`, palette DSFR. Si `typeof tableauAdmin.useDataTable<TRow>` n'est pas accepté par TypeScript — instanciation d'expression —, exporter depuis `tableauAdmin.ts` le type `TableAdmin<TRow> = DataTable<AppFeatures, TRow>` en exportant `AppFeatures` depuis le factory.)

- [ ] **Step 3 : page Axes (modèle pour les 6 autres)**

`PageAdminAxes/useTableauAdminAxes.tsx` :

```tsx
import { useMemo } from "react";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
  FILTRE_STATUT_REFERENTIEL,
  filtreStatutReferentiel,
  statutReferentielDe,
} from "@/components/_commons/TableauAdmin/constants";
import {
  tableauAdmin,
  urlStateAdmin,
} from "@/components/_commons/TableauAdmin/tableauAdmin";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { AxeAdminListItem } from "@/server/metadataAxe/queries/ListerAxesAdminQuery";

const columnHelper = tableauAdmin.createColumnHelper<AxeAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("axeId", {
          id: "axeId",
          header: "ID",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_ID },
        }),
        columnHelper.accessor("axeName", {
          id: "axeName",
          header: "Nom",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_NOM },
          cell: (info) => (
            <span
              className={
                info.row.original.deletedAt !== null
                  ? "line-through text-gray-400"
                  : ""
              }
            >
              {info.getValue()}
            </span>
          ),
        }),
        columnHelper.accessor((axe) => statutReferentielDe(axe.deletedAt), {
          id: "statut",
          header: "Statut",
          enableSorting: true,
          filterFn: filterFnOneOf,
          meta: { filter: filtreStatutReferentiel },
          cell: (info) => (
            <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
          ),
        }),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: "Mise à jour",
          enableSorting: true,
          meta: { cellClassName: CLASSE_COLONNE_DATE },
          cell: (info) => formaterDateCourte(new Date(info.getValue())),
        }),
      ]),
    [],
  );

export const useTableauAdminAxes = (axes: AxeAdminListItem[]) =>
  tableauAdmin.useDataTable({
    data: axes,
    columns: useTableColumns(),
    rowHeader: "axeName",
    getRowHref: (row) =>
      `/panel-administrateur/referentiels-deprecies/axes/${row.original.axeId}`,
    search: (axe) => [axe.axeId, axe.axeName],
    urlState: urlStateAdmin([FILTRE_STATUT_REFERENTIEL]),
  });
```

`PageAdminAxes/PageAdminAxes.tsx` : `const table = useTableauAdminAxes(axes ?? []);` ; supprimer `useFiltreColonne`, `GroupeCasesACocher`, `FiltresTableauAdmin`, `CLASSES_COLONNES`, et remplacer l'appel par :

```tsx
        <TableauAdmin
          caption="Liste des axes"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
```

- [ ] **Step 4 : les 6 autres pages**

Même transformation que l'étape 3, avec ces valeurs (issues des hooks et pages actuels) :

| Page | `rowHeader` | `getRowHref` | `search` | filtres URL (`urlStateAdmin([...])`) | `meta.filter` | `cellClassName` par colonne | `caption` |
|---|---|---|---|---|---|---|---|
| Chantiers | `chNom` | `/panel-administrateur/chantiers/${chantierId}` | `[chantierId, chNom]` | `{param:"statut", columnId:"chState", default:["PUBLIE"]}`, `{param:"perimetre", columnId:"perimetreId"}` | `chState` : `checkboxes` « Statut : » sur les options de `type_statut` (libellés `STATUT_BADGE`) ; `perimetreId` : `multiselect` « Périmètre », `options` = périmètres (`{value: id, label: nom}`), `className: "max-w-fit"`, `buttonClassName: "min-w-[20rem]"` (colonnes dépendant de `perimetres` : `useMemo([perimetres])`) | ID, NOM, DATE | « Liste des chantiers » |
| Engagements | `engagementName` | `/panel-administrateur/referentiels-deprecies/engagements/${engagementId}` | `[engagementId, engagementShort, engagementName]` | statut | statut | ID, `engagementShort` SECONDAIRE, NOM, DATE | « Liste des engagements » |
| Périmètres | `perNom` | `/panel-administrateur/referentiels/perimetres/${perimetreId}` | `[perimetreId, perNom]` | statut, `{param:"porteur", columnId:"porteurId"}` | statut ; `porteurId` : `multiselect` « Porteur » (options depuis `metadataPorteur.lister`, libellé `porteurShort`) | ID, NOM, `porteurId` SECONDAIRE, DATE | « Liste des périmètres » |
| Porteurs | `porteurName` | `/panel-administrateur/referentiels/porteurs/${porteurId}` | `[porteurId, porteurShort, porteurName]` | statut, `{param:"type", columnId:"porteurType"}` | statut ; `porteurType` : `checkboxes` « Type : » sur `OPTIONS_TYPE_PORTEUR` | ID, `porteurShort` NOM, `porteurName` `text-gray-700`, DATE | « Liste des porteurs » |
| PPG | `ppgNom` | `/panel-administrateur/referentiels-deprecies/ppgs/${ppgId}` | `[ppgId, ppgNom]` | statut | statut | ID, NOM, `ppgAxe` SECONDAIRE, DATE | « Liste des PPG » |
| Zonegroups | `zgName` | `/panel-administrateur/referentiels/zonegroups/${zoneGroupId}` | `[zoneGroupId, zgName]` | statut | statut | ID, NOM, `nbZones` SECONDAIRE, DATE | « Liste des groupes de zones » |

Dans chaque hook : `enableSorting: true` sur toutes les colonnes ; `filterFn: filterFn_arrHas` → `filterFnOneOf` ; les `sortingFn` personnalisés existants (Chantiers `perimetreId`, Périmètres `porteurId`) sont conservés. Supprimer `FiltresAdminChantiers.tsx`.

- [ ] **Step 5 : vérifier et committer**

Run : `grep -rn "useEtatTableauAdmin\|FiltresTableauAdmin\|useFiltreColonne\|PaginationCompacte\|filterFn_arrHas" src/client` → aucune occurrence.
Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): reconstruit TableauAdmin et les 7 référentiels sur DataTable`.

---

### Task 15 : accueil — liste des chantiers (pagination, tri et recherche serveur, groupement, tuiles)

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiersActionsDeTri.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/PageChantiers/TableauChantiers/Tuile/Chantier/TableauChantiersTuileChantier.tsx`, `Tuile/Ministère/TableauChantiersTuileMinistère.tsx` (classes `fr-*`, bouton imbriqué)
- Delete: `…/TableauChantiers/Contenu/TableauChantiersContenu.tsx`, `apps/pilote-ppg/src/client/components/PageAccueil/TableauRéformes/EnTête/TableauRéformesEnTête.tsx`, `…/TableauChantiers/TableauChantiers.integration.test.tsx` (entièrement en `describe.skip`)
- Modify (paramètres d'URL) : `apps/pilote-ppg/src/client/searchParams/accueilSearchParams.ts`, `apps/pilote-ppg/src/pages/accueil/chantier/[territoireCode]/index.tsx`, `apps/pilote-ppg/src/pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx`
- Modify (remise à la page 1, `pageIndex` → `page`) : `PageAccueil/BoutonReintialiserLesFiltres.tsx`, `PageAccueil/Filtres/Filtres.tsx`, `Filtres/FiltresMinistères/FiltresMinistères.tsx`, `Filtres/FiltresSelectionMultipleBoolean/*`, `Filtres/FiltresSelectionUnique/*`, `PageChantiers/FiltresMeteos/RepartitionsMeteosChantiers.tsx`, `TableauChantiers/SelecteurGroupementTableauChantier.tsx`, `_commons/Widget/WidgetRepartitionMeteos/WidgetRepartitionMeteos.tsx`, `_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales.tsx`, `_commons/RemontéeAlerteChantier/RemontéeAlerte.tsx`, `_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille.tsx`, `_commons/SélecteursMaillesEtTerritoiresChantier/SélecteursMaillesEtTerritoires.tsx`, `_commons/Cartographie/useCartographie.ts`
- Modify (e2e) : `apps/pilote-ppg/tests/pages/page-accueil.ts`, `apps/pilote-ppg/tests/import-donnee.spec.ts`

**Interfaces:**
- Consumes : tout le socle (tâches 1-8), `parseAsSorting`, `parseAsTablePage`.
- URL : `?page=` (base 1, défaut 1), `?pageSize=` (50), `?sort=avancement.asc` (était JSON `{"id":…,"desc":…}`), `?q=` (throttle 200 ms) ; `shallow: false`, `history: "push"`. `groupeParMinistere` inchangé.
- Tri serveur : `manualSorting: true` ; colonnes `météo`, `dateDeMàjDonnéesQualitatives`, `tendance`, `avancement`, `dateDeMàjDonnéesQuantitatives`, `écart` en `enableSorting: true` + `meta.sortButton: false` (tri par le sélecteur « Trier par », `aria-sort` sur les en-têtes).
- Pagination serveur : `manualPagination: true`, `rowCount: nombreTotalChantiersAvecAlertes` (corrige le bug du modulo 10).
- Recherche serveur : `manualFiltering: true`.
- Ligne feuille : lien unique sur `nom`. Ligne de groupe : le bouton de la colonne `dérouler-groupe` devient un vrai bouton nommé (`aria-expanded`, « Déplier/Replier {ministère} ») dont la zone couvre la ligne.
- Tuiles : sous `lg` (< 1280 px, `tileBreakpoint: "lg"`), liste de tuiles ; plus de colonne `chantier-tuile`.

- [ ] **Step 1 : paramètres serveur**

`accueilSearchParams.ts` : dans `filtresParsers`, `sort: parseAsJson(sortingSchema.parse).withDefault({...})` → `sort: parseAsSorting.withDefault([{ id: "avancement", desc: false }])` ; dans `loadAccueilSearchParams`, `pageIndex: parseAsInteger.withDefault(1)` → `page: parseAsTablePage`. Supprimer `sortingSchema`/`parseAsJson`/`z` s'ils ne servent plus.

`pages/accueil/chantier/[territoireCode]/index.tsx` : `const pageIndex = searchParams.pageIndex;` → `const page = searchParams.page;` ; `splice((pageIndex - 1) * pageSize, pageSize)` → `splice(page * pageSize, pageSize)` ; `const sorting = searchParams.sort;` → `const [sorting = { id: "avancement", desc: false }] = searchParams.sort;`.
`pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx` : même changement pour `sorting`.

- [ ] **Step 2 : composants qui remettent la page à 1**

Dans chaque fichier listé, remplacer `pageIndex: 1` par `page: null` dans les objets passés aux `setQuery`/`useQueryStates` (et le parser `pageIndex: parseAsInteger…` par `page: parseAsTablePage` là où il est déclaré), et `delete router.query.pageIndex` par `delete router.query.page`. Vérifier : `grep -rn "pageIndex" src/client/components/PageAccueil src/client/components/_commons/Widget src/client/components/_commons/RemontéeAlerteChantier src/client/components/_commons/SélecteursMaillesEtTerritoiresChantier src/client/components/_commons/Cartographie` → aucune occurrence liée à l'URL.

- [ ] **Step 3 : hook**

Dans `useTableauChantiers.tsx` :

- `const accueilChantiers = createDataTableHook(features);` et `const reactTableColonnesHelper = accueilChantiers.createColumnHelper<DonnéesTableauChantiers>();` ;
- supprimer les `useQueryState("q")`, `useQueryStates({pageIndex, pageSize})`, `estVueTuile`, la colonne `chantier-tuile` et l'agrégat `ministèrePorteurDesChantiers` ;
- colonnes `météo`, `tendance`, `avancement`, `écart`, `dateDeMàjDonnéesQualitatives`, `dateDeMàjDonnéesQuantitatives` : `enableSorting: true` et `meta: { …, sortButton: false }` ; supprimer `tabIndex` de toutes les `meta` ;
- colonne `dérouler-groupe` : `header: () => <span className="sr-only">Déplier le groupe</span>`, `meta: { width: "3.5rem", label: "Déplier le groupe" }`, et `aggregatedCell` :

```tsx
          aggregatedCell: (aggregatedCellContext) => {
            const estDéroulé = aggregatedCellContext.row.getIsExpanded();
            const ministère = aggregatedCellContext.row.original.porteur?.nom ?? "";
            return (
              <button
                aria-expanded={estDéroulé}
                className={clsxm(
                  "after:absolute after:inset-0 after:content-['']",
                  chantiersSontArchives ? "!text-dsfr-grey-925" : "!text-primary",
                )}
                onClick={aggregatedCellContext.row.getToggleExpandedHandler()}
                type="button"
              >
                <span className="sr-only">
                  {`${estDéroulé ? "Replier" : "Déplier"} ${ministère}`}
                </span>
                <Icone
                  className="!text-current"
                  icone={estDéroulé ? ArrowSLineIcon : ArrowSLine2Icon}
                />
              </button>
            );
          },
```

- l'appel à `useTable` devient :

```tsx
  const [mailleSelectionnee] = useQueryState(
    "maille",
    parseAsStringLiteral(["departementale", "regionale"]).withDefault("departementale"),
  );

  const tableau = accueilChantiers.useDataTable({
    data: données,
    columns: colonnesTableauChantiers,
    rowHeader: "nom",
    getRowHref: (row) => {
      const mailleRedirection =
        !row.original.maillesApplicables.includes("departementale") &&
        row.original.maillesApplicables.includes("regionale")
          ? "regionale"
          : mailleSelectionnee;
      return `/chantier/${row.original.id}/${territoireCode}?maille=${mailleRedirection}&jalon=${jalon}`;
    },
    tile: (row) =>
      row.getIsGrouped() ? (
        <button
          aria-expanded={row.getIsExpanded()}
          className="w-full text-left"
          onClick={row.getToggleExpandedHandler()}
          type="button"
        >
          <TableauChantiersTuileMinistère
            estArchive={chantiersSontArchives}
            estDéroulé={row.getIsExpanded()}
            ministère={{
              nom: row.original.porteur?.nom ?? "",
              icône: row.original.porteur?.icône ?? null,
              avancement: calculerMoyenne(
                row.getLeafRows().map((feuille) => feuille.original.avancement),
              ),
            }}
          />
        </button>
      ) : (
        <TableauChantiersTuileChantier
          afficherIcône={regroupement.length === 0}
          chantier={row.original}
          chantiersSontArchives={chantiersSontArchives}
        />
      ),
    tileBreakpoint: "lg",
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: nombreTotalChantiersAvecAlertes,
    autoResetExpanded: false,
    onExpandedChange: setExpanded,
    state: {
      grouping: regroupement,
      expanded,
      columnVisibility: {
        porteur: false,
        dateDeMàjDonnéesQualitatives: false,
        dateDeMàjDonnéesQuantitatives: false,
        "dérouler-groupe": estGroupe,
      },
    },
    urlState: {
      sorting: { default: [{ id: "avancement", desc: false }] },
      pagination: { pageSize: 50 },
      globalFilter: true,
      shallow: false,
      history: "push",
      throttleMs: 200,
    },
  });

  return {
    tableau,
    changementDeLaRechercheCallback: (event: ChangeEvent<HTMLInputElement>) =>
      tableau.setGlobalFilter(event.target.value),
    valeurDeLaRecherche: tableau.store.state.globalFilter ?? "",
  };
```

  (`territoireCode` devient un paramètre du hook ; `useTableauChantiers` est appelé par `TableauChantiers`, qui le reçoit déjà en prop.) Le type exporté `TableauDesChantiers` est conservé (`ReturnType<typeof useTableauChantiers>["tableau"]`).

- [ ] **Step 4 : tuiles**

`TableauChantiersTuileMinistère.tsx` : le `<button type="button">` interne devient `<span aria-hidden="true">` (le bouton est désormais l'enveloppe posée par le hook ; un bouton imbriqué est invalide). Dans les deux tuiles, remplacer les classes `fr-*` via la table de la tâche 9 (`fr-mb-0 fr-ml-n1w` → `mb-0 -ml-2`, `fr-mt-1w fr-ml-5v` → `mt-2 ml-5`, `fr-mx-3w fr-mt-1v` → `mx-6 mt-1`).

- [ ] **Step 5 : tri externe**

`TableauChantiersActionsDeTri.tsx` : prend `tableau: TableauDesChantiers` en prop ; supprimer le `useQueryState("sort")` et le schéma zod ; lire `const [tri = { id: "avancement", desc: false }] = tableau.store.state.sorting;` ; le sélecteur appelle `tableau.setSorting([{ id: triSélectionné, desc: tri.desc }])` ; remplacer `BoutonsDeTri` par :

```tsx
        <SortButtons
          column={tableau.getColumn(tri.id)!}
          label={listeColonnesÀtrier.find((colonne) => colonne.valeur === tri.id)?.libellé ?? tri.id}
        />
```

(`SortButtons` de `@/components/shared/DataTable/SortButtons`, qui accepte `AnyColumn` : caster `tableau.getColumn(tri.id)` en `AnyColumn` si le typage l'exige.) Remplacer `fr-select-group` et `fr-label label` par `flex flex-col gap-1 mb-0` et `text-sm/6`.

- [ ] **Step 6 : wrapper**

`TableauChantiers.tsx` :

```tsx
const TableauChantiers: FunctionComponent<TableauChantiersProps> = ({
  nombreTotalChantiersAvecAlertes,
  données,
  ministèresDisponibles,
  territoireCode,
  jalon,
  chantiersSontArchives,
}) => {
  const { tableau, changementDeLaRechercheCallback, valeurDeLaRecherche } =
    useTableauChantiers(
      données,
      ministèresDisponibles,
      nombreTotalChantiersAvecAlertes,
      chantiersSontArchives,
      jalon,
      territoireCode,
    );

  const lignesFeuille = chantiersSontArchives
    ? "even:bg-dsfr-contrast-grey odd:bg-dsfr-grey-1000 even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
    : "even:bg-dsfr-blue-france-950 odd:bg-dsfr-alt-blue-france even:hover:bg-dsfr-blue-france-950-hover odd:hover:bg-dsfr-blue-france-975-hover";
  const ligneGroupe =
    "relative not-first:border-t-primary not-first:border-t-2 font-bold bg-white bg-[image:linear-gradient(0deg,theme(colors.dsfr-grey-900),theme(colors.dsfr-grey-900))] bg-no-repeat bg-bottom bg-[size:100%_1px] [@media(hover:hover)]:hover:bg-dsfr-grey-1000";

  return (
    <section className="m-0 p-0 text-dsfr-grey-50">
      <div className="flex flex-col justify-between 2xl:flex-row gap-4 2xl:items-end w-full mb-4">
        <div className="flex flex-col 2xl:flex-row gap-4">
          <div className="w-80">
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
          </div>
        </div>
        <div className="flex 2xl:flex-row gap-4 items-end">
          <SelecteurGroupementTableauChantier />
          <TableauChantiersActionsDeTri tableau={tableau} />
        </div>
      </div>
      <tableau.Root
        caption="Liste des chantiers"
        captionHidden
        empty={{
          title: "Aucun chantier ne correspond à votre recherche !",
          description: "Vous pouvez modifier vos filtres pour élargir votre recherche.",
        }}
        tileClassName={(row) => clsxm("px-4 py-2", row.getIsGrouped() ? ligneGroupe : lignesFeuille)}
      >
        <tableau.Header
          cellClassName="px-2 first:rounded-tl-lg last:rounded-tr-lg max-[78rem]:!text-xs"
          className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925"
        />
        <tableau.Body
          cellClassName="px-4 py-2"
          rowClassName={(row) =>
            clsxm("h-[4.5rem]", row.getIsGrouped() ? clsxm("cursor-pointer", ligneGroupe) : lignesFeuille)
          }
          zebra={false}
        />
      </tableau.Root>
      <tableau.Pagination />
    </section>
  );
};
```

Supprimer les imports CSS DSFR (`table.min.css`, `notice.min.css`), `TableauPagination`, `TableauRéformesEnTête`, `TableauChantiersContenu`, et les fichiers listés en « Delete ». `SelecteurGroupementTableauChantier` (étape 2) remet `page` au défaut.

- [ ] **Step 7 : e2e**

`tests/pages/page-accueil.ts` (`selectChantier`, lignes 51-57) : `page.getByRole("table").getByRole("cell", { name: chantierName }).click()` → `page.getByRole("table").getByRole("link", { name: chantierName }).click()`.
`tests/import-donnee.spec.ts:19` : `getByRole("cell", { name: chantier.nom })` → `getByRole("link", { name: chantier.nom })`.

- [ ] **Step 8 : vérifier et committer**

Run : `grep -rn "pageIndex\|TableauRéformesEnTête\|TableauChantiersContenu" src tests` → plus d'occurrence liée à l'accueil.
Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): passe la liste des chantiers de l'accueil sur DataTable (URL harmonisée, liens et groupes accessibles)`.

**Point de contrôle utilisateur** : vérifier dans le navigateur l'accueil `/accueil/chantier/NAT-FR` en vue chantier et en vue ministère (groupes dépliés/repliés), en desktop et sous 1280 px (tuiles), le tri par le sélecteur, la recherche et la pagination.

---

### Task 16 : logs et tableau de bord Albert

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/TableauLogs.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardTable.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx`

**Interfaces:**
- Consumes : `Table.*` (tâche 1), `PaginationView`, `DataTableEmpty` (tâches 5-6), `parseAsSorting` (tâche 7).
- Ces deux tableaux ne passent pas par `DataTable` : les logs ont des lignes de détail en `colSpan` et un état local ; Albert est alimenté par tRPC avec tri et page serveur. Ils prennent les primitives et la pagination partagées.
- URL d'Albert : `triChamp` + `triDirection` → `?sort=updatedAt.desc` (défaut) ; `?page=` inchangé (déjà base 1).

- [ ] **Step 1 : logs**

Dans `TableauLogs.tsx` : `div.overflow-x-auto border border-gray-200 rounded-lg > table.w-full text-sm` → `<Table.Root bordered={false} caption="Journal applicatif" captionHidden className="w-full text-sm" containerClassName="border border-dsfr-grey-925 rounded-lg">` ; en-tête `Table.Header className="bg-dsfr-grey-1000"` + `Table.ColumnHeaderCell className="px-4 py-3 font-medium text-dsfr-mention-grey"` (colonne `expand` : `<span className="sr-only">Contexte</span>`, `w-10`) ; lignes `Table.Row className="border-b border-dsfr-grey-925 hover:bg-dsfr-grey-1000"`, cellules `Table.Cell` avec les classes existantes ; ligne de contexte `Table.Row id={`contexte-${id}`}` + `Table.Cell colSpan={6}`. Remplacer le composant local `PaginationPages` par :

```tsx
<PaginationView
  onPageChange={(pageIndex) => setPage(pageIndex + 1)}
  pageCount={Math.ceil(total / TAILLE_PAGE)}
  pageIndex={page - 1}
/>
```

et supprimer `PaginationPages`. Sans log : `<DataTableEmpty empty={{ title: "Aucun log" }} hasActiveFilters={false} onResetFilters={() => {}} />` à la place du tableau. Les classes `gray-*` des cellules (badges de niveau) sont conservées.

- [ ] **Step 2 : Albert — URL**

Dans `AlbertDashboard.tsx`, remplacer `triChamp`/`triDirection` par `sort: parseAsSorting.withDefault([{ id: "updatedAt", desc: true }])` dans le `useQueryStates` ; dériver `const [tri = { id: "updatedAt", desc: true }] = params.sort;` puis `triChamp: tri.id as "createdAt" | "updatedAt"`, `triDirection: tri.desc ? "desc" : "asc"` pour l'entrée tRPC et la prop `tri` du tableau ; `onTriChange({ champ, direction })` écrit `setParams({ sort: [{ id: champ, desc: direction === "desc" }], page: 1 })`.

- [ ] **Step 3 : Albert — tableau**

`AlbertDashboardTable.tsx` : `table.!w-full !text-sm` → `<Table.Root bordered={false} caption="Conversations Albert" captionHidden className="!w-full !text-sm" containerClassName="!border !border-dsfr-grey-925 !rounded-md !bg-white">` ; `thead.!bg-dsfr-grey-1000` → `Table.Header` ; `th` → `Table.ColumnHeaderCell className="!text-left !px-4 !py-2"`, avec `aria-sort` (`"ascending"`/`"descending"`/`"none"`) sur « Créé le » et « MAJ » selon `tri` ; en-têtes 👍 👎 💬 : `<span aria-hidden="true">👍</span><span className="sr-only">Pouces levés</span>` (resp. « Pouces baissés », « Commentaires »). Lignes : `Table.Row className="relative !border-t !border-dsfr-grey-925 even:!bg-dsfr-grey-1000 hover:!bg-dsfr-grey-900"` (+ `!opacity-60` en chargement), **sans** `onClick` ; la cellule « Conversation » devient `Table.RowHeaderCell` et son titre un bouton qui couvre la ligne :

```tsx
<button
  className="text-left after:absolute after:inset-0 after:content-['']"
  onClick={() => onLigneClick(conversation.id)}
  type="button"
>
  {conversation.titre || "Sans titre"}
</button>
```

(l'extrait du premier message reste sous le bouton). Remplacer le pied « Précédent / Page x / y / Suivant » par `PaginationView` (`pageIndex={page - 1}`, `pageCount={nbPages}`, `onPageChange={(pageIndex) => onPageChange(pageIndex + 1)}`) en gardant le texte `{debut} – {fin} sur {total}`. État vide : `DataTableEmpty` avec `{ title: "Aucune conversation pour ces filtres" }`.

- [ ] **Step 4 : vérifier et committer**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): passe les logs et le tableau de bord Albert sur les primitives et la pagination partagées`.

---

### Task 17 : suppressions et vérification finale

**Files:**
- Delete: `apps/pilote-ppg/src/client/components/_commons/Tableau/` (dont `typesTableau.ts`, `BoutonsDeTri`, `FlècheDeTri`, `Pagination` et son test d'intégration)
- Delete: `apps/pilote-ppg/src/client/components/_commons/TableauNew/`
- Delete: `apps/pilote-ppg/src/client/react-table.d.ts` (augmentation globale de `ColumnMeta` ; plus aucun lecteur de `meta.width`/`tabIndex` hors `DataTableColumnMeta`)
- Modify: `apps/pilote-ppg/src/client/components/PageUtilisateur/PageUtilisateur.tsx`, `PageIndicateur/PageIndicateur.tsx`, `PageIndicateur/FicheIndicateur/FicheIndicateur.tsx` (imports `table.min.css` morts)

- [ ] **Step 1 : supprimer**

Supprimer les dossiers et fichiers ci-dessus et les trois imports CSS morts.

- [ ] **Step 2 : vérifier qu'il ne reste rien**

Run (depuis `apps/pilote-ppg`) :

```bash
grep -rn "_commons/Tableau/\|_commons/TableauNew\|shared/Tableau\"\|typesTableau\|table.min.css\|pagination.min.css\|fr-table\|as TableauHtml" src tests
```

Expected : aucune occurrence (le `notice.min.css` de `MiseEnPage/Navigation` n'est pas concerné).

- [ ] **Step 3 : tests et lint**

Run : `pnpm test:unit` → PASS.
Run : `pnpm test:client:integration` → PASS.
Run : `pnpm lint` → sans erreur.

- [ ] **Step 4 : commit**

Commit : `refactor(PIL-1822): supprime les anciens composants de tableau et le CSS DSFR des tableaux`.

- [ ] **Step 5 : e2e et coordination**

Demander à l'utilisateur s'il faut lancer `pnpm test:e2e` (sortie filtrée, vidéo désactivée) ; les sélecteurs de l'accueil ont été adaptés à la tâche 15. Envoyer à la session a11y `pilote-2-82` le récapitulatif (chemins, pages migrées) pour sa mesure axe avant/après.

---
