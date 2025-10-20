import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useDebloquerFiches } from "@/components/PagePilotage/useDebloquerFiches";

export const BoutonRetourEnConsolidation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const debloquerFiches = useDebloquerFiches();

  const handleDebloquerFiches = async () => {
    await debloquerFiches(fichesSelectionneesIds);
  };

  return (
    <Bouton
      disabled={disabled}
      label="Retour en consolidation"
      onClick={handleDebloquerFiches}
      variant="secondary"
    />
  );
};
