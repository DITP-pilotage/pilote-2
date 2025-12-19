import { Fragment } from "react";
import { $Enums } from "@prisma/client";
import { Row } from "@tanstack/react-table";
import {
  ETAPES,
  FicheEvaluationRow,
  useTableauPilotage,
} from "@/components/PagePilotage/useTableauPilotage";
import { clsxm } from "@/utils/clsxm";
import { useObjectifsCount } from "@/components/PagePilotage/useObjectifsCount";
import { TableauPilotageHeader } from "@/components/PagePilotage/TableauPilotageHeader";
import { EnteteGroupeRattachement } from "@/components/PagePilotage/EnteteGroupeRattachement";

function EvaluationsBlock<T>({
  items,
  rowGroup,
  getEvaluation,
}: {
  items: T[];
  rowGroup: Row<FicheEvaluationRow>;
  getEvaluation(options: {
    item: T;
    row: Row<FicheEvaluationRow>;
    etape: $Enums.etape_evaluation_enum;
  }): number | null;
}) {
  return (
    <div
      className="grid gap-0 grid-cols-subgrid border-l border-t !border-black"
      style={{ gridColumn: `span ${items.length}` }}
    >
      {items.map((item) => {
        return (
          <>
            {rowGroup.subRows.map((row) => {
              const fiche = row.original;
              return (
                <div
                  className="grid grid-cols-3 border-b !border-black border-r"
                  key={fiche.id}
                >
                  {ETAPES.map((etape) => {
                    const evaluation = getEvaluation({
                      item,
                      row,
                      etape: etape.key,
                    });

                    return (
                      <div
                        className={clsxm(
                          "flex items-center justify-center text-center whitespace-nowrap",
                          { "bg-dsfr-grey-925": evaluation == null },
                        )}
                        key={etape.key}
                      >
                        {evaluation ?? " "}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        );
      })}
    </div>
  );
}

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds, criteres } = useTableauPilotage();
  const maxObjectifs = useObjectifsCount();

  const gridTemplateColumns = [
    "380px",
    ...Array(criteres.length)
      .fill(0)
      .map(() => "170px"),
    ...Array(maxObjectifs)
      .fill(0)
      .map(() => "170px"),
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <div
          className="w-full grid gap-x-4"
          style={{
            gridTemplateColumns: gridTemplateColumns.join(" "),
          }}
        >
          <TableauPilotageHeader
            columnsCount={gridTemplateColumns.length}
            fichesSelectionneesIds={fichesSelectionneesIds}
            table={table}
          />

          {table.getRowModel().rows.map((rowGroup) => (
            <Fragment key={rowGroup.id}>
              <EnteteGroupeRattachement
                columnCount={gridTemplateColumns.length}
                rowGroup={rowGroup}
              />

              <EvaluationsBlock
                getEvaluation={({ row, item, etape }) => {
                  return row.original.evaluationsParCritereEtEtape[item.id]?.[
                    etape
                  ];
                }}
                items={criteres}
                rowGroup={rowGroup}
              />

              <EvaluationsBlock
                getEvaluation={({ row, item, etape }) => {
                  const objectif = row.original.objectifs[item.index];
                  return objectif?.evaluations[etape];
                }}
                items={Array.from({ length: maxObjectifs }).map((_, index) => ({
                  index,
                }))}
                rowGroup={rowGroup}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
