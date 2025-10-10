import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Controller } from "react-hook-form";
import { useMemo } from "react";
import { useFormulaireConsolidation } from "@/components/PageConsolidation/form";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";

const SelecteurStatutEvaluation = ({ name }: { name: any }) => {
  const form = useFormulaireConsolidation();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <div className="p-1 !bg-dsfr-alt-blue-france rounded gap-1 flex">
          <button
            className={clsxm("w-1/2 p-2 rounded", {
              "!bg-error !text-white bold": field.value === "A_VERIFIER",
              "!bg-transparent !text-black": field.value !== "A_VERIFIER",
            })}
            onClick={() => field.onChange("A_VERIFIER")}
            type="button"
          >
            A vérifier
          </button>
          <button
            className={clsxm("w-1/2 p-2 rounded", {
              "!bg-success !text-white bold": field.value === "VERIFIE",
              "!bg-transparent !text-black": field.value !== "VERIFIE",
            })}
            onClick={() => field.onChange("VERIFIE")}
            type="button"
          >
            Vérifié
          </button>
        </div>
      )}
    />
  );
};

export function InputNote({ name }: { name: any }) {
  const form = useFormulaireConsolidation();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col">
          <div
            className={clsxm(
              "border !rounded-md !bg-white flex items-stretch overflow-hidden",
              "focus-within:outline-2 focus-within:outline-dsfr-info-main-525 focus-within:outline-offset-2",
              {
                "!border-error text-error": !!fieldState.error,
              },
            )}
          >
            <input
              className={clsxm(
                "focus:!outline-none w-[6ch] text-right px-4 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                {
                  "!border-dsfr-error-425": fieldState.error != null,
                },
              )}
              type="number"
              {...field}
              onChange={(e) => {
                const value = e.target.valueAsNumber;
                field.onChange(Number.isNaN(value) ? null : value);
              }}
              value={field.value?.toString() ?? ""}
            />
            <span
              className={clsxm(
                "px-2 flex items-center font-semibold text-sm py-2 border-l border-gray-200 bg-gray-50",
                {
                  "!border-error/30 !bg-error/5": !!fieldState.error,
                },
              )}
            >
              %
            </span>
          </div>
          <div className="relative h-3 mt-1">
            {fieldState.error ? (
              <MessageErreur className="absolute right-0">
                {fieldState.error.message}
              </MessageErreur>
            ) : null}
          </div>
        </div>
      )}
    />
  );
}

const CommentaireTextarea = ({ name }: { name: any }) => {
  const form = useFormulaireConsolidation();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldId = `${name}.commentaire`;
        return (
          <div className="flex flex-col gap-1 max-w-lg">
            <label
              className={clsxm("font-bold text-sm", {
                "text-error": !!fieldState.error,
              })}
              htmlFor={fieldId}
            >
              Commentaire
            </label>
            <textarea
              className={clsxm(
                "border !rounded-md !bg-white py-2 px-4 field-sizing-content",
                {
                  "!border-error": !!fieldState.error,
                },
              )}
              id={fieldId}
              {...field}
              ref={(node) => {
                node?.focus();
                field.ref(node);
              }}
            />
            <div className="flex justify-between mt-1">
              {fieldState.error ? (
                <MessageErreur>{fieldState.error.message}</MessageErreur>
              ) : null}

              <span className="text-xs ml-auto">
                {field.value.length} / 600
              </span>
            </div>
          </div>
        );
      }}
    />
  );
};

type TableauConsolidationRow =
  | {
      type: "sous-critere";
      id: string;
      libelle: string;
      critere: {
        id: string;
        libelle: string;
      };
      rattachement: {
        code: string;
        libelle: string;
      };
      evaluation: {
        id: string;
        note: number | null;
        commentaire: string;
      };
    }
  | {
      type: "objectif";
      id: string;
      libelle: string;
      rattachement: {
        code: string;
        libelle: string;
      };
      evaluation: {
        id: string;
        note: number | null;
        commentaire: string;
      };
    };

const columnHelper = createColumnHelper<TableauConsolidationRow>();

const columns = [
  columnHelper.accessor("rattachement.code", {
    id: "rattachementCode",
    header: "Rattachement",
    cell: (info) => {
      if (info.row.getIsGrouped() || info.row.original.type === "objectif") {
        return (
          <span className="text-primary font-semibold">
            {info.row.original.rattachement.libelle}
          </span>
        );
      }

      return "";
    },
    getGroupingValue: (row) => row.rattachement.code,
  }),
  columnHelper.accessor("critere.id", {
    id: "critereId",
    header: "Libellé",
    cell: (info) => {
      const row = info.row;
      if (row.getIsGrouped()) {
        if (row.original.type === "sous-critere") {
          return (
            <span className="font-bold text-primary">
              {row.original.critere.libelle}
            </span>
          );
        }
        return null;
      }

      const name =
        info.row.original.type === "objectif"
          ? (`objectifs.${info.row.original.id}.commentaire` as const)
          : (`sousCriteres.${info.row.original.id}.commentaire` as const);

      return (
        <div>
          <div>{row.original.libelle}</div>
          <CommentaireTextarea name={name} />
        </div>
      );
    },
    getGroupingValue: (row) =>
      row.type === "sous-critere" ? row.critere.id : null,
  }),
  columnHelper.display({
    id: "note",
    header: "Note",
    cell: (info) => {
      if (info.row.getIsGrouped()) {
        return null;
      }
      const name =
        info.row.original.type === "objectif"
          ? (`objectifs.${info.row.original.id}.note` as const)
          : (`sousCriteres.${info.row.original.id}.note` as const);

      return (
        <div className="flex justify-end">
          <InputNote name={name} />
        </div>
      );
    },
    enableGrouping: false,
  }),
  columnHelper.display({
    id: "statut",
    header: "Statut",
    cell: (info) => {
      if (info.row.getIsGrouped()) {
        return "";
      }
      const name =
        info.row.original.type === "objectif"
          ? (`objectifs.${info.row.original.id}.statut_evaluation` as const)
          : (`sousCriteres.${info.row.original.id}.statut_evaluation` as const);

      return <SelecteurStatutEvaluation name={name} />;
    },
    enableGrouping: false,
  }),
];
const grouping = ["rattachementCode", "critereId"];

export function useTableauConsolidation(rattachements: ConsolidationData) {
  const data = useMemo<TableauConsolidationRow[]>(() => {
    const rows: TableauConsolidationRow[] = [];

    rattachements.forEach((rattachement) => {
      rattachement.sousCriteres.forEach((sousCritere) => {
        rows.push({
          id: sousCritere.id,
          type: "sous-critere",
          rattachement,
          critere: sousCritere.critere,
          libelle: sousCritere.libelle,
          evaluation: sousCritere.evaluation,
        });
      });

      rattachement.objectifs.forEach((objectif) => {
        rows.push({
          id: objectif.id,
          type: "objectif",
          rattachement,
          libelle: objectif.libelle,
          evaluation: objectif.evaluation,
        });
      });
    });

    return rows;
  }, [rattachements]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    state: { grouping },
    initialState: {
      expanded: true, // Expand all groups by default
    },
  });

  return { table };
}
