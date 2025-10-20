import { useMemo } from "react";
import keyBy from "lodash.keyby";
import { $Enums } from "@prisma/client";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { BoutonDebloquerLaConsolidation } from "@/components/PagePilotage/BoutonDebloquerLaConsolidation";

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

  const peutModifierLEtapeViaPilotage = toutesFichesEnEtape(
    $Enums.etape_evaluation_enum.CONSOLIDATION,
  );

  return (
    <div className="flex items-center gap-4 px-3 py-2 rounded border border-gray-200">
      <p className="!text-sm font-semibold !mb-0">
        {selectedCount} ligne{selectedCount > 1 ? "s" : ""} sélectionné
        {selectedCount > 1 ? "s" : ""}
      </p>
      <BoutonDebloquerLaConsolidation
        disabled={!peutModifierLEtapeViaPilotage}
        fichesSelectionneesIds={fichesSelectionneesIds}
      />
      <Bouton
        disabled={!peutModifierLEtapeViaPilotage}
        label="Passer en instruction"
        variant="secondary"
      />
    </div>
  );
};
