import { PropsWithChildren } from "react";
import { Critere } from "@/server/evaluation/queries/types";
import { Modale } from "@/components/shared/Modale";

export const ModaleFicheCadrage = ({
  critere,
  children,
}: PropsWithChildren<{ critere: Critere }>) => {
  return (
    <Modale title={`Fiche de cadrage - ${critere.libelle}`} trigger={children}>
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
