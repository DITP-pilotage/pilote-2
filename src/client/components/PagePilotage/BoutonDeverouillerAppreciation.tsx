import { useModifierEtatFichesConsolidation } from "@/components/PagePilotage/useModifierEtatFichesConsolidation";
import { Icone } from "@/components/_commons/Icone";
import { LockUnlockIcon } from "@/components/_commons/Icones/LockUnlockIcon";

export const BoutonDeverouillerAppreciation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const { modifierEtat } = useModifierEtatFichesConsolidation();

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
      déverouiller l'appréciation
    </button>
  );
};
