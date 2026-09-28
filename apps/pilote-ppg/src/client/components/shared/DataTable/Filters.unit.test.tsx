import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  globalFilteringFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import { render } from "@/components/shared/DataTable/testUtils";

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
