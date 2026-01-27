import { Fragment, FunctionComponent } from "react";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import PublicationAffichage from "@/components/_commons/PublicationChantier/PublicationAffichage/PublicationAffichage";
import PublicationHistoriqueProps from "./PublicationHistorique.interface";
import usePublicationHistorique from "./usePublicationHistorique";

const PublicationHistorique: FunctionComponent<PublicationHistoriqueProps> = ({
  type,
  entité,
  réformeId,
  maille,
  territoireCode,
}) => {
  const { publications, nomTerritoire, récupérerPublications } =
    usePublicationHistorique(type, entité, réformeId, maille, territoireCode);

  return (
    <Modale
      onOpenChange={(open) => {
        if (open) {
          récupérerPublications();
        }
      }}
      sousTitre={nomTerritoire}
      title={`Historique - ${entité}`}
      trigger={
        <BoutonSousLigné
          aria-label={`Voir l'histoire des ${entité} du type ${type}`}
          className="fr-mt-1w"
          type="button"
        >
          Voir l'historique
        </BoutonSousLigné>
      }
    >
      <div>
        {publications ? (
          publications.map(
            (publication, i) =>
              publication && (
                <Fragment key={publication.id}>
                  {i !== 0 && <hr className="fr-mt-4w" />}
                  <div className="fr-mx-2w">
                    <PublicationAffichage publication={publication} />
                  </div>
                </Fragment>
              ),
          )
        ) : (
          <p>Chargement de l'historique...</p>
        )}
      </div>
    </Modale>
  );
};

export default PublicationHistorique;
