import {
  Column,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import pick from "lodash.pick";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { $Enums } from "@prisma/client";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { Rattachement } from "@/server/evaluation/queries/types";
import { CelluleEvaluation } from "@/components/Evaluation/CelluleEvaluation";
import { useGetCritere } from "@/components/Evaluation/CriteresProvider";
import { BadgeEtape } from "@/components/Evaluation/BadgeEtape";

const columnHelper = createColumnHelper<TableauEvaluationRow>();

const PHASES_EVALUATION = {
  [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: { label: "Auto-évalution" },
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

const getColumnFacetedUniqueValues = (column: Column<any>): string[] =>
  [...column.getFacetedUniqueValues().keys()].filter(Boolean);

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
    () => [
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
              $Enums.etape_evaluation_enum.AUTO_EVALUATION,
              $Enums.etape_evaluation_enum.CONSOLIDATION,
              $Enums.etape_evaluation_enum.INSTRUCTION,
            ],
            getOptionLabel: (value: $Enums.etape_evaluation_enum) =>
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
        filterFn: "arrIncludesSome",
        meta: {
          filter: {
            type: "multiselect",
            label: "Filtrer par territoire",
            getPlaceholder: (values) =>
              `${values.length} territoire(s) sélectionné(s)`,
            getOptionLabel: (value) =>
              rattachements.find((rattachement) => rattachement.code === value)
                ?.libelle ?? value,
            getOptionGroups: (
              column: Column<TableauEvaluationRow["rattachement"]>,
            ) => {
              const values = getColumnFacetedUniqueValues(column);
              return [
                {
                  label: "Régions",
                  options: values.filter((value) => value.startsWith("REG-")),
                },
                {
                  label: "Départements",
                  options: values.filter((value) => value.startsWith("DEPT-")),
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
            onChange: (
              newValue: string | null,
              table: Table<TableauEvaluationRow>,
            ) => {
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
      columnHelper.accessor((row) => (row.type === "critere" ? row.id : null), {
        id: COLONNES.CRITERE_ID,
        header: "Critere",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        meta: {
          filter: {
            type: "checkboxes",
            label: "Filtrer par axe",
            getOptions: getColumnFacetedUniqueValues,
            getOptionLabel: (value) => getCritere(value)?.libelle ?? value,
          },
          grouping: {
            label: "Critère",
          },
        },
        getGroupingValue: (row) => (row.type === "critere" ? row.id : null),
      }),
    ],
    [rattachements, getCritere],
  );
};

const toStringArray = (value: unknown): string[] => {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? (value as string[])
    : [];
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
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
