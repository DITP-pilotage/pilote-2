import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { Modale } from "@/components/shared/Modale";
import { Critere } from "@/server/evaluation/queries/types";

export const BoutonAfficherFicheCadrage = ({
  critere,
}: {
  critere: Critere;
}) => {
  return (
    <Modale
      title="COucou"
      trigger={
        <Bouton
          className="whitespace-nowrap underline !p-2 !-m-2 self-start gap-1.5 items-center"
          iconLeft={<Icone className="h-3.5 w-3.5" icone={Eye1Icon} />}
          label="Voir la fiche de cadrage"
          size="sm"
          variant="link"
        />
      }
    >
      <pre>{JSON.stringify(critere, null, 2)}</pre>
    </Modale>
  );
};
