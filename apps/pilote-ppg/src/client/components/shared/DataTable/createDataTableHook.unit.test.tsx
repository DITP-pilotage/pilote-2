import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  renderHook as renderHookWithoutUrl,
  waitFor,
} from "@testing-library/react";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { render, renderHook } from "@/components/shared/DataTable/testUtils";

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
      enableSorting: false,
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
  // @ts-expect-error une table sans rowPaginationFeature n'expose pas Pagination
  void table.Pagination;
  // @ts-expect-error une table sans filtrage n'expose pas Filters
  void table.Filters;
  return (
    <table.Root caption="Minimal">
      <table.Header />
      <table.Body />
    </table.Root>
  );
}

const avecPagination = createDataTableHook(
  tableFeatures({
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
  }),
);
const colonnesAvecPagination = (() => {
  const helper = avecPagination.createColumnHelper<Chantier>();
  return helper.columns([helper.accessor("nom", { header: "Nom" })]);
})();

const lignesDuCorps = (tableau: HTMLElement) =>
  within(tableau)
    .getAllByRole("row")
    .slice(1)
    .map((ligne) =>
      Array.from(ligne.children).map((cellule) => cellule.textContent),
    );

describe("createDataTableHook", () => {
  it("rend l'en-tête et les lignes, la colonne principale en en-tête de ligne", () => {
    render(<TableauAvecTri />);

    const tableau = screen.getByRole("table", { name: "Chantiers" });
    expect(
      within(tableau)
        .getAllByRole("columnheader")
        .map((cellule) => cellule.textContent),
    ).toEqual(["Nom, trier par ordre croissant", "Avancement", "Identifiant"]);
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
      screen.getByRole("button", { name: "Nom, trier par ordre croissant" }),
    );

    expect(ordres()).toEqual(["ascending", null, null]);
  });

  it("trie au clic puis inverse l'ordre sans jamais retirer le tri", async () => {
    render(<TableauAvecTri />);

    await userEvent.click(
      screen.getByRole("button", { name: "Nom, trier par ordre croissant" }),
    );
    expect(lignesDuCorps(screen.getByRole("table"))).toEqual([
      ["Chantier A", "50", "a"],
      ["Chantier B", "20", "b"],
    ]);

    await userEvent.click(
      screen.getByRole("button", { name: "Nom, trier par ordre décroissant" }),
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Nom, trier par ordre croissant" }),
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("n'affiche pas de bouton de tri sur une colonne non triable", () => {
    render(<TableauAvecTri />);

    expect(
      screen.queryByRole("button", { name: /^Avancement, trier/ }),
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

  it("revient sur la dernière page existante quand la page de l'URL la dépasse", async () => {
    const { result, rerender } = renderHookWithoutUrl(
      ({ data }: { data: Chantier[] }) =>
        avecPagination.useDataTable({
          data,
          columns: colonnesAvecPagination,
          urlState: { pagination: { pageSize: 1 } },
        }),
      {
        initialProps: { data: chantiers },
        wrapper: withNuqsTestingAdapter({ searchParams: "?page=2" }),
      },
    );
    expect(result.current.store.state.pagination.pageIndex).toBe(1);

    rerender({ data: chantiers.slice(0, 1) });

    await waitFor(() =>
      expect(result.current.store.state.pagination.pageIndex).toBe(0),
    );
    expect(result.current.getRowModel().rows).toHaveLength(1);
  });
});
