import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import Loader from '@/components/_commons/Loader/Loader';
import SynthèseDesRésultats from '@/client/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Sommaire from '@/client/components/_commons/Sommaire/Sommaire';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import Titre from '@/components/_commons/Titre/Titre';
import Objectifs from '@/components/_commons/Objectifs/Objectifs';
import { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import Indicateurs from '@/client/components/_commons/Indicateurs/Indicateurs';
import { listeRubriquesChantier, listeRubriquesIndicateursChantier } from '@/client/utils/rubriques';
import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import PageChantierProps from './PageChantier.interface';
import ResponsablesPageChantier from './Responsables/Responsables';
import PageChantierEnTête from './EnTête/EnTête';
import Cartes from './Cartes/Cartes';
import PageChantierStyled from './PageChantier.styled';
import usePageChantier from './usePageChantier';
import DécisionsStratégiques from './DécisionsStratégiques/DécisionsStratégiques';

export default function PageChantier({ indicateurs, chantierId }: PageChantierProps) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  // TODO Mettre dans getServerSideProps !
  const {
    détailsIndicateurs,
    commentaires,
    synthèseDesRésultats,
    objectifs,
    décisionStratégique,
    chantier,
    rechargerChantier,
    avancements,
    modeÉcriture,
    modeÉcritureObjectifs,
    territoireSélectionné,
    indicateurPondérations,
    saisieIndicateurAutorisée,
    afficheLeBoutonFicheConducteur,
    responsableLocal,
    coordinateurTerritorial,
  } = usePageChantier(chantierId, indicateurs);
  // TODO Mettre dans getServerSideProps !

  const listeRubriques = listeRubriquesChantier(indicateurs.map(i => i.type), territoireSélectionné!.maille);
  return (
    <PageChantierStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires chantierMailles={chantier?.mailles} />
        </BarreLatéraleEncart>
        <Sommaire
          auClic={() => setEstOuverteBarreLatérale(false)}
          rubriques={listeRubriques}
        />
      </BarreLatérale>
      <main className='fr-pb-5w'>
        <BoutonSousLigné
          classNameSupplémentaires='fr-link--icon-left fr-fi-arrow-right-line fr-hidden-lg fr-m-2w'
          onClick={() => setEstOuverteBarreLatérale(true)}
          type='button'
        >
          Filtres
        </BoutonSousLigné>
        {
          chantier !== null ? (
            <>
              <PageChantierEnTête
                afficheLeBoutonFicheConducteur={afficheLeBoutonFicheConducteur}
                afficheLeBoutonImpression
                afficheLeBoutonMiseAJourDonnee={saisieIndicateurAutorisée}
                chantier={chantier}
              />
              <div className='fr-container--fluid fr-py-2w fr-px-md-2w'>
                <div className={`grid-template ${territoireSélectionné!.maille === 'nationale' ? 'layout--nat' : 'layout--dept-reg'}`}>
                  {
                    avancements !== null &&
                      <>
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
                              !!territoireSélectionné && process.env.NEXT_PUBLIC_FF_INFOBULLE_PONDERATION === 'true' && (
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
                            chantierId={chantierId}
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
                            afficheResponsablesLocaux={territoireSélectionné?.maille !== 'nationale'}
                            coordinateurTerritorial={coordinateurTerritorial}
                            responsables={chantier.responsables}
                            responsablesLocal={responsableLocal}
                          />
                        </section>
                      </>
                  }
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
                      modeÉcriture={modeÉcriture}
                      nomTerritoire={territoireSélectionné!.nomAffiché}
                      rechargerRéforme={rechargerChantier}
                      réformeId={chantier.id}
                      synthèseDesRésultatsInitiale={synthèseDesRésultats}
                    />
                  </section>
                </div>
                {
                  (!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSélectionnée] ||
                    !!chantier.météoDonnéeTerritorialisée[mailleSélectionnée] ||
                    !!chantier.estTerritorialisé) && (
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
                          afficheCarteAvancement={!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSélectionnée] || !!chantier.estTerritorialisé}  
                          afficheCarteMétéo={!!chantier.météoDonnéeTerritorialisée[mailleSélectionnée] || !!chantier.estTerritorialisé}  
                          chantierMailles={chantier.mailles}
                        />
                      </section>
                    </div>                   
                  )
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
                      maille='nationale'
                      modeÉcriture={modeÉcritureObjectifs}
                      nomTerritoire='National'
                      objectifs={objectifs}
                      réformeId={chantier.id}
                      typesObjectif={typesObjectif}
                    />
                  </section>
                </div>
                {
                  détailsIndicateurs !== null && indicateurs.length > 0 && (
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
                        <Indicateurs
                          chantierEstTerritorialisé={chantier.estTerritorialisé}
                          détailsIndicateurs={détailsIndicateurs}
                          indicateurs={indicateurs}
                          listeRubriquesIndicateurs={listeRubriquesIndicateursChantier}
                          typeDeRéforme='chantier'
                        />
                      </section>
                    </div>
                  )
                }
                {
                  territoireSélectionné!.maille === 'nationale' &&
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
                          décisionStratégique={décisionStratégique}
                          modeÉcriture={modeÉcriture}
                        />
                      </section>
                    </div>
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
                          territoireSélectionné!.maille === 'nationale'
                            ? INFOBULLE_CONTENUS.chantier.commentaires.territoireNational
                            : INFOBULLE_CONTENUS.chantier.commentaires.territoireNonNational
                        }
                      </Infobulle>
                    </TitreInfobulleConteneur>
                    <Commentaires
                      commentaires={commentaires}
                      maille={territoireSélectionné!.maille}
                      modeÉcriture={modeÉcriture}
                      nomTerritoire={territoireSélectionné!.nomAffiché}
                      réformeId={chantier.id}
                      typesCommentaire={territoireSélectionné!.maille === 'nationale' ? typesCommentaireMailleNationale : typesCommentaireMailleRégionaleOuDépartementale}
                    />
                  </section>
                </div>
              </div>
            </>
          ) : (
            <div className='loader'>
              <Loader />
            </div>
          )
        }
      </main>
    </PageChantierStyled>
  );
}
