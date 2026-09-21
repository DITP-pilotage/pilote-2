import {
  createColumnHelper,
  getCoreRowModel,
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
  useQueryState,
  useQueryStates,
} from "nuqs";
import type { inferRouterOutputs } from "@trpc/server";
import { $Enums } from "@prisma/client";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { Badge, type BadgeType } from "@/components/_commons/Badge";
import { formaterDateCourte } from "@/client/utils/date/date";

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

const STATUTS_PAR_DEFAUT: $Enums.type_statut[] = ["PUBLIE"];

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
      pageSize: parseAsInteger.withDefault(10),
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

const ontLesMemesValeurs = (valeurs: string[], autresValeurs: string[]) =>
  valeurs.length === autresValeurs.length &&
  valeurs.every((valeur) => autresValeurs.includes(valeur));

const useFiltresColonnes = () => {
  const [filtres, setFiltres] = useQueryStates(
    {
      statut: parseAsArrayOf(parseAsString).withDefault(STATUTS_PAR_DEFAUT),
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

  const filtresColonnesActifs =
    !ontLesMemesValeurs(filtres.statut, STATUTS_PAR_DEFAUT) ||
    filtres.perimetre.length > 0;

  const reinitialiserFiltresColonnes = () =>
    setFiltres({ statut: STATUTS_PAR_DEFAUT, perimetre: [] });

  return {
    columnFilters,
    onColumnFiltersChange,
    filtresColonnesActifs,
    reinitialiserFiltresColonnes,
  };
};

const useRecherche = () =>
  useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      clearOnDefault: true,
      history: "replace",
    }),
  );

const filtreGlobal = (
  row: { original: ChantierAdminRow },
  recherche: string,
) => {
  const texte = recherche.toLowerCase().trim();
  if (!texte) return true;
  return (
    row.original.chantierId.toLowerCase().includes(texte) ||
    row.original.chNom.toLowerCase().includes(texte)
  );
};

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
        filterFn: "arrIncludesSome",
        cell: (info) => {
          const badge = STATUT_BADGE[info.getValue()];
          return <Badge type={badge.type}>{badge.label}</Badge>;
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
        cell: (info) => formaterDateCourte(info.getValue()),
      }),
    ],
    [],
  );

export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();
  const {
    columnFilters,
    onColumnFiltersChange: setColumnFilters,
    filtresColonnesActifs,
    reinitialiserFiltresColonnes,
  } = useFiltresColonnes();
  const [globalFilter, setRecherche] = useRecherche();

  const aDesFiltresActifs = filtresColonnesActifs || globalFilter !== "";

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater);
    void setPagination({ pageIndex: 0 });
  };

  const reinitialiserLesFiltres = () => {
    void reinitialiserFiltresColonnes();
    void setRecherche("");
    void setPagination({ pageIndex: 0 });
  };

  const onGlobalFilterChange: OnChangeFn<string> = (updater) => {
    const nouvelleRecherche =
      typeof updater === "function" ? updater(globalFilter) : updater;
    void setRecherche(nouvelleRecherche);
    void setPagination({ pageIndex: 0 });
  };

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination, columnFilters, globalFilter },
    onSortingChange,
    onPaginationChange: setPagination,
    onColumnFiltersChange,
    onGlobalFilterChange,
    globalFilterFn: (row, _columnId, filterValue: string) =>
      filtreGlobal(row, filterValue),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
