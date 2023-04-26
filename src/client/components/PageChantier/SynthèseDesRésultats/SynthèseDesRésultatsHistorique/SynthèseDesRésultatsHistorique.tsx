import { Fragment } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import SynthèseDesRésultatsAffichage
  from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultatsAffichage/SynthèseDesRésultatsAffichage';
import HistoriqueDeLaSynthèseDesRésultatsProps from './HistoriqueDeLaSynthèseDesRésultats.interface';
import HistoriqueDeLaSynthèseDesRésultatsStyled from './SynthèseDesRésultatsHistorique.styled';
import useHistoriqueDeLaSynthèseDesRésultats from './useHistoriqueDeLaSynthèseDesRésultats';

export default function HistoriqueDeLaSynthèseDesRésultats({ chantierId }: HistoriqueDeLaSynthèseDesRésultatsProps) {
  const { historiqueDeLaSynthèseDesRésultats, territoireSélectionné, récupérerHistoriqueSynthèseDesRésultats } = useHistoriqueDeLaSynthèseDesRésultats(chantierId);

  return (
    <Modale
      idHtml="historique-synthèse-des-résultats"
      libelléBouton="Voir l'historique"
      ouvertureCallback={récupérerHistoriqueSynthèseDesRésultats}
      sousTitre={territoireSélectionné.nom}
      titre="Historique - Synthèse des résultats"
    >
      <HistoriqueDeLaSynthèseDesRésultatsStyled>
        {
          historiqueDeLaSynthèseDesRésultats ?
            historiqueDeLaSynthèseDesRésultats.map((synthèse, i) => (
              <Fragment key={synthèse?.date ?? 'MANQUANT'}>
                {
                  i !== 0 && (
                    <hr className="fr-mt-4w" />
                  )
                }
                <div className="conteneur">
                  <div className="conteneur-météo fr-mb-3w fr-mb-md-0">
                    <MétéoBadge météo={synthèse?.météo ?? 'NON_RENSEIGNEE'} />
                    {
                      !!synthèse &&
                        <div>
                          <MétéoPicto météo={synthèse.météo} />
                        </div>
                    }
                  </div>
                  <div className="fr-pl-md-3w">
                    <SynthèseDesRésultatsAffichage synthèseDesRésultats={synthèse} />
                  </div>
                </div>
              </Fragment>
            ))
            :
            <p>
              Chargement de l&apos;historique...
            </p>
        }
      </HistoriqueDeLaSynthèseDesRésultatsStyled>
    </Modale>
  );
}
