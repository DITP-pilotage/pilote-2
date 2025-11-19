import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import pick from "lodash.pick";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";
import { Rattachement } from "@/server/evaluation/queries/types";
import { CelluleEvaluation } from "@/components/Evaluation/CelluleEvaluation";
import { useGetCritere } from "@/components/Evaluation/CriteresProvider";

const columnHelper = createColumnHelper<TableauEvaluationRow>();

const STATUTS_EVALUATION = {
  TRAITE: { label: "Traité" },
  NON_TRAITE: { label: "Non traité" },
};

type STATUT_EVALUATION = keyof typeof STATUTS_EVALUATION;

const getStatutTraitement = (row: TableauEvaluationRow): STATUT_EVALUATION => {
  return row.evaluations[0]?.dateTraitement != null ? "TRAITE" : "NON_TRAITE";
};

export const useTableauEvaluation = ({
  rattachements,
  onAutosave,
}: {
  rattachements: Rattachement[];
  onAutosave: () => void;
}) => {
  const getCritere = useGetCritere();
  const [grouping, setGrouping] = useState<string[]>(["rattachementCode"]);
  const data = useMemo<TableauEvaluationRow[]>(() => {
    const rows: TableauEvaluationRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.criteres.forEach((critere) => {
        rows.push({
          type: "critere",
          ficheEvaluationId: rattachement.ficheEvaluationId,
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
  const columns = useMemo(
    () => [
      columnHelper.accessor("rattachement.code", {
        id: "rattachementCode",
        header: "Rattachement",
        cell: (info) => {
          return (
            <span className="text-primary font-semibold">
              {info.row.original.rattachement.libelle}
            </span>
          );
        },
        filterFn: "arrIncludesSome",
        meta: {
          filter: {
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
      columnHelper.accessor("id", {
        id: "id",
        header: "Évaluation",
        cell: ({ table, row }) => {
          const currentGrouping = table.getState().grouping[0];
          return (
            <CelluleEvaluation
              currentGrouping={currentGrouping}
              ligne={row.original}
              onAutosave={onAutosave}
            />
          );
        },
        enableGrouping: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => (row.type === "critere" ? row.id : null), {
        id: "critereId",
        header: "Critere",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        meta: {
          filter: {
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
      columnHelper.accessor(getStatutTraitement, {
        id: "traite",
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
            label: "Filtrer par statut",
            labelToutesLesOptions: "Tous",
            getValueLabel: (value: STATUT_EVALUATION) =>
              STATUTS_EVALUATION[value].label,
          },
        },
      }),
    ],
    [rattachements, onAutosave, getCritere],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: { grouping },
    onGroupingChange: setGrouping,
    initialState: {
      expanded: true,
      columnVisibility: {
        critereId: false,
        traite: false,
      },
    },
  });

  return { table };
};
