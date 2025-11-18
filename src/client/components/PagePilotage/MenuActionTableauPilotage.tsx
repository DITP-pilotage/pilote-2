import { useMemo } from "react";
import keyBy from "lodash.keyby";
import { $Enums } from "@prisma/client";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { BoutonPasserALaConsolidation } from "@/components/PagePilotage/BoutonPasserALaConsolidation";
import { BoutonDebloquerLaConsolidation } from "@/components/PagePilotage/BoutonDebloquerLaConsolidation";
import { BoutonBloquerLaConsolidation } from "@/components/PagePilotage/BoutonBloquerLaConsolidation";
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

  const peutPasserALaConsolidation = toutesFichesEnEtape(
    $Enums.etape_evaluation_enum.AUTO_EVALUATION,
  );

  const peutModifierLaConsolidationViaPilotage = toutesFichesEnEtape(
    $Enums.etape_evaluation_enum.CONSOLIDATION,
  );

  const peutModifierLInstructionViaPilotage = toutesFichesEnEtape(
    $Enums.etape_evaluation_enum.INSTRUCTION,
  );

  return (
    <div className="flex flex-col gap-3 px-3 py-2 rounded border border-gray-200">
      <p className="!text-sm font-semibold !mb-0">
        {selectedCount} ligne{selectedCount > 1 ? "s" : ""} sélectionné
        {selectedCount > 1 ? "s" : ""}
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <BoutonPasserALaConsolidation
            disabled={!peutPasserALaConsolidation}
            fichesSelectionneesIds={fichesSelectionneesIds}
          />
          <BoutonDebloquerLaConsolidation
            disabled={!peutModifierLaConsolidationViaPilotage}
            fichesSelectionneesIds={fichesSelectionneesIds}
          />
          <BoutonBloquerLaConsolidation
            disabled={!peutModifierLaConsolidationViaPilotage}
            fichesSelectionneesIds={fichesSelectionneesIds}
          />
        </div>
        <div className="flex gap-2">
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
      </div>
    </div>
  );
};
