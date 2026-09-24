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
import type { EngagementAdminListItem } from "@/server/metadataEngagement/queries/ListerEngagementsAdminQuery";

const FILTRES: ConfigFiltreColonne[] = [FILTRE_STATUT_REFERENTIEL];

const champsRecherche = (engagement: EngagementAdminListItem) => [
  engagement.engagementId,
  engagement.engagementShort,
  engagement.engagementName,
];

const columnHelper = createColumnHelper<
  typeof featuresTableauAdmin,
  EngagementAdminListItem
>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("engagementId", {
          id: "engagementId",
          header: "ID",
        }),
        columnHelper.accessor("engagementShort", {
          id: "engagementShort",
          header: "Code",
        }),
        columnHelper.accessor("engagementName", {
          id: "engagementName",
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
        columnHelper.accessor(
          (engagement) => statutReferentielDe(engagement.deletedAt),
          {
            id: "statut",
            header: "Statut",
            enableColumnFilter: true,
            filterFn: filterFn_arrHas,
            cell: (info) => (
              <BadgeStatutReferentiel
                supprimé={info.getValue() === "SUPPRIME"}
              />
            ),
          },
        ),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: "Mise à jour",
          cell: (info) => formaterDateCourte(new Date(info.getValue())),
        }),
      ]),
    [],
  );

export const useTableauAdminEngagements = (
  engagements: EngagementAdminListItem[],
) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<EngagementAdminListItem>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useTable({ data: engagements, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
