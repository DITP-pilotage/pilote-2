import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Link from 'next/link';
import { useState } from 'react';
import PageRapportDétailléStyled from '@/components/PageRapportDétailléNew/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import PageRapportDétailléProps from '@/components/PageRapportDétailléNew/PageRapportDétaillé.interface';
import {
  RapportDétailléVueDEnsemble,
} from '@/components/PageRapportDétailléNew/VueDEnsemble/RapportDétailléVueDEnsemble';
import RapportDétailléChantier from '@/components/PageRapportDétailléNew/Chantier/RapportDétailléChantier';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import PremièrePageImpressionRapportDétaillé
  from '@/components/PageRapportDétailléNew/PremièrePageImpression/PremièrePageImpressionRapportDétaillé';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import FiltresSélectionnés from './FiltresSélectionnés/FiltresSélectionnés';

export const htmlId = {
  listeDesChantiers: () => 'liste-des-chantiers',
  chantier: (chantierId: string) => `chantier-${chantierId}`,
};

export default function PageRapportDétaillé({
  chantiers: chantiersFiltrés,
  ministères,
  axes,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  mailleSélectionnée,
  mapChantierStatistiques,
  codeInsee,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  répartitionMétéos,
  territoireCode,
  mapDonnéesCartographieAvancement,
  mapDonnéesCartographieMétéo,
}: PageRapportDétailléProps) {
  const {
    récupérerDétailsSurUnTerritoireAvecCodeInsee,
  } = actionsTerritoiresStore();

  // le filtre devrait être fait en server side avant d'arriver au front
  const filtresActifs = filtresActifsStore();
  const territoireSélectionné = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee, mailleSélectionnée);
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
          <div className='fr-container fr-mb-0 fr-px-0 fr-px-md-2w'>
            <div className='fr-px-2w fr-px-md-0 flex justify-between entête-rapport-détaillé'>
              <Titre
                baliseHtml='h1'
                className='fr-h2'
              >
                {`Rapport détaillé : ${chantiersFiltrés.length} ${chantiersFiltrés.length > 1 ? 'chantiers' : 'chantier'}`}
              </Titre>
              <div>
                <Link
                  className='fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-go-back-fill fr-btn--icon-left fr-text--sm'
                  href='/'
                  title="Revenir à l'accueil"
                >
                  Revenir à l'accueil
                </Link>
                <button
                  className='fr-btn fr-btn--tertiary-no-outline fr-icon-printer-line fr-btn--icon-left fr-text--sm'
                  onClick={() => window.print()}
                  type='button'
                >
                  Imprimer
                </button>
              </div>
            </div>
            <FiltresSélectionnés
              axes={axes}
              ministères={ministères}
              territoireSélectionné={territoireSélectionné}
            />
            <div className='fr-mb-3w interrupteur-chantiers'>
              <Interrupteur
                auChangement={setAfficherLesChantiers}
                checked={afficherLesChantiers}
                id='afficher-chantiers'
                libellé='Afficher le détail des chantiers'
              />
            </div>
            <RapportDétailléVueDEnsemble
              avancementsAgrégés={avancementsAgrégés}
              avancementsGlobauxTerritoriauxMoyens={avancementsGlobauxTerritoriauxMoyens}
              chantiers={chantiersFiltrés}
              filtresComptesCalculés={filtresComptesCalculés}
              mailleSelectionnee={mailleSélectionnée}
              répartitionMétéos={répartitionMétéos}
              territoireCode={territoireCode}
            />
            <div className='force-break-page' />
            {
              afficherLesChantiers ? (
                <div className='chantiers'>
                  {
                    chantiersFiltrés.map((chantier) => (
                      <RapportDétailléChantier
                        chantier={chantier}
                        commentaires={publicationsGroupéesParChantier.commentaires[chantier.id] ?? []}
                        donnéesCartographieAvancement={mapDonnéesCartographieAvancement.get(chantier.id)!}
                        donnéesCartographieMétéo={mapDonnéesCartographieMétéo.get(chantier.id)!}
                        décisionStratégique={publicationsGroupéesParChantier.décisionStratégique[chantier.id] ?? null}
                        détailsIndicateurs={détailsIndicateursGroupésParChantier[chantier.id] ?? []}
                        indicateurs={indicateursGroupésParChantier[chantier.id] ?? []}
                        key={chantier.id}
                        mailleSélectionnée={mailleSélectionnée}
                        mapChantierStatistiques={mapChantierStatistiques}
                        objectifs={publicationsGroupéesParChantier.objectifs[chantier.id] ?? []}
                        synthèseDesRésultats={publicationsGroupéesParChantier.synthèsesDesRésultats[chantier.id] ?? null}
                        territoireCode={territoireCode}
                        territoireSélectionné={territoireSélectionné}
                      />
                    ))
                  }
                </div>
              ) : null
            }
          </div>
        </main>
      </PageRapportDétailléStyled>
    </>
  );
}
