import { Row } from "@tanstack/react-table";
import { $Enums } from "@prisma/client";
import {
  ETAPES,
  FicheEvaluationRow,
} from "@/components/PagePilotage/useTableauPilotage";
import { clsxm } from "@/utils/clsxm";

export function EvaluationsBlock<T>({
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
      {items.map((item) => (
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
      ))}
    </div>
  );
}
