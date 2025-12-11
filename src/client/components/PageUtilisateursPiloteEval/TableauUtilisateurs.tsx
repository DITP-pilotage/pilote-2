import { useRouter } from "next/router";
import { flexRender } from "@tanstack/react-table";
import { pageUtilisateursPiloteEval } from "@/components/PageUtilisateursPiloteEval/PageUtilisateursServerSideContext";
import { useTableauUtilisateurs } from "@/components/PageUtilisateursPiloteEval/useTableauUtilisateurs";

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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  className="bg-dsfr-blue-france-925 border-b-2 text-left font-bold text-sm"
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header) => (
                    <th className="px-4 py-3" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-dsfr-grey-925 text-sm">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  className={`cursor-pointer transition-colors hover:bg-dsfr-alt-blue-france ${
                    index % 2 === 0 ? "bg-white" : "bg-dsfr-grey-1000"
                  }`}
                  key={row.id}
                  onClick={() =>
                    router.push(`/evaluation/utilisateur/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td className="px-4 py-3" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.getRowModel().rows.length === 0 && (
          <p className="text-center text-dsfr-grey-625 py-4">
            Aucun résultat trouvé.
          </p>
        )}
      </div>
    </div>
  );
};
