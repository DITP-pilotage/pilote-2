import { act, renderHook, screen, within } from "@testing-library/react";
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
import { render } from "@/components/shared/DataTable/testUtils";
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
  const table = hook.useDataTable<Chantier>({
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
    expect(
      screen.getByRole("table", { name: "Chantiers" }),
    ).toBeInTheDocument();
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

    expect(document.querySelector("[aria-live='polite']")?.textContent).toBe(
      "",
    );
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
