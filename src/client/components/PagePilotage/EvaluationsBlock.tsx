import React from "react";
import { Row } from "@tanstack/react-table";
import { $Enums } from "@prisma/client";
import {
  ETAPES,
  FicheEvaluationRow,
  getInformationsAffichageCellule,
} from "@/components/PagePilotage/useTableauPilotage";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/client/components/_commons/Icone";
import { TodoIcon } from "@/client/components/_commons/Icones/TodoIcon";
import { Tooltip } from "@/client/components/shared/Tooltip";

export function EvaluationsBlock<T extends { id: string | number }>({
  items,
  rowGroup,
  getEvaluation,
  getNomObjectif,
  isObjectif,
  getMoyenne,
}: {
  isObjectif?: boolean;
  items: T[];
  rowGroup: Row<FicheEvaluationRow>;
  getEvaluation(options: {
    item: T;
    row: Row<FicheEvaluationRow>;
    etape: $Enums.etape_evaluation_enum;
  }): number | null;
  getNomObjectif?(options: { item: T; row: Row<FicheEvaluationRow> }): string;
  getMoyenne(options: {
    row: Row<FicheEvaluationRow>;
    etape: $Enums.etape_evaluation_enum;
  }): number | null;
}) {
  return (
    <div
      className="grid gap-0 grid-cols-subgrid border-l border-t !border-black"
      style={{ gridColumn: `span ${items.length + 1}` }}
    >
      {rowGroup.subRows.map((row) => {
        const fiche = row.original;
        return (
          <React.Fragment key={row.id}>
            {items.map((item) => (
              <div
                className={clsxm("grid border-b !border-black border-r", {
                  "grid-cols-[30px_1fr_1fr_1fr]": isObjectif,
                  "grid-cols-3": !isObjectif,
                })}
                key={item.id}
              >
                {isObjectif ? (
                  <div className="flex justify-center items-center !border-r">
                    <Tooltip.Root>
                      <Tooltip.Trigger className="!px-0">
                        <Icone className="h-4 w-4" icone={TodoIcon} />
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        {getNomObjectif?.({ item, row })}
                      </Tooltip.Content>
                    </Tooltip.Root>
                  </div>
                ) : null}
                {ETAPES.map((etape) => {
                  const evaluation = getEvaluation({
                    item,
                    row,
                    etape: etape.key,
                  });

                  const { isAfterPhase, shouldShowBlueText, shouldShowDash } =
                    getInformationsAffichageCellule(fiche, evaluation, etape);

                  return (
                    <div
                      className={clsxm(
                        "flex items-center justify-center text-center whitespace-nowrap",
                        {
                          "bg-dsfr-contrast-grey": isAfterPhase,
                          "text-dsfr-info-main-525": shouldShowBlueText,
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
            <div className="grid grid-cols-3 border-b !border-black border-r">
              {ETAPES.map((etape) => {
                const moyenne = getMoyenne({ row, etape: etape.key });
                const { isAfterPhase, shouldShowBlueText, shouldShowDash } =
                  getInformationsAffichageCellule(fiche, moyenne, etape);

                return (
                  <div
                    className={clsxm(
                      "flex items-center justify-center text-center font-bold whitespace-nowrap",
                      {
                        "bg-dsfr-contrast-grey": isAfterPhase,
                        "text-dsfr-info-main-525": shouldShowBlueText,
                      },
                    )}
                    key={etape.key}
                  >
                    {shouldShowDash ? "–" : moyenne}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
