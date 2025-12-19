import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";
import { Icone } from "@/components/_commons/Icone";
import { LockUnlockIcon } from "@/components/_commons/Icones/LockUnlockIcon";

export const BoutonDeverrouillerInstruction = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const { modifierEtat } = useModifierEtatFichesInstruction();

  const handleDebloquerFiches = async () => {
    await modifierEtat(fichesSelectionneesIds, false);
  };

  return (
    <button
      className="fr-link text-left !text-xs !flex items-center gap-1"
      disabled={disabled}
      onClick={handleDebloquerFiches}
      type="button"
    >
      <Icone className="inline h-3 w-3" icone={LockUnlockIcon} />
      déverrouiller l'instruction
    </button>
  );
};
