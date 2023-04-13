import { Fragment } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import Publication from '@/components/PageChantier/Publication/Publication';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import HistoriqueDeLaSynthèseDesRésultatsStyled
  from '@/components/PageChantier/SynthèseDesRésultats/Historique/HistoriqueDeLaSynthèseDesRésultats.styled';
import useHistoriqueDeLaSynthèseDesRésultats from './useHistoriqueDeLaSynthèseDesRésultats';

export default function HistoriqueDeLaSynthèseDesRésultats() {
  const { historiqueDeLaSynthèseDesRésultats, territoireSélectionné, récupérerPublications } = useHistoriqueDeLaSynthèseDesRésultats();

  return (
    <Modale
      idHtml="historique-synthèse-des-résultats"
      libelléBouton="Voir l'historique"
      ouvertureCallback={récupérerPublications}
      sousTitre={territoireSélectionné.nom}
      titre="Historique - Synthèse des résultats"
    >
      <HistoriqueDeLaSynthèseDesRésultatsStyled>
        {
          historiqueDeLaSynthèseDesRésultats === null ? (
            <p>
              Chargement de l&apos;historique...
            </p>
          ) : (
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
                    {
                      synthèse
                        ?
                          <Publication
                            auteur={synthèse.auteur}
                            contenu={synthèse.contenu}
                            date={synthèse.date}
                            messageSiAucunContenu="Aucune synthèse des résultats."
                          />
                        :
                          <p className='fr-text--sm texte-gris'>
                            Aucune synthèse des résultats.
                          </p>
                    }
                  </div>
                </div>
              </Fragment>
            ))
          )
        }
      </HistoriqueDeLaSynthèseDesRésultatsStyled>
    </Modale>
  );
}
