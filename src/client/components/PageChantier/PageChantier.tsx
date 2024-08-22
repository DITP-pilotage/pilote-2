import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-media/icons-media.min.css';
import { FunctionComponent, useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoiresNew/SélecteursMaillesEtTerritoires';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Commentaires from '@/components/_commons/CommentairesNew/Commentaires';
import SynthèseDesRésultats from '@/client/components/_commons/SynthèseDesRésultatsNew/SynthèseDesRésultats';
import Sommaire from '@/client/components/_commons/Sommaire/Sommaire';
import Titre from '@/components/_commons/Titre/Titre';
import Objectifs from '@/components/_commons/ObjectifsNew/Objectifs';
import { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import IndicateursChantier from '@/components/_commons/IndicateursChantier/IndicateursChantier';
import { listeRubriquesChantier, listeRubriquesIndicateursChantier } from '@/client/utils/rubriques';
import ResponsablesPageChantier from '@/components/PageChantier/ResponsablesChantier/ResponsablesChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurPondération } from '@/components/PageChantier/PageChantier.interface';
import { SynthèseDesRésultatsContrat } from '@/server/chantiers/app/contrats/SynthèseDesRésultatsContrat';
import { CommentaireChantierContrat } from '@/server/chantiers/app/contrats/CommentaireChantierContrat';
import { ObjectifChantierContrat } from '@/server/chantiers/app/contrats/ObjectifChantierContrat';
import { DecisionStrategiqueChantierContrat } from '@/server/chantiers/app/contrats/DecisionStrategiqueChantierContrat';
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { AvancementChantierContrat } from '@/components/PageChantier/AvancementChantier';
import { CoordinateurTerritorial, ResponsableLocal } from '@/server/domain/territoire/Territoire.interface';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import PageChantierEnTête from './EnTête/EnTête';
import Cartes from './Cartes/Cartes';
import PageChantierStyled from './PageChantier.styled';
import usePageChantier from './usePageChantier';
import DécisionsStratégiques from './DécisionsStratégiques/DécisionsStratégiques';

interface PageChantierProps {
  indicateurs: Indicateur[]
  chantier: Chantier
  territoireCode: string
  territoiresCompares: string[]
  mailleSelectionnee: MailleInterne
  synthèseDesRésultats: SynthèseDesRésultatsContrat
  commentaires: CommentaireChantierContrat
  objectifs: ObjectifChantierContrat
  décisionStratégique: DecisionStrategiqueChantierContrat
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: Record<string, DétailsIndicateurTerritoire>
  avancements: AvancementChantierContrat
  indicateurPondérations: IndicateurPondération[]
  listeResponsablesLocaux: ResponsableLocal[]
  listeCoordinateursTerritorials: CoordinateurTerritorial[]
}

const PageChantier: FunctionComponent<PageChantierProps> = ({
  indicateurs,
  chantier,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  synthèseDesRésultats,
  commentaires,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  objectifs,
  décisionStratégique,
  avancements,
  indicateurPondérations,
  listeResponsablesLocaux,
  listeCoordinateursTerritorials,
}: PageChantierProps) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('md');
  const [estVisibleEnMobile, setEstVisibleEnMobile] = useState(false);

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const {
    estAutoriseAImporterDesIndicateurs,
    estAutoriseAVoirLeBoutonFicheConducteur,
    estAutoriseAVoirLesPropositionsDeValeurActuelle,
    estAutoriseAModifierLesPublications,
    estAutoriseAModifierLesObjectifs,
  } = usePageChantier(chantier, territoireSélectionné);

  const listeRubriques = listeRubriquesChantier(indicateurs.map(indicateur => indicateur.type), territoireSélectionné.maille);

  return (
    <PageChantierStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          {
            estVueMobile && estVisibleEnMobile ? (
              <Titre
                baliseHtml='h3'
                className='fr-h6 fr-mb-2w fr-mt-0 fr-col-8'
              >
                Maille géographique
              </Titre>
            ) : null
          }        
          <SélecteursMaillesEtTerritoires
            chantierMailles={chantier.mailles}
            estVisibleEnMobile={estVisibleEnMobile}
            estVueMobile={estVueMobile}
            mailleSelectionnee={mailleSelectionnee}
            pathname='/chantier/[id]/[territoireCode]'
            territoireCode={territoireCode}
          />
        </BarreLatéraleEncart>
        <Sommaire
          auClic={() => setEstOuverteBarreLatérale(false)}
          rubriques={listeRubriques}
        />
      </BarreLatérale>
      <main className='fr-pb-5w w-full'>
        <div className='bouton-filtrer fr-hidden-lg fr-py-1w fr-px-1v'>
          <button
            className='fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-equalizer-fill fr-text-title--blue-france'
            onClick={() => {
              setEstOuverteBarreLatérale(true);
              setEstVisibleEnMobile(true);
            }}
            title='Filtrer'
            type='button'
          >
            Filtrer
          </button>
        </div>
        <PageChantierEnTête
          afficheLeBoutonFicheConducteur={estAutoriseAVoirLeBoutonFicheConducteur}
          afficheLeBoutonImpression
          afficheLeBoutonMiseAJourDonnee={estAutoriseAImporterDesIndicateurs}
          chantier={chantier}
          responsables={chantier.responsables}
          territoireCode={territoireCode}
        />
        <div className='fr-container--fluid fr-py-2w fr-px-md-2w'>
          <div
            className={`grid-template ${territoireSélectionné.maille === 'nationale' ? 'layout--nat' : 'layout--dept-reg'}`}
          >
            <section
              className='rubrique'
              id='avancement'
            >
              <TitreInfobulleConteneur className='fr-mb-1w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-py-1v'
                  estInline
                >
                  Avancement du chantier
                </Titre>
                {
                  process.env.NEXT_PUBLIC_FF_INFOBULLE_PONDERATION === 'true' && (
                    indicateurPondérations.length === 0
                      ? (
                        <Infobulle
                          idHtml='infobulle-chantier-météoEtSynthèseDesRésultats'
                        >
                          {INFOBULLE_CONTENUS.chantier.avancement.aucunIndicateur(territoireSélectionné.maille)}
                        </Infobulle>
                      ) : (
                        indicateurPondérations.length === 1
                          ? (
                            <Infobulle
                              idHtml='infobulle-chantier-météoEtSynthèseDesRésultats'
                            >
                              {INFOBULLE_CONTENUS.chantier.avancement.unSeulIndicateur(territoireSélectionné.maille, indicateurPondérations[0])}
                            </Infobulle>
                          )
                          : (
                            <Infobulle
                              idHtml='infobulle-chantier-météoEtSynthèseDesRésultats'
                            >
                              {INFOBULLE_CONTENUS.chantier.avancement.plusieursIndicateurs(territoireSélectionné.maille, indicateurPondérations)}
                            </Infobulle>
                          )
                      )
                  )
                }
              </TitreInfobulleConteneur>
              <AvancementChantier
                avancements={avancements}
                territoireCode={territoireCode}
              />
            </section>
            <section
              className='rubrique'
              id='synthèse'
            >
              <TitreInfobulleConteneur className='fr-mb-1w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-py-1v'
                  estInline
                >
                  Météo et synthèse des résultats
                </Titre>
                <Infobulle idHtml='infobulle-chantier-météoEtSynthèseDesRésultats'>
                  {INFOBULLE_CONTENUS.chantier.météoEtSynthèseDesRésultats}
                </Infobulle>
              </TitreInfobulleConteneur>
              <SynthèseDesRésultats
                modeÉcriture={estAutoriseAModifierLesPublications}
                nomTerritoire={territoireSélectionné.nomAffiché}
                réformeId={chantier.id}
                synthèseDesRésultatsInitiale={synthèseDesRésultats ?? null}
              />
            </section>
            <section
              className='rubrique'
              id='responsables'
            >
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Responsables
              </Titre>
              <ResponsablesPageChantier
                afficheResponsablesLocaux={territoireSélectionné.maille !== 'nationale'}
                libelléChantier={chantier.nom}
                listeCoordinateursTerritorials={listeCoordinateursTerritorials}
                listeDirecteursProjets={chantier.responsables.directeursProjet}
                listeResponsablesLocaux={listeResponsablesLocaux}
                maille={territoireSélectionné.maille}
              />
            </section>
          </div>
          {
            (
              !!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee]
              || !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee]
              || chantier.estTerritorialisé
            ) ? (
              <div className='fr-my-2w'>
                <section
                  className='rubrique'
                  id='cartes'
                >
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Répartition géographique
                  </Titre>
                  <Cartes
                    afficheCarteAvancement={!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] || chantier.estTerritorialisé}
                    afficheCarteMétéo={!!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] || chantier.estTerritorialisé}
                    chantierMailles={chantier.mailles}
                    mailleSelectionnee={mailleSelectionnee}
                    territoireCode={territoireCode}
                  />
                </section>
              </div>
              ) : null
          }
          <div className='fr-my-2w'>
            <section
              className='rubrique'
              id='objectifs'
            >
              <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-py-1v'
                  estInline
                >
                  Objectifs
                </Titre>
                <Infobulle idHtml='infobulle-chantier-objectifs'>
                  {INFOBULLE_CONTENUS.chantier.objectifs}
                </Infobulle>
              </TitreInfobulleConteneur>
              <Objectifs
                estEtendu={false}
                maille='nationale'
                modeÉcriture={estAutoriseAModifierLesObjectifs}
                nomTerritoire='National'
                objectifs={objectifs[chantier.id]}
                réformeId={chantier.id}
                territoireCode={territoireCode}
                tousLesTypesDObjectif={typesObjectif}
              />
            </section>
          </div>
          {
            indicateurs.length > 0 ? (
              <div className='fr-my-2w'>
                <section
                  className='rubrique'
                  id='indicateurs'
                >
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Indicateurs
                  </Titre>
                  <IndicateursChantier
                    chantierEstTerritorialisé={chantier.estTerritorialisé}
                    detailsIndicateursTerritoire={detailsIndicateursTerritoire}
                    détailsIndicateurs={détailsIndicateurs}
                    estAutoriseAVoirLesPropositionsDeValeurActuelle={estAutoriseAVoirLesPropositionsDeValeurActuelle}
                    indicateurs={indicateurs}
                    listeRubriquesIndicateurs={listeRubriquesIndicateursChantier}
                    mailleSelectionnee={mailleSelectionnee}
                    territoireCode={territoireCode}
                    territoiresCompares={territoiresCompares}
                  />
                </section>
              </div>
            ) : null
          }
          {
            territoireSélectionné.maille === 'nationale' ? (
              <div className='fr-my-2w'>
                <section
                  className='rubrique'
                  id='décisions-stratégiques'
                >
                  <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                    <Titre
                      baliseHtml='h2'
                      className='fr-h4'
                      estInline
                    >
                      Décisions stratégiques
                    </Titre>
                    <Infobulle idHtml='infobulle-chantier-décisionsStratégiques'>
                      {INFOBULLE_CONTENUS.chantier.décisionsStratégiques}
                    </Infobulle>
                  </TitreInfobulleConteneur>
                  <DécisionsStratégiques
                    chantierId={chantier.id}
                    décisionStratégique={décisionStratégique ?? null}
                    modeÉcriture={estAutoriseAModifierLesPublications}
                    territoireCode={territoireCode}
                  />
                </section>
              </div>
            ) : null
          }
          <div className='fr-my-2w'>
            <section
              className='rubrique'
              id='commentaires'
            >
              <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-py-1v'
                  estInline
                >
                  Commentaires du chantier
                </Titre>
                <Infobulle idHtml='infobulle-chantier-décisionsStratégiques'>
                  {
                    territoireSélectionné.maille === 'nationale'
                      ? INFOBULLE_CONTENUS.chantier.commentaires.territoireNational
                      : INFOBULLE_CONTENUS.chantier.commentaires.territoireNonNational
                  }
                </Infobulle>
              </TitreInfobulleConteneur>
              <Commentaires
                commentaires={commentaires[chantier.id]}
                maille={territoireSélectionné.maille}
                modeÉcriture={estAutoriseAModifierLesPublications}
                nomTerritoire={territoireSélectionné.nomAffiché}
                réformeId={chantier.id}
                territoireCode={territoireCode}
                typesCommentaire={territoireSélectionné.maille === 'nationale' ? typesCommentaireMailleNationale : typesCommentaireMailleRégionaleOuDépartementale}
              />
            </section>
          </div>
        </div>
      </main>
    </PageChantierStyled>
  );
};

export default PageChantier;
