import { useMemo } from "react";
import keyBy from "lodash.keyby";
import { $Enums } from "@prisma/client";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { BoutonPasserAAppreciation } from "@/components/PagePilotage/BoutonPasserAAppreciation";
import { BoutonDeverouillerAppreciation } from "@/components/PagePilotage/BoutonDeverouillerAppreciation";
import { BoutonVerrouillerAppreciation } from "@/components/PagePilotage/BoutonVerrouillerAppreciation";
import { BoutonPasserEnInstruction } from "@/components/PagePilotage/BoutonPasserEnInstruction";
import { BoutonVerrouillerInstruction } from "@/components/PagePilotage/BoutonVerrouillerInstruction";
import { BoutonDeverrouillerInstruction } from "@/components/PagePilotage/BoutonDeverrouillerInstruction";
import { BoutonRetourAutoEvaluation } from "@/components/PagePilotage/BoutonRetourAutoEvaluation";
import { BoutonRetourAppreciation } from "@/components/PagePilotage/BoutonRetourAppreciation";

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
    <div className="grid grid-cols-2 gap-1 p-2 sticky left-0 z-2 bg-white">
      <BoutonRetourAutoEvaluation
        disabled={!peutModifierLaConsolidationViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonVerrouillerAppreciation
        disabled={!peutModifierLaConsolidationViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonPasserAAppreciation
        disabled={!peutPasserALaConsolidation}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonDeverouillerAppreciation
        disabled={!peutModifierLaConsolidationViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonRetourAppreciation
        disabled={!peutModifierLInstructionViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonVerrouillerInstruction
        disabled={!peutModifierLInstructionViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonPasserEnInstruction
        disabled={!peutModifierLaConsolidationViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <BoutonDeverrouillerInstruction
        disabled={!peutModifierLInstructionViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
    </div>
  );
};
