import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { usePasserALEtapeInstruction } from "@/components/PagePilotage/usePasserALEtapeInstruction";

export const BoutonPasserEnInstruction = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const passerALEtapeInstruction = usePasserALEtapeInstruction();

  const handlePasserEnInstruction = async () => {
    await passerALEtapeInstruction(fichesSelectionneesIds);
  };

  return (
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Passer en instruction"
      onClick={handlePasserEnInstruction}
      variant="secondary"
    />
  );
};
