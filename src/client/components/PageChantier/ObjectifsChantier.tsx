import { FunctionComponent } from "react";
import {
  consignesDÉcritureObjectif,
  libellésTypesObjectif,
  TypeObjectif,
} from "@/client/constants/libellésObjectif";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Publication from "@/components/_commons/PublicationChantier/Publication";
import { typesObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

export interface ObjectifsChantierProps {
  modeÉcriture?: boolean;
  estInteractif?: boolean;
}

export const ObjectifsChantier: FunctionComponent<ObjectifsChantierProps> = ({
  modeÉcriture = false,
  estInteractif = true,
}) => {
  const {
    objectifs: tousLesObjectifs,
    chantier,
    territoireCode,
  } = pageChantier.useServerSidePropsContext();
  const objectifs = tousLesObjectifs[chantier.id];

  return (
    <Bloc contenuClassesSupplémentaires="" titre="National">
      {typesObjectif.map((type) => (
        <section className="fr-accordion" key={type}>
          <h3 className="fr-accordion__title">
            <button
              aria-controls={`accordion-${type}`}
              aria-expanded={false}
              className="fr-accordion__btn"
              title={libellésTypesObjectif[type as TypeObjectif]}
              type="button"
            >
              {libellésTypesObjectif[type as TypeObjectif]}
            </button>
          </h3>
          <div className="fr-collapse" id={`accordion-${type}`}>
            <Publication
              caractéristiques={{
                type: type,
                entité: "objectifs",
                libelléType: libellésTypesObjectif[type as TypeObjectif],
                consigneDÉcriture:
                  consignesDÉcritureObjectif[type as TypeObjectif],
              }}
              estInteractif={estInteractif}
              maille="nationale"
              modeÉcriture={modeÉcriture}
              publicationInitiale={
                objectifs?.find((objectif) => objectif?.type === type) || null
              }
              réformeId={chantier.id}
              territoireCode={territoireCode}
            />
          </div>
        </section>
      ))}
    </Bloc>
  );
};
