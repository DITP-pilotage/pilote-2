import { useRouter } from "next/router";
import { flexRender } from "@tanstack/react-table";
import { pageUtilisateursPiloteEval } from "@/components/PageUtilisateursPiloteEval/PageUtilisateursServerSideContext";
import { useTableauUtilisateurs } from "@/components/PageUtilisateursPiloteEval/useTableauUtilisateurs";
import { Table } from "@/components/shared/Table";

export const TableauUtilisateurs = () => {
  const { utilisateurs } =
    pageUtilisateursPiloteEval.useServerSidePropsContext();
  const router = useRouter();
  const { table, globalFilter, setGlobalFilter } = useTableauUtilisateurs({
    utilisateurs,
  });

  if (utilisateurs.length === 0) {
    return (
      <p className="text-dsfr-grey-625">
        Aucun utilisateur n'a accès à Pilote Eval pour le moment.
      </p>
    );
  }

  return (
    <div className="bg-white p-8 rounded shadow-sm">
      <div className="!space-y-4">
        <input
          className="!px-4 !py-2 !border-b-2 !border-primary !bg-dsfr-alt-blue-france !placeholder-dsfr-mention-grey placeholder:italic"
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Rechercher"
          type="text"
          value={globalFilter ?? ""}
        />

        <Table.Root
          caption="Utilisateurs de Pilote Eval"
          captionHidden
          className="w-full border-collapse"
        >
          <Table.Header className="bg-transparent">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row
                className="bg-dsfr-blue-france-925 border-b-2 text-left font-bold text-sm"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <Table.ColumnHeaderCell
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                    className="text-[length:inherit] leading-[inherit] px-4 py-3 md:px-4 md:py-3 border-b-0 cursor-pointer select-none hover:bg-dsfr-blue-france-925-hover"
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <span>↑</span>
                        ) : header.column.getIsSorted() === "desc" ? (
                          <span>↓</span>
                        ) : (
                          <span className="opacity-30">↕</span>
                        )}
                      </div>
                    )}
                  </Table.ColumnHeaderCell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body
            className="divide-y divide-dsfr-grey-925 text-sm"
            zebra={false}
          >
            {table.getRowModel().rows.map((row, index) => (
              <Table.Row
                className={`cursor-pointer transition-colors hover:bg-dsfr-alt-blue-france ${
                  index % 2 === 0 ? "bg-white" : "bg-dsfr-grey-1000"
                }`}
                key={row.id}
                onClick={() =>
                  router.push(`/evaluation/utilisateur/${row.original.id}`)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    className="text-[length:inherit] leading-[inherit] px-4 py-3 md:px-4 md:py-3"
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {table.getRowModel().rows.length === 0 && (
          <p className="text-center text-dsfr-grey-625 py-4">
            Aucun résultat trouvé.
          </p>
        )}
      </div>
    </div>
  );
};
