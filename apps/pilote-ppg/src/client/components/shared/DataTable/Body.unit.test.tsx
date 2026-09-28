import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  aggregationFns,
  columnGroupingFeature,
  createExpandedRowModel,
  createGroupedRowModel,
  rowAggregationFeature,
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
    rowAggregationFeature,
    aggregationFns,
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
      screen
        .getAllByRole("link")
        .map((lien) => [lien.textContent, lien.getAttribute("href")]),
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

    expect(
      screen.getByRole("rowheader", { name: "École" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "École" }),
    ).not.toBeInTheDocument();
  });

  it("déplie un groupe avec un bouton qui expose son état", async () => {
    render(<TableauGroupe />);

    const bouton = screen.getByRole("button", { name: /MTE/ });
    expect(bouton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Total 60")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await userEvent.click(bouton);

    expect(bouton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link").map((lien) => lien.textContent)).toEqual(
      ["Eau", "Air"],
    );
  });
});
