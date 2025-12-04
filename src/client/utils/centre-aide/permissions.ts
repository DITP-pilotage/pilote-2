import { $Enums } from "@prisma/client";

export function estAutoriséACentreAideEval(
  applicationsAccessibles: $Enums.application_accessible[],
): boolean {
  return (
    applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    ) ||
    applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  );
}
