import { Fragment, FunctionComponent } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import SynthèseDesRésultatsAffichage from '@/components/_commons/SynthèseDesRésultatsNew/Affichage/Affichage';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import SynthèseDesRésultatsHistoriqueStyled from './Historique.styled';
import useHistoriqueDeLaSynthèseDesRésultats from './useHistoriqueDeLaSynthèseDesRésultats';

interface SynthèseDesRésultatsHistoriqueProps {
  réformeId: Chantier['id'] | ProjetStructurant['id'];
}

const ID_HTML = 'historique-synthèse-des-résultats';

const SynthèseDesRésultatsHistorique: FunctionComponent<SynthèseDesRésultatsHistoriqueProps> = ({ réformeId }) => {
  const {
    historiqueDeLaSynthèseDesRésultats,
    territoireSélectionné,
    récupérerHistoriqueSynthèseDesRésultats,
  } = useHistoriqueDeLaSynthèseDesRésultats(réformeId);

  return (
    <>
      <BoutonSousLigné
        ariaControls={ID_HTML}
        classNameSupplémentaires='fr-mt-1w fr-ml-3w'
        dataFrOpened={false}
        type='button'
      >
        Voir l'historique
      </BoutonSousLigné>
      <Modale
        idHtml={ID_HTML}
        ouvertureCallback={récupérerHistoriqueSynthèseDesRésultats}
        sousTitre={territoireSélectionné!.nomAffiché}
        titre='Historique - Synthèse des résultats'
      >
        <SynthèseDesRésultatsHistoriqueStyled>
          {
            historiqueDeLaSynthèseDesRésultats ?
              historiqueDeLaSynthèseDesRésultats.map((synthèse, i) => (
                <Fragment key={synthèse?.date ?? 'MANQUANT'}>
                  {
                    i !== 0 && (
                      <hr className='fr-mt-4w' />
                    )
                  }
                  <div className='conteneur'>
                    <div className='conteneur-météo fr-mb-3w fr-mb-md-0'>
                      <div className='fr-mb-2w'>
                        <MétéoBadge météo={synthèse?.météo ?? 'NON_RENSEIGNEE'} />
                      </div>
                      {
                        !!synthèse &&
                        <div>
                          <MétéoPicto météo={synthèse.météo} />
                        </div>
                      }
                    </div>
                    <div className='fr-pl-md-3w'>
                      <SynthèseDesRésultatsAffichage synthèseDesRésultats={synthèse} />
                    </div>
                  </div>
                </Fragment>
              ))
              :
              <p>
                Chargement de l'historique...
              </p>
          }
        </SynthèseDesRésultatsHistoriqueStyled>
      </Modale>
    </>
  );
};

export default SynthèseDesRésultatsHistorique;
