import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { Critere } from "@/server/evaluation/queries/types";
import { ModaleFicheCadrage } from "@/components/Evaluation/ModaleFicheCadrage";

export const BoutonAfficherFicheCadrage = ({
  critere,
}: {
  critere: Critere;
}) => {
  return (
    <ModaleFicheCadrage critere={critere}>
      <Bouton
        className="whitespace-nowrap underline !p-2 !-m-2 self-start gap-1.5 items-center"
        iconLeft={<Icone className="h-3.5 w-3.5" icone={Eye1Icon} />}
        label="Voir la fiche de cadrage"
        size="sm"
        variant="link"
      />
    </ModaleFicheCadrage>
  );
};
