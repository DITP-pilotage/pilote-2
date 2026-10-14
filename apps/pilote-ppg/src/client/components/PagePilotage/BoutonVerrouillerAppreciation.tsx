import { useModifierEtatFichesConsolidation } from "@/components/PagePilotage/useModifierEtatFichesConsolidation";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { TextLink } from "@/components/shared/TextLink";

export const BoutonVerrouillerAppreciation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const { modifierEtat } = useModifierEtatFichesConsolidation();

  const handleBloquerFiches = async () => {
    await modifierEtat(fichesSelectionneesIds, true);
  };

  return (
    <TextLink asChild className="text-left flex items-center gap-1" size="xs">
      <button disabled={disabled} onClick={handleBloquerFiches} type="button">
        <Icone className="inline h-3 w-3" icone={LockIcon} />
        verrouiller l'appréciation
      </button>
    </TextLink>
  );
};
