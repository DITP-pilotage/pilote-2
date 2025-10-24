import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";

export const BoutonDebloquerInstruction = ({
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
    <Bouton
      disabled={disabled}
      label="Débloquer l'instruction"
      onClick={handleDebloquerFiches}
      variant="secondary"
    />
  );
};
