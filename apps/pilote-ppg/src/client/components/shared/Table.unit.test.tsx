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
