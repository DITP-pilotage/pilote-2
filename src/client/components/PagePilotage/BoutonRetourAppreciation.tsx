import { Bouton } from "@/components/_commons/Bouton/Bouton";
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
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Retour en appréciation"
      onClick={handleRetournerAppreciation}
      variant="secondary"
    />
  );
};
