import { Icone } from "@/components/_commons/Icone";
import { Success1Icon } from "@/components/_commons/Icones/Success1Icon";
import { useRetournerAppreciation } from "./useRetournerAppreciation";
import { TextLink } from "@/components/shared/TextLink";

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
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button
        disabled={disabled}
        onClick={handleRetournerAppreciation}
        type="button"
      >
        <Icone className="inline h-3 w-3" icone={Success1Icon} />
        retour en appréciation
      </button>
    </TextLink>
  );
};
