import { FunctionComponent } from 'react';
import HeaderFicheTerritoriale from '@/components/PageFicheTerritoriale/HeaderFicheTerritoriale';
import Encart from '@/components/_commons/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import {
  AvancementsFicheTerritoriale,
} from '@/components/PageFicheTerritoriale/AvancementsFicheTerritoriale/AvancementsFicheTerritoriale';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import RépartitionMétéo from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';
import '@gouvfr/dsfr/dist/utility/colors/colors.css';
import { TableauFicheTerritoriale } from '@/components/PageFicheTerritoriale/TableauFicheTerritoriale';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { FicheTerritorialeContrat } from '@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat';
import PageFicheTerritorialeStyled from './PageFicheTerritoriale.styled';

export const PageFicheTerritoriale: FunctionComponent<FicheTerritorialeContrat> = ({ territoire, avancementGlobalTerritoire, avancementAnnuelTerritoire, répartitionMétéos, chantiersFicheTerritoriale }) => {
  const now = new Date();

  return (
    <PageFicheTerritorialeStyled>
      <HeaderFicheTerritoriale />
      <main>
        <div className='fr-container fr-pb-2w fiche-territoriale__container'>
          <Encart>
            <div className='flex justify-between'>
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-0 fr-text-title--blue-france'
              >
                {`Fiche territoriale de synthèse ${territoire.nomAffiché}`}
              </Titre>
              <div className='flex justify-end'>
                <BoutonImpression />
              </div>
            </div>
          </Encart>
          <p className='fr-px-2w fr-m-0'>
            <i className='fr-text--sm fr-ital'>
              {`Fiche de synthèse généré le ${now.toLocaleString()}`}
            </i>
          </p>
          <Titre
            baliseHtml='h1'
            className='fr-h3 fr-mt-0 fr-mb-1w fr-px-2w'
          >
            Vue générale
          </Titre>
          <div className='fr-grid-row fr-px-2w'>
            <div className='fr-col-4 fr-pr-1v fiche-territoriale__avancement'>
              <div className='fiche-territoriale__avancement--moyen fr-mb-1w'>
                <Bloc>
                  <div className='flex flex-column align-center'>
                    <TitreInfobulleConteneur>
                      <Titre
                        baliseHtml='h2'
                        className='fr-text--md fr-mb-2w fr-py-1v'
                        estInline
                      >
                        Taux d’avancement moyen
                      </Titre>
                      <Infobulle idHtml='infobulle-chantiers-jauges'>
                        {INFOBULLE_CONTENUS.chantiers.jauges}
                      </Infobulle>
                    </TitreInfobulleConteneur>
                    <AvancementsFicheTerritoriale avancementGlobalTerritoire={avancementGlobalTerritoire} />
                  </div>
                </Bloc>
              </div>
              <div className='fiche-territoriale__avancement--annuel'>
                <Bloc>
                  <div className='flex flex-column align-center'>
                    <TitreInfobulleConteneur>
                      <Titre
                        baliseHtml='h2'
                        className='fr-text--md fr-mb-2w fr-py-1v'
                        estInline
                      >
                        Taux d’avancement de l’année en cours
                      </Titre>
                    </TitreInfobulleConteneur>
                    <div className='fiche-territoriale__avancement--barre-progression'>
                      <BarreDeProgression
                        afficherTexte
                        bordure={null}
                        fond='bleu'
                        positionTexte='dessus'
                        taille='md'
                        valeur={avancementAnnuelTerritoire}
                        variante='primaire'
                      />
                    </div>
                    <div className='w-full flex justify-center fr-mt-2w'>
                      <span>
                        { `Année en cours : ${new Date().getFullYear()}` }
                      </span>
                    </div>
                  </div>
                </Bloc>
              </div>
            </div>
            <div className='fr-col-8 fr-pl-1v fiche-territoriale__meteo'>
              <Bloc>
                <div className='fr-grid-row'>
                  <TitreInfobulleConteneur>
                    <Titre
                      baliseHtml='h2'
                      className='fr-text--md fr-mb-0 fr-py-1v'
                      estInline
                    >
                      Répartition des météos renseignées
                    </Titre>
                    <Infobulle idHtml='infobulle-chantiers-météos'>
                      {INFOBULLE_CONTENUS.chantiers.météos}
                    </Infobulle>
                  </TitreInfobulleConteneur>
                  <ul className='fr-raw-list'>
                    <li className='fr-mb-1w'>
                      <div className='flex align-center'>
                        <div className='fiche-territoriale__avancement--meteo'>
                          <MétéoPicto
                            météo='ORAGE'
                          />
                        </div>
                        <span className='fr-pl-1w fr-text--sm fr-m-0'>
                          Le déploiement du chantier prioritaire rencontrent des difficultés importantes qui empêche la réalisation des objectifs fixée.
                        </span>
                      </div>
                    </li>
                    <li className='fr-mb-1w'>
                      <div className='flex align-center'>
                        <div className='fiche-territoriale__avancement--meteo'>
                          <MétéoPicto
                            météo='NUAGE'
                          />
                        </div>
                        <span className='fr-pl-1w fr-text--sm fr-m-0'>
                          Le déploiement du chantier prioritaire rencontre des obstacles importants. Une intervention
                          directe du directeur de projet est nécessaire afin de résoudre les difficultés.
                        </span>
                      </div>
                    </li>
                    <li className='fr-mb-1w fr-text--sm'>
                      <div className='flex align-center'>
                        <div className='fiche-territoriale__avancement--meteo'>
                          <MétéoPicto
                            météo='COUVERT'
                          />
                        </div>
                        <span className='fr-pl-1w fr-text--sm fr-m-0'>
                          Le déploiement du chantier prioritaire ne rencontre pas de difficultés majeures. Les possibles
                          difficultés sont résolues directement sur le terrain.
                        </span>
                      </div>
                    </li>
                    <li className='fr-mb-1w'>
                      <div className='flex align-center'>
                        <div className='fiche-territoriale__avancement--meteo'>
                          <MétéoPicto
                            météo='SOLEIL'
                          />
                        </div>
                        <span className='fr-pl-1w fr-text--sm fr-m-0'>
                          Le chantier prioritaire se déploie sans difficultés. Aucun appui nécessaire.
                        </span>
                      </div>
                    </li>
                  </ul>
                  <div className='fiche-territoriale__contenu--meteo w-full fr-px-2w fr-mb-1w'>
                    <RépartitionMétéo météos={répartitionMétéos} />
                  </div>
                  <span className='fr-mb-0 fr-text--sm'>
                    Les météos sont saisies plusieurs fois par an par un responsable local sous la responsabilité des préfectures
                  </span>
                </div>
              </Bloc>
            </div>
          </div>
          <div className='fr-px-2w fr-mt-2w'>
            <Bloc>
              <div className='flex w-full justify-between'>
                <Titre
                  baliseHtml='h2'
                  className='fr-text--lg fr-mb-0 fr-py-1v'
                  estInline
                >
                  {`Liste des chantiers (${chantiersFicheTerritoriale.length})`}
                </Titre>
                <div className='flex align-center'>
                  <div />
                  <span
                    className='fr-text--xs fr-m-0 fr-ml-2w fr-badge fr-badge--no-icon fr-badge--success'
                  >
                    Avancement positif
                  </span>
                  <span
                    className='fr-text--xs fr-m-0 fr-ml-2w fr-badge fr-badge--no-icon fr-badge--warning'
                  >
                    Léger retard
                  </span>
                  <span
                    className='fr-text--xs fr-m-0 fr-ml-2w fr-badge fr-badge--no-icon fr-badge--error'
                  >
                    Retard important
                  </span>
                </div>
              </div>
              <TableauFicheTerritoriale chantiersFicheTerritoriale={chantiersFicheTerritoriale} />
            </Bloc>
          </div>
        </div>
      </main>
    </PageFicheTerritorialeStyled>
  );
};
