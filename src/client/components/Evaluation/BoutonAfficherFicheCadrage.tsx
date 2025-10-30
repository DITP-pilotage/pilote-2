import { CritereOuObjectif } from "@/components/Evaluation/FicheCadrage";
import { UseSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";
import { Bouton } from "@/components/_commons/Bouton/Bouton";

export const BoutonAfficherFicheCadrage = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif;
}) => {
  return (
    <UseSetCritereOuObjectif>
      {(setCritereOuObjectif) => (
        <Bouton
          label="Fiche de cadrage"
          onClick={() => setCritereOuObjectif(critereOuObjectif)}
          size="sm"
          variant="secondary"
        />
      )}
    </UseSetCritereOuObjectif>
  );
};
