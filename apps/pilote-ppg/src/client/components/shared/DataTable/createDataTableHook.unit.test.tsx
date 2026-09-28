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
