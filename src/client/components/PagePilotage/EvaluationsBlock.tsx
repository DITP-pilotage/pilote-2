import { Row } from "@tanstack/react-table";
import { $Enums } from "@prisma/client";
import {
  ETAPES,
  FicheEvaluationRow,
  getPhaseStatus,
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
      {rowGroup.subRows.map((row) => {
        const fiche = row.original;
        return (
          <>
            {items.map((item) => (
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

                  const phaseStatus = getPhaseStatus(
                    etape.key,
                    fiche.etapeCourante,
                  );

                  const isAfterPhase = phaseStatus === "after";
                  const isBeforePhase = phaseStatus === "before";
                  const isCurrentPhase = phaseStatus === "current";
                  const isReadOnly = fiche.readOnly;

                  const shouldShowBlueText =
                    isBeforePhase || (isCurrentPhase && isReadOnly);
                  const shouldShowDash =
                    evaluation == null ||
                    (etape.key === "AUTO_EVALUATION" &&
                      isCurrentPhase &&
                      !isReadOnly);

                  return (
                    <div
                      className={clsxm(
                        "flex items-center justify-center text-center whitespace-nowrap",
                        {
                          "bg-[#EEEEEE]": isAfterPhase,
                          "text-[#0078F3]": shouldShowBlueText,
                        },
                      )}
                      key={etape.key}
                    >
                      {shouldShowDash ? "–" : evaluation}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        );
      })}
    </div>
  );
}
