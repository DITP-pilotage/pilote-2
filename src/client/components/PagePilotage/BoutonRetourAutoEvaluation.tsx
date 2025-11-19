import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useRetournerAutoEvaluation } from "./useRetournerAutoEvaluation";

export const BoutonRetourAutoEvaluation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const retournerAutoEvaluation = useRetournerAutoEvaluation();

  const handleRetournerAutoEvaluation = async () => {
    await retournerAutoEvaluation(fichesSelectionneesIds);
  };

  return (
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Retour en auto-évaluation"
      onClick={handleRetournerAutoEvaluation}
      variant="secondary"
    />
  );
};
