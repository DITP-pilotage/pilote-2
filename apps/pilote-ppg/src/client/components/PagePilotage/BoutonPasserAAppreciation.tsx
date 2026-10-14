import { usePasserALaConsolidation } from "@/components/PagePilotage/usePasserALaConsolidation";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { TextLink } from "@/components/shared/TextLink";

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
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button
        disabled={disabled}
        onClick={handlePasserALaConsolidation}
        type="button"
      >
        <Icone className="inline h-3 w-3" icone={SuccessIcon} />
        passer en appréciation
      </button>
    </TextLink>
  );
};
