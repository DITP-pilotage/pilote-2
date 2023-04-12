import { Fragment } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import PublicationAffichage from '@/components/_commons/Publication/PublicationAffichage/PublicationAffichage';
import PublicationHistoriqueProps from './PublicationHistorique.interface';
import usePublicationHistorique from './usePublicationHistorique';

export default function PublicationHistorique({ type, entité, chantierId, maille, codeInsee }: PublicationHistoriqueProps) {
  const { publications, nomTerritoire, récupérerPublications } = usePublicationHistorique(type, entité, chantierId, maille, codeInsee);

  return (
    <Modale
      idHtml={`historique-${entité}-${type}`}
      libelléBouton="Voir l'historique"
      ouvertureCallback={récupérerPublications}
      sousTitre={nomTerritoire}
      titre={`Historique - ${entité}`}
    >
      <div>
        {
          publications 
            ? 
            publications.map((publication, i) => (
              publication &&
              <Fragment key={publication.id}>
                {
                  i !== 0 && (
                    <hr className="fr-mt-4w" />
                  )
                }
                <div className="fr-mx-2w">
                  <PublicationAffichage publication={publication} />
                </div>
              </Fragment>
            ))
            :
            <p>
              Chargement de l&apos;historique...
            </p>
        }
      </div>
    </Modale>
  );
}
