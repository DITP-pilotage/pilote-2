import { useMemo } from "react";
import keyBy from "lodash.keyby";
import { $Enums } from "@prisma/client";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { BoutonDebloquerLaConsolidation } from "@/components/PagePilotage/BoutonDebloquerLaConsolidation";
import { BoutonPasserEnInstruction } from "@/components/PagePilotage/BoutonPasserEnInstruction";
import { BoutonBloquerInstruction } from "@/components/PagePilotage/BoutonBloquerInstruction";
import { BoutonDebloquerInstruction } from "@/components/PagePilotage/BoutonDebloquerInstruction";

export const MenuActionTableauPilotage = ({
  fichesSelectionneesIds,
}: {
  fichesSelectionneesIds: string[];
}) => {
  const { pilotage } = pagePilotage.useServerSidePropsContext();
  const fiches = useMemo(
    () => keyBy(pilotage.fichesEvaluation, (fiche) => fiche.id),
    [pilotage.fichesEvaluation],
  );
  const selectedCount = fichesSelectionneesIds.length;
  const fichesSelectionnees = fichesSelectionneesIds.map((id) => fiches[id]);

  const toutesFichesEnEtape = (etape: $Enums.etape_evaluation_enum) =>
    fichesSelectionnees.every((fiche) => fiche.etapeCourante === etape) &&
    selectedCount > 0;

  const peutModifierLaConsolidationViaPilotage = toutesFichesEnEtape(
    $Enums.etape_evaluation_enum.CONSOLIDATION,
  );

  const peutModifierLInstructionViaPilotage = toutesFichesEnEtape(
    $Enums.etape_evaluation_enum.INSTRUCTION,
  );

  return (
    <div className="flex items-center gap-4 px-3 py-2 rounded border border-gray-200">
      <p className="!text-sm font-semibold !mb-0">
        {selectedCount} ligne{selectedCount > 1 ? "s" : ""} sélectionné
        {selectedCount > 1 ? "s" : ""}
      </p>
      <BoutonDebloquerLaConsolidation
        disabled={!peutModifierLaConsolidationViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonPasserEnInstruction
        disabled={!peutModifierLaConsolidationViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonBloquerInstruction
        disabled={!peutModifierLInstructionViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonDebloquerInstruction
        disabled={!peutModifierLInstructionViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
    </div>
  );
};
