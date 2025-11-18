import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { usePasserALaConsolidation } from "@/components/PagePilotage/usePasserALaConsolidation";

export const BoutonPasserALaConsolidation = ({
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
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Passer en consolidation"
      onClick={handlePasserALaConsolidation}
      variant="secondary"
    />
  );
};
