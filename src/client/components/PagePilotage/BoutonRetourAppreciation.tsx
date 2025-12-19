import { useRetournerAppreciation } from "./useRetournerAppreciation";

export const BoutonRetourAppreciation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const retournerAppreciation = useRetournerAppreciation();

  const handleRetournerAppreciation = async () => {
    await retournerAppreciation(fichesSelectionneesIds);
  };

  return (
    <button
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handleRetournerAppreciation}
      type="button"
    >
      retour en appréciation
    </button>
  );
};
