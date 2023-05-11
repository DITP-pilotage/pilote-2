import { Fragment } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import SynthèseDesRésultatsAffichage
  from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultatsAffichage/SynthèseDesRésultatsAffichage';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import HistoriqueDeLaSynthèseDesRésultatsProps from './HistoriqueDeLaSynthèseDesRésultats.interface';
import HistoriqueDeLaSynthèseDesRésultatsStyled from './SynthèseDesRésultatsHistorique.styled';
import useHistoriqueDeLaSynthèseDesRésultats from './useHistoriqueDeLaSynthèseDesRésultats';

const ID_HTML = 'historique-synthèse-des-résultats';

export default function HistoriqueDeLaSynthèseDesRésultats({ chantierId }: HistoriqueDeLaSynthèseDesRésultatsProps) {
  const { historiqueDeLaSynthèseDesRésultats, territoireSélectionné, récupérerHistoriqueSynthèseDesRésultats } = useHistoriqueDeLaSynthèseDesRésultats(chantierId);

  return (
    <>
      <BoutonSousLigné
        idHtml={ID_HTML}
      >
        Voir l&apos;historique
      </BoutonSousLigné>
      <Modale
        idHtml={ID_HTML}
        ouvertureCallback={récupérerHistoriqueSynthèseDesRésultats}
        sousTitre={territoireSélectionné!.nomAffiché}
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
    </>
  );
}
