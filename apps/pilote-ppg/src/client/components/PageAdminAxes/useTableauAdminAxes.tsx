import {
  createColumnHelper,
  filterFn_arrHas,
  useTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  featuresTableauAdmin,
  useEtatTableauAdmin,
  type ConfigFiltreColonne,
} from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";
import { FILTRE_STATUT_REFERENTIEL } from "@/components/_commons/TableauAdmin/constants";
import { statutReferentielDe } from "@/components/_commons/TableauAdmin/utils";
import type { AxeAdminListItem } from "@/server/metadataAxe/queries/ListerAxesAdminQuery";

const FILTRES: ConfigFiltreColonne[] = [FILTRE_STATUT_REFERENTIEL];

const champsRecherche = (axe: AxeAdminListItem) => [axe.axeId, axe.axeName];

const columnHelper = createColumnHelper<
  typeof featuresTableauAdmin,
  AxeAdminListItem
>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("axeId", {
          id: "axeId",
          header: "ID",
        }),
        columnHelper.accessor("axeName", {
          id: "axeName",
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
        columnHelper.accessor((axe) => statutReferentielDe(axe.deletedAt), {
          id: "statut",
          header: "Statut",
          enableColumnFilter: true,
          filterFn: filterFn_arrHas,
          cell: (info) => (
            <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
          ),
        }),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: "Mise à jour",
          cell: (info) => formaterDateCourte(new Date(info.getValue())),
        }),
      ]),
    [],
  );

export const useTableauAdminAxes = (axes: AxeAdminListItem[]) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<AxeAdminListItem>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useTable({ data: axes, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
