import { createColumnHelper, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  useEtatTableauAdmin,
  type ConfigFiltreColonne,
} from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";
import { FILTRE_STATUT_REFERENTIEL } from "@/components/_commons/TableauAdmin/constants";
import { statutReferentielDe } from "@/components/_commons/TableauAdmin/utils";
import type { PerimetreAdminListItem } from "@/server/metadataPerimetre/queries/ListerPerimetresAdminQuery";

const FILTRES: ConfigFiltreColonne[] = [
  FILTRE_STATUT_REFERENTIEL,
  { parametre: "porteur", colonneId: "porteurId", valeursParDefaut: [] },
];

const champsRecherche = (perimetre: PerimetreAdminListItem) => [
  perimetre.perimetreId,
  perimetre.perNom,
];

const columnHelper = createColumnHelper<PerimetreAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "ID",
      }),
      columnHelper.accessor("perNom", {
        id: "perNom",
        header: "Nom",
        cell: (info) => (
          <span
            className={
              info.row.original.deletedAt !== null
                ? "line-through text-gray-400"
                : ""
            }
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("porteurId", {
        id: "porteurId",
        header: "Porteur",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        cell: (info) => info.row.original.porteurShort ?? "-",
        sortingFn: (rowA, rowB) =>
          (rowA.original.porteurShort ?? "").localeCompare(
            rowB.original.porteurShort ?? "",
          ),
      }),
      columnHelper.accessor(
        (perimetre) => statutReferentielDe(perimetre.deletedAt),
        {
          id: "statut",
          header: "Statut",
          enableColumnFilter: true,
          filterFn: "arrIncludesSome",
          cell: (info) => (
            <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
          ),
        },
      ),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: "Mise à jour",
        cell: (info) => formaterDateCourte(new Date(info.getValue())),
      }),
    ],
    [],
  );

export const useTableauAdminPerimetres = (
  perimetres: PerimetreAdminListItem[],
) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<PerimetreAdminListItem>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useReactTable({ data: perimetres, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
