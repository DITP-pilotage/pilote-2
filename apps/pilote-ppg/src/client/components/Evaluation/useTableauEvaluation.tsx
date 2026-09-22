import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  filterFn_arrHas,
  metaHelper,
  rowExpandingFeature,
  tableFeatures,
  useTable,
  type Column,
  type ReactTable,
  type Table,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { $Enums } from "@prisma/client";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { pick } from "@/server/utils/pick";
import { Rattachement } from "@/server/evaluation/queries/types";
import { CelluleEvaluation } from "@/components/Evaluation/CelluleEvaluation";
import { useGetCritere } from "@/components/Evaluation/CriteresProvider";
import { BadgeEtape } from "@/components/Evaluation/BadgeEtape";

export type ColonneEvaluation = Column<
  typeof featuresTableauEvaluation,
  TableauEvaluationRow
>;

export type TableEvaluation = ReactTable<
  typeof featuresTableauEvaluation,
  TableauEvaluationRow
>;

export type GroupeOptionsFiltre = {
  label: string;
  options: string[];
};

type FiltreDeBase = {
  label: string;
  getOptionLabel(value: string): string;
  hidden?(
    table: Table<typeof featuresTableauEvaluation, TableauEvaluationRow>,
  ): boolean;
};

export type FiltreColonneEvaluation =
  | (FiltreDeBase & {
      type: "checkboxes";
      getOptions(column: ColonneEvaluation): string[];
    })
  | (FiltreDeBase & {
      type: "multiselect";
      getPlaceholder(values: string[]): string;
      getOptionGroups(column: ColonneEvaluation): GroupeOptionsFiltre[];
    })
  | (FiltreDeBase & {
      type: "tags";
      labelToutesLesOptions: string;
      onChange?(
        value: string | null,
        table: Table<typeof featuresTableauEvaluation, TableauEvaluationRow>,
      ): void;
      getOptions(column: ColonneEvaluation): string[];
    });

/**
 * L'augmentation globale de `ColumnMeta` décrit ses filtres avec `Column<any, any>` et
 * `Table<any, any>` : en v9 ces types valent « toutes les features », et aucune table
 * concrète ne leur est assignable. Le slot `columnMeta` remplace l'interface globale pour
 * cette seule table, ce que la documentation amont recommande quand l'isolation aide, et
 * les descripteurs de filtre retrouvent le type exact de la table qui les porte.
 */
type ColumnMetaEvaluation = {
  filter?: FiltreColonneEvaluation;
  grouping?: {
    label: string;
  };
};

/**
 * Le tableau d'évaluation filtre ses colonnes, les regroupe, déplie ses lignes et
 * facette les valeurs disponibles. En v9 chaque capacité doit être déclarée, et une
 * feature prérequis se place avant le slot de modèle de lignes qui en dépend :
 * `columnFacetingFeature` s'appuie sur `columnFilteringFeature`, `facetedUniqueValues`
 * sur `columnFacetingFeature`, `groupedRowModel` sur `columnGroupingFeature` et
 * `expandedRowModel` sur `rowExpandingFeature`.
 *
 * Pas de `facetedRowModel` : sans ce slot les facettes se calculent sur le modèle
 * pré-filtré, ce qui est exactement ce que faisait la v8 ici, qui n'enregistrait pas
 * `getFacetedRowModel()`. Les options d'un filtre restent donc toutes les valeurs du jeu
 * de données, et non celles qui survivent aux autres filtres actifs.
 */
export const featuresTableauEvaluation = tableFeatures({
  columnFilteringFeature,
  columnFacetingFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  filterFns: { arrHas: filterFn_arrHas },
  filteredRowModel: createFilteredRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  columnMeta: metaHelper<ColumnMetaEvaluation>(),
});

const columnHelper = createColumnHelper<
  typeof featuresTableauEvaluation,
  TableauEvaluationRow
>();

const PHASES_EVALUATION = {
  [$Enums.etape_evaluation_enum.CONSOLIDATION]: { label: "Appréciation" },
  [$Enums.etape_evaluation_enum.INSTRUCTION]: { label: "Instruction" },
};

const STATUTS_EVALUATION = {
  TRAITE: { label: "Traité" },
  NON_TRAITE: { label: "Non traité" },
};

const CATEGORIES = {
  objectif: { label: "Objectifs individuels" },
  critere: { label: "Manière de servir" },
};

type STATUT_EVALUATION = keyof typeof STATUTS_EVALUATION;

const getStatutTraitement = (row: TableauEvaluationRow): STATUT_EVALUATION =>
  row.evaluations[0]?.dateTraitement != null ? "TRAITE" : "NON_TRAITE";

const toStringArray = (value: unknown): string[] => {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? (value as string[])
    : [];
};

/**
 * Les facettes sont indexées par la valeur brute de la colonne : on ne garde que les
 * chaînes non vides, ce qui écarte le `null` des lignes sans critère.
 */
const getColumnFacetedUniqueValues = (column: ColonneEvaluation): string[] =>
  [...column.getFacetedUniqueValues().keys()].filter(
    (valeur): valeur is string => typeof valeur === "string" && valeur !== "",
  );

const useTableData = (rattachements: Rattachement[]) => {
  const getCritere = useGetCritere();
  return useMemo<TableauEvaluationRow[]>(() => {
    const rows: TableauEvaluationRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.criteres.forEach((critere) => {
        rows.push({
          type: "critere",
          ficheEvaluationId: rattachement.ficheEvaluationId,
          etapeCourante: rattachement.etapeCourante,
          rattachement,
          id: critere.id,
          libelle: getCritere(critere.id).libelle,
          evaluations: critere.evaluations,
        });
      });

      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          type: "objectif",
          ficheEvaluationId: rattachement.ficheEvaluationId,
          etapeCourante: rattachement.etapeCourante,
          rattachement,
          ...pick(objectif, [
            "id",
            "libelle",
            "descriptif",
            "indicateurCible",
            "evaluations",
          ]),
        });
      });
    });

    return rows;
  }, [getCritere, rattachements]);
};

export const COLONNES = {
  PHASE: "phase",
  RATTACHEMENT_CODE: "rattachementCode",
  CRITERE_ID: "critereId",
  STATUT_TRAITEMENT: "statutTraitement",
  CATEGORIE: "categorie",
};

const useTableColumns = (rattachements: Rattachement[]) => {
  const getCritere = useGetCritere();
  return useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((row) => row.etapeCourante, {
          id: COLONNES.PHASE,
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            const filter = Array.isArray(filterValue)
              ? filterValue
              : [filterValue];

            if (filter.length === 0) {
              return true;
            }

            return filter.includes(row.original.etapeCourante);
          },
          meta: {
            filter: {
              type: "checkboxes",
              label: "Filtrer par phase",
              getOptions: () => [
                $Enums.etape_evaluation_enum.CONSOLIDATION,
                $Enums.etape_evaluation_enum.INSTRUCTION,
              ],
              getOptionLabel: (value: keyof typeof PHASES_EVALUATION) =>
                PHASES_EVALUATION[value].label,
            },
          },
        }),
        columnHelper.accessor(getStatutTraitement, {
          id: COLONNES.STATUT_TRAITEMENT,
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            const filter = Array.isArray(filterValue)
              ? filterValue
              : [filterValue];

            if (filter.length === 0) {
              return true;
            }

            return filter.includes(getStatutTraitement(row.original));
          },
          meta: {
            filter: {
              type: "tags",
              label: "Filtrer par statut",
              labelToutesLesOptions: "Tous",
              getOptions: () => ["TRAITE", "NON_TRAITE"],
              getOptionLabel: (value: STATUT_EVALUATION) =>
                STATUTS_EVALUATION[value].label,
            },
          },
        }),
        columnHelper.accessor("rattachement.code", {
          id: COLONNES.RATTACHEMENT_CODE,
          header: "Rattachement",
          cell: (info) => {
            return (
              <div className="flex flex-col -mx-4 min-h-[80px]">
                <div className="px-3 py-4 bg-dsfr-blue-france-925 flex flex-col gap-1 items-start">
                  <span className="text-primary font-semibold text-sm line-clamp-1">
                    {info.row.original.rattachement.libelle}
                  </span>
                  <BadgeEtape etapeCourante={info.row.original.etapeCourante} />
                </div>
              </div>
            );
          },
          filterFn: "arrHas",
          meta: {
            filter: {
              type: "multiselect",
              label: "Filtrer par territoire",
              getPlaceholder: (values) =>
                `${values.length} territoire(s) sélectionné(s)`,
              getOptionLabel: (value) =>
                rattachements.find(
                  (rattachement) => rattachement.code === value,
                )?.libelle ?? value,
              getOptionGroups: (column) => {
                const values = getColumnFacetedUniqueValues(column);
                return [
                  {
                    label: "Régions",
                    options: values.filter((value) => value.startsWith("REG-")),
                  },
                  {
                    label: "Départements",
                    options: values.filter((value) =>
                      value.startsWith("DEPT-"),
                    ),
                  },
                  {
                    label: "Autres",
                    options: values.filter(
                      (value) =>
                        !value.startsWith("REG-") && !value.startsWith("DEPT-"),
                    ),
                  },
                ];
              },
            },
            grouping: {
              label: "Territoire",
            },
          },
          getGroupingValue: (row) => row.rattachement.code,
        }),
        columnHelper.accessor((ligne) => ligne.type, {
          id: COLONNES.CATEGORIE,
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            const filter = Array.isArray(filterValue)
              ? filterValue
              : [filterValue];

            if (filter.length === 0) {
              return true;
            }

            return filter.includes(row.original.type);
          },
          meta: {
            filter: {
              type: "tags",
              label: "Filtrer par catégorie",
              labelToutesLesOptions: "Tous",
              getOptions: () => ["objectif", "critere"],
              getOptionLabel: (value: TableauEvaluationRow["type"]) =>
                CATEGORIES[value].label,
              onChange: (newValue, table) => {
                if (newValue === "critere") return;

                table.getColumn(COLONNES.CRITERE_ID)?.setFilterValue([]);
              },
            },
          },
        }),
        columnHelper.display({
          header: "Évaluation",
          cell: CelluleEvaluation,
          enableGrouping: false,
          enableColumnFilter: false,
        }),
        columnHelper.accessor(
          (row) => (row.type === "critere" ? row.id : null),
          {
            id: COLONNES.CRITERE_ID,
            header: "Critere",
            enableColumnFilter: true,
            filterFn: "arrHas",
            meta: {
              filter: {
                type: "checkboxes",
                label: "Filtrer par axe",
                getOptions: getColumnFacetedUniqueValues,
                getOptionLabel: (value) => getCritere(value)?.libelle ?? value,
                hidden: (table) => {
                  const colonne = table.getColumn(COLONNES.CATEGORIE);
                  if (!colonne) return true;
                  return (
                    toStringArray(colonne.getFilterValue())[0] !== "critere"
                  );
                },
              },
              grouping: {
                label: "Critère",
              },
            },
            getGroupingValue: (row) => (row.type === "critere" ? row.id : null),
          },
        ),
      ]),
    [rattachements, getCritere],
  );
};

const useColumnFilters = () => {
  const [filters, setFilters] = useQueryStates(
    {
      territoire: parseAsArrayOf(parseAsString).withDefault([]),
      critere: parseAsArrayOf(parseAsString).withDefault([]),
      traite: parseAsArrayOf(parseAsString).withDefault([]),
      categorie: parseAsArrayOf(parseAsString).withDefault([]),
      phase: parseAsArrayOf(parseAsString).withDefault([]),
    },
    {
      shallow: true,
      clearOnDefault: true,
      history: "replace",
    },
  );
  const columnFilters = useMemo(() => {
    const columnFiltersArray = [];
    if (filters.territoire.length > 0) {
      columnFiltersArray.push({
        id: COLONNES.RATTACHEMENT_CODE,
        value: filters.territoire,
      });
    }
    if (filters.critere.length > 0) {
      columnFiltersArray.push({
        id: COLONNES.CRITERE_ID,
        value: filters.critere,
      });
    }
    if (filters.traite.length > 0) {
      columnFiltersArray.push({
        id: COLONNES.STATUT_TRAITEMENT,
        value: filters.traite,
      });
    }
    if (filters.categorie.length > 0) {
      columnFiltersArray.push({
        id: COLONNES.CATEGORIE,
        value: filters.categorie,
      });
    }
    if (filters.phase.length > 0) {
      columnFiltersArray.push({
        id: COLONNES.PHASE,
        value: filters.phase,
      });
    }
    return columnFiltersArray;
  }, [filters]);

  return [columnFilters, setFilters] as const;
};

export const useTableauEvaluation = ({
  rattachements,
}: {
  rattachements: Rattachement[];
}) => {
  const data = useTableData(rattachements);
  const columns = useTableColumns(rattachements);
  const [columnFilters, setFilters] = useColumnFilters();

  const table = useTable({
    features: featuresTableauEvaluation,
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === "function" ? updater(columnFilters) : updater;

      const territoireFilterValue = newFilters.find(
        (filter) => filter.id === COLONNES.RATTACHEMENT_CODE,
      )?.value;
      const critereFilterValue = newFilters.find(
        (filter) => filter.id === COLONNES.CRITERE_ID,
      )?.value;
      const traiteFilterValue = newFilters.find(
        (filter) => filter.id === COLONNES.STATUT_TRAITEMENT,
      )?.value;
      const categorieFilterValue = newFilters.find(
        (filter) => filter.id === COLONNES.CATEGORIE,
      )?.value;
      const phaseFilterValue = newFilters.find(
        (filter) => filter.id === COLONNES.PHASE,
      )?.value;

      void setFilters({
        territoire: toStringArray(territoireFilterValue),
        critere: toStringArray(critereFilterValue),
        traite: toStringArray(traiteFilterValue),
        categorie: toStringArray(categorieFilterValue),
        phase: toStringArray(phaseFilterValue),
      });
    },
    initialState: {
      expanded: true,
      columnVisibility: {
        [COLONNES.PHASE]: false,
        [COLONNES.CRITERE_ID]: false,
        [COLONNES.STATUT_TRAITEMENT]: false,
        [COLONNES.CATEGORIE]: false,
      },
    },
  });

  return { table };
};
