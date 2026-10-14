import { Icone } from "@/components/_commons/Icone";
import { QuillPenIcon } from "@/components/_commons/Icones/QuillPenIcon";
import { useRetournerAutoEvaluation } from "./useRetournerAutoEvaluation";
import { TextLink } from "@/components/shared/TextLink";

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
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button
        disabled={disabled}
        onClick={handleRetournerAutoEvaluation}
        type="button"
      >
        <Icone className="inline h-3 w-3" icone={QuillPenIcon} />
        retour en auto-évaluation
      </button>
    </TextLink>
  );
};
