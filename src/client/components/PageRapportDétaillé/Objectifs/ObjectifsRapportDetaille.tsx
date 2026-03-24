import { Fragment } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import {
  libellésTypesObjectif,
  TypeObjectif,
} from "@/client/constants/libellésObjectif";
import { typesObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import Objectif from "@/server/domain/chantier/objectif/Objectif.interface";
import { isDefined } from "@/client/utils/predicates";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { Badge } from "@/components/_commons/Badge";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

interface ObjectifsRapportDetailleProps {
  objectifs: Objectif[];
}

export const ObjectifsRapportDetaille = ({
  objectifs,
}: ObjectifsRapportDetailleProps) => {
  const objectifParType = new Map<TypeObjectif, NonNullable<Objectif>>(
    objectifs.filter(isDefined).map((objectif) => [objectif.type, objectif]),
  );

  return (
    <Bloc
      backgroundClassNameTitre="bg-dsfr-blue-france-925"
      contenuClassesSupplémentaires=""
      titre="National"
    >
      {typesObjectif.map((type, index) => {
        const objectif = objectifParType.get(type) ?? null;
        return (
          <Fragment key={type}>
            {index !== 0 && <hr className="fr-hr p-1" />}
            <div className="py-4 px-6">
              <p className="font-bold mb-1 text-xl">
                {libellésTypesObjectif[type]}
              </p>
              {objectif ? (
                <>
                  <p className="text-xs text-dsfr-mention-grey mb-1">
                    {`Mis à jour le ${PiloteDateFormatter.isoDateFranceMetropolitaine(objectif.date)} | Par ${objectif.auteur}`}
                  </p>
                  <p
                    className="fr-text--sm fr-mb-0"
                    dangerouslySetInnerHTML={{
                      __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(
                        objectif.contenu,
                      ),
                    }}
                  />
                </>
              ) : (
                <Badge type="gris">Non renseigné</Badge>
              )}
            </div>
          </Fragment>
        );
      })}
    </Bloc>
  );
};
