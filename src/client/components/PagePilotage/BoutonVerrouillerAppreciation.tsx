import { useModifierEtatFichesConsolidation } from "@/components/PagePilotage/useModifierEtatFichesConsolidation";

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
    <button
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handleBloquerFiches}
      type="button"
    >
      vérouiller l'appréciation
    </button>
  );
};
