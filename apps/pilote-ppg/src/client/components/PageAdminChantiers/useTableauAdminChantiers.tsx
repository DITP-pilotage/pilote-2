import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { $Enums } from "@prisma/client";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

export type ChantierAdminRow =
  inferRouterOutputs<typeof appRouter>["metadataChantier"]["lister"][number];

export const STATUT_BADGE: Record<
  $Enums.type_statut,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  PUBLIE: {
    label: "Publié",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  ARCHIVE: {
    label: "Archivé",
    className: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
  SUPPRIME: {
    label: "Supprimé",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
  },
};

const columnHelper = createColumnHelper<ChantierAdminRow>();

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const useTableColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("chantierId", {
        id: "chantierId",
        header: "ID",
      }),
      columnHelper.accessor("chNom", {
        id: "chNom",
        header: "Nom",
      }),
      columnHelper.accessor("chState", {
        id: "chState",
        header: "Statut",
        cell: (info) => {
          const badge = STATUT_BADGE[info.getValue()];
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          );
        },
      }),
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "Périmètre",
        cell: (info) => info.row.original.perimetreNom,
      }),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: "Mise à jour",
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();

  const table = useReactTable({
    data: chantiers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
};
