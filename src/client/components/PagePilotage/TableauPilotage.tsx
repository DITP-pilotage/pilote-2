import { Fragment } from "react";
import { useTableauPilotage } from "@/components/PagePilotage/useTableauPilotage";
import { useObjectifsCount } from "@/components/PagePilotage/useObjectifsCount";
import { TableauPilotageHeader } from "@/components/PagePilotage/TableauPilotageHeader";
import { EnteteGroupeRattachement } from "@/components/PagePilotage/EnteteGroupeRattachement";
import { EvaluationsBlock } from "@/components/PagePilotage/EvaluationsBlock";
import { clsxm } from "@/utils/clsxm";

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds, criteres } = useTableauPilotage();
  const maxObjectifs = useObjectifsCount();

  const gridTemplateColumns = [
    "380px",
    "170px",
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

              <div
                className="grid grid-cols-subgrid border-t border-l border-r !border-black"
                style={{ gridColumn: "span 1" }}
              >
                {rowGroup.subRows.map((row) => {
                  const noteObjectifsCollectifs =
                    row.original.noteObjectifsCollectifs;
                  return (
                    <div
                      className={clsxm(
                        "border-b !border-black flex items-center justify-center font-bold",
                        {
                          "bg-[#EEEEEE]": noteObjectifsCollectifs == null,
                        },
                      )}
                      key={row.id}
                    >
                      {noteObjectifsCollectifs ?? "–"}
                    </div>
                  );
                })}
              </div>

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
