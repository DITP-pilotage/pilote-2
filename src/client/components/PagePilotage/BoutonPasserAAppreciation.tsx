import { usePasserALaConsolidation } from "@/components/PagePilotage/usePasserALaConsolidation";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";

export const BoutonPasserAAppreciation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const passerALaConsolidation = usePasserALaConsolidation();

  const handlePasserALaConsolidation = async () => {
    await passerALaConsolidation(fichesSelectionneesIds);
  };

  return (
    <button
      className="fr-link text-left !text-xs !flex items-center gap-1"
      disabled={disabled}
      onClick={handlePasserALaConsolidation}
      type="button"
    >
      <Icone className="inline h-3 w-3" icone={SuccessIcon} />
      passer en appréciation
    </button>
  );
};
