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
import type { PpgAdminListItem } from "@/server/metadataPpg/queries/ListerPpgsAdminQuery";

const FILTRES: ConfigFiltreColonne[] = [FILTRE_STATUT_REFERENTIEL];

const champsRecherche = (ppg: PpgAdminListItem) => [ppg.ppgId, ppg.ppgNom];

const columnHelper = createColumnHelper<PpgAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("ppgId", {
        id: "ppgId",
        header: "ID",
      }),
      columnHelper.accessor("ppgNom", {
        id: "ppgNom",
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
      columnHelper.accessor("ppgAxe", {
        id: "ppgAxe",
        header: "Axe",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor((ppg) => statutReferentielDe(ppg.deletedAt), {
        id: "statut",
        header: "Statut",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        cell: (info) => (
          <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
        ),
      }),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: "Mise à jour",
        cell: (info) => formaterDateCourte(new Date(info.getValue())),
      }),
    ],
    [],
  );

export const useTableauAdminPpgs = (ppgs: PpgAdminListItem[]) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<PpgAdminListItem>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useReactTable({ data: ppgs, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
