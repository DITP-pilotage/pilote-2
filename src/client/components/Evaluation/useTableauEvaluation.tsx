import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import pick from "lodash.pick";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { Rattachement } from "@/server/evaluation/queries/types";
import { CelluleEvaluation } from "@/components/Evaluation/CelluleEvaluation";
import { useGetCritere } from "@/components/Evaluation/CriteresProvider";
import { BadgeEtape } from "@/components/Evaluation/BadgeEtape";

const columnHelper = createColumnHelper<TableauEvaluationRow>();

const STATUTS_EVALUATION = {
  TRAITE: { label: "Traité" },
  NON_TRAITE: { label: "Non traité" },
};

const CATEGORIES = {
  objectif: { label: "Objectifs individuels" },
  critere: { label: "Manière de servir" },
};

type STATUT_EVALUATION = keyof typeof STATUTS_EVALUATION;

const getStatutTraitement = (row: TableauEvaluationRow): STATUT_EVALUATION => {
  return row.evaluations[0]?.dateTraitement != null ? "TRAITE" : "NON_TRAITE";
};

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
  RATTACHEMENT_CODE: "rattachementCode",
  CRITERE_ID: "critereId",
  STATUT_TRAITEMENT: "statutTraitement",
  CATEGORIE: "categorie",
};

const useTableColumns = (rattachements: Rattachement[]) => {
  const getCritere = useGetCritere();
  return useMemo(
    () => [
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
            type: "multi",
            label: "Filtrer par statut",
            labelToutesLesOptions: "Tous",
            getValueLabel: (value: STATUT_EVALUATION) =>
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
            type: "multi",
            label: "Filtrer par territoire",
            labelToutesLesOptions: "Tous les territoires",
            getValueLabel: (value) =>
              rattachements.find((rattachement) => rattachement.code === value)
                ?.libelle ?? value,
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
            type: "multi",
            label: "Filtrer par catégorie",
            labelToutesLesOptions: "Tous",
            getValueLabel: (value: TableauEvaluationRow["type"]) =>
              CATEGORIES[value].label,
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
            type: "multi",
            label: "Filtrer par critère",
            labelToutesLesOptions: "Tous les critères",
            getValueLabel: (value) => getCritere(value)?.libelle ?? value,
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

const useColumnFilters = () => {
  const [filters, setFilters] = useQueryStates(
    {
      territoire: parseAsArrayOf(parseAsString).withDefault([]),
      critere: parseAsArrayOf(parseAsString).withDefault([]),
      traite: parseAsArrayOf(parseAsString).withDefault([]),
      categorie: parseAsArrayOf(parseAsString).withDefault([]),
    },
    {
      shallow: false,
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

      void setFilters({
        territoire:
          Array.isArray(territoireFilterValue) &&
          territoireFilterValue.every((v) => typeof v === "string")
            ? (territoireFilterValue as string[])
            : [],
        critere:
          Array.isArray(critereFilterValue) &&
          critereFilterValue.every((v) => typeof v === "string")
            ? (critereFilterValue as string[])
            : [],
        traite:
          Array.isArray(traiteFilterValue) &&
          traiteFilterValue.every((v) => typeof v === "string")
            ? (traiteFilterValue as string[])
            : [],
        categorie:
          Array.isArray(categorieFilterValue) &&
          categorieFilterValue.every((v) => typeof v === "string")
            ? (categorieFilterValue as string[])
            : [],
      });
    },
    initialState: {
      expanded: true,
      columnVisibility: {
        [COLONNES.CRITERE_ID]: false,
        [COLONNES.STATUT_TRAITEMENT]: false,
        [COLONNES.CATEGORIE]: false,
      },
    },
  });

  return { table };
};
