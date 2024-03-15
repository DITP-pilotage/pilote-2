import '@gouvfr/dsfr/dist/utility/colors/colors.css';

import { FunctionComponent } from 'react';
import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import PageFicheConducteurStyled from '@/components/PageFicheConducteur/PageFicheConducteur.styled';
import Titre from '@/components/_commons/Titre/Titre';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import Encart from '@/components/_commons/Encart/Encart';
import Bloc from '@/components/_commons/Bloc/Bloc';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import MétéoBadge from '@/components/_commons/Météo/Badge/MétéoBadge';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import CartographieAvancement from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement';
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieMétéo';
import CartographieMétéo from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo';

const PageFicheConducteur: FunctionComponent<
FicheConducteurContrat
> = ({  chantier, avancement, synthèseDesRésultats, donnéesCartographie }) => {
  const commentaire = (synthèseDesRésultats.commentaire?.length || 0) > 1000 ? synthèseDesRésultats.commentaire?.slice(0, 930) + '... [commentaire coupé car dépassant les 1000 caractères]' : synthèseDesRésultats.commentaire;

  return (
    <PageFicheConducteurStyled>
      <main className='fr-py-2w'>
        <div className='fr-container fr-pb-1w fiche-conducteur__container'>
          <Encart>
            <div className='flex justify-between'>
              <Titre
                baliseHtml='h2'
                className='fr-h5 fr-mb-0 fr-text-title--blue-france'
              >
                {`Nationale - ${chantier.nom}`}
              </Titre>
              <div className='flex align-center'>
                <BoutonImpression />
              </div>
            </div>
          </Encart>
        </div>
        <div className='fr-container'>
          <div className='fr-grid-row fr-grid-row--gutters'>
            <div className='fr-col-4 flex flex-column fiche-conducteur__bloc'>
              <Titre
                baliseHtml='h2'
                className='fr-h5 fr-mb-1w fr-text-title--blue-france'
              >
                Responsables & État d'avancement
              </Titre>
              <Bloc contenuClassesSupplémentaires='fr-px-1w fr-py-1v'>
                <div className='fr-grid-row border-b fr-pb-1w fr-text--xs fr-m-0'>
                  <span className='fr-col-2 fr-text--bold'>
                    DAC
                  </span>
                  <span className='fr-col-8'>
                    {chantier.directeursAdministrationCentrale}
                  </span>
                </div>
                <div className='fr-grid-row border-b fr-py-1w fr-text--xs fr-m-0'>
                  <span className='fr-col-2 fr-text--bold'>
                    DP
                  </span>
                  <span className='fr-col-8'>
                    {chantier.directeursProjet}
                  </span>
                </div>
                <div className='fr-grid-row fr-pt-1w'>
                  <div className='fr-col-5 flex justify-center align-end'>
                    <JaugeDeProgression
                      couleur='bleu'
                      libellé="Taux d'avancement global"
                      pourcentage={avancement.global}
                      taille='md'
                    />
                  </div>
                  <div className='fr-col-7 fr-grid-row fr-grid-row-md--gutters'>
                    <div className='fr-col-4 flex justify-center align-end'>
                      <JaugeDeProgression
                        couleur='orange'
                        libellé='Minimum'
                        pourcentage={avancement.minimum}
                        taille='sm'
                      />
                    </div>
                    <div className='fr-col-4 flex justify-center align-end'>
                      <JaugeDeProgression
                        couleur='violet'
                        libellé='Médiane'
                        pourcentage={avancement.mediane}
                        taille='sm'
                      />
                    </div>
                    <div className='fr-col-4 flex justify-center align-end'>
                      <JaugeDeProgression
                        couleur='vert'
                        libellé='Maximum'
                        pourcentage={avancement.maximum}
                        taille='sm'
                      />
                    </div>
                  </div>
                </div>
              </Bloc>
            </div>
            <div className='fr-col-8 flex flex-column fiche-conducteur__bloc'>
              <Titre
                baliseHtml='h2'
                className='fr-h5 fr-mb-1w fr-text-title--blue-france'
              >
                Météo et synthèse des résultats
              </Titre>
              <Bloc contenuClassesSupplémentaires='fr-grid-row fr-grid-row--gutters fr-p-1w'>
                <div className='fr-col-2'>
                  <div className='texte-centre fr-text--xs'>
                    <MétéoBadge météo={synthèseDesRésultats.meteo || 'NON_RENSEIGNEE'} />
                  </div>
                  <div className='w-full flex justify-center'>
                    <MétéoPicto météo={synthèseDesRésultats.meteo || 'NON_RENSEIGNEE'} />
                  </div>
                </div>
                <div className='fr-col-10'>
                  {
                    commentaire ? (
                      commentaire?.split('\n').map((paragrapheCommentaire, index) => (
                        <p
                          className='fr-text--xs fr-mb-1w'
                          key={`paragraphe-commentaire-${index}`}
                        >
                          {paragrapheCommentaire}
                        </p>
                      ))
                    ) : (
                      <p>
                        Aucune synthèse des résultats
                      </p>
                    )
                  }
                  <p className='fr-text--sm fr-mb-0' />
                </div>
              </Bloc>
            </div>
          </div>
        </div>
        <div className='fr-container fr-mt-2w'>
          <Bloc contenuClassesSupplémentaires='fr-px-1w fr-py-1v'>
            <div className='fiche-conducteur--tableau fr-container--fluid fr-text--xs fr-m-0'>
              <div
                className='fr-grid-row fr-background-action-low--blue-france fr-px-1w fr-py-1w border-b'
              >
                <div
                  className='fr-col-5 fr-text--bold'
                >
                  Avancement des indicateurs d'impact pris en compte dans le TA
                </div>
                <div className='fr-col-7 fr-grid-row'>
                  <div
                    className='fr-col-2 fr-text--bold flex align-center no-wrap'
                  >
                    V. Initiale (12/22)
                  </div>
                  <div
                    className='fr-col-2 fr-text--bold flex align-center'
                  >
                    V. Actuelle
                  </div>
                  <div
                    className='fr-col-2 fr-text--bold flex align-center'
                  >
                    Jalon 2024
                  </div>
                  <div
                    className='fr-col-2 fr-text--bold flex align-center'
                  >
                    TA 2024
                  </div>
                  <div
                    className='fr-col-2 fr-text--bold flex align-center'
                  >
                    Cible 2026
                  </div>
                  <div
                    className='fr-col-2 fr-text--bold flex align-center'
                  >
                    TA 2026
                  </div>
                </div>
              </div>
              {
                chantier.indicateurs.map((indicateur, index) => (
                  <div
                    className='fr-grid-row fr-px-1w fr-py-1v border-t'
                    key={`indicateur-${index}`}
                  >
                    <div
                      className='fr-col-5'
                    >
                      {indicateur.nom}
                    </div>
                    <div className='fr-col-7 fr-grid-row'>
                      <div
                        className='fr-col-2 flex align-center'
                      >
                        {indicateur.valeurInitiale}
                      </div>
                      <div
                        className='fr-col-2 flex align-center fr-pr-1w'
                      >
                        {`${indicateur.valeurActuelle} ${indicateur.dateValeurActuelle}`}
                      </div>
                      <div
                        className='fr-col-2 flex align-center'
                      >
                        {indicateur.objectifValeurCibleIntermediaire}
                      </div>
                      <div
                        className='fr-col-2 flex align-center'
                      >
                        {indicateur.objectifTauxAvancementIntermediaire}
                      </div>
                      <div
                        className='fr-col-2 flex align-center'
                      >
                        {indicateur.objectifValeurCible}
                      </div>
                      <div
                        className='fr-col-2 flex align-center'
                      >
                        {indicateur.objectifTauxAvancement}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </Bloc>
        </div>
        <div className='page-break fr-mb-2w' />
        <div className='fr-container'>
          <div className='fr-grid-row fr-grid-row--gutters'>
            <div className='fr-col-6'>
              <Titre
                baliseHtml='h2'
                className='fr-h5 fr-mb-1w fr-text-title--blue-france'
              >
                Taux d'avancement 2026
              </Titre>
              <Bloc>
                <CartographieAvancement
                  auClicTerritoireCallback={() => {}}
                  données={donnéesCartographie.tauxAvancement}
                  options={{ estInteractif: false, territoireSélectionnable: false }}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
                />
              </Bloc>
            </div>
            <div className='fr-col-6'>
              <Titre
                baliseHtml='h2'
                className='fr-h5 fr-mb-1w fr-text-title--blue-france'
              >
                Niveau de confiance
              </Titre>
              <Bloc>
                <CartographieMétéo
                  auClicTerritoireCallback={() => {}}
                  données={donnéesCartographie.meteo}
                  options={{ estInteractif: false, territoireSélectionnable: false }}
                  élémentsDeLégende={ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS}
                />
              </Bloc>
            </div>
          </div>
        </div>
        <div className='page-break fr-mb-2w' />
        <div className='fr-container'>
          Objectif
        </div>
      </main>
    </PageFicheConducteurStyled>
  );
};

export {
  PageFicheConducteur,
};
