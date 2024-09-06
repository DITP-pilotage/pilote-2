import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Link from 'next/link';
import { FunctionComponent, useState } from 'react';
import PageRapportDétailléStyled from '@/components/PageRapportDétaillé/PageRapportDétaillé.styled';
import Titre from '@/components/_commons/Titre/Titre';
import { PublicationsGroupéesParChantier } from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import RapportDétailléVueDEnsemble from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble';
import RapportDétailléChantier from '@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import PremièrePageImpressionRapportDétaillé
  from '@/components/PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import { getFiltresActifs } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import { getQueryParamString } from '@/client/utils/getQueryParamString';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  RépartitionsMétéos,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import Axe from '@/server/domain/axe/Axe.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { AvancementChantierRapportDetaille } from '@/components/PageRapportDétaillé/AvancementChantierRapportDetaille';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo.interface';
import FiltresSélectionnés from './FiltresSélectionnés/FiltresSélectionnés';

interface PageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[]
  ministères: Ministère[]
  axes: Axe[],
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  mailleSélectionnée: 'départementale' | 'régionale'
  mapChantierStatistiques: Map<string, AvancementChantierRapportDetaille>
  codeInsee: CodeInsee
  territoireCode: string
  filtresComptesCalculés: Record<string, { nombre: number }>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
  estAutoriseAVoirLesBrouillons: boolean
  mapDonnéesCartographieAvancement: Map<string, AvancementsGlobauxTerritoriauxMoyensContrat>
  mapDonnéesCartographieMétéo:Map<string, CartographieDonnéesMétéo>
}

export const htmlId = {
  listeDesChantiers: () => 'liste-des-chantiers',
  chantier: (chantierId: string) => `chantier-${chantierId}`,
};

const PageRapportDétaillé: FunctionComponent<PageRapportDétailléProps> = ({
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
  estAutoriseAVoirLesBrouillons,
  territoireCode,
  mapDonnéesCartographieAvancement,
  mapDonnéesCartographieMétéo,
}) => {
  const {
    récupérerDétailsSurUnTerritoireAvecCodeInsee,
  } = actionsTerritoiresStore();

  // le filtre devrait être fait en server side avant d'arriver au front
  const territoireSélectionné = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee, mailleSélectionnée);
  const [afficherLesChantiers, setAfficherLesChantiers] = useState(false);


  const queryParamString = getQueryParamString(getFiltresActifs());
  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ''}`;

  return (
    <>
      <PremièrePageImpressionRapportDétaillé
        axes={axes}
        estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
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
                  href={hrefBoutonRetour}
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
              estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
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
            {
              afficherLesChantiers ? (
                <>
                  <div className='force-break-page' />
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
                </>
              ) : null
            }
          </div>
        </main>
      </PageRapportDétailléStyled>
    </>
  );
};

export default PageRapportDétaillé;
