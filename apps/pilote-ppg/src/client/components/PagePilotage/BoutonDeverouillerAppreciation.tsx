import { useModifierEtatFichesConsolidation } from "@/components/PagePilotage/useModifierEtatFichesConsolidation";
import { Icone } from "@/components/_commons/Icone";
import { LockUnlockIcon } from "@/components/_commons/Icones/LockUnlockIcon";
import { TextLink } from "@/components/shared/TextLink";

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
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button disabled={disabled} onClick={handleDebloquerFiches} type="button">
        <Icone className="inline h-3 w-3" icone={LockUnlockIcon} />
        déverrouiller l'appréciation
      </button>
    </TextLink>
  );
};
