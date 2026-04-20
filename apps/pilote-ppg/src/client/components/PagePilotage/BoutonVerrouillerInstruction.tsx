import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";

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
    <button
      className="fr-link text-left !text-xs !flex items-center gap-1"
      disabled={disabled}
      onClick={handleBloquerFiches}
      type="button"
    >
      <Icone className="inline h-3 w-3" icone={LockIcon} />
      verrouiller l'instruction
    </button>
  );
};
