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
      [
        "Première page",
        "Page précédente",
        "Page suivante",
        "Dernière page",
      ].map((nom) =>
        screen.getByRole("button", { name: nom }).hasAttribute("disabled"),
      ),
    ).toEqual([true, true, false, false]);
  });

  it("demande la page choisie en base 0", async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationView
        onPageChange={onPageChange}
        pageCount={10}
        pageIndex={4}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Page suivante" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "10" }));

    expect(onPageChange.mock.calls).toEqual([[5], [9]]);
  });

  it("ne s'affiche pas quand il n'y a qu'une page", () => {
    render(
      <PaginationView onPageChange={() => {}} pageCount={1} pageIndex={0} />,
    );

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
    render(<TableauPagine data={[{ nom: "a" }, { nom: "b" }, { nom: "c" }]} />);

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
