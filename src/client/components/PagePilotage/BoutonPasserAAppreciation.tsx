import { usePasserALaConsolidation } from "@/components/PagePilotage/usePasserALaConsolidation";

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
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handlePasserALaConsolidation}
      type="button"
    >
      passer en appréciation
    </button>
  );
};
