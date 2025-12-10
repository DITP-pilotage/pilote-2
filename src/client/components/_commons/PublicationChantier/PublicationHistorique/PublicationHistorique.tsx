import { Fragment, FunctionComponent } from "react";
import { Modal } from "@/components/shared/Modal";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import PublicationAffichage from "@/components/_commons/PublicationChantier/PublicationAffichage/PublicationAffichage";
import PublicationHistoriqueProps from "./PublicationHistorique.interface";
import usePublicationHistorique from "./usePublicationHistorique";

const PublicationHistorique: FunctionComponent<PublicationHistoriqueProps> = ({
  type,
  entité,
  réformeId,
  maille,
}) => {
  const { publications, nomTerritoire, récupérerPublications } =
    usePublicationHistorique(type, entité, réformeId, maille);

  return (
    <Modal
      onOpenChange={(open) => {
        if (open) {
          récupérerPublications();
        }
      }}
      title={`Historique - ${entité}`}
      trigger={
        <BoutonSousLigné className="fr-mt-1w" type="button">
          Voir l'historique
        </BoutonSousLigné>
      }
    >
      {nomTerritoire ? (
        <p className="fr-text--lg bold">{nomTerritoire}</p>
      ) : null}

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
    </Modal>
  );
};

export default PublicationHistorique;
