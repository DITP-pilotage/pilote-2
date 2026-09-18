import {
  createColumnHelper,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
  parseAsArrayOf,
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

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) && value.every((valeur) => typeof valeur === "string")
    ? (value as string[])
    : [];

const useFiltresColonnes = () => {
  const [filtres, setFiltres] = useQueryStates(
    {
      statut: parseAsArrayOf(parseAsString).withDefault([]),
      perimetre: parseAsArrayOf(parseAsString).withDefault([]),
    },
    { shallow: true, clearOnDefault: true, history: "replace" },
  );

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filtresColonnes: ColumnFiltersState = [];
    if (filtres.statut.length > 0) {
      filtresColonnes.push({ id: "chState", value: filtres.statut });
    }
    if (filtres.perimetre.length > 0) {
      filtresColonnes.push({ id: "perimetreId", value: filtres.perimetre });
    }
    return filtresColonnes;
  }, [filtres]);

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const nouveauxFiltres =
      typeof updater === "function" ? updater(columnFilters) : updater;

    void setFiltres({
      statut: toStringArray(
        nouveauxFiltres.find((filtre) => filtre.id === "chState")?.value,
      ),
      perimetre: toStringArray(
        nouveauxFiltres.find((filtre) => filtre.id === "perimetreId")?.value,
      ),
    });
  };

  return [columnFilters, onColumnFiltersChange] as const;
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
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
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
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
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
  const [columnFilters, setColumnFilters] = useFiltresColonnes();

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater);
    void setPagination({ pageIndex: 0 });
  };

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination, columnFilters },
    onSortingChange,
    onPaginationChange: setPagination,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return { table };
};
