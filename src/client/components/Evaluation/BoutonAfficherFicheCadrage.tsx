import { CritereOuObjectif } from "@/components/Evaluation/FicheCadrage";
import { UseSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";

export const BoutonAfficherFicheCadrage = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif;
}) => {
  return (
    <UseSetCritereOuObjectif>
      {(setCritereOuObjectif) => (
        <Bouton
          className="whitespace-nowrap underline !p-2 !-m-2 self-start gap-1.5 items-center"
          iconLeft={<Icone className="h-3.5 w-3.5" icone={Eye1Icon} />}
          label="Voir la fiche de cadrage"
          onClick={() => setCritereOuObjectif(critereOuObjectif)}
          size="sm"
          variant="link"
        />
      )}
    </UseSetCritereOuObjectif>
  );
};
