import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { formaterDate } from "@/client/utils/date/date";
import { UtilisateurPiloteEval } from "@/server/evaluation/queries/ListerUtilisateursPiloteEval";

type UtilisateurRow = UtilisateurPiloteEval;

const columnHelper = createColumnHelper<UtilisateurRow>();

const useTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("nom", {
        header: "Nom",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("prenom", {
        header: "Prénom",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("profilCode", {
        header: "Profil",
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-dsfr-blue-france-925 text-dsfr-blue-france-sun-113">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("dateDerniereModification", {
        header: "Dernière modification",
        cell: (info) => formaterDate(info.getValue(), "DD/MM/YYYY") ?? "-",
      }),
    ],
    [],
  );
};

export const useTableauUtilisateurs = ({
  utilisateurs,
}: {
  utilisateurs: UtilisateurRow[];
}) => {
  const columns = useTableColumns();
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: utilisateurs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const utilisateur = row.original;

      return (
        utilisateur.email.toLowerCase().includes(search) ||
        utilisateur.nom.toLowerCase().includes(search) ||
        utilisateur.prenom.toLowerCase().includes(search) ||
        utilisateur.profilCode.toLowerCase().includes(search)
      );
    },
  });

  return { table, globalFilter, setGlobalFilter };
};
