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
- Sur `dev`, `shared/Tableau.tsx` n'existe pas : les tableaux utilisent `.fr-table` directement ou `_commons/Tableau(New)`.
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

### Task 1 : primitives `Table.*`

**Files:**
- Modify: `apps/pilote-ppg/tailwind.config.js` (ajout de la couleur de focus DSFR)
- Create: `apps/pilote-ppg/src/client/components/shared/Table.tsx`
- Test: `apps/pilote-ppg/src/client/components/shared/Table.unit.test.tsx`

**Interfaces:**
- Produces : `Table` (`Root`, `Header`, `Body`, `Footer`, `Row`, `ColumnHeaderCell`, `RowHeaderCell`, `Cell`), `DSFR_TEXT_SPACING_RESET`, `INTERACTIVE_IN_CELL`, type `TableRootProps`.
- `Table.Root` props : `caption: ReactNode` (obligatoire), `captionHidden?: boolean`, `bordered?: boolean` (défaut `true`), `containerClassName?: string`, + props de `<table>`.
- Le conteneur ne devient une zone atteignable au clavier (`role="region"`, `tabIndex={0}`, `aria-labelledby` vers la légende) **que lorsque le tableau déborde horizontalement** (`scrollWidth > clientWidth`, mesuré au montage et via `ResizeObserver`) : sinon il ajouterait un arrêt de tabulation inutile sur chaque tableau (RGAA 12.8, remarque de PIL-1818).
- `Table.Body` props : `zebra?: boolean` (défaut `true`) + props de `<tbody>`.
- `Table.ColumnHeaderCell` props : props de `<th>` avec `children: ReactNode` **obligatoire**, `scope` par défaut `"col"`.
- `Table.RowHeaderCell` : `<th scope="row">`, même rendu qu'une `Cell` (graisse normale, pour ne pas changer le visuel des colonnes principales).
- Règle pour le lien de ligne étendu (tâche 4) : aucune primitive de cellule ne pose `position: relative` (sinon le pseudo-élément du lien serait borné à la cellule).

Point de départ : sur `dev`, aucune primitive partagée n'existe (`shared/Tableau.tsx` n'existait que sur la branche supprimée) ; les tableaux utilisent `.fr-table` directement ou `_commons/Tableau`. Valeurs reprises de `@gouvfr/dsfr/dist/component/table/table.css` (1.15.2, sélecteurs `.fr-table > table …`, balisage actuel de ppg) : cellules `padding: .75rem` puis `1rem` dès 48em, en-têtes `padding-bottom: .875rem` puis `1.125rem`, `font-size: .875rem`, `line-height: 1.5rem`, `text-align: left`, `vertical-align: middle` ; `thead` fond `#F6F6F6` (`dsfr-grey-1000`), texte `#161616` (`dsfr-grey-50`), trait bas 1 px `#3A3A3A` (`dsfr-grey-200`) ; `tbody` fond blanc, lignes paires `#F6F6F6` ; cadre 1 px `#929292` (`dsfr-grey-625`) posé par le JS DSFR (`data-fr-js-table`) ; caption `1.375rem/1.75rem`, gras, `margin-bottom: 1rem`.

- [ ] **Step 1 : ajouter la couleur de focus DSFR**

Dans `apps/pilote-ppg/tailwind.config.js`, dans `theme.extend.colors`, après `"dsfr-flat-info": "#0063cb",` :

```js
        "dsfr-focus": "#0A76F6",
```

- [ ] **Step 2 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/Table.unit.test.tsx` :

```tsx
import { render, screen, within } from "@testing-library/react";
import { Table } from "@/components/shared/Table";

const renderTable = (props: { captionHidden?: boolean } = {}) =>
  render(
    <Table.Root caption="Liste des chantiers" {...props}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            <span className="sr-only">Actions</span>
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.RowHeaderCell>Chantier A</Table.RowHeaderCell>
          <Table.Cell>
            <button type="button">Modifier</button>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>,
  );

describe("Table", () => {
  it("nomme le tableau par sa légende", () => {
    renderTable();

    expect(
      screen.getByRole("table", { name: "Liste des chantiers" }),
    ).toBeInTheDocument();
  });

  it("n'ajoute pas d'arrêt de tabulation quand le tableau ne déborde pas", () => {
    renderTable();

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("rend la zone de défilement atteignable au clavier quand le tableau déborde", () => {
    const scrollWidth = vi
      .spyOn(Element.prototype, "scrollWidth", "get")
      .mockReturnValue(800);
    const clientWidth = vi
      .spyOn(Element.prototype, "clientWidth", "get")
      .mockReturnValue(300);

    renderTable();

    expect(
      screen.getByRole("region", { name: "Liste des chantiers" }),
    ).toHaveAttribute("tabindex", "0");
    scrollWidth.mockRestore();
    clientWidth.mockRestore();
  });

  it("masque visuellement la légende sans la retirer de l'arbre d'accessibilité", () => {
    renderTable({ captionHidden: true });

    expect(screen.getByText("Liste des chantiers")).toHaveClass("sr-only");
    expect(
      screen.getByRole("table", { name: "Liste des chantiers" }),
    ).toBeInTheDocument();
  });

  it("associe les en-têtes de colonne et de ligne à leurs cellules", () => {
    renderTable();

    expect(
      screen
        .getAllByRole("columnheader")
        .map((cellule) => cellule.getAttribute("scope")),
    ).toEqual(["col", "col"]);
    expect(
      screen.getByRole("rowheader", { name: "Chantier A" }),
    ).toHaveAttribute("scope", "row");
  });

  it("donne un nom accessible à l'en-tête d'une colonne d'actions", () => {
    renderTable();

    expect(
      screen.getAllByRole("columnheader").map((cellule) => cellule.textContent),
    ).toEqual(["Nom", "Actions"]);
  });

  it("zèbre les lignes du corps par défaut et permet de le désactiver", () => {
    const { rerender } = render(
      <Table.Root caption="Zèbre">
        <Table.Body>
          <Table.Row>
            <Table.Cell>1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(
      within(screen.getByRole("table")).getAllByRole("rowgroup")[0],
    ).toHaveClass("[&>tr:nth-child(even)]:bg-dsfr-grey-1000");

    rerender(
      <Table.Root caption="Zèbre">
        <Table.Body zebra={false}>
          <Table.Row>
            <Table.Cell>1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(
      within(screen.getByRole("table")).getAllByRole("rowgroup")[0],
    ).not.toHaveClass("[&>tr:nth-child(even)]:bg-dsfr-grey-1000");
  });

  it("exige un contenu pour chaque en-tête de colonne", () => {
    // @ts-expect-error un <th> vide est interdit (RGAA : en-tête de colonne sans contenu)
    render(<Table.ColumnHeaderCell />);
  });
});
```

- [ ] **Step 3 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/Table.unit.test.tsx` (depuis `apps/pilote-ppg`)
Expected : FAIL, `Failed to resolve import "@/components/shared/Table"`.

- [ ] **Step 4 : implémenter `Table.tsx`**

`apps/pilote-ppg/src/client/components/shared/Table.tsx` :

```tsx
import {
  ComponentPropsWithoutRef,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { clsxm } from "@/utils/clsxm";

const useHorizontalOverflow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setOverflowing(element.scrollWidth > element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return [ref, overflowing] as const;
};

export const DSFR_TEXT_SPACING_RESET = "[--text-spacing:0] [--title-spacing:0]";

export const INTERACTIVE_IN_CELL =
  "[&_:is(a,button)]:min-h-6 [&_:is(a,button)]:min-w-6 [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-2 [&_:is(a,button):focus-visible]:outline-dsfr-focus";

export type TableRootProps = Omit<
  ComponentPropsWithoutRef<"table">,
  "children"
> & {
  caption: ReactNode;
  captionHidden?: boolean;
  bordered?: boolean;
  containerClassName?: string;
  children: ReactNode;
};

function Root({
  caption,
  captionHidden = false,
  bordered = true,
  containerClassName,
  className,
  children,
  ...props
}: TableRootProps) {
  const captionId = useId();
  const [containerRef, overflowing] = useHorizontalOverflow();
  return (
    <div
      className={clsxm(
        "relative w-full overflow-x-auto",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus",
        DSFR_TEXT_SPACING_RESET,
        containerClassName,
      )}
      ref={containerRef}
      {...(overflowing
        ? { role: "region", tabIndex: 0, "aria-labelledby": captionId }
        : {})}
    >
      <table
        className={clsxm(
          "w-full border-separate border-spacing-0",
          bordered && "border border-dsfr-grey-625",
          className,
        )}
        {...props}
      >
        <caption
          className={clsxm(
            captionHidden
              ? "sr-only"
              : "mb-4 text-left text-[1.375rem]/7 font-bold text-dsfr-grey-50",
          )}
          id={captionId}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

function Header({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={clsxm("bg-dsfr-grey-1000 text-dsfr-grey-50", className)}
      {...props}
    />
  );
}

function Body({
  zebra = true,
  className,
  ...props
}: ComponentPropsWithoutRef<"tbody"> & { zebra?: boolean }) {
  return (
    <tbody
      className={clsxm(
        "bg-white",
        zebra && "[&>tr:nth-child(even)]:bg-dsfr-grey-1000",
        className,
      )}
      {...props}
    />
  );
}

function Footer({ className, ...props }: ComponentPropsWithoutRef<"tfoot">) {
  return <tfoot className={clsxm(className)} {...props} />;
}

function Row({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return <tr className={clsxm(className)} {...props} />;
}

const CELL = "p-3 md:p-4 text-left align-middle text-sm/6";

function ColumnHeaderCell({
  scope = "col",
  className,
  ...props
}: ComponentPropsWithoutRef<"th"> & { children: ReactNode }) {
  return (
    <th
      className={clsxm(
        CELL,
        "pb-3.5 md:pb-4.5 font-bold",
        "border-b border-dsfr-grey-200",
        INTERACTIVE_IN_CELL,
        className,
      )}
      scope={scope}
      {...props}
    />
  );
}

function RowHeaderCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={clsxm(CELL, "font-normal", INTERACTIVE_IN_CELL, className)}
      scope="row"
      {...props}
    />
  );
}

function Cell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td className={clsxm(CELL, INTERACTIVE_IN_CELL, className)} {...props} />
  );
}

export const Table = Object.assign(Root, {
  Root,
  Header,
  Body,
  Footer,
  Row,
  ColumnHeaderCell,
  RowHeaderCell,
  Cell,
});
```

Le trait bas de l'en-tête est porté par les `ColumnHeaderCell` (`border-b`) : avec `border-separate`, c'est ce qui reproduit le `background-image` 1 px du `thead` DSFR.

- [ ] **Step 5 : lancer le test**

Run : `pnpm exec vitest run --project client src/client/components/shared/Table.unit.test.tsx`
Expected : PASS (8 tests).

- [ ] **Step 6 : lint et commit**

Run : `pnpm lint` (depuis `apps/pilote-ppg`) → sans erreur.
Commit via `commit-billable` : `refactor(PIL-1822): ajoute les primitives Table accessibles au rendu fr-table`, fichiers `tailwind.config.js`, `shared/Table.tsx`, `shared/Table.unit.test.tsx`.

**Point de contrôle utilisateur** (non bloquant) : comparer le cadre gris et le trait d'en-tête avec une page de `dev` ; si `dev` n'a pas de cadre, passer `bordered` à `false` par défaut.

---

### Task 2 : socle `DataTable` — types, fonctions de filtre, utilitaires

**Files:**
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/types.ts`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/features.ts`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/filterFns.ts`
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/filterFns.unit.test.ts`

**Interfaces:**
- Produces :
  - `type AnyTable`, `type AnyColumn` (instances tanstack non typées, réservées aux briques) ;
  - `type DataTableColumnMeta = { label?: string; sortButton?: boolean; width?: string; headerClassName?: string; cellClassName?: string; filter?: FilterDescriptor }` ;
  - `type FilterOption = { value: string; label: string }` et `type FilterDescriptor` (union `checkboxes` | `multiselect`, options statiques ; Pilote Eval, seul utilisateur des filtres `tags`, n'est pas migré) ;
  - `type EmptyMessage = { title: string; description?: ReactNode; action?: ReactNode }` et `type EmptyConfig = EmptyMessage | { noData: EmptyMessage; noResults: EmptyMessage }` ;
  - `hasFeature(table: AnyTable, feature: FeatureName): boolean` (lit `table.features`), `getColumnMeta(column)`, `getColumnLabel(column): string`, `toAriaSort(sorted: false | "asc" | "desc"): "none" | "ascending" | "descending"` ;
  - `filterFnOneOf` (filtre de colonne « la valeur de la ligne ∈ sélection, sélection vide = pas de filtre », avec `autoRemove`) ;
  - `createSearchFilterFn<TData>(search: (row: TData) => string[])` (filtre global insensible à la casse et aux accents).

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/filterFns.unit.test.ts` :

```ts
import {
  createSearchFilterFn,
  filterFnOneOf,
} from "@/components/shared/DataTable/filterFns";

const ligne = <T,>(valeur: T, original: object = {}) =>
  ({ getValue: () => valeur, original }) as never;

describe("filterFnOneOf", () => {
  it("laisse passer toutes les lignes quand aucune valeur n'est sélectionnée", () => {
    expect(filterFnOneOf(ligne("actif"), "statut", [], () => {})).toBe(true);
  });

  it("garde les lignes dont la valeur fait partie de la sélection", () => {
    expect(
      [ligne("actif"), ligne("inactif"), ligne("archive")].map((row) =>
        filterFnOneOf(row, "statut", ["actif", "archive"], () => {}),
      ),
    ).toEqual([true, false, true]);
  });

  it("accepte une valeur unique en guise de sélection", () => {
    expect(filterFnOneOf(ligne("actif"), "statut", "actif", () => {})).toBe(
      true,
    );
  });

  it("se retire automatiquement quand la sélection est vide", () => {
    expect(filterFnOneOf.autoRemove?.([])).toBe(true);
    expect(filterFnOneOf.autoRemove?.(["actif"])).toBe(false);
  });
});

describe("createSearchFilterFn", () => {
  const rechercher = createSearchFilterFn<{ nom: string; email: string }>(
    (utilisateur) => [utilisateur.nom, utilisateur.email],
  );

  it("trouve une ligne sans tenir compte de la casse ni des accents", () => {
    const utilisateur = { nom: "Élodie Martin", email: "elodie@gouv.fr" };
    expect(
      ["elodie", "MARTIN", "gouv.fr", "dupont"].map((recherche) =>
        rechercher(ligne(null, utilisateur), "", recherche, () => {}),
      ),
    ).toEqual([true, true, true, false]);
  });

  it("laisse passer toutes les lignes quand la recherche est vide", () => {
    expect(
      rechercher(ligne(null, { nom: "A", email: "a@b.c" }), "", "  ", () => {}),
    ).toBe(true);
  });
});
```

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/filterFns.unit.test.ts`
Expected : FAIL, `Failed to resolve import "@/components/shared/DataTable/filterFns"`.

- [ ] **Step 3 : implémenter `types.ts`**

```ts
import type { ReactNode } from "react";
import type { AppReactTable, Column } from "@tanstack/react-table";

// Les briques partagées reçoivent une instance dont le jeu de features varie d'une page à
// l'autre : en v9 aucun type concret ne les réunit. Seule `shared/DataTable/` manipule ce type,
// et chaque brique vérifie la présence d'une feature (`hasFeature`) avant d'en appeler les méthodes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTable = AppReactTable<any, any, any, any, any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumn = Column<any, any, any>;

export type FilterOption = { value: string; label: string };

export type FilterDescriptor =
  | { type: "checkboxes"; label: string; options: FilterOption[] }
  | {
      type: "multiselect";
      label: string;
      options: FilterOption[];
      className?: string;
      buttonClassName?: string;
    };

export type DataTableColumnMeta = {
  label?: string;
  sortButton?: boolean;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  filter?: FilterDescriptor;
};

export type EmptyMessage = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export type EmptyConfig =
  | EmptyMessage
  | { noData: EmptyMessage; noResults: EmptyMessage };
```

- [ ] **Step 4 : implémenter `features.ts`**

```ts
import type { AnyColumn, AnyTable, DataTableColumnMeta } from "./types";

export type FeatureName =
  | "rowSortingFeature"
  | "rowPaginationFeature"
  | "columnFilteringFeature"
  | "globalFilteringFeature"
  | "columnGroupingFeature"
  | "rowExpandingFeature"
  | "columnFacetingFeature";

export const hasFeature = (table: AnyTable, feature: FeatureName) =>
  feature in table.features;

export const getColumnMeta = (column: AnyColumn) =>
  column.columnDef.meta as DataTableColumnMeta | undefined;

export const getColumnLabel = (column: AnyColumn): string => {
  const header = column.columnDef.header;
  return (
    getColumnMeta(column)?.label ??
    (typeof header === "string" ? header : column.id)
  );
};

export const toAriaSort = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return "none";
};
```

- [ ] **Step 5 : implémenter `filterFns.ts`**

```ts
import type { FilterFn } from "@tanstack/react-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFilterFn = FilterFn<any, any>;

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

export const filterFnOneOf: AnyFilterFn = (row, columnId, filterValue) => {
  const selection = toArray(filterValue);
  if (selection.length === 0) return true;
  return selection.includes(row.getValue(columnId));
};
filterFnOneOf.autoRemove = (filterValue) => toArray(filterValue).length === 0;

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export const createSearchFilterFn =
  <TData,>(search: (row: TData) => string[]): AnyFilterFn =>
  (row, _columnId, filterValue) => {
    const recherche = normalize(String(filterValue ?? ""));
    if (recherche === "") return true;
    return search(row.original as TData).some((champ) =>
      normalize(champ ?? "").includes(recherche),
    );
  };
```

- [ ] **Step 6 : lancer le test**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/filterFns.unit.test.ts`
Expected : PASS (6 tests).

- [ ] **Step 7 : lint et commit**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): pose le socle DataTable (types, meta de colonnes, filtres oneOf et recherche)`.

---

### Task 3 : factory `createDataTableHook`, briques `Root`, `Header` (+ tri) et `Body` de base

**Files:**
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/config.ts`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/SortButtons.tsx`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/Header.tsx`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/Body.tsx`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/Root.tsx`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.tsx`
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.unit.test.tsx`

**Interfaces:**
- Consumes : `Table.*` (tâche 1) ; `AnyTable`, `DataTableColumnMeta`, `EmptyConfig`, `hasFeature`, `getColumnMeta`, `getColumnLabel`, `toAriaSort`, `createSearchFilterFn` (tâche 2).
- Produces :
  - `createDataTableHook(features)` → `{ useDataTable, createColumnHelper, features }` ; types exportés `AppFeatures<F>`, `DataTable<F, TData extends RowData>`, `DataTableOptions<F, TData extends RowData>` ;
  - `useDataTable<TData extends RowData>(options)` → instance tanstack + `Root`, `Header`, `Body`, `hasActiveFilters()`, `resetFilters()` (les tâches 6 et 8 ajoutent `Pagination` et `Filters`) ;
  - options ajoutées aux options tanstack : `rowHeader?: string`, `getRowHref?: (row) => string | undefined`, `tile?: (row) => ReactNode`, `search?: (row: TData) => string[]` ;
  - `DataTableRootProps` = props de `Table.Root` sans `children` + `empty?: EmptyConfig` + `children` ;
  - `DataTableHeaderProps = { className?: string; cellClassName?: string }` ;
  - `DataTableBodyProps = { className?: string; zebra?: boolean; rowClassName?: string | ((row: AnyRow) => string | undefined) }` (complété à la tâche 4) ;
  - `getDataTableConfig(table)` → `{ rowHeader?, getRowHref?, tile? }` lu dans `table.options.meta.dataTable` (complété aux tâches 5 et 7).
- Règles d'accessibilité du tri (PIL-1818) : `aria-sort` n'est posé **que sur la colonne triée** (jamais `none` sur les autres, jamais deux colonnes annoncées triées) ; les deux boutons portent toujours `aria-pressed` (`"true"`/`"false"`).
- Règles du factory : `columnVisibilityFeature` forcée (`Header`/`Body` utilisent `getHeaderGroups`/`getVisibleCells` ; sans elle `row.getVisibleCells is not a function`, constaté pendant l'exploration) ; `columnMeta: metaHelper<DataTableColumnMeta>()` ; `defaultColumn: { enableSorting: false }` (tri opt-in par colonne). Les briques sont liées à l'instance une seule fois (`useMemo` sur `table`) : leur identité est stable d'un rendu à l'autre.
- Conséquence du helper `createAppColumnHelper` : un `accessor` **fonction** exige un `id` (contrairement au helper core) — à ajouter lors des migrations.

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.unit.test.tsx` :

```tsx
import { render, renderHook, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";

type Chantier = { id: string; nom: string; avancement: number };

const chantiers: Chantier[] = [
  { id: "b", nom: "Chantier B", avancement: 20 },
  { id: "a", nom: "Chantier A", avancement: 50 },
];

const avecTri = createDataTableHook(
  tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() }),
);
const colonnesAvecTri = (() => {
  const helper = avecTri.createColumnHelper<Chantier>();
  return helper.columns([
    helper.accessor("nom", { header: "Nom", enableSorting: true }),
    helper.accessor("avancement", {
      header: "Avancement",
      enableSorting: true,
      meta: { sortButton: false },
    }),
    helper.accessor("id", { header: "Identifiant" }),
  ]);
})();

const minimal = createDataTableHook(tableFeatures({}));
const colonnesMinimal = (() => {
  const helper = minimal.createColumnHelper<Chantier>();
  return helper.columns([helper.accessor("nom", { header: "Nom" })]);
})();

function TableauAvecTri() {
  const table = avecTri.useDataTable({
    data: chantiers,
    columns: colonnesAvecTri,
    rowHeader: "nom",
  });
  return (
    <table.Root caption="Chantiers">
      <table.Header />
      <table.Body />
    </table.Root>
  );
}

function TableauMinimal() {
  const table = minimal.useDataTable({
    data: chantiers,
    columns: colonnesMinimal,
  });
  // @ts-expect-error une table sans rowSortingFeature n'expose pas setSorting
  void table.setSorting;
  return (
    <table.Root caption="Minimal">
      <table.Header />
      <table.Body />
    </table.Root>
  );
}

const lignesDuCorps = (tableau: HTMLElement) =>
  within(tableau)
    .getAllByRole("row")
    .slice(1)
    .map((ligne) =>
      within(ligne)
        .getAllByRole(/cell|rowheader/)
        .map((cellule) => cellule.textContent),
    );

describe("createDataTableHook", () => {
  it("rend l'en-tête et les lignes, la colonne principale en en-tête de ligne", () => {
    render(<TableauAvecTri />);

    const tableau = screen.getByRole("table", { name: "Chantiers" });
    expect(
      within(tableau)
        .getAllByRole("columnheader")
        .map((cellule) => cellule.textContent),
    ).toEqual([
      "NomTrier par Nom, ordre croissantTrier par Nom, ordre décroissant",
      "Avancement",
      "Identifiant",
    ]);
    expect(
      within(tableau)
        .getAllByRole("rowheader")
        .map((cellule) => cellule.textContent),
    ).toEqual(["Chantier B", "Chantier A"]);
  });

  it("n'annonce un ordre que sur la colonne effectivement triée", async () => {
    render(<TableauAvecTri />);
    const ordres = () =>
      screen
        .getAllByRole("columnheader")
        .map((cellule) => cellule.getAttribute("aria-sort"));

    expect(ordres()).toEqual([null, null, null]);

    await userEvent.click(
      screen.getByRole("button", { name: "Trier par Nom, ordre décroissant" }),
    );

    expect(ordres()).toEqual(["descending", null, null]);
    expect(
      screen
        .getAllByRole("button", { name: /Trier par Nom/ })
        .map((bouton) => bouton.getAttribute("aria-pressed")),
    ).toEqual(["false", "true"]);
  });

  it("trie au clic et reflète l'ordre dans aria-sort et aria-pressed", async () => {
    render(<TableauAvecTri />);

    const bouton = screen.getByRole("button", {
      name: "Trier par Nom, ordre croissant",
    });
    await userEvent.click(bouton);

    expect(lignesDuCorps(screen.getByRole("table"))).toEqual([
      ["Chantier A", "50", "a"],
      ["Chantier B", "20", "b"],
    ]);
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(bouton).toHaveAttribute("aria-pressed", "true");
  });

  it("n'affiche pas de bouton pour une colonne triée depuis l'extérieur", () => {
    render(<TableauAvecTri />);

    expect(
      screen.queryByRole("button", { name: /Trier par Avancement/ }),
    ).not.toBeInTheDocument();
  });

  it("rend une table sans feature de tri ni aria-sort", () => {
    render(<TableauMinimal />);

    expect(
      screen
        .getAllByRole("columnheader")
        .map((cellule) => cellule.getAttribute("aria-sort")),
    ).toEqual([null]);
    expect(lignesDuCorps(screen.getByRole("table"))).toEqual([
      ["Chantier B"],
      ["Chantier A"],
    ]);
  });

  it("garde l'identité des briques d'un rendu à l'autre", () => {
    const { result, rerender } = renderHook(() =>
      avecTri.useDataTable({ data: chantiers, columns: colonnesAvecTri }),
    );
    const premierRoot = result.current.Root;

    rerender();

    expect(result.current.Root).toBe(premierRoot);
  });
});
```

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/createDataTableHook.unit.test.tsx`
Expected : FAIL, `Failed to resolve import "@/components/shared/DataTable/createDataTableHook"`.

- [ ] **Step 3 : implémenter `config.ts`**

```ts
import type { ReactNode } from "react";
import type { Row } from "@tanstack/react-table";
import type { AnyTable } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRow = Row<any, any>;

export type DataTableConfig = {
  rowHeader?: string;
  getRowHref?: (row: AnyRow) => string | undefined;
  tile?: (row: AnyRow) => ReactNode;
};

export const getDataTableConfig = (table: AnyTable): DataTableConfig =>
  (table.options.meta as { dataTable?: DataTableConfig } | undefined)
    ?.dataTable ?? {};
```

- [ ] **Step 4 : implémenter `SortButtons.tsx`** (reprend le visuel de `_commons/Tableau/EnTête/BoutonsDeTri`, avec des noms accessibles)

```tsx
import { clsxm } from "@/utils/clsxm";
import type { AnyColumn } from "./types";

type Direction = "asc" | "desc";

function SortDirectionButton({
  direction,
  active,
  label,
  onClick,
  className,
}: {
  direction: Direction;
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={clsxm(
        "inline-flex w-6 h-7 items-center justify-center rounded border border-white bg-dsfr-blue-france-925 hover:bg-dsfr-blue-france-925-hover",
        active && "bg-primary hover:bg-dsfr-blue-france-sun-113-hover",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <span className="sr-only">{label}</span>
      <svg
        aria-hidden="true"
        className={active ? "text-white" : "text-primary"}
        fill="currentColor"
        height="6"
        viewBox="0 0 12 6"
        width="12"
      >
        <path
          clipRule="evenodd"
          d={direction === "asc" ? "M6 0L12 6H0L6 0Z" : "M6 6L0 0H12L6 6Z"}
          fillRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function SortButtons({
  column,
  label,
}: {
  column: AnyColumn;
  label: string;
}) {
  const sorted = column.getIsSorted();
  const toggle = (direction: Direction) =>
    sorted === direction
      ? column.clearSorting()
      : column.toggleSorting(direction === "desc");

  return (
    <span className="inline-flex items-center min-[576px]:flex-row min-[576px]:items-start">
      <SortDirectionButton
        active={sorted === "asc"}
        className="mr-1"
        direction="asc"
        label={`Trier par ${label}, ordre croissant`}
        onClick={() => toggle("asc")}
      />
      <SortDirectionButton
        active={sorted === "desc"}
        direction="desc"
        label={`Trier par ${label}, ordre décroissant`}
        onClick={() => toggle("desc")}
      />
    </span>
  );
}
```

- [ ] **Step 5 : implémenter `Header.tsx`**

```tsx
import type { Header as TanstackHeader } from "@tanstack/react-table";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import {
  getColumnLabel,
  getColumnMeta,
  hasFeature,
  toAriaSort,
} from "./features";
import { SortButtons } from "./SortButtons";
import type { AnyTable } from "./types";

export type DataTableHeaderProps = {
  className?: string;
  cellClassName?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHeader = TanstackHeader<any, any, any>;

function DataTableColumnHeader({
  table,
  header,
  cellClassName,
}: {
  table: AnyTable;
  header: AnyHeader;
  cellClassName?: string;
}) {
  const column = header.column;
  const meta = getColumnMeta(column);
  const label = getColumnLabel(column);
  const sortable =
    hasFeature(table, "rowSortingFeature") && column.getCanSort();
  const sorted = sortable ? column.getIsSorted() : false;

  return (
    <Table.ColumnHeaderCell
      aria-sort={sorted ? toAriaSort(sorted) : undefined}
      className={clsxm(cellClassName, meta?.headerClassName)}
      colSpan={header.colSpan > 1 ? header.colSpan : undefined}
      style={meta?.width ? { width: meta.width } : undefined}
    >
      {header.isPlaceholder ? (
        <span className="sr-only">{label}</span>
      ) : sortable && meta?.sortButton !== false ? (
        <span className="inline-flex items-center gap-2">
          <table.FlexRender header={header} />
          <SortButtons column={column} label={label} />
        </span>
      ) : (
        <table.FlexRender header={header} />
      )}
    </Table.ColumnHeaderCell>
  );
}

export function DataTableHeader({
  table,
  className,
  cellClassName,
}: DataTableHeaderProps & { table: AnyTable }) {
  return (
    <Table.Header className={className}>
      {table.getHeaderGroups().map((headerGroup) => (
        <Table.Row key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <DataTableColumnHeader
              cellClassName={cellClassName}
              header={header}
              key={header.id}
              table={table}
            />
          ))}
        </Table.Row>
      ))}
    </Table.Header>
  );
}
```

Convention (rappelée dans les migrations) : une colonne sans titre visible (actions, pictos) déclare `header: () => <span className="sr-only">Actions</span>` et `meta: { label: "Actions" }`.

- [ ] **Step 6 : implémenter `Body.tsx` (version de base : cellules, en-tête de ligne)**

```tsx
import { flexRender } from "@tanstack/react-table";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import { type AnyRow, getDataTableConfig } from "./config";
import { getColumnMeta } from "./features";
import type { AnyTable } from "./types";

export type DataTableBodyProps = {
  className?: string;
  zebra?: boolean;
  rowClassName?: string | ((row: AnyRow) => string | undefined);
};

function DataTableRow({
  table,
  row,
  rowClassName,
}: {
  table: AnyTable;
  row: AnyRow;
  rowClassName?: DataTableBodyProps["rowClassName"];
}) {
  const { rowHeader } = getDataTableConfig(table);

  return (
    <Table.Row
      className={
        typeof rowClassName === "function" ? rowClassName(row) : rowClassName
      }
    >
      {row.getVisibleCells().map((cell) => {
        const meta = getColumnMeta(cell.column);
        const content = flexRender(
          cell.column.columnDef.cell,
          cell.getContext(),
        );
        return cell.column.id === rowHeader ? (
          <Table.RowHeaderCell className={meta?.cellClassName} key={cell.id}>
            {content}
          </Table.RowHeaderCell>
        ) : (
          <Table.Cell className={meta?.cellClassName} key={cell.id}>
            {content}
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
}

export function DataTableBody({
  table,
  className,
  zebra,
  rowClassName,
}: DataTableBodyProps & { table: AnyTable }) {
  return (
    <Table.Body className={clsxm(className)} zebra={zebra}>
      {table.getRowModel().rows.map((row) => (
        <DataTableRow
          key={row.id}
          row={row}
          rowClassName={rowClassName}
          table={table}
        />
      ))}
    </Table.Body>
  );
}
```

- [ ] **Step 7 : implémenter `Root.tsx` (version de base)**

```tsx
import type { ReactNode } from "react";
import { Table, type TableRootProps } from "@/components/shared/Table";
import type { AnyTable, EmptyConfig } from "./types";

export type DataTableRootProps = Omit<TableRootProps, "children"> & {
  empty?: EmptyConfig;
  children: ReactNode;
};

export function DataTableRoot({
  table,
  empty: _empty,
  children,
  ...props
}: DataTableRootProps & { table: AnyTable }) {
  return (
    <table.AppTable>
      <Table.Root {...props}>{children}</Table.Root>
    </table.AppTable>
  );
}
```

(`empty` est branché à la tâche 5.)

- [ ] **Step 8 : implémenter `createDataTableHook.tsx`**

```tsx
import {
  columnVisibilityFeature,
  createTableHook,
  metaHelper,
  tableFeatures,
  type AppReactTable,
  type CreateTableHookOptions,
  type Row,
  type RowData,
  type TableFeatures,
  type TableOptions,
  type TableState,
} from "@tanstack/react-table";
import { type ReactNode, useMemo } from "react";
import { DataTableBody, type DataTableBodyProps } from "./Body";
import type { DataTableConfig } from "./config";
import { hasFeature } from "./features";
import { createSearchFilterFn } from "./filterFns";
import { DataTableHeader, type DataTableHeaderProps } from "./Header";
import { DataTableRoot, type DataTableRootProps } from "./Root";
import type { AnyTable, DataTableColumnMeta } from "./types";

const dataTableBaseFeatures = tableFeatures({
  columnVisibilityFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type AppFeatures<F extends TableFeatures> = F &
  typeof dataTableBaseFeatures;

type NoComponents = Record<never, never>;

export type DataTableOptions<
  F extends TableFeatures,
  TData extends RowData,
> = Omit<TableOptions<AppFeatures<F>, TData>, "features"> & {
  rowHeader?: string;
  getRowHref?: (row: Row<AppFeatures<F>, TData>) => string | undefined;
  tile?: (row: Row<AppFeatures<F>, TData>) => ReactNode;
  search?: (row: TData) => string[];
};

type DataTableBricks = {
  Root: (props: DataTableRootProps) => ReactNode;
  Header: (props: DataTableHeaderProps) => ReactNode;
  Body: (props: DataTableBodyProps) => ReactNode;
  hasActiveFilters: () => boolean;
  resetFilters: () => void;
};

export type DataTable<
  F extends TableFeatures,
  TData extends RowData,
> = AppReactTable<
  F,
  TData,
  TableState<F>,
  NoComponents,
  NoComponents,
  NoComponents
> &
  DataTableBricks;

const bindBricks = (table: AnyTable) => {
  const bricks: DataTableBricks = {
    Root: (props) => <DataTableRoot table={table} {...props} />,
    Header: (props) => <DataTableHeader table={table} {...props} />,
    Body: (props) => <DataTableBody table={table} {...props} />,
    hasActiveFilters: () => {
      const state = table.store.state;
      return (
        (state.columnFilters?.length ?? 0) > 0 ||
        Boolean(state.globalFilter?.trim?.())
      );
    },
    resetFilters: () => {
      if (hasFeature(table, "columnFilteringFeature")) {
        table.resetColumnFilters(true);
      }
      if (hasFeature(table, "globalFilteringFeature")) {
        table.resetGlobalFilter(true);
      }
    },
  };
  return bricks;
};

export function createDataTableHook<F extends TableFeatures>(features: F) {
  type Features = AppFeatures<F>;

  const hook = createTableHook({
    features: { ...features, ...dataTableBaseFeatures },
    defaultColumn: { enableSorting: false },
  } as unknown as CreateTableHookOptions<
    Features,
    NoComponents,
    NoComponents,
    NoComponents
  >);

  function useDataTable<TData extends RowData>({
    rowHeader,
    getRowHref,
    tile,
    search,
    ...tableOptions
  }: DataTableOptions<F, TData>): DataTable<Features, TData> {
    const dataTable: DataTableConfig = {
      rowHeader,
      getRowHref: getRowHref as DataTableConfig["getRowHref"],
      tile: tile as DataTableConfig["tile"],
    };
    const table = hook.useAppTable<TData>({
      ...tableOptions,
      ...(search ? { globalFilterFn: createSearchFilterFn(search) } : {}),
      meta: { ...tableOptions.meta, dataTable },
    } as never);

    return useMemo(
      () =>
        Object.assign(
          table,
          bindBricks(table as unknown as AnyTable),
        ) as unknown as DataTable<Features, TData>,
      [table],
    );
  }

  return {
    useDataTable,
    createColumnHelper: hook.createAppColumnHelper,
    features: hook.appFeatures,
  };
}
```

Notes pour l'exécutant :
- `hook.useAppTable` renvoie l'instance **stable** de tanstack (le test « garde l'identité des briques » le vérifie). Si ce test échoue parce que l'instance change à chaque rendu, créer les briques une seule fois (`useState(() => …)`) en les faisant lire l'instance courante via une référence mise à jour dans un `useEffect`, et le signaler.
- Si `tsc` refuse `{ ...tableOptions.meta, dataTable }` (type `TableMeta` vide), c'est couvert par le `as never` de l'objet d'options ; ne pas ajouter d'augmentation globale de `TableMeta`.

- [ ] **Step 9 : lancer le test**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/createDataTableHook.unit.test.tsx`
Expected : PASS (6 tests).

- [ ] **Step 10 : lint et commit**

Run : `pnpm lint` → sans erreur (le `@ts-expect-error` du test prouve le typage conditionnel).
Commit : `refactor(PIL-1822): ajoute le factory DataTable (createTableHook) et les briques Root, Header et Body`.

---

### Task 4 : `Body` — lien unique par ligne, lignes de groupe

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/Body.tsx`
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/Body.unit.test.tsx`

**Interfaces:**
- Consumes : `getDataTableConfig` (`rowHeader`, `getRowHref`) (tâche 3) ; `hasFeature`, `getColumnMeta` (tâche 2).
- Produces :
  - avec `getRowHref` et `rowHeader` : la cellule `rowHeader` contient **un seul** `<a>` (`next/link`) nommé par son contenu, dont la zone couvre toute la ligne (`after:absolute after:inset-0`, `<tr>` en `relative`) ; les autres éléments interactifs de la ligne passent au-dessus (`relative z-10`) ; aucune autre ancre n'est ajoutée ;
  - le focus du lien est rendu visible **sur toute la ligne** (`outline` DSFR 2 px sur le `<tr>` via `:has(> th > a:focus-visible)`, l'outline propre du lien étant alors retiré) — RGAA 10.7 ; l'ordre de tabulation reste lien principal puis actions de la ligne tant que la colonne `rowHeader` précède les colonnes d'actions (à respecter dans les migrations) ;
  - si `getRowHref(row)` renvoie `undefined`, la ligne n'a pas de lien ;
  - lignes de groupe (`columnGroupingFeature` + `row.getIsGrouped()`) : la cellule groupée (si sa colonne est visible) contient un `<button type="button" aria-expanded>` qui déplie/replie (`row.getToggleExpandedHandler()`) ; toutes les autres cellules d'une ligne de groupe rendent `columnDef.aggregatedCell ?? columnDef.cell` — **règle v8 conservée volontairement** : en v9 `cell.getIsAggregated()` n'est vrai que si la colonne a une `aggregationFn`, or l'accueil déclare des `aggregatedCell` sans fonction d'agrégation (colonnes `nom`, `écart`, `dérouler-groupe`) ; pas de lien sur une ligne de groupe ;
  - prop `cellClassName?: string` sur `table.Body`, appliquée à toutes les cellules (avant `meta.cellClassName`) ;
  - prop `cellTitle?: boolean` sur `table.Body` : pose `title` = valeur de la cellule (si c'est une chaîne ou un nombre) sur chaque cellule, pour les colonnes tronquées de l'admin ;
  - prop `renderGroupCell?: (cell) => ReactNode` sur `table.Body` pour personnaliser le contenu du bouton de groupe (accueil : ligne « ministère »).

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/Body.unit.test.tsx` :

```tsx
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  columnGroupingFeature,
  createExpandedRowModel,
  createGroupedRowModel,
  rowExpandingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";

type Chantier = { id: string; nom: string; ministere: string; taux: number };

const chantiers: Chantier[] = [
  { id: "1", nom: "Eau", ministere: "MTE", taux: 20 },
  { id: "2", nom: "Air", ministere: "MTE", taux: 40 },
  { id: "3", nom: "École", ministere: "MEN", taux: 10 },
];

const plat = createDataTableHook(tableFeatures({}));
const colonnesPlates = (() => {
  const helper = plat.createColumnHelper<Chantier>();
  return helper.columns([
    helper.accessor("nom", { header: "Nom" }),
    helper.accessor("taux", { header: "Taux" }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      meta: { label: "Actions" },
      cell: () => <button type="button">Modifier</button>,
    }),
  ]);
})();

function TableauPlat() {
  const table = plat.useDataTable({
    data: chantiers,
    columns: colonnesPlates,
    rowHeader: "nom",
    getRowHref: (row) =>
      row.original.id === "3" ? undefined : `/chantier/${row.original.id}`,
  });
  return (
    <table.Root caption="Chantiers">
      <table.Header />
      <table.Body />
    </table.Root>
  );
}

const groupe = createDataTableHook(
  tableFeatures({
    columnGroupingFeature,
    rowExpandingFeature,
    groupedRowModel: createGroupedRowModel(),
    expandedRowModel: createExpandedRowModel(),
  }),
);
const colonnesGroupees = (() => {
  const helper = groupe.createColumnHelper<Chantier>();
  return helper.columns([
    helper.accessor("ministere", { header: "Ministère" }),
    helper.accessor("nom", { header: "Nom" }),
    helper.accessor("taux", {
      header: "Taux",
      aggregationFn: "sum",
      aggregatedCell: ({ getValue }) => `Total ${getValue()}`,
    }),
  ]);
})();

function TableauGroupe() {
  const table = groupe.useDataTable({
    data: chantiers,
    columns: colonnesGroupees,
    rowHeader: "nom",
    getRowHref: (row) => `/chantier/${row.original.id}`,
    initialState: { grouping: ["ministere"], expanded: {} },
  });
  return (
    <table.Root caption="Chantiers groupés">
      <table.Header />
      <table.Body />
    </table.Root>
  );
}

describe("table.Body", () => {
  it("rend un seul lien nommé par ligne, sur la colonne principale", () => {
    render(<TableauPlat />);

    expect(
      screen.getAllByRole("link").map((lien) => [
        lien.textContent,
        lien.getAttribute("href"),
      ]),
    ).toEqual([
      ["Eau", "/chantier/1"],
      ["Air", "/chantier/2"],
    ]);
  });

  it("étend le lien à toute la ligne et garde les autres actions cliquables", () => {
    render(<TableauPlat />);

    const ligne = screen.getByRole("link", { name: "Eau" }).closest("tr");
    expect(ligne).toHaveClass(
      "relative",
      "[&:has(>th>a:focus-visible)]:outline-2",
    );
    expect(screen.getByRole("link", { name: "Eau" })).toHaveClass(
      "after:absolute",
    );
    expect(
      within(ligne as HTMLElement).getByRole("button", { name: "Modifier" })
        .parentElement,
    ).toHaveClass("[&_:is(a,button,input,select,textarea)]:relative");
  });

  it("ne rend pas de lien quand la ligne n'a pas de destination", () => {
    render(<TableauPlat />);

    expect(screen.getByRole("rowheader", { name: "École" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "École" })).not.toBeInTheDocument();
  });

  it("déplie un groupe avec un bouton qui expose son état", async () => {
    render(<TableauGroupe />);

    const bouton = screen.getByRole("button", { name: /MTE/ });
    expect(bouton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Total 60")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await userEvent.click(bouton);

    expect(bouton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getAllByRole("link").map((lien) => lien.textContent),
    ).toEqual(["Eau", "Air"]);
  });
});
```

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/Body.unit.test.tsx`
Expected : FAIL (`Unable to find role="link"`).

- [ ] **Step 3 : réécrire `Body.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { type Cell, flexRender } from "@tanstack/react-table";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import { type AnyRow, getDataTableConfig } from "./config";
import { getColumnMeta, hasFeature } from "./features";
import type { AnyTable } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCell = Cell<any, any, any>;

export type DataTableBodyProps = {
  className?: string;
  cellClassName?: string;
  cellTitle?: boolean;
  zebra?: boolean;
  rowClassName?: string | ((row: AnyRow) => string | undefined);
  renderGroupCell?: (cell: AnyCell) => ReactNode;
};

const ROW_LINK_FOCUS =
  "[&:has(>th>a:focus-visible)]:outline-2 [&:has(>th>a:focus-visible)]:-outline-offset-2 [&:has(>th>a:focus-visible)]:outline-dsfr-focus";

const ABOVE_ROW_LINK =
  "[&_:is(a,button,input,select,textarea)]:relative [&_:is(a,button,input,select,textarea)]:z-10";

function renderCellContent(
  cell: AnyCell,
  isGroupRow: boolean,
  renderGroupCell: DataTableBodyProps["renderGroupCell"],
) {
  const row = cell.row;
  if (isGroupRow && cell.getIsGrouped()) {
    return (
      <button
        aria-expanded={row.getIsExpanded()}
        className="inline-flex items-center gap-2 text-left"
        onClick={row.getToggleExpandedHandler()}
        type="button"
      >
        {renderGroupCell
          ? renderGroupCell(cell)
          : flexRender(cell.column.columnDef.cell, cell.getContext())}
      </button>
    );
  }
  const template = isGroupRow
    ? (cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell)
    : cell.column.columnDef.cell;
  return flexRender(template, cell.getContext());
}

function DataTableRow({
  table,
  row,
  rowClassName,
  cellClassName,
  cellTitle,
  renderGroupCell,
}: {
  table: AnyTable;
  row: AnyRow;
  rowClassName?: DataTableBodyProps["rowClassName"];
  cellClassName?: string;
  cellTitle?: boolean;
  renderGroupCell?: DataTableBodyProps["renderGroupCell"];
}) {
  const { rowHeader, getRowHref } = getDataTableConfig(table);
  const isGroupRow =
    hasFeature(table, "columnGroupingFeature") && row.getIsGrouped();
  const href = isGroupRow ? undefined : getRowHref?.(row);

  return (
    <Table.Row
      className={clsxm(
        href && ["relative", ROW_LINK_FOCUS],
        typeof rowClassName === "function" ? rowClassName(row) : rowClassName,
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const meta = getColumnMeta(cell.column);
        const content = renderCellContent(cell, isGroupRow, renderGroupCell);
        const value = cellTitle ? cell.getValue() : undefined;
        const title =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : undefined;

        if (cell.column.id === rowHeader) {
          return (
            <Table.RowHeaderCell
              className={clsxm(cellClassName, meta?.cellClassName)}
              key={cell.id}
              title={title}
            >
              {href ? (
                <Link
                  className="after:absolute after:inset-0 after:content-[''] focus-visible:!outline-none"
                  href={href}
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </Table.RowHeaderCell>
          );
        }
        return (
          <Table.Cell
            className={clsxm(
              cellClassName,
              href && ABOVE_ROW_LINK,
              meta?.cellClassName,
            )}
            key={cell.id}
            title={title}
          >
            {content}
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
}

export function DataTableBody({
  table,
  className,
  cellClassName,
  cellTitle,
  zebra,
  rowClassName,
  renderGroupCell,
}: DataTableBodyProps & { table: AnyTable }) {
  return (
    <Table.Body className={clsxm(className)} zebra={zebra}>
      {table.getRowModel().rows.map((row) => (
        <DataTableRow
          cellClassName={cellClassName}
          cellTitle={cellTitle}
          key={row.id}
          renderGroupCell={renderGroupCell}
          row={row}
          rowClassName={rowClassName}
          table={table}
        />
      ))}
    </Table.Body>
  );
}
```

- [ ] **Step 4 : lancer les tests**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable`
Expected : PASS (nouveau fichier + tests des tâches précédentes toujours verts).

- [ ] **Step 5 : lint et commit**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): rend les lignes de tableau cliquables par un lien unique et gère les groupes`.

---

### Task 5 : `Root` complet — état vide, annonces, vue tuile

**Files:**
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/Empty.tsx`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/LiveRegion.tsx`
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/TileList.tsx`
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/Root.tsx`
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/config.ts` (`tileBreakpoint`)
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.tsx` (option `tileBreakpoint`)
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/Root.unit.test.tsx`

**Interfaces:**
- Consumes : `Table.Root` (tâche 1) ; `AnyTable`, `EmptyConfig`, `EmptyMessage`, `hasFeature`, `getColumnLabel` (tâche 2) ; `getDataTableConfig`, `DataTableRoot`, `table.hasActiveFilters()` / `table.resetFilters()` via `bindBricks` (tâche 3).
- Produces :
  - `DataTableEmpty` : bloc `role="status"` qui recode `fr-notice--info` (fond `dsfr-info-950`, texte `dsfr-flat-info`, `py-4`, titre gras précédé de l'icône `InformationPleineIcon` 24 px) ; avec `{ noData, noResults }`, affiche `noResults` quand des filtres sont actifs, avec un bouton « Réinitialiser les filtres » ;
  - `DataTableLiveRegion` : **une seule par tableau, montée vide dès le premier rendu** (une région insérée au moment de l'annonce n'est pas lue), `aria-live="polite"`, `aria-atomic="true"`, `sr-only` ; annonce le tri (« Trié par {libellé}, ordre croissant|décroissant », « Tri retiré »), la page (« Page {n} sur {total} ») et le nombre de résultats après un filtre ou une recherche (« {n} résultat(s) », « Aucun résultat ») ; rien au premier rendu ;
  - `DataTableTileList` : sous le point de rupture `tileBreakpoint` (option de `useDataTable`, défaut `"sm"` ; store `estLargeurDÉcranActuelleMoinsLargeQue`, comparaison inclusive : `"sm"` = largeur < 768 px, `"lg"` = < 1280 px) et si `tile` est fourni, `<ul>`/`<li>` nommée par la légende à la place du `<table>` ; si `getRowHref(row)` renvoie une URL, la tuile est enveloppée dans un `next/link` (`block`) ; prop `tileClassName?: (row) => string | undefined` sur `table.Root` pour styler chaque `<li>` ;
  - `Root` : ordre de décision → aucune ligne et `empty` fourni : état vide ; sinon vue tuile si applicable ; sinon `Table.Root`. La région d'annonces est toujours rendue.

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/Root.unit.test.tsx` :

```tsx
import { act, render, renderHook, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { actionsLargeurDÉcranStore } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";

type Chantier = { id: string; nom: string };

const hook = createDataTableHook(
  tableFeatures({
    rowSortingFeature,
    columnFilteringFeature,
    globalFilteringFeature,
    sortedRowModel: createSortedRowModel(),
    filteredRowModel: createFilteredRowModel(),
  }),
);
const colonnes = (() => {
  const helper = hook.createColumnHelper<Chantier>();
  return helper.columns([
    helper.accessor("nom", { header: "Nom", enableSorting: true }),
  ]);
})();

function Tableau({
  data,
  avecTuile = false,
}: {
  data: Chantier[];
  avecTuile?: boolean;
}) {
  const table = hook.useDataTable({
    data,
    columns: colonnes,
    search: (chantier) => [chantier.nom],
    ...(avecTuile
      ? {
          tile: (row) => <p>{`Tuile ${row.original.nom}`}</p>,
          getRowHref: (row) => `/chantier/${row.original.id}`,
          tileLabel: (row) => row.original.nom,
        }
      : {}),
  });
  return (
    <>
      <input
        aria-label="Rechercher"
        onChange={(event) => table.setGlobalFilter(event.target.value)}
      />
      <table.Root
        caption="Chantiers"
        empty={{
          noData: { title: "Aucun chantier" },
          noResults: { title: "Aucun chantier ne correspond" },
        }}
      >
        <table.Header />
        <table.Body />
      </table.Root>
    </>
  );
}

const chantiers = [
  { id: "1", nom: "Eau" },
  { id: "2", nom: "Air" },
];

const passerEnMobile = () => {
  const { result } = renderHook(() => actionsLargeurDÉcranStore());
  act(() => result.current.modifierLargeurDÉcran("xs"));
  return () => act(() => result.current.modifierLargeurDÉcran("lg"));
};

describe("table.Root", () => {
  it("annonce l'état vide sans données", () => {
    render(<Tableau data={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Aucun chantier");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("distingue l'absence de résultat et permet de réinitialiser les filtres", async () => {
    render(<Tableau data={chantiers} />);

    await userEvent.type(screen.getByLabelText("Rechercher"), "zzz");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Aucun chantier ne correspond",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Réinitialiser les filtres" }),
    );
    expect(screen.getByRole("table", { name: "Chantiers" })).toBeInTheDocument();
  });

  it("annonce le tri appliqué", async () => {
    render(<Tableau data={chantiers} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Trier par Nom, ordre décroissant" }),
    );

    expect(screen.getByText("Trié par Nom, ordre décroissant")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("annonce le nombre de résultats après une recherche", async () => {
    render(<Tableau data={chantiers} />);

    await userEvent.type(screen.getByLabelText("Rechercher"), "ea");

    expect(screen.getByText("1 résultat")).toBeInTheDocument();
  });

  it("n'annonce rien au premier affichage", () => {
    render(<Tableau data={chantiers} />);

    expect(
      document.querySelector("[aria-live='polite']")?.textContent,
    ).toBe("");
  });

  it("présente les lignes en liste de tuiles sur petit écran", () => {
    const revenirEnDesktop = passerEnMobile();
    render(<Tableau avecTuile data={chantiers} />);

    const liste = screen.getByRole("list", { name: "Chantiers" });
    expect(
      within(liste)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Tuile Eau", "Tuile Air"]);
    expect(
      within(liste)
        .getAllByRole("link")
        .map((lien) => lien.getAttribute("aria-label")),
    ).toEqual(["Eau", "Air"]);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    revenirEnDesktop();
  });
});
```

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/Root.unit.test.tsx`
Expected : FAIL (pas d'état vide : `Unable to find role="status"`).

- [ ] **Step 3 : implémenter `Empty.tsx`**

```tsx
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import type { AnyTable, EmptyConfig, EmptyMessage } from "./types";

const isSplitConfig = (
  empty: EmptyConfig,
): empty is { noData: EmptyMessage; noResults: EmptyMessage } =>
  "noData" in empty;

export function DataTableEmpty({
  empty,
  hasActiveFilters,
  onResetFilters,
}: {
  empty: EmptyConfig;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  const showNoResults = isSplitConfig(empty) && hasActiveFilters;
  const message = isSplitConfig(empty)
    ? showNoResults
      ? empty.noResults
      : empty.noData
    : empty;

  return (
    <div className="bg-dsfr-info-950 py-4 text-dsfr-flat-info" role="status">
      <div className="flex flex-col items-start gap-2 px-4 md:px-6">
        <p className="!mb-0 flex items-center gap-1 font-bold">
          <Icone className="w-6 h-6 shrink-0 text-current" icone={InformationPleineIcon} />
          {message.title}
        </p>
        {message.description}
        {message.action}
        {showNoResults && (
          <Bouton
            label="Réinitialiser les filtres"
            onClick={onResetFilters}
            size="sm"
            variant="secondary"
          />
        )}
      </div>
    </div>
  );
}

export const isTableEmpty = (table: AnyTable) =>
  table.getRowModel().rows.length === 0;
```

- [ ] **Step 4 : implémenter `LiveRegion.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { getColumnLabel, hasFeature } from "./features";
import type { AnyTable } from "./types";

const plural = (count: number) =>
  count === 0 ? "Aucun résultat" : `${count} résultat${count > 1 ? "s" : ""}`;

function describeSorting(table: AnyTable) {
  const [first] = table.store.state.sorting ?? [];
  if (!first) return "Tri retiré";
  const column = table.getColumn(first.id);
  const label = column ? getColumnLabel(column) : first.id;
  return `Trié par ${label}, ordre ${first.desc ? "décroissant" : "croissant"}`;
}

const resultCount = (table: AnyTable) =>
  hasFeature(table, "rowPaginationFeature")
    ? table.getRowCount()
    : table.getRowModel().rows.length;

export function DataTableLiveRegion({ table }: { table: AnyTable }) {
  const state = table.store.state;
  const sortingKey = JSON.stringify(state.sorting ?? null);
  const pageIndex = state.pagination?.pageIndex ?? null;
  const filtersKey = JSON.stringify([
    state.columnFilters ?? null,
    state.globalFilter ?? null,
  ]);
  const count = resultCount(table);

  const [message, setMessage] = useState("");
  const previous = useRef({ sortingKey, pageIndex, filtersKey, count });

  useEffect(() => {
    const before = previous.current;
    previous.current = { sortingKey, pageIndex, filtersKey, count };
    if (before.sortingKey !== sortingKey) {
      setMessage(describeSorting(table));
    } else if (before.filtersKey !== filtersKey || before.count !== count) {
      setMessage(plural(count));
    } else if (before.pageIndex !== pageIndex && pageIndex != null) {
      setMessage(`Page ${pageIndex + 1} sur ${table.getPageCount()}`);
    }
  }, [table, sortingKey, pageIndex, filtersKey, count]);

  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
```

Le composant se re-rend avec `Root`, qui se re-rend à chaque changement d'état de la page (le `useDataTable` s'abonne à tout l'état par défaut) ; `hasFeature` n'est pas nécessaire pour lire `table.store.state`, qui contient seulement les tranches des features présentes.

- [ ] **Step 5 : implémenter `TileList.tsx`**

```tsx
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { clsxm } from "@/utils/clsxm";
import type { AnyRow } from "./config";
import type { AnyTable } from "./types";

export function DataTableTileList({
  table,
  caption,
  tile,
  getRowHref,
  tileLabel,
  tileClassName,
}: {
  table: AnyTable;
  caption: ReactNode;
  tile: (row: AnyRow) => ReactNode;
  getRowHref?: (row: AnyRow) => string | undefined;
  tileLabel?: (row: AnyRow) => string;
  tileClassName?: (row: AnyRow) => string | undefined;
}) {
  const captionId = useId();
  return (
    <>
      <p className="sr-only" id={captionId}>
        {caption}
      </p>
      <ul aria-labelledby={captionId} className="flex flex-col">
        {table.getRowModel().rows.map((row) => {
          const href = row.getIsGrouped?.() ? undefined : getRowHref?.(row);
          return (
            <li className={clsxm(tileClassName?.(row))} key={row.id}>
              {href ? (
                <Link
                  aria-label={tileLabel?.(row)}
                  className="block no-underline bg-none"
                  href={href}
                >
                  {tile(row)}
                </Link>
              ) : (
                tile(row)
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
```

`row.getIsGrouped` n'existe qu'avec `columnGroupingFeature` : l'appel optionnel évite de supposer la feature.

- [ ] **Step 6 : réécrire `Root.tsx`**

```tsx
import type { ReactNode } from "react";
import { Table, type TableRootProps } from "@/components/shared/Table";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import { type AnyRow, getDataTableConfig } from "./config";
import { DataTableEmpty, isTableEmpty } from "./Empty";
import { DataTableLiveRegion } from "./LiveRegion";
import { DataTableTileList } from "./TileList";
import type { AnyTable, EmptyConfig } from "./types";

export type DataTableRootProps = Omit<TableRootProps, "children"> & {
  empty?: EmptyConfig;
  tileClassName?: (row: AnyRow) => string | undefined;
  children: ReactNode;
};

export function DataTableRoot({
  table,
  empty,
  tileClassName,
  hasActiveFilters,
  onResetFilters,
  children,
  ...props
}: DataTableRootProps & {
  table: AnyTable;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  const { tile, tileBreakpoint, tileLabel, getRowHref } =
    getDataTableConfig(table);
  const isNarrow = estLargeurDÉcranActuelleMoinsLargeQue(tileBreakpoint ?? "sm");

  const content =
    empty != null && isTableEmpty(table) ? (
      <DataTableEmpty
        empty={empty}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
      />
    ) : tile != null && isNarrow ? (
      <DataTableTileList
        caption={props.caption}
        getRowHref={getRowHref}
        table={table}
        tile={tile}
        tileClassName={tileClassName}
        tileLabel={tileLabel}
      />
    ) : (
      <Table.Root {...props}>{children}</Table.Root>
    );

  return (
    <table.AppTable>
      {content}
      <DataTableLiveRegion table={table} />
    </table.AppTable>
  );
}
```

Dans `createDataTableHook.tsx`, remplacer entièrement `bindBricks` par cette version, où `Root` reçoit l'état des filtres calculé par les autres briques :

```tsx
const bindBricks = (table: AnyTable) => {
  const bricks: DataTableBricks = {
    Root: (props) => (
      <DataTableRoot
        hasActiveFilters={bricks.hasActiveFilters()}
        onResetFilters={bricks.resetFilters}
        table={table}
        {...props}
      />
    ),
    Header: (props) => <DataTableHeader table={table} {...props} />,
    Body: (props) => <DataTableBody table={table} {...props} />,
    hasActiveFilters: () => {
      const state = table.store.state;
      return (
        (state.columnFilters?.length ?? 0) > 0 ||
        Boolean(state.globalFilter?.trim?.())
      );
    },
    resetFilters: () => {
      if (hasFeature(table, "columnFilteringFeature")) {
        table.resetColumnFilters(true);
      }
      if (hasFeature(table, "globalFilteringFeature")) {
        table.resetGlobalFilter(true);
      }
    },
  };
  return bricks;
};
```

- [ ] **Step 6 bis : option `tileBreakpoint`**

Dans `config.ts`, ajouter l'import `import type { PointDeRuptureÉcran } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore.interface";` et les champs `tileBreakpoint?: PointDeRuptureÉcran;` et `tileLabel?: (row: AnyRow) => string;` à `DataTableConfig`.

Dans `createDataTableHook.tsx` : ajouter `tileBreakpoint?: PointDeRuptureÉcran;` et `tileLabel?: (row: Row<AppFeatures<F>, TData>) => string;` à `DataTableOptions` (même import), les déstructurer dans `useDataTable`, et les ajouter à l'objet `dataTable` :

```tsx
    const dataTable: DataTableConfig = {
      rowHeader,
      getRowHref: getRowHref as DataTableConfig["getRowHref"],
      tile: tile as DataTableConfig["tile"],
      tileBreakpoint,
      tileLabel: tileLabel as DataTableConfig["tileLabel"],
    };
```

`tileLabel` borne le nom accessible du lien d'une tuile (sinon tout le texte de la carte devient le nom du lien). Une tuile enveloppée dans un lien ne doit contenir **aucun** élément interactif (axe `nested-interactive`) ; même règle pour un bouton de groupe.

- [ ] **Step 7 : lancer les tests**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable`
Expected : PASS.

- [ ] **Step 8 : lint et commit**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): ajoute l'état vide, les annonces et la vue tuile au Root DataTable`.

---

### Task 6 : brique `Pagination` (recode `fr-pagination`)

**Files:**
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/Pagination.tsx`
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.tsx` (enregistrement conditionnel de `Pagination`)
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/Pagination.unit.test.tsx`

**Interfaces:**
- Consumes : `AnyTable`, `hasFeature` (tâche 2) ; `DataTable`, `bindBricks` (tâche 3).
- Produces :
  - `getPageItems(currentPage: number, pageCount: number): Array<number | "ellipsis">` (pages en base 1) ;
  - `PaginationView` (props : `pageIndex` base 0, `pageCount`, `onPageChange(pageIndex)`, `pageSize?`, `pageSizeOptions?: number[]`, `onPageSizeChange?(size)`, `className?`) ;
  - `DataTablePaginationProps = { pageSizeOptions?: number[]; className?: string }` ;
  - `table.Pagination` n'existe au typage que si les features contiennent `rowPaginationFeature`.
- Règle : en pagination serveur (`manualPagination: true`), la page passe `rowCount: total` ; `getPageCount()` vaut alors `Math.ceil(rowCount / pageSize)` (vérifié dans `table_getPageCount` de table-core 9.2.4). Ne plus passer `pageCount` calculé à la main.

Valeurs reprises de `@gouvfr/dsfr/dist/component/pagination/pagination.css` (1.15.2) : lien `inline-flex`, `font-size .875rem`, `line-height 1.5rem`, `min-height 2rem`, `min-width 2rem`, `padding .25rem .75rem`, marges horizontales `.5rem` (nulles aux extrémités), `margin-bottom 1rem`, texte `#161616` ; page courante fond `#000091` (`primary`), texte `#F5F5FE` (`dsfr-alt-blue-france`), survol `#1212FF` ; désactivé `#929292` ; premier/dernier : icône seule `max-width/height 2rem`, `padding-x .5rem` ; précédent/suivant : icône seule, libellé visible dès 62em ; premier/précédent/suivant/dernier masqués sous 36em. Conteneur actuel : `fr-mt-11v fr-mb-10w` → `mt-11 mb-20`, centré.

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/Pagination.unit.test.tsx` :

```tsx
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import {
  getPageItems,
  PaginationView,
} from "@/components/shared/DataTable/Pagination";

describe("getPageItems", () => {
  it.each([
    [1, 3, [1, 2, 3]],
    [1, 10, [1, 2, 3, "ellipsis", 10]],
    [4, 10, [1, 2, 3, 4, 5, "ellipsis", 10]],
    [5, 10, [1, "ellipsis", 4, 5, 6, "ellipsis", 10]],
    [10, 10, [1, "ellipsis", 8, 9, 10]],
  ])("page %i sur %i", (page, total, attendu) => {
    expect(getPageItems(page, total)).toEqual(attendu);
  });
});

describe("PaginationView", () => {
  it("se présente comme une navigation nommée avec la page courante signalée", () => {
    render(
      <PaginationView onPageChange={() => {}} pageCount={10} pageIndex={4} />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Pagination du tableau",
    });
    expect(
      within(navigation).getByRole("button", { current: "page" }),
    ).toHaveTextContent("5");
  });

  it("désactive les boutons de bord sur la première page au lieu de les masquer", () => {
    render(
      <PaginationView onPageChange={() => {}} pageCount={10} pageIndex={0} />,
    );

    expect(
      ["Première page", "Page précédente", "Page suivante", "Dernière page"].map(
        (nom) => screen.getByRole("button", { name: nom }).hasAttribute("disabled"),
      ),
    ).toEqual([true, true, false, false]);
  });

  it("demande la page choisie en base 0", async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationView onPageChange={onPageChange} pageCount={10} pageIndex={4} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    await userEvent.click(screen.getByRole("button", { name: "10" }));

    expect(onPageChange.mock.calls).toEqual([[5], [9]]);
  });

  it("ne s'affiche pas quand il n'y a qu'une page", () => {
    render(<PaginationView onPageChange={() => {}} pageCount={1} pageIndex={0} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("propose de changer le nombre de lignes par page", async () => {
    const onPageSizeChange = vi.fn();
    render(
      <PaginationView
        onPageChange={() => {}}
        onPageSizeChange={onPageSizeChange}
        pageCount={3}
        pageIndex={0}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
      />,
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Lignes par page" }),
      "20",
    );

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});

describe("table.Pagination", () => {
  type Ligne = { nom: string };
  const pagine = createDataTableHook(
    tableFeatures({
      rowPaginationFeature,
      paginatedRowModel: createPaginatedRowModel(),
    }),
  );
  const colonnes = (() => {
    const helper = pagine.createColumnHelper<Ligne>();
    return helper.columns([helper.accessor("nom", { header: "Nom" })]);
  })();

  function TableauPagine({
    data,
    manuel = false,
  }: {
    data: Ligne[];
    manuel?: boolean;
  }) {
    const table = pagine.useDataTable({
      data,
      columns: colonnes,
      initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
      ...(manuel ? { manualPagination: true, rowCount: 5 } : {}),
    });
    return (
      <>
        <table.Root caption="Paginé">
          <table.Body />
        </table.Root>
        <table.Pagination />
      </>
    );
  }

  it("affiche la page demandée", async () => {
    render(
      <TableauPagine
        data={[{ nom: "a" }, { nom: "b" }, { nom: "c" }]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "2" }));

    expect(
      within(screen.getByRole("table"))
        .getAllByRole("cell")
        .map((cellule) => cellule.textContent),
    ).toEqual(["c"]);
  });

  it("calcule le nombre de pages depuis rowCount en pagination serveur", () => {
    render(<TableauPagine data={[{ nom: "a" }, { nom: "b" }]} manuel />);

    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "4" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/Pagination.unit.test.tsx`
Expected : FAIL, `Failed to resolve import "@/components/shared/DataTable/Pagination"`.

- [ ] **Step 3 : implémenter `Pagination.tsx`**

```tsx
import { type ComponentType, useId } from "react";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLeftSFirstIcon } from "@/components/_commons/Icones/ArrowLeftSFirstIcon";
import { ArrowLeftSLastIcon } from "@/components/_commons/Icones/ArrowLeftSLastIcon";
import { ArrowSLine1Icon } from "@/components/_commons/Icones/ArrowSLine1Icon";
import { ArrowSLine3Icon } from "@/components/_commons/Icones/ArrowSLine3Icon";
import { clsxm } from "@/utils/clsxm";
import type { AnyTable } from "./types";

export const getPageItems = (
  currentPage: number,
  pageCount: number,
): Array<number | "ellipsis"> => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) [2, 3].forEach((page) => pages.add(page));
  if (currentPage >= pageCount - 2)
    [pageCount - 2, pageCount - 1].forEach((page) => pages.add(page));

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);

  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    if (previous === undefined || page - previous === 1) return [page];
    if (page - previous === 2) return [previous + 1, page];
    return ["ellipsis" as const, page];
  });
};

const LINK =
  "inline-flex items-center justify-center min-h-8 min-w-8 px-3 py-1 mx-2 mb-4 rounded text-sm/6 text-dsfr-grey-50 hover:bg-dsfr-grey-1000 disabled:cursor-not-allowed disabled:text-dsfr-grey-625 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

const CURRENT =
  "cursor-default bg-primary text-dsfr-alt-blue-france hover:bg-dsfr-blue-france-sun-113-hover";

function EdgeButton({
  label,
  icon,
  iconPosition = "start",
  labelFromLg = false,
  disabled,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className: string; fill: string }>;
  iconPosition?: "start" | "end";
  labelFromLg?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const iconElement = (
    <Icone className="w-4 h-4 shrink-0 text-current" icone={icon} />
  );
  return (
    <button
      className={clsxm(
        LINK,
        "px-2",
        labelFromLg ? "min-[992px]:px-3 min-[992px]:gap-2" : "max-w-8 max-h-8 overflow-hidden",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {iconPosition === "start" && iconElement}
      <span className={labelFromLg ? "sr-only min-[992px]:not-sr-only" : "sr-only"}>
        {label}
      </span>
      {iconPosition === "end" && iconElement}
    </button>
  );
}

export type PaginationViewProps = {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

export function PaginationView({
  pageIndex,
  pageCount,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: PaginationViewProps) {
  const pageSizeId = useId();
  const hasPageSize = pageSizeOptions != null && onPageSizeChange != null;
  if (pageCount <= 1 && !hasPageSize) return null;

  const currentPage = pageIndex + 1;
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= pageCount;

  return (
    <div className={clsxm("flex flex-col items-center mt-11 mb-20", className)}>
      {pageCount > 1 && (
        <nav aria-label="Pagination du tableau">
          <ul className="flex flex-row flex-wrap items-center [&>li:first-child>*]:ml-0 [&>li:last-child>*]:mr-0">
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isFirst}
                icon={ArrowLeftSFirstIcon}
                label="Première page"
                onClick={() => onPageChange(0)}
              />
            </li>
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isFirst}
                icon={ArrowSLine3Icon}
                label="Page précédente"
                labelFromLg
                onClick={() => onPageChange(pageIndex - 1)}
              />
            </li>
            {getPageItems(currentPage, pageCount).map((item, index) =>
              item === "ellipsis" ? (
                <li key={`ellipsis-${index}`}>
                  <span className={LINK}>...</span>
                </li>
              ) : (
                <li key={item}>
                  <button
                    aria-current={item === currentPage ? "page" : undefined}
                    className={clsxm(LINK, item === currentPage && CURRENT)}
                    onClick={() => onPageChange(item - 1)}
                    type="button"
                  >
                    {item}
                  </button>
                </li>
              ),
            )}
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isLast}
                icon={ArrowSLine1Icon}
                iconPosition="end"
                label="Page suivante"
                labelFromLg
                onClick={() => onPageChange(pageIndex + 1)}
              />
            </li>
            <li className="hidden min-[576px]:block">
              <EdgeButton
                disabled={isLast}
                icon={ArrowLeftSLastIcon}
                label="Dernière page"
                onClick={() => onPageChange(pageCount - 1)}
              />
            </li>
          </ul>
        </nav>
      )}
      {hasPageSize && (
        <div className="flex items-center gap-2 text-sm/6">
          <label htmlFor={pageSizeId}>Lignes par page</label>
          <select
            className="rounded-t border-b-2 border-dsfr-grey-200 bg-dsfr-contrast-grey px-3 py-1"
            id={pageSizeId}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export type DataTablePaginationProps = {
  pageSizeOptions?: number[];
  className?: string;
};

export function DataTablePagination({
  table,
  pageSizeOptions,
  className,
}: DataTablePaginationProps & { table: AnyTable }) {
  return (
    <table.Subscribe selector={(state) => state.pagination}>
      {(pagination) => (
        <PaginationView
          className={className}
          onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
          onPageSizeChange={
            pageSizeOptions ? (pageSize) => table.setPageSize(pageSize) : undefined
          }
          pageCount={table.getPageCount()}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </table.Subscribe>
  );
}
```

- [ ] **Step 4 : enregistrer `Pagination` dans le factory**

Dans `createDataTableHook.tsx` :

1. Ajouter l'import `import { DataTablePagination, type DataTablePaginationProps } from "./Pagination";`.
2. Remplacer le type `DataTable` par :

```tsx
type PaginationBricks<F> = F extends { rowPaginationFeature: unknown }
  ? { Pagination: (props: DataTablePaginationProps) => ReactNode }
  : NoComponents;

export type DataTable<
  F extends TableFeatures,
  TData extends RowData,
> = AppReactTable<
  F,
  TData,
  TableState<F>,
  NoComponents,
  NoComponents,
  NoComponents
> &
  DataTableBricks &
  PaginationBricks<F>;
```

3. Dans `bindBricks`, remplacer le `return bricks;` final par :

```tsx
  return {
    ...bricks,
    ...(hasFeature(table, "rowPaginationFeature")
      ? {
          Pagination: (props: DataTablePaginationProps) => (
            <DataTablePagination table={table} {...props} />
          ),
        }
      : {}),
  };
```

- [ ] **Step 5 : ajouter le contrôle de typage au test du factory**

Dans `createDataTableHook.unit.test.tsx`, dans `TableauMinimal`, sous le `@ts-expect-error` existant :

```tsx
  // @ts-expect-error une table sans rowPaginationFeature n'expose pas Pagination
  void table.Pagination;
```

- [ ] **Step 6 : lancer les tests**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable`
Expected : PASS (tous les fichiers du dossier).

- [ ] **Step 7 : lint et commit**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): ajoute la pagination DataTable au rendu fr-pagination, accessible`.

---

### Task 7 : état d'URL `urlState` (nuqs)

**Files:**
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/urlParsers.ts` (parsers sans React, importables côté serveur par les `createLoader` de `getServerSideProps`)
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/urlState.ts`
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/config.ts` (config des filtres d'URL)
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.tsx` (option `urlState`)
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/urlState.unit.test.tsx`

**Interfaces:**
- Consumes : `DataTableConfig`, `getDataTableConfig` (tâche 3).
- Produces :
  - `parseAsSorting` : parser nuqs `SortingState` ⇄ `col.asc,col2.desc` (découpe sur le **dernier** point ; valeur invalide → `null`, donc défaut) ;
  - `parseAsSorting` et `parseAsTablePage` (= `parseAsIndex.withDefault(0)`) exportés par `urlParsers.ts` ;
  - `type UrlStateConfig = { sorting?: { default?: SortingState }; pagination?: { pageSize?: number }; globalFilter?: boolean; columnFilters?: Array<{ param: string; columnId: string; default?: string[] }>; shallow?: boolean; history?: "push" | "replace"; throttleMs?: number }` ;
  - `useUrlTableState(config?: UrlStateConfig)` → `{ state, handlers, hasActiveFilters, resetFilters }` où `state` ⊂ `{ sorting, pagination, globalFilter, columnFilters }` et `handlers` ⊂ `{ onSortingChange, onPaginationChange, onGlobalFilterChange, onColumnFiltersChange }` ;
  - option `urlState?: UrlStateConfig` de `useDataTable`.
- Paramètres : `sort`, `page` (base 1 via `parseAsIndex`), `pageSize`, `q`, un paramètre par filtre de colonne (`parseAsArrayOf(parseAsString)`). Options nuqs : `clearOnDefault: true`, `shallow` (défaut `true`), `history` (défaut `"replace"`).
- `throttleMs` est traduit en `limitUrlUpdates: throttle(ms)` (`throttleMs` est déprécié dans nuqs 2.10).
- Avec `urlState.pagination`, le factory passe `autoResetPageIndex: false` : sinon tanstack remet la page à 0 à chaque changement de `data` (chargement tRPC, refetch) et un lien `?page=3` serait perdu ; la remise à la page 1 sur filtre ou recherche est déjà explicite.
- L'état d'URL est **fusionné** avec le `state` passé par la page (`{ ...url.state, ...tableOptions.state }`) : une page peut piloter `grouping`, `expanded`, `columnVisibility` en plus de l'URL.
- Règles : écritures **fonctionnelles** (`setQuery((prev) => …)`) pour que deux mises à jour successives se cumulent ; tout changement de filtre ou de recherche remet `page` au défaut ; `resetFilters()` remet filtres et recherche à leurs valeurs par défaut ; avec `urlState`, la page ne passe pas elle-même les `onXChange` correspondants.

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/urlState.unit.test.tsx` :

```tsx
import { act, renderHook } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import {
  type UrlStateConfig,
  useUrlTableState,
} from "@/components/shared/DataTable/urlState";

const config: UrlStateConfig = {
  sorting: { default: [{ id: "updatedAt", desc: true }] },
  pagination: { pageSize: 20 },
  globalFilter: true,
  columnFilters: [
    { param: "statut", columnId: "statut", default: ["actif"] },
    { param: "critere", columnId: "critereId" },
  ],
};

const rendre = (searchParams = "") => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const rendu = renderHook(() => useUrlTableState(config), {
    wrapper: withNuqsTestingAdapter({ searchParams, onUrlUpdate, hasMemory: true }),
  });
  const derniereUrl = () =>
    onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.toString() ?? "";
  return { ...rendu, derniereUrl };
};

describe("useUrlTableState", () => {
  it("lit l'état du tableau depuis l'URL, page en base 1", () => {
    const { result } = rendre(
      "?sort=rattachement.code.desc&page=3&pageSize=50&q=eau&critere=a,b",
    );

    expect(result.current.state).toEqual({
      sorting: [{ id: "rattachement.code", desc: true }],
      pagination: { pageIndex: 2, pageSize: 50 },
      globalFilter: "eau",
      columnFilters: [
        { id: "statut", value: ["actif"] },
        { id: "critereId", value: ["a", "b"] },
      ],
    });
  });

  it("revient au tri par défaut quand le paramètre de tri est invalide", () => {
    const { result } = rendre("?sort=nom.haut");

    expect(result.current.state.sorting).toEqual([
      { id: "updatedAt", desc: true },
    ]);
  });

  it("écrit le tri au format colonne.sens", () => {
    const { result, derniereUrl } = rendre();

    act(() => result.current.handlers.onSortingChange?.([{ id: "nom", desc: false }]));

    expect(derniereUrl()).toBe("sort=nom.asc");
  });

  it("revient à la première page quand un filtre change", () => {
    const { result, derniereUrl } = rendre("?page=4");

    act(() =>
      result.current.handlers.onColumnFiltersChange?.((filtres) => [
        ...filtres,
        { id: "critereId", value: ["a"] },
      ]),
    );

    expect(derniereUrl()).toBe("critere=a");
  });

  it("cumule deux mises à jour de filtres successives", () => {
    const { result, derniereUrl } = rendre("?critere=a");

    act(() => {
      result.current.handlers.onColumnFiltersChange?.((filtres) =>
        filtres.filter((filtre) => filtre.id !== "critereId"),
      );
      result.current.handlers.onColumnFiltersChange?.((filtres) =>
        filtres.map((filtre) =>
          filtre.id === "statut" ? { ...filtre, value: ["inactif"] } : filtre,
        ),
      );
    });

    expect(derniereUrl()).toBe("statut=inactif");
  });

  it("garde un filtre vidé même quand sa valeur par défaut est non vide", () => {
    const { result } = rendre();

    act(() =>
      result.current.handlers.onColumnFiltersChange?.((filtres) =>
        filtres.filter((filtre) => filtre.id !== "statut"),
      ),
    );

    expect(result.current.state.columnFilters).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("réinitialise filtres et recherche à leurs valeurs par défaut", () => {
    const { result } = rendre("?statut=inactif&q=eau&page=2");

    act(() => result.current.resetFilters());

    expect(result.current.state.columnFilters).toEqual([
      { id: "statut", value: ["actif"] },
    ]);
    expect(result.current.state.globalFilter).toBe("");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
```

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/urlState.unit.test.tsx`
Expected : FAIL, `Failed to resolve import "@/components/shared/DataTable/urlState"`.

- [ ] **Step 3 : implémenter `urlParsers.ts` puis `urlState.ts`**

`urlParsers.ts` :

```ts
import type { SortingState } from "@tanstack/react-table";
import { createParser, parseAsIndex } from "nuqs/server";

const DIRECTIONS = { asc: false, desc: true } as const;

export const parseAsSorting = createParser<SortingState>({
  parse: (value) => {
    const sorting = value.split(",").map((part) => {
      const separator = part.lastIndexOf(".");
      const direction = part.slice(separator + 1);
      if (separator <= 0 || !(direction in DIRECTIONS)) return null;
      return {
        id: part.slice(0, separator),
        desc: DIRECTIONS[direction as keyof typeof DIRECTIONS],
      };
    });
    return sorting.length > 0 && sorting.every((sort) => sort != null)
      ? (sorting as SortingState)
      : null;
  },
  serialize: (sorting) =>
    sorting.map((sort) => `${sort.id}.${sort.desc ? "desc" : "asc"}`).join(","),
  eq: (left, right) =>
    left.length === right.length &&
    left.every(
      (sort, index) =>
        sort.id === right[index].id && sort.desc === right[index].desc,
    ),
});

export const parseAsTablePage = parseAsIndex.withDefault(0);
```

`urlState.ts` :

```ts
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  throttle,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import { parseAsSorting, parseAsTablePage } from "./urlParsers";

export type UrlStateConfig = {
  sorting?: { default?: SortingState };
  pagination?: { pageSize?: number };
  globalFilter?: boolean;
  columnFilters?: Array<{ param: string; columnId: string; default?: string[] }>;
  shallow?: boolean;
  history?: "push" | "replace";
  throttleMs?: number;
};

const resolve = <T,>(updater: Updater<T>, previous: T): T =>
  typeof updater === "function"
    ? (updater as (previous: T) => T)(previous)
    : updater;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const sameValues = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value) => right.includes(value));

type Query = Record<string, unknown>;

export function useUrlTableState(config?: UrlStateConfig) {
  const configKey = JSON.stringify(config ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableConfig = useMemo(() => config, [configKey]);
  const filters = stableConfig?.columnFilters ?? [];

  const parsers = useMemo(
    () => ({
      ...(stableConfig?.sorting
        ? { sort: parseAsSorting.withDefault(stableConfig.sorting.default ?? []) }
        : {}),
      ...(stableConfig?.pagination
        ? {
            page: parseAsTablePage,
            pageSize: parseAsInteger.withDefault(
              stableConfig.pagination.pageSize ?? 10,
            ),
          }
        : {}),
      ...(stableConfig?.globalFilter ? { q: parseAsString.withDefault("") } : {}),
      ...Object.fromEntries(
        (stableConfig?.columnFilters ?? []).map((filter) => [
          filter.param,
          parseAsArrayOf(parseAsString).withDefault(filter.default ?? []),
        ]),
      ),
    }),
    [stableConfig],
  );

  const [query, setQuery] = useQueryStates(parsers, {
    clearOnDefault: true,
    shallow: stableConfig?.shallow ?? true,
    history: stableConfig?.history ?? "replace",
    ...(stableConfig?.throttleMs
      ? { limitUrlUpdates: throttle(stableConfig.throttleMs) }
      : {}),
  });
  const values = query as Query;
  const update = setQuery as unknown as (
    updater: (previous: Query) => Query | null,
  ) => Promise<URLSearchParams>;

  const toColumnFilters = (source: Query): ColumnFiltersState =>
    filters
      .filter((filter) => toStringArray(source[filter.param]).length > 0)
      .map((filter) => ({
        id: filter.columnId,
        value: toStringArray(source[filter.param]),
      }));

  const firstPage = stableConfig?.pagination ? { page: null } : {};

  if (stableConfig == null) {
    return {
      state: {},
      handlers: {},
      hasActiveFilters: false,
      resetFilters: () => {},
    };
  }

  const state = {
    ...(stableConfig.sorting ? { sorting: values.sort as SortingState } : {}),
    ...(stableConfig.pagination
      ? {
          pagination: {
            pageIndex: values.page as number,
            pageSize: values.pageSize as number,
          },
        }
      : {}),
    ...(stableConfig.globalFilter ? { globalFilter: values.q as string } : {}),
    ...(filters.length > 0 ? { columnFilters: toColumnFilters(values) } : {}),
  };

  const onSortingChange: OnChangeFn<SortingState> = (updater) =>
    void update((previous) => ({
      sort: resolve(updater, previous.sort as SortingState),
    }));

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) =>
    void update((previous) => {
      const next = resolve(updater, {
        pageIndex: previous.page as number,
        pageSize: previous.pageSize as number,
      });
      return { page: next.pageIndex, pageSize: next.pageSize };
    });

  const onGlobalFilterChange: OnChangeFn<string> = (updater) =>
    void update((previous) => ({
      q: resolve(updater, previous.q as string) ?? "",
      ...firstPage,
    }));

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) =>
    void update((previous) => {
      const next = resolve(updater, toColumnFilters(previous));
      return {
        ...Object.fromEntries(
          filters.map((filter) => [
            filter.param,
            toStringArray(
              next.find((columnFilter) => columnFilter.id === filter.columnId)
                ?.value,
            ),
          ]),
        ),
        ...firstPage,
      };
    });

  const hasActiveFilters =
    filters.some(
      (filter) =>
        !sameValues(toStringArray(values[filter.param]), filter.default ?? []),
    ) ||
    (stableConfig.globalFilter === true && (values.q as string).trim() !== "");

  const resetFilters = () =>
    void update(() => ({
      ...Object.fromEntries(filters.map((filter) => [filter.param, null])),
      ...(stableConfig.globalFilter ? { q: null } : {}),
      ...firstPage,
    }));

  return {
    state,
    handlers: {
      ...(stableConfig.sorting ? { onSortingChange } : {}),
      ...(stableConfig.pagination ? { onPaginationChange } : {}),
      ...(stableConfig.globalFilter ? { onGlobalFilterChange } : {}),
      ...(filters.length > 0 ? { onColumnFiltersChange } : {}),
    },
    hasActiveFilters,
    resetFilters,
  };
}
```

Si le test « garde un filtre vidé » échoue parce que nuqs relit `statut=` comme la valeur par défaut, sérialiser le tableau vide avec une valeur sentinelle n'est **pas** la solution : vérifier d'abord ce que produit `parseAsArrayOf(parseAsString).parse("")` dans nuqs 2.10.1 et le signaler à l'utilisateur (comportement actuel de l'admin à préserver).

- [ ] **Step 4 : lancer le test**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/urlState.unit.test.tsx`
Expected : PASS (7 tests).

- [ ] **Step 5 : brancher `urlState` dans le factory**

Dans `config.ts`, ajouter à `DataTableConfig` :

```ts
  urlFilters?: { hasActiveFilters: boolean; resetFilters: () => void };
```

Dans `createDataTableHook.tsx` :

1. Importer `import { type UrlStateConfig, useUrlTableState } from "./urlState";` et `import { getDataTableConfig } from "./config";`.
2. Ajouter `urlState?: UrlStateConfig;` à `DataTableOptions`.
3. Dans `useDataTable`, déstructurer `urlState`, puis avant l'appel à `useAppTable` :

```tsx
    const url = useUrlTableState(urlState);
```

   et remplacer l'objet d'options par :

```tsx
    const table = hook.useAppTable<TData>({
      ...(urlState?.pagination ? { autoResetPageIndex: false } : {}),
      ...tableOptions,
      ...url.handlers,
      state: { ...url.state, ...tableOptions.state },
      ...(search ? { globalFilterFn: createSearchFilterFn(search) } : {}),
      meta: {
        ...tableOptions.meta,
        dataTable: {
          ...dataTable,
          ...(urlState
            ? {
                urlFilters: {
                  hasActiveFilters: url.hasActiveFilters,
                  resetFilters: url.resetFilters,
                },
              }
            : {}),
        },
      },
    } as never);
```

4. Dans `bindBricks`, faire déléguer `hasActiveFilters` et `resetFilters` à l'URL quand elle est configurée :

```tsx
  hasActiveFilters: () => {
    const urlFilters = getDataTableConfig(table).urlFilters;
    if (urlFilters) return urlFilters.hasActiveFilters;
    const state = table.store.state;
    return (
      (state.columnFilters?.length ?? 0) > 0 ||
      Boolean(state.globalFilter?.trim?.())
    );
  },
  resetFilters: () => {
    const urlFilters = getDataTableConfig(table).urlFilters;
    if (urlFilters) return urlFilters.resetFilters();
    if (hasFeature(table, "columnFilteringFeature")) table.resetColumnFilters(true);
    if (hasFeature(table, "globalFilteringFeature")) table.resetGlobalFilter(true);
  },
```

- [ ] **Step 6 : lancer tous les tests DataTable**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable`
Expected : PASS.

- [ ] **Step 7 : lint et commit**

Run : `pnpm lint` → sans erreur. Si oxlint ne connaît pas la règle `react-hooks/exhaustive-deps` citée dans le commentaire de désactivation, retirer ce commentaire.
Commit : `refactor(PIL-1822): synchronise l'état des tableaux avec l'URL (nuqs, formats harmonisés)`.

---

### Task 8 : brique `Filters` (panneau généré depuis `meta.filter`)

**Files:**
- Create: `apps/pilote-ppg/src/client/components/shared/DataTable/Filters.tsx`
- Modify: `apps/pilote-ppg/src/client/components/shared/DataTable/createDataTableHook.tsx` (enregistrement conditionnel de `Filters`)
- Test: `apps/pilote-ppg/src/client/components/shared/DataTable/Filters.unit.test.tsx`

**Interfaces:**
- Consumes : `FilterDescriptor`, `getColumnMeta`, `hasFeature` (tâche 2) ; `table.hasActiveFilters()`, `table.resetFilters()` (tâches 3 et 7) ; composants existants `GroupeCasesACocher` (`_commons/GroupeCasesACocher`), `MultiSelectFiltre` (`_commons/MultiSelectFiltre`), `BarreDeRecherche` (`_commons/BarreDeRecherche`), `Bouton`, `Icone`, `ArrowGoBackIcon`.
- Produces :
  - `table.Filters` (props `{ className?: string }`), présent au typage seulement si les features contiennent `columnFilteringFeature` ou `globalFilteringFeature` ;
  - rendu (repris de `_commons/TableauAdmin/FiltresTableauAdmin`) : `<section aria-label="Filtres du tableau">`, barre de recherche si `globalFilteringFeature` (écrit `table.setGlobalFilter`), un contrôle par colonne portant `meta.filter` (`checkboxes` → `GroupeCasesACocher`, `multiselect` → `MultiSelectFiltre` avec `showGroupSelection={false}`), bouton secondaire « Réinitialiser les filtres » désactivé sans filtre actif.
- Couleurs : `bg-gray-50`/`border-gray-200` de l'admin → `bg-dsfr-grey-1000`/`border-dsfr-grey-900` (palette DSFR de la config).

- [ ] **Step 1 : écrire le test qui échoue**

`apps/pilote-ppg/src/client/components/shared/DataTable/Filters.unit.test.tsx` :

```tsx
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  globalFilteringFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";

type Axe = { id: string; nom: string; statut: string };

const axes: Axe[] = [
  { id: "1", nom: "Eau", statut: "ACTIF" },
  { id: "2", nom: "Air", statut: "SUPPRIME" },
];

const hook = createDataTableHook(
  tableFeatures({
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
  }),
);
const colonnes = (() => {
  const helper = hook.createColumnHelper<Axe>();
  return helper.columns([
    helper.accessor("nom", { header: "Nom" }),
    helper.accessor("statut", {
      header: "Statut",
      filterFn: filterFnOneOf,
      meta: {
        filter: {
          type: "checkboxes",
          label: "Statut :",
          options: [
            { value: "ACTIF", label: "Actif" },
            { value: "SUPPRIME", label: "Supprimé" },
          ],
        },
      },
    }),
  ]);
})();

function Tableau() {
  const table = hook.useDataTable({
    data: axes,
    columns: colonnes,
    search: (axe) => [axe.nom],
  });
  return (
    <>
      <table.Filters />
      <table.Root caption="Axes">
        <table.Body />
      </table.Root>
    </>
  );
}

const nomsAffiches = () =>
  within(screen.getByRole("table"))
    .getAllByRole("cell")
    .filter((_, index) => index % 2 === 0)
    .map((cellule) => cellule.textContent);

describe("table.Filters", () => {
  it("génère un filtre par colonne qui en déclare un", async () => {
    render(<Tableau />);

    const filtres = screen.getByRole("region", { name: "Filtres du tableau" });
    await userEvent.click(within(filtres).getByLabelText("Actif"));

    expect(nomsAffiches()).toEqual(["Eau"]);
  });

  it("filtre par la recherche globale", async () => {
    render(<Tableau />);

    await userEvent.type(screen.getByRole("searchbox"), "air");

    expect(nomsAffiches()).toEqual(["Air"]);
  });

  it("ne permet de réinitialiser que lorsqu'un filtre est actif", async () => {
    render(<Tableau />);

    const bouton = screen.getByRole("button", {
      name: "Réinitialiser les filtres",
    });
    expect(bouton).toBeDisabled();

    await userEvent.click(screen.getByLabelText("Actif"));
    expect(bouton).toBeEnabled();

    await userEvent.click(bouton);
    expect(nomsAffiches()).toEqual(["Eau", "Air"]);
  });
});
```

(Si `BarreDeRecherche` n'expose pas le rôle `searchbox`, lire `_commons/BarreDeRecherche/BarreDeRecherche.tsx` et cibler l'input par son libellé réel.)

- [ ] **Step 2 : lancer le test pour le voir échouer**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable/Filters.unit.test.tsx`
Expected : FAIL (`table.Filters` n'existe pas : `Element type is invalid`).

- [ ] **Step 3 : implémenter `Filters.tsx`**

```tsx
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { GroupeCasesACocher } from "@/components/_commons/GroupeCasesACocher/GroupeCasesACocher";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { clsxm } from "@/utils/clsxm";
import { getColumnMeta, hasFeature } from "./features";
import type { AnyColumn, AnyTable } from "./types";

export type DataTableFiltersProps = { className?: string };

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function ColumnFilter({ column }: { column: AnyColumn }) {
  const filter = getColumnMeta(column)?.filter;
  if (!filter) return null;
  const values = toStringArray(column.getFilterValue());
  const onChange = (nextValues: string[]) => column.setFilterValue(nextValues);

  if (filter.type === "checkboxes") {
    return (
      <GroupeCasesACocher
        label={filter.label}
        onChange={onChange}
        options={filter.options.map((option) => ({
          valeur: option.value,
          label: option.label,
        }))}
        values={values}
      />
    );
  }
  return (
    <MultiSelectFiltre
      className={filter.className}
      classNameBouton={filter.buttonClassName}
      getOptionLabel={(value) =>
        filter.options.find((option) => option.value === value)?.label ?? value
      }
      label={filter.label}
      onChange={onChange}
      optionGroups={[
        { label: "", options: filter.options.map((option) => option.value) },
      ]}
      showGroupSelection={false}
      values={values}
    />
  );
}

export function DataTableFilters({
  table,
  className,
  hasActiveFilters,
  onResetFilters,
}: DataTableFiltersProps & {
  table: AnyTable;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  const columns = hasFeature(table, "columnFilteringFeature")
    ? table
        .getAllLeafColumns()
        .filter((column) => getColumnMeta(column)?.filter != null)
    : [];

  return (
    <section
      aria-label="Filtres du tableau"
      className={clsxm(
        "flex flex-col gap-4 px-6 py-4 border-b border-dsfr-grey-900 bg-dsfr-grey-1000",
        className,
      )}
    >
      {hasFeature(table, "globalFilteringFeature") && (
        <div className="w-full max-w-sm">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              table.setGlobalFilter(event.target.value)
            }
            valeur={table.store.state.globalFilter ?? ""}
          />
        </div>
      )}
      {columns.map((column) => (
        <ColumnFilter column={column} key={column.id} />
      ))}
      <Bouton
        disabled={!hasActiveFilters}
        iconLeft={
          <Icone
            className="w-4 h-4 text-current rotate-y-180"
            icone={ArrowGoBackIcon}
          />
        }
        label="Réinitialiser les filtres"
        onClick={onResetFilters}
        size="sm"
        variant="secondary"
      />
    </section>
  );
}
```

- [ ] **Step 4 : enregistrer `Filters` dans le factory**

Dans `createDataTableHook.tsx` :

1. Importer `import { DataTableFilters, type DataTableFiltersProps } from "./Filters";`.
2. Ajouter le type conditionnel et l'intégrer à `DataTable` :

```tsx
type FiltersBricks<F> = F extends { columnFilteringFeature: unknown }
  ? { Filters: (props: DataTableFiltersProps) => ReactNode }
  : F extends { globalFilteringFeature: unknown }
    ? { Filters: (props: DataTableFiltersProps) => ReactNode }
    : NoComponents;
```

   et remplacer `DataTableBricks & PaginationBricks<F>;` par `DataTableBricks & PaginationBricks<F> & FiltersBricks<F>;`.
3. Dans `bindBricks`, remplacer le `return { ...bricks, … }` par :

```tsx
  return {
    ...bricks,
    ...(hasFeature(table, "rowPaginationFeature")
      ? {
          Pagination: (props: DataTablePaginationProps) => (
            <DataTablePagination table={table} {...props} />
          ),
        }
      : {}),
    ...(hasFeature(table, "columnFilteringFeature") ||
    hasFeature(table, "globalFilteringFeature")
      ? {
          Filters: (props: DataTableFiltersProps) => (
            <DataTableFilters
              hasActiveFilters={bricks.hasActiveFilters()}
              onResetFilters={bricks.resetFilters}
              table={table}
              {...props}
            />
          ),
        }
      : {}),
  };
```

4. Dans le test du factory (`createDataTableHook.unit.test.tsx`), `TableauMinimal`, ajouter :

```tsx
  // @ts-expect-error une table sans filtrage n'expose pas Filters
  void table.Filters;
```

- [ ] **Step 5 : lancer les tests**

Run : `pnpm exec vitest run --project client src/client/components/shared/DataTable`
Expected : PASS.

- [ ] **Step 6 : lint et commit**

Run : `pnpm lint` → sans erreur.
Commit : `refactor(PIL-1822): génère le panneau de filtres des tableaux depuis les colonnes`.

**Point de coordination** (à faire après ce commit, pas un blocage) : envoyer à la session a11y `pilote-2-82` les chemins `apps/pilote-ppg/src/client/components/shared/Table.tsx` et `apps/pilote-ppg/src/client/components/shared/DataTable/` (demande de PIL-1818 pour son test axe ciblé).

---

### Task 9 : tableaux statiques → `Table.*`

**Files (Modify, sauf mention) :** tous sous `apps/pilote-ppg/src/client/components/`
- `PageRapportsHebdomadaires/TableauUtilisateurs.tsx`
- `PageRapportsHebdomadaires/BlocChantier.tsx`
- `_commons/ChatUI/ChantierIndicateursTable.tsx`
- Delete : `_commons/ChatUI/ChantierIndicateursSkeleton.tsx` (importé nulle part)
- `_commons/Widget/TableauEvolution.tsx`
- `Evaluation/TableauNoteCollective.tsx`
- `PageAdminChantiers/OngletPonderationsIndicateurs.tsx`
- `PageAdminGestionTokenAPI/PageAdminGestionTokenAPI.tsx`
- `PageImportIndicateur/PageImportIndicateurSectionImport/EtapePublierFichier.tsx`
- `PageImportIndicateur/PageImportIndicateurSectionRessource/PageImportIndicateurSectionRessource.tsx`
- `PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier.tsx`
- `Evaluation/TableauEvaluation.tsx` et `PageUtilisateursPiloteEval/TableauUtilisateurs.tsx` (Pilote Eval : balisage uniquement)

**Interfaces:**
- Consumes : `Table.*` (tâche 1).
- Aucune nouvelle API ; aucun nouveau test (pas de tests de pages). Filets : `pnpm lint`, `ResultatValidationFichier.integration.test.tsx` existant.

**Règles de transformation (toutes les tâches de migration) :**

| Avant | Après |
|---|---|
| `<div className="fr-table …"><table>` ou `<table className="fr-table …">` | `<Table.Root caption=… captionHidden>` (+ `containerClassName` pour les classes du conteneur) |
| `<thead>` / `<tbody>` / `<tfoot>` / `<tr>` | `Table.Header` / `Table.Body` / `Table.Footer` / `Table.Row` |
| `<th>` d'en-tête de colonne | `Table.ColumnHeaderCell` (jamais vide : libellé `sr-only` sinon) |
| `<td>` | `Table.Cell` |
| import `@gouvfr/dsfr/dist/component/table/table.min.css` | supprimé |
| `fr-sr-only` | `sr-only` |
| `fr-p-0` `fr-m-0` `fr-mb-0` `fr-pt-0` `fr-pr-0` | `p-0` `m-0` `mb-0` `pt-0` `pr-0` |
| `fr-mb-3` (classe inexistante, sans effet) | supprimée |
| `fr-my-3w` `fr-mt-2w` `fr-pb-2w` `fr-pl-2w` `fr-px-2w` `fr-mx-3w` | `my-6` `mt-4` `pb-4` `pl-4` `px-4` `mx-6` |
| `fr-p-1w` `fr-py-1w` `fr-pt-1w` `fr-mt-1w` `fr-ml-n1w` | `p-2` `py-2` `pt-2` `mt-2` `-ml-2` |
| `fr-py-1v` `fr-px-1v` `fr-mt-1v` `fr-mr-1v` `fr-ml-5v` | `py-1` `px-1` `mt-1` `mr-1` `ml-5` |
| `fr-py-md-1w` | `md:py-2` |
| `fr-px-lg-2w` | `min-[992px]:px-4` |
| `fr-text--sm` | `text-sm/6` |
| `fr-background-contrast-grey` | `bg-dsfr-contrast-grey` |
| `fr-background-action-low-blue-france` | `bg-dsfr-blue-france-925` |
| `fr-background-transparent` | `bg-transparent` |
| `fr-btn` (bouton isolé) | composant `Bouton` (`@/components/_commons/Bouton/Bouton`) avec `variant="primary"` |

Pour garder le rendu d'un tableau qui n'était pas en `.fr-table` (Tailwind pur : `TableauEvolution`, `TableauNoteCollective`, pondérations, Pilote Eval), passer `bordered={false}`, `Table.Body zebra={false}` et recopier les classes existantes sur les primitives : `clsxm` fait gagner la classe de l'appelant. La légende est ajoutée **visuellement masquée** partout où il n'y en avait pas (RGAA 5.4).

- [ ] **Step 1 : Rapports hebdomadaires**

`PageRapportsHebdomadaires/TableauUtilisateurs.tsx` : supprimer l'import CSS DSFR ; remplacer `div.fr-table fr-mb-0 fr-pt-0 > table.table` par :

```tsx
<Table.Root caption="Utilisateurs concernés par le rapport" captionHidden containerClassName="mb-0 pt-0">
  <Table.Header className="bg-dsfr-blue-france-925">
    <Table.Row>
      <Table.ColumnHeaderCell>Prénom</Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body className="bg-transparent">
    {/* lignes existantes : <tr key={email}> → <Table.Row key={email}>, <td> → <Table.Cell> */}
  </Table.Body>
</Table.Root>
```

`PageRapportsHebdomadaires/BlocChantier.tsx` (lignes 59-95) : même traitement ; légende masquée `` `Valeurs saisies pour ${chantier.nom}` `` (utiliser le nom du chantier disponible dans le composant) ; conserver `text-right` sur les en-têtes et cellules concernés.

- [ ] **Step 2 : ChatUI**

`_commons/ChatUI/ChantierIndicateursTable.tsx` : supprimer l'import CSS ; `div.fr-table fr-p-0 fr-m-0 > table.!table` → `<Table.Root caption="Indicateurs du chantier" captionHidden containerClassName="p-0 m-0">` ; `th scope="col"` → `Table.ColumnHeaderCell` (le `scope` est par défaut) ; cellules → `Table.Cell`. Supprimer `ChantierIndicateursSkeleton.tsx`.

- [ ] **Step 3 : `TableauEvolution` (colonne figée)**

`_commons/Widget/TableauEvolution.tsx` : `div.overflow-x-auto text-xs > table.w-full border-collapse` →

```tsx
<Table.Root
  bordered={false}
  caption="Évolution des valeurs par territoire et par jalon"
  captionHidden
  className="w-full border-collapse"
  containerClassName="text-xs"
>
```

En-tête : `Table.Header className="bg-transparent text-inherit"`, `Table.Row`, cellules `Table.ColumnHeaderCell` avec les classes existantes `px-3 py-2 text-center whitespace-nowrap` (+ `font-bold`/`font-semibold` selon le jalon) ; la cellule d'angle vide reçoit `<span className="sr-only">Territoire</span>` et garde `sticky left-0 bg-white z-10 min-w-[130px]`. Corps : `Table.Body zebra={false} className="bg-transparent"`, lignes `Table.Row className="border-t border-dsfr-grey-925"`, première cellule `Table.RowHeaderCell` avec `sticky left-0 bg-white z-10 min-w-[130px]`, autres `Table.Cell` avec les classes existantes. Retirer le trait d'en-tête par défaut : `className="border-b-0"` sur les `ColumnHeaderCell`.

- [ ] **Step 4 : `TableauNoteCollective` (+ correction de clé)**

`Evaluation/TableauNoteCollective.tsx` : `div.overflow-x-auto > table.min-w-full` → `<Table.Root bordered={false} caption={`Objectifs collectifs applicables pour ${…}`} captionHidden className="min-w-full">` (reprendre le libellé du `span` d'en-tête existant) ; `thead` → `Table.Header` avec les classes existantes ; `tbody` → `Table.Body zebra={false}` avec `!divide-y !divide-dsfr-grey-925` ; conserver l'alternance de fond par index. Remplacer chaque fragment `<>` rendu dans le `.map` par `<Fragment key={chantier.id}>` (import `Fragment` de `react`). Les lignes « Aucun chantier trouvé » / « Aucun indicateur pour ce chantier » gardent leur `colSpan={2}` sur un `Table.Cell`.

- [ ] **Step 5 : pondérations (avec `tfoot`)**

`PageAdminChantiers/OngletPonderationsIndicateurs.tsx` : `table.w-full table-fixed text-sm` → `<Table.Root bordered={false} caption="Pondération des indicateurs par maille" captionHidden className="w-full table-fixed text-sm">` ; `thead tr.bg-dsfr-grey-1000 text-xs uppercase text-dsfr-mention-grey` → `Table.Header` + `Table.Row` avec ces classes ; en-têtes « Indicateur » et par maille (`w-36 text-right`) → `Table.ColumnHeaderCell` ; corps `Table.Body zebra={false}` ; `PiedTableauPonderations` : `tfoot` → `Table.Footer`, `td` → `Table.Cell` (classes existantes).

- [ ] **Step 6 : gestion des jetons d'API**

`PageAdminGestionTokenAPI/PageAdminGestionTokenAPI.tsx` : supprimer l'import CSS ; `table.fr-table fr-mb-3 fr-p-0 w-full` → `<Table.Root caption="Jetons d'API" captionHidden className="w-full" containerClassName="p-0">` ; en-têtes Émail / Date d'expiration / Action → `Table.ColumnHeaderCell` ; cellules → `Table.Cell` (garder l'email en `Table.Cell` : l'e2e `tests/pages/admin/page-gestion-token-api.ts` cherche `getByRole("cell", { name: email })`) ; `button.fr-btn` → `Bouton` avec `label="Supprimer le token API"`, `variant="primary"` et les attributs `aria-controls="supprimer-token"` et `onClick` existants (si `Bouton` ne relaie pas `aria-controls`, garder `<button>` et remplacer `fr-btn` par les classes du variant primaire de `Bouton`).

- [ ] **Step 7 : écrans d'import**

`EtapePublierFichier.tsx` : `table.fr-table fr-my-3w fr-p-0 w-full` → `<Table.Root caption="Prévisualisation des données à publier" captionHidden className="w-full" containerClassName="my-6 p-0">`.
`PageImportIndicateurSectionRessource.tsx` : `table.fr-table fr-mb-3 fr-p-0 w-full` → `<Table.Root caption="Exemple de fichier d'import" captionHidden className="w-full" containerClassName="p-0">`.
`ResultatValidationFichier.tsx` : supprimer l'import CSS ; `table.fr-table fr-m-0 fr-p-0` → `<Table.Root caption="Rapport d'erreur de la validation du fichier" captionHidden containerClassName="m-0 p-0">`.
Dans les trois : `th` → `Table.ColumnHeaderCell`, `td` → `Table.Cell`.

- [ ] **Step 8 : Pilote Eval (balisage seul)**

`Evaluation/TableauEvaluation.tsx` (lignes 193-229) : `<table className="table-fixed w-full border-collapse">` → `<Table.Root bordered={false} caption={titre} captionHidden className="table-fixed w-full border-collapse">` ; `tbody` → `Table.Body zebra={false} className="bg-transparent"` ; `tr` → `Table.Row` ; `td` → `Table.Cell` avec **exactement** les classes existantes (`border border-gray-300 px-4 first:!border-l-0 last:!border-r-0 align-top` + `w-auto` conditionnel) et `p-0` retiré du défaut en ajoutant `py-0` si le rendu l'exige. Le `<colgroup>` reste tel quel. Hooks, filtres, `setTimeout` : inchangés.
`PageUtilisateursPiloteEval/TableauUtilisateurs.tsx` : `table.w-full border-collapse` → `<Table.Root bordered={false} caption="Utilisateurs de Pilote Eval" captionHidden className="w-full border-collapse">` ; `thead tr` et `th` gardent leurs classes (`Table.Header className="bg-transparent"`, `Table.ColumnHeaderCell` avec `px-4 py-3 cursor-pointer select-none hover:bg-dsfr-blue-france-925-hover`) et reçoivent `aria-sort` (`"ascending"`/`"descending"`) **uniquement sur la colonne triée** (`header.column.getIsSorted()` non faux ; rien sur les autres) ; corps `Table.Body zebra={false}` avec les classes et l'alternance existantes. Pas d'autre changement.

- [ ] **Step 9 : vérifier**

Run : `pnpm exec vitest run --project client src/client/components/PageImportIndicateur` → PASS.
Run : `grep -rn "fr-table" src/client/components/{PageRapportsHebdomadaires,_commons/ChatUI,_commons/Widget,PageAdminGestionTokenAPI,PageImportIndicateur,PageAdminChantiers,Evaluation,PageUtilisateursPiloteEval}` → aucune occurrence.
Run : `pnpm lint` → sans erreur.

- [ ] **Step 10 : commit**

Commit : `refactor(PIL-1822): passe les tableaux statiques sur les primitives Table`.

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
// `dateDeMiseAJourIndicateur`, aujourd'hui fourni par useIndicateurBloc et utilisé par
// IndicateurBloc.tsx (lignes 32 et 65), est recalculé ici à l'identique depuis les mêmes données.

return estVueTuile ? (
  <IndicateurBlocIndicateurTuile
    indicateurDétailsParTerritoire={ligne}
    typeDeRéforme="chantier"
    unité={ligne.données.unite}
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

Les cellules reprennent les classes de l'ancien `TableauContenu` (`fr-py-0 fr-py-md-1w fr-px-1v fr-px-lg-2w` → `py-0 md:py-2 px-1 min-[992px]:px-4`). Reprendre aussi le calcul de `dateDeMiseAJourIndicateur` (utilisé lignes 32 et 65 d'`IndicateurBloc.tsx`) et garder `unité={ligne.données.unite}` comme dans l'actuel `useIndicateurBloc.tsx:159`. Supprimer `useIndicateurBloc.tsx`.

- [ ] **Step 2 : bloc de la page chantier**

`_commons/IndicateursChantier/Bloc/IndicateurBloc.tsx` (lignes 188-376) : supprimer l'import CSS DSFR ; `table.fr-table w-full border-collapse fr-mb-0` → `<Table.Root caption={`Tableau de l'indicateur : ${…nom de l'indicateur…}`} captionHidden className="w-full border-collapse" containerClassName="mb-0">` (corrige la légende tronquée « Un tableau de l'indicateur :' ») ; en-tête à deux niveaux : `thead.fr-background-transparent text-center` → `Table.Header className="bg-transparent text-center"`, les deux `Table.Row`, les `th` → `Table.ColumnHeaderCell` avec la table de correspondance de la tâche 9 ; les deux `th` vides de la première ligne deviennent des `Table.Cell` vides (un `<td>` vide est permis dans un `thead` et évite de doubler les en-têtes « Territoire(s) » et « valeur initiale » de la seconde ligne) ; le `th colSpan={3}` garde son `colSpan`. Corps : `tbody.bg-none` → `Table.Body zebra={false} className="bg-none"` ; lignes et cellules → `Table.Row` / `Table.Cell` (première cellule de chaque ligne de territoire → `Table.RowHeaderCell` avec les classes existantes, dont `font-bold text-primary`). Dans `LignesPropositionValeurAvancementV2` et `BaseLignesPropositionValeurAvancement`, remplacer `tr`/`td` par `Table.Row`/`Table.Cell` (garder `colSpan`) et `fr-text--sm` par `text-sm/6`. Le `<strong>{indicateur.id}</strong>` utilisé par l'e2e `tests/components/pva-indicateur.component.ts` reste inchangé.

- [ ] **Step 3 : tuiles**

Dans les deux `indicateurBlocIndicateurTuile.tsx`, remplacer `table`/`thead`/`tbody`/`tr`/`th`/`td` par les primitives (`Table.Root` avec `caption={`Indicateur pour ${territoireNom}`} captionHidden bordered={false}`, `Table.Body zebra={false}`), `th` → `Table.ColumnHeaderCell` (« Territoire », nom du territoire), libellés de ligne → `Table.RowHeaderCell` (`font-bold`), et les classes `fr-*` via la table de la tâche 9 (`fr-p-0 fr-pb-2w` → `p-0 pb-4`, `fr-py-1v` → `py-1`, `fr-pt-1w fr-pb-0 fr-pr-0` → `pt-2 pb-0 pr-0`). `texte-gris` (classe maison) est conservée. Les deux fichiers restent distincts, comme le prévoit le spec : ils n'ont ni la même source de données (props / contexte) ni les mêmes variantes (`rose` pour les réformes non-chantier).

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

Ajouter `enableSorting: true` à chaque colonne existante et `id: "Dernière modification"` à l'accessor fonction « Dernière modification » (le helper de `createTableHook` exige un `id` pour un accessor fonction ; cet id est celui du tri par défaut). Colonne « Actif / Inactif » : ajouter dans le `div` de la cellule un texte masqué `<span className="sr-only">{estMasqué ? "Inactif" : "Actif"}</span>` à côté de l'icône (reprendre la condition existante qui choisit `CloseCircleIcon`/`SuccessIcon`) et `header: "Actif / Inactif"` inchangé.

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

(`featuresTableauAdminUtilisateurs` devient `tableFeatures({ columnFilteringFeature, globalFilteringFeature, rowSortingFeature, rowPaginationFeature })` : `globalFilteringFeature` exige `columnFilteringFeature` et fournit `setGlobalFilter` ; **aucun** `filteredRowModel` ni `sortedRowModel`, le serveur filtre et trie.) Ajouter `enableSorting: true` aux colonnes `email`, `nom`, `prénom`, `profil`, `fonction`, `Dernière modification`, et `id: "Dernière modification"` à l'accessor fonction correspondant (id attendu par `convertirEnIdPrisma`). Colonne « Actif » : texte masqué `Actif`/`Désactivé` à côté de l'icône, comme à la tâche 12.

```tsx
  const tableau = adminUtilisateurs.useDataTable({
    data: utilisateurs,
    columns: colonnes,
    rowHeader: "email",
    getRowHref: (row) => `/admin/utilisateur/${row.original.id}`,
    manualPagination: true,
    manualSorting: true,
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

(Sans `filteredRowModel`, le `globalFilter` ne filtre pas côté client : pas besoin de `manualFiltering`.)

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
import type { RowData } from "@tanstack/react-table";
import {
  type AppFeatures,
  createDataTableHook,
  type DataTable,
} from "@/components/shared/DataTable/createDataTableHook";
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
  shallow: true,
  history: "replace",
});

export type TableAdmin<TRow extends RowData> = DataTable<
  AppFeatures<typeof featuresTableauAdmin>,
  TRow
>;
```

Dans `featuresTableauAdmin.ts`, corriger le commentaire (« quatre tableaux » → les sept pages de référentiels).

Dans `constants.ts`, remplacer `FILTRE_STATUT_REFERENTIEL` et ajouter le descripteur, `statutReferentielDe` **et le type `StatutReferentiel`** (tous deux déplacés depuis `utils.ts`, corps inchangés ; `constants.ts` importait déjà ce type depuis `utils.ts`) :

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
import type { RowData } from "@tanstack/react-table";
import Loader from "@/components/_commons/Loader/Loader";
import type { TableAdmin } from "./tableauAdmin";

export type LibellesTableauAdmin = {
  aucun: string;
  aucunResultat: string;
  invitationCreation?: string;
  iconeVide?: string;
};

export function TableauAdmin<TRow extends RowData>({
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

(`ring-gray-200` → `ring-dsfr-grey-925`, palette DSFR. `RowData` est la contrainte des lignes tanstack : sans elle, `DataTable<…, TRow>` ne compile pas.)

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

Dans chaque hook : `enableSorting: true` sur toutes les colonnes ; les options `{ valeur, label }` existantes (`OPTIONS_TYPE_PORTEUR`, statuts chantier via `STATUT_BADGE`) sont converties en `{ value: valeur, label }` ; les hooks dont les options de filtre viennent d'une requête reçoivent ces données en paramètre et mémorisent leurs colonnes dessus — Chantiers : `useTableauAdminChantiers(chantiers, perimetres)` avec `useMemo(..., [perimetres])` ; Périmètres : `useTableauAdminPerimetres(perimetres, porteurs)` avec `useMemo(..., [porteurs])` (les porteurs sont aujourd'hui lus dans `PageAdminPerimetres.tsx:33`) ; `filterFn: filterFn_arrHas` → `filterFnOneOf` ; les `sortingFn` personnalisés existants (Chantiers `perimetreId`, Périmètres `porteurId`) sont conservés. Supprimer `FiltresAdminChantiers.tsx`.

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

`pages/accueil/chantier/[territoireCode]/index.tsx` : `const pageIndex = searchParams.pageIndex;` → `const page = searchParams.page;` ; `splice((pageIndex - 1) * pageSize, pageSize)` → `splice(page * pageSize, pageSize)` ; `const sorting = searchParams.sort;` → `const [sorting = { id: "avancement", desc: false }] = searchParams.sort;` (un id inconnu est déjà ignoré par `appliquerTri`, dont le `switch` a un cas par défaut ; le vérifier en lisant `RecupererChantiersAccessiblesEnLectureUseCaseV2.ts:63-200`).
`pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx` : même changement pour `sorting`.

- [ ] **Step 2 : composants qui remettent la page à 1**

La plupart de ces fichiers suivent le schéma :

```tsx
const [, setPagination] = useQueryState(
  "pageIndex",
  parseAsInteger.withDefault(1).withOptions({ shallow: false }),
);
// …
setPagination(1);
```

Le remplacer **exactement** par (attention : garder `setPagination(1)` avec un parser en base 0 enverrait sur la page 2) :

```tsx
const [, setPagination] = useQueryState(
  "page",
  parseAsTablePage.withOptions({ shallow: false }),
);
// …
setPagination(null);
```

(conserver les options existantes, `history` compris). Dans les objets passés à un `useQueryStates` (`Filtres.tsx`, `BoutonReintialiserLesFiltres.tsx`…), `pageIndex: 1` → `page: null`. `delete router.query.pageIndex` → `delete router.query.page`. Vérifier : `grep -rn "pageIndex" src/client/components/PageAccueil src/client/components/_commons/Widget src/client/components/_commons/RemontéeAlerteChantier src/client/components/_commons/SélecteursMaillesEtTerritoiresChantier src/client/components/_commons/Cartographie` → aucune occurrence liée à l'URL.

- [ ] **Step 3 : hook**

Dans `useTableauChantiers.tsx` :

- `const accueilChantiers = createDataTableHook(features);` et `const reactTableColonnesHelper = accueilChantiers.createColumnHelper<DonnéesTableauChantiers>();` ;
- supprimer les `useQueryState("q")`, `useQueryStates({pageIndex, pageSize})`, `estVueTuile`, la colonne `chantier-tuile` et l'agrégat `ministèrePorteurDesChantiers` ;
- `getRowHref` n'est appelé que pour les lignes feuilles (`Body` et `TileList` ne posent pas de lien sur une ligne de groupe, dont `row.original` serait un chantier arbitraire) ;
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
    tileLabel: (row) => row.original.nom ?? "",
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

`TableauChantiersTuileMinistère.tsx` : le `<button type="button">` interne devient `<span aria-hidden="true">` (le bouton est désormais l'enveloppe posée par le hook ; un bouton imbriqué est invalide) ; tous ses `<div>` deviennent des `<span>` avec la classe `block` (ou `grid`/`flex` existante) — un `<div>` n'est pas permis dans un `<button>`. La tuile chantier reste navigable : `TileList` l'enveloppe dans le lien de `getRowHref` (tâche 5). Dans les deux tuiles, remplacer les classes `fr-*` via la table de la tâche 9 (`fr-mb-0 fr-ml-n1w` → `mb-0 -ml-2`, `fr-mt-1w fr-ml-5v` → `mt-2 ml-5`, `fr-mx-3w fr-mt-1v` → `mx-6 mt-1`).

- [ ] **Step 5 : tri externe**

`TableauChantiersActionsDeTri.tsx` : prend `tableau: TableauDesChantiers` en prop ; supprimer le `useQueryState("sort")` et le schéma zod ; lire le tri en validant l'id venu de l'URL (le regex zod le faisait ; un `?sort=inconnu.asc` ne doit pas faire planter la page) :

```tsx
const TRI_PAR_DÉFAUT = { id: "avancement", desc: false };
const [triURL] = tableau.store.state.sorting;
const tri =
  triURL && listeColonnesÀtrier.some((colonne) => colonne.valeur === triURL.id)
    ? triURL
    : TRI_PAR_DÉFAUT;
```

 le sélecteur appelle `tableau.setSorting([{ id: triSélectionné, desc: tri.desc }])` ; remplacer `BoutonsDeTri` par :

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
  pageCount={totalPages}
  pageIndex={page - 1}
/>
```

et supprimer `PaginationPages`. Sans log : `<DataTableEmpty empty={{ title: "Aucun log" }} hasActiveFilters={false} onResetFilters={() => {}} />` à la place du tableau. Les classes `gray-*` des cellules (badges de niveau) sont conservées.

- [ ] **Step 2 : Albert — URL**

Dans `AlbertDashboard.tsx`, remplacer `triChamp`/`triDirection` par `sort: parseAsSorting.withDefault([{ id: "updatedAt", desc: true }])` dans le `useQueryStates` ; dériver le tri en validant l'id (l'entrée tRPC n'accepte que `createdAt`/`updatedAt`) :

```tsx
const CHAMPS_TRI = ["createdAt", "updatedAt"] as const;
const [triURL] = params.sort;
const tri =
  triURL && (CHAMPS_TRI as readonly string[]).includes(triURL.id)
    ? triURL
    : { id: "updatedAt", desc: true };
```

puis `triChamp: tri.id as (typeof CHAMPS_TRI)[number]`, `triDirection: tri.desc ? "desc" : "asc"` pour l'entrée tRPC et la prop `tri` du tableau ; `onTriChange({ champ, direction })` écrit `setParams({ sort: [{ id: champ, desc: direction === "desc" }], page: 1 })`.

- [ ] **Step 3 : Albert — tableau**

`AlbertDashboardTable.tsx` : `table.!w-full !text-sm` → `<Table.Root bordered={false} caption="Conversations Albert" captionHidden className="!w-full !text-sm" containerClassName="!border !border-dsfr-grey-925 !rounded-md !bg-white">` ; `thead.!bg-dsfr-grey-1000` → `Table.Header` ; `th` → `Table.ColumnHeaderCell className="!text-left !px-4 !py-2"`, avec `aria-sort` (`"ascending"`/`"descending"`) **uniquement** sur celle des deux colonnes « Créé le » / « MAJ » qui est triée (`tri.champ`) ; en-têtes 👍 👎 💬 : `<span aria-hidden="true">👍</span><span className="sr-only">Pouces levés</span>` (resp. « Pouces baissés », « Commentaires »). Lignes : `Table.Row className="relative !border-t !border-dsfr-grey-925 even:!bg-dsfr-grey-1000 hover:!bg-dsfr-grey-900"` (+ `!opacity-60` en chargement), **sans** `onClick` ; la cellule « Conversation » devient `Table.RowHeaderCell` et son titre un bouton qui couvre la ligne :

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

