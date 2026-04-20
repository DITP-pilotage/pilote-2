import { usePasserALEtapeInstruction } from "@/components/PagePilotage/usePasserALEtapeInstruction";
import { Icone } from "@/components/_commons/Icone";
import { DraftPleineIcon } from "@/components/_commons/Icones/DraftPleineIcon";

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
      className="fr-link text-left !text-xs !flex items-center gap-1"
      disabled={disabled}
      onClick={handlePasserEnInstruction}
      type="button"
    >
      <Icone className="inline h-3 w-3" icone={DraftPleineIcon} />
      passer en instruction
    </button>
  );
};
