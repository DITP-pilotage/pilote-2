import { Fragment, FunctionComponent, useMemo } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import PublicationAffichage from '@/components/_commons/Publication/PublicationAffichage/PublicationAffichage';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import PublicationHistoriqueProps from './PublicationHistorique.interface';
import usePublicationHistorique from './usePublicationHistorique';

const PublicationHistorique: FunctionComponent<PublicationHistoriqueProps> = ({ type, entité, réformeId, maille }) => {
  const { publications, nomTerritoire, récupérerPublications } = usePublicationHistorique(type, entité, réformeId, maille);

  const ID_HTML = useMemo(() => `historique-${entité}-${type}`, [entité, type]);

  return (
    <>
      <BoutonSousLigné
        ariaControls={ID_HTML}
        classNameSupplémentaires='fr-mt-1w'
        dataFrOpened={false}
        type='button'
      >
        Voir l'historique
      </BoutonSousLigné>
      <Modale
        idHtml={ID_HTML}
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
                      <hr className='fr-mt-4w' />
                    )
                  }
                  <div className='fr-mx-2w'>
                    <PublicationAffichage publication={publication} />
                  </div>
                </Fragment>
              ))
              :
              <p>
                Chargement de l'historique...
              </p>
          }
        </div>
      </Modale>
    </>
  );
};

export default PublicationHistorique;
