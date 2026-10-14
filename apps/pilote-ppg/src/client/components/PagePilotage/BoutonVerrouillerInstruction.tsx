import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { TextLink } from "@/components/shared/TextLink";

export const BoutonVerrouillerInstruction = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const { modifierEtat } = useModifierEtatFichesInstruction();

  const handleBloquerFiches = async () => {
    await modifierEtat(fichesSelectionneesIds, true);
  };

  return (
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button disabled={disabled} onClick={handleBloquerFiches} type="button">
        <Icone className="inline h-3 w-3" icone={LockIcon} />
        verrouiller l'instruction
      </button>
    </TextLink>
  );
};
