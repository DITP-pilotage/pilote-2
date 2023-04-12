import { Fragment } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import Publication from '@/components/PageChantier/Publication/Publication';
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
      <div>
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
                <div className="fr-mx-2w">
                  <Publication
                    auteur={synthèse?.auteur ?? null}
                    contenu={synthèse?.contenu ?? null}
                    date={synthèse?.date ?? null}
                    messageSiAucunContenu="La synthèse des résutats est vide."
                  />
                </div>
              </Fragment>
            ))
          )
        }
      </div>
    </Modale>
  );
}
