import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useModifierEtatFichesConsolidation } from "@/components/PagePilotage/useModifierEtatFichesConsolidation";

export const BoutonDebloquerLaConsolidation = ({
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
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Débloquer la consolidation"
      onClick={handleDebloquerFiches}
      variant="secondary"
    />
  );
};
