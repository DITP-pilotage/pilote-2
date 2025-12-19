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
    <button
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handlePasserEnInstruction}
      type="button"
    >
      passer en instruction
    </button>
  );
};
