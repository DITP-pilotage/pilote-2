import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
  type Table,
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

export type ConfigFiltreColonne = {
  parametre: string;
  colonneId: string;
  valeursParDefaut: string[];
};

const DIRECTIONS_DE_TRI = ["asc", "desc"] as const;
const COLONNE_DE_TRI_PAR_DEFAUT = "updatedAt";
const DIRECTION_DE_TRI_PAR_DEFAUT = "desc";

const useTri = () => {
  const [tri, setTri] = useQueryStates(
    {
      sortBy: parseAsString.withDefault(COLONNE_DE_TRI_PAR_DEFAUT),
      sortDir: parseAsStringLiteral(DIRECTIONS_DE_TRI).withDefault(
        DIRECTION_DE_TRI_PAR_DEFAUT,
      ),
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
        : {
            sortBy: COLONNE_DE_TRI_PAR_DEFAUT,
            sortDir: DIRECTION_DE_TRI_PAR_DEFAUT,
          },
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

const useFiltresColonnes = (configs: ConfigFiltreColonne[]) => {
  const parsers = useMemo(
    () =>
      Object.fromEntries(
        configs.map((config) => [
          config.parametre,
          parseAsArrayOf(parseAsString).withDefault(config.valeursParDefaut),
        ]),
      ),
    [configs],
  );

  const [filtres, setFiltres] = useQueryStates(parsers, {
    shallow: true,
    clearOnDefault: true,
    history: "replace",
  });

  const columnFilters: ColumnFiltersState = useMemo(
    () =>
      configs
        .filter((config) => filtres[config.parametre].length > 0)
        .map((config) => ({
          id: config.colonneId,
          value: filtres[config.parametre],
        })),
    [configs, filtres],
  );

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const nouveauxFiltres =
      typeof updater === "function" ? updater(columnFilters) : updater;

    void setFiltres(
      Object.fromEntries(
        configs.map((config) => [
          config.parametre,
          toStringArray(
            nouveauxFiltres.find((filtre) => filtre.id === config.colonneId)
              ?.value,
          ),
        ]),
      ),
    );
  };

  const filtresColonnesActifs = configs.some(
    (config) =>
      !ontLesMemesValeurs(filtres[config.parametre], config.valeursParDefaut),
  );

  const reinitialiserFiltresColonnes = () =>
    setFiltres(
      Object.fromEntries(
        configs.map((config) => [config.parametre, config.valeursParDefaut]),
      ),
    );

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

const correspondALaRecherche = (champs: string[], recherche: string) => {
  const texte = recherche.toLowerCase().trim();
  if (!texte) return true;
  return champs.some((champ) => champ.toLowerCase().includes(texte));
};

export const useEtatTableauAdmin = <TRow>({
  filtres,
  champsRecherche,
}: {
  filtres: ConfigFiltreColonne[];
  champsRecherche: (ligne: TRow) => string[];
}) => {
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();
  const {
    columnFilters,
    onColumnFiltersChange: setColumnFilters,
    filtresColonnesActifs,
    reinitialiserFiltresColonnes,
  } = useFiltresColonnes(filtres);
  const [globalFilter, setRecherche] = useRecherche();

  const aDesFiltresActifs = filtresColonnesActifs || globalFilter !== "";

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater);
    void setPagination({ pageIndex: 0 });
  };

  const onGlobalFilterChange: OnChangeFn<string> = (updater) => {
    const nouvelleRecherche =
      typeof updater === "function" ? updater(globalFilter) : updater;
    void setRecherche(nouvelleRecherche);
    void setPagination({ pageIndex: 0 });
  };

  const reinitialiserLesFiltres = () => {
    void reinitialiserFiltresColonnes();
    void setRecherche("");
    void setPagination({ pageIndex: 0 });
  };

  return {
    optionsTable: {
      state: { sorting, pagination, columnFilters, globalFilter },
      onSortingChange,
      onPaginationChange: setPagination,
      onColumnFiltersChange,
      onGlobalFilterChange,
      globalFilterFn: (row: Row<TRow>, _columnId: string, recherche: string) =>
        correspondALaRecherche(champsRecherche(row.original), recherche),
      getCoreRowModel: getCoreRowModel<TRow>(),
      getSortedRowModel: getSortedRowModel<TRow>(),
      getPaginationRowModel: getPaginationRowModel<TRow>(),
      getFilteredRowModel: getFilteredRowModel<TRow>(),
    },
    aDesFiltresActifs,
    reinitialiserLesFiltres,
  };
};

/**
 * Lit et met à jour les valeurs sélectionnées d'un filtre de colonne
 * (GroupeCasesACocher, MultiSelectFiltre…) sans que chaque page admin ait
 * à refaire le cast `getFilterValue() as string[]`.
 */
export const useFiltreColonne = <TRow>(
  table: Table<TRow>,
  colonneId: string,
) => {
  const colonne = table.getColumn(colonneId);
  const valeurs = toStringArray(colonne?.getFilterValue());
  const setValeurs = (nouvellesValeurs: string[]) =>
    colonne?.setFilterValue(nouvellesValeurs);

  return [valeurs, setValeurs] as const;
};
