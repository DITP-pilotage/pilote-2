import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useModifierEtatFichesConsolidation } from "@/components/PagePilotage/useModifierEtatFichesConsolidation";

export const BoutonBloquerLaConsolidation = ({
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
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Bloquer la consolidation"
      onClick={handleBloquerFiches}
      variant="secondary"
    />
  );
};
