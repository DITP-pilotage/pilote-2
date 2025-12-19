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
    <button
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handleRetournerAutoEvaluation}
      type="button"
    >
      retour en auto-évaluation
    </button>
  );
};
