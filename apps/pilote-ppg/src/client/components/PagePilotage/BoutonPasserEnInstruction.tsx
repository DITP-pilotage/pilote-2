import { usePasserALEtapeInstruction } from "@/components/PagePilotage/usePasserALEtapeInstruction";
import { Icone } from "@/components/_commons/Icone";
import { DraftPleineIcon } from "@/components/_commons/Icones/DraftPleineIcon";
import { TextLink } from "@/components/shared/TextLink";

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
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button
        disabled={disabled}
        onClick={handlePasserEnInstruction}
        type="button"
      >
        <Icone className="inline h-3 w-3" icone={DraftPleineIcon} />
        passer en instruction
      </button>
    </TextLink>
  );
};
