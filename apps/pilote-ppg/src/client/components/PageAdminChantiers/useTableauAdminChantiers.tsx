import {
  createColumnHelper,
  filterFn_arrIncludesSome,
  useTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { $Enums } from "@prisma/client";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { Badge, type BadgeType } from "@/components/_commons/Badge";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  featuresTableauAdmin,
  useEtatTableauAdmin,
  type ConfigFiltreColonne,
} from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";

export type ChantierAdminRow = inferRouterOutputs<
  typeof appRouter
>["metadataChantier"]["lister"][number];

export const STATUT_BADGE: Record<
  $Enums.type_statut,
  { label: string; type: BadgeType }
> = {
  BROUILLON: { label: "Brouillon", type: "jaune" },
  PUBLIE: { label: "Publié", type: "vert" },
  ARCHIVE: { label: "Archivé", type: "gris" },
  SUPPRIME: { label: "Supprimé", type: "rouge" },
};

const FILTRES: ConfigFiltreColonne[] = [
  { parametre: "statut", colonneId: "chState", valeursParDefaut: ["PUBLIE"] },
  { parametre: "perimetre", colonneId: "perimetreId", valeursParDefaut: [] },
];

const champsRecherche = (chantier: ChantierAdminRow) => [
  chantier.chantierId,
  chantier.chNom,
];

const columnHelper = createColumnHelper<
  typeof featuresTableauAdmin,
  ChantierAdminRow
>();

const useTableColumns = () =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("chantierId", {
          id: "chantierId",
          header: "ID",
        }),
        columnHelper.accessor("chNom", {
          id: "chNom",
          header: "Nom",
          cell: (info) => (
            <div className="max-w-sm truncate" title={info.getValue()}>
              {info.getValue()}
            </div>
          ),
        }),
        columnHelper.accessor("chState", {
          id: "chState",
          header: "Statut",
          enableColumnFilter: true,
          filterFn: filterFn_arrIncludesSome,
          cell: (info) => {
            const badge = STATUT_BADGE[info.getValue()];
            return <Badge type={badge.type}>{badge.label}</Badge>;
          },
        }),
        columnHelper.accessor("perimetreId", {
          id: "perimetreId",
          header: "Périmètre",
          enableColumnFilter: true,
          filterFn: filterFn_arrIncludesSome,
          cell: (info) => info.row.original.perimetreNom,
          sortFn: (rowA, rowB) =>
            rowA.original.perimetreNom.localeCompare(
              rowB.original.perimetreNom,
            ),
        }),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: "Mise à jour",
          cell: (info) => formaterDateCourte(info.getValue()),
        }),
      ]),
    [],
  );

export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<ChantierAdminRow>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useTable({ data: chantiers, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
