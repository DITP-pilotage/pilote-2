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
      title={`Fiche de cadrage - ${critere.libelle}`}
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
      <div>
        <p className="whitespace-pre-line !text-sm !m-0">
          {critere.descriptif}
        </p>

        <ul className="list-style-none !p-0 !m-0">
          {critere.sousCriteres.map((sousCritere) => (
            <li key={sousCritere.id}>
              <h3 className="!text-base !mb-1 italic">{sousCritere.libelle}</h3>
              <p className="whitespace-pre-line !text-sm">
                {sousCritere.descriptif}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Modale>
  );
};
