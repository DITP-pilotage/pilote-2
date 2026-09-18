import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
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

const DIRECTIONS_DE_TRI = ["asc", "desc"] as const;

const useTri = () => {
  const [tri, setTri] = useQueryStates(
    {
      sortBy: parseAsString.withDefault("updatedAt"),
      sortDir: parseAsStringLiteral(DIRECTIONS_DE_TRI).withDefault("desc"),
    },
    { shallow: true, history: "replace" },
  );

  const sorting: SortingState = useMemo(
    () => [{ id: tri.sortBy, desc: tri.sortDir === "desc" }],
    [tri],
  );

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nouveauTri =
      typeof updater === "function" ? updater(sorting) : updater;
    const [premierTri] = nouveauTri;
    void setTri(
      premierTri
        ? { sortBy: premierTri.id, sortDir: premierTri.desc ? "desc" : "asc" }
        : { sortBy: "updatedAt", sortDir: "desc" },
    );
  };

  return [sorting, onSortingChange] as const;
};

const usePagination = () => {
  const [pagination, setPagination] = useQueryStates(
    {
      pageIndex: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(20),
    },
    { shallow: true, history: "replace" },
  );

  const paginationState: PaginationState = useMemo(
    () => pagination,
    [pagination],
  );

  return [paginationState, setPagination] as const;
};

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
        sortingFn: (rowA, rowB) =>
          rowA.original.perimetreNom.localeCompare(rowB.original.perimetreNom),
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
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return { table };
};
