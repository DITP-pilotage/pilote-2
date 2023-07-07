/* eslint-disable react/jsx-max-depth */
import '@gouvfr/dsfr/dist/component/link/link.min.css';
import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Link from 'next/link';
import { useState } from 'react';
import PageRapportDétailléStyled from '@/components/PageRapportDétaillé/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import PageRapportDétailléProps from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import { RapportDétailléVueDEnsemble } from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';
import RapportDétailléChantier from '@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier';
import { actionsTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import PremièrePageImpressionRapportDétaillé
  from '@/components/PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import FiltresSélectionnés from './FiltresSélectionnés/FiltresSélectionnés';

export const htmlId = {
  listeDesChantiers: () => 'liste-des-chantiers',
  chantier: (chantierId: string) => `chantier-${chantierId}`,
};

export default function PageRapportDétaillé({ chantiers, ministères, indicateursGroupésParChantier, détailsIndicateursGroupésParChantier, publicationsGroupéesParChantier, maille, codeInsee }: PageRapportDétailléProps) {
  const { modifierMailleSélectionnée, modifierTerritoireSélectionné, récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  if (maille !== 'nationale') {
    modifierMailleSélectionnée(maille);
    modifierTerritoireSélectionné(récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee).code);
  }

  const { chantiersFiltrés } = useChantiersFiltrés(chantiers);
  const filtresActifs = filtresActifsStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const [afficherLesChantiers, setAfficherLesChantiers] = useState(false);

  return (
    <>
      <PremièrePageImpressionRapportDétaillé
        filtresActifs={filtresActifs}
        ministères={ministères}
        territoireSélectionné={territoireSélectionné}
      />
      <PageRapportDétailléStyled>
        <main>
          <div className="fr-container fr-mb-0 fr-px-0 fr-px-md-2w">
            <div className="fr-px-2w fr-px-md-0 flex justify-between entête-rapport-détaillé">
              <Titre
                baliseHtml="h1"
                className="fr-h2"
              >
                {`Rapport détaillé : ${chantiersFiltrés.length} ${chantiersFiltrés.length > 1 ? 'chantiers' : 'chantier'}`}
              </Titre>
              <div>
                <Link
                  className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-go-back-fill fr-btn--icon-left fr-text--sm"
                  href="/"
                  title="Revenir à l'accueil"
                >
                  Revenir à l&apos;accueil
                </Link>
                <button
                  className="fr-btn fr-btn--tertiary-no-outline fr-icon-printer-line fr-btn--icon-left fr-text--sm"
                  onClick={() => window.print()}
                  type="button"
                >
                  Imprimer
                </button>
              </div>
            </div>
            <FiltresSélectionnés
              filtresActifs={filtresActifs}
              territoireSélectionné={territoireSélectionné}
            />
            <div className="fr-mb-3w interrupteur-chantiers">
              <Interrupteur
                auChangement={setAfficherLesChantiers}
                checked={afficherLesChantiers}
                id="afficher-chantiers"
                libellé="Afficher le détails des chantiers"
              />
            </div>
            <RapportDétailléVueDEnsemble chantiers={chantiersFiltrés} />
            {
              !!afficherLesChantiers &&
              <div className="chantiers">
                {
                  chantiersFiltrés.map((chantier) => (
                    <RapportDétailléChantier
                      chantier={chantier}
                      commentaires={publicationsGroupéesParChantier.commentaires[chantier.id] ?? []}
                      décisionStratégique={publicationsGroupéesParChantier.décisionStratégique[chantier.id] ?? null}
                      détailsIndicateurs={détailsIndicateursGroupésParChantier[chantier.id] ?? []}
                      indicateurs={indicateursGroupésParChantier[chantier.id] ?? []}
                      key={chantier.id}
                      objectifs={publicationsGroupéesParChantier.objectifs[chantier.id] ?? []}
                      synthèseDesRésultats={publicationsGroupéesParChantier.synthèsesDesRésultats[chantier.id] ?? null}
                    />
                  ))
                }
              </div>
            }
          </div>
        </main>
      </PageRapportDétailléStyled>
    </>
  );
}
