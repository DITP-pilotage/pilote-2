import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import Loader from '@/components/_commons/Loader/Loader';
import SynthèseDesRésultats from '@/client/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Sommaire from '@/client/components/_commons/Sommaire/Sommaire';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import Titre from '@/components/_commons/Titre/Titre';
import Objectifs from '@/components/_commons/Objectifs/Objectifs';
import { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import { typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import Indicateurs from '@/client/components/_commons/Indicateurs/Indicateurs';
import { listeRubriquesChantier, listeRubriquesIndicateursChantier } from '@/client/utils/rubriques';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import PageChantierProps from './PageChantier.interface';
import ResponsablesPageChantier from './Responsables/Responsables';
import PageChantierEnTête from './EnTête/EnTête';
import Cartes from './Cartes/Cartes';
import PageChantierStyled from './PageChantier.styled';
import usePageChantier from './usePageChantier';
import DécisionsStratégiques from './DécisionsStratégiques/DécisionsStratégiques';

export default function PageChantier({ indicateurs, chantierId }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const {
    détailsIndicateurs,
    commentaires,
    synthèseDesRésultats,
    objectifs,
    décisionStratégique,
    chantier,
    rechargerChantier,
    avancements,
    territoireSélectionné,
    territoires,
  } = usePageChantier(chantierId);

  const modeÉcritureObjectifs = territoires.some(t => t.maille === 'nationale' && t.accèsSaisiePublication === true);
  const listeRubriques = listeRubriquesChantier(indicateurs.map(i => i.type), territoireSélectionné!.maille);

  return (
    <PageChantierStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
        <Sommaire rubriques={listeRubriques} />
      </BarreLatérale>
      <main className='fr-pb-5w'>
        <div className="texte-impression fr-mb-5w">
          Pilote   •   Extrait de la page chantier généré le
          {' '}
          {new Date().toLocaleString('FR-fr')}
        </div>
        <BoutonSousLigné
          classNameSupplémentaires="fr-link--icon-left fr-fi-arrow-right-line fr-sr-only-xl fr-m-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          type="button"
        >
          Sommaire
        </BoutonSousLigné>
        {
          chantier !== null ? (
            <>
              <PageChantierEnTête
                afficheLeBoutonImpression
                chantier={chantier}
              />
              <div className='fr-container--fluid fr-py-2w fr-px-md-4w'>
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  {
                    avancements !== null &&
                    <>
                      <section
                        className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-7' : 'fr-col-xl-12'} fr-col-12 rubrique`}
                        id="avancement"
                      >
                        <Titre
                          baliseHtml='h2'
                          className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                        >
                          Avancement du chantier
                        </Titre>
                        <AvancementChantier
                          avancements={avancements}
                          chantierId={chantierId}
                        />
                      </section>
                      <section
                        className='fr-col-xl-5 fr-col-12 rubrique'
                        id="responsables"
                      >
                        <Titre
                          baliseHtml='h2'
                          className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                        >
                          Responsables
                        </Titre>
                        <ResponsablesPageChantier responsables={chantier.responsables} />
                      </section>
                    </>
                  }
                  <section
                    className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-7'} fr-col-12 rubrique`}
                    id="synthèse"
                  >
                    <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                      <Titre
                        baliseHtml='h2'
                        className='fr-h4'
                        estInline
                      >
                        Météo et synthèse des résultats
                      </Titre>
                      <Infobulle idHtml="infobulle-chantier-météoEtSynthèseDesRésultats">
                        { INFOBULLE_CONTENUS.chantier.météoEtSynthèseDesRésultats }
                      </Infobulle>
                    </TitreInfobulleConteneur>
                    <SynthèseDesRésultats
                      modeÉcriture={territoireSélectionné!.accèsSaisiePublication}
                      nomTerritoire={territoireSélectionné!.nomAffiché}
                      rechargerRéforme={rechargerChantier}
                      réformeId={chantier.id}
                      synthèseDesRésultatsInitiale={synthèseDesRésultats}
                    />
                  </section>
                </div>
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  <section
                    className="fr-col-12 rubrique"
                    id="cartes"
                  >
                    <Titre
                      baliseHtml='h2'
                      className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    >
                      Répartition géographique
                    </Titre>
                    <Cartes chantierMailles={chantier.mailles} />
                  </section>
                </div>
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  <section
                    className="fr-col-12 rubrique"
                    id="objectifs"
                  >
                    <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                      <Titre
                        baliseHtml='h2'
                        className='fr-h4'
                        estInline
                      >
                        Objectifs
                      </Titre>
                      <Infobulle idHtml="infobulle-chantier-objectifs">
                        { INFOBULLE_CONTENUS.chantier.objectifs }
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
                    <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                      <section
                        className="fr-col-12 rubrique"
                        id="indicateurs"
                      >
                        <Titre
                          baliseHtml='h2'
                          className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                        >
                          Indicateurs
                        </Titre>
                        <Indicateurs
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
                  <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                    <section
                      className="fr-col-12 rubrique"
                      id="décisions-stratégiques"
                    >
                      <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                        <Titre
                          baliseHtml="h2"
                          className="fr-h4"
                          estInline
                        >
                          Décisions stratégiques
                        </Titre>
                        <Infobulle idHtml="infobulle-chantier-décisionsStratégiques">
                          { INFOBULLE_CONTENUS.chantier.décisionsStratégiques }
                        </Infobulle>
                      </TitreInfobulleConteneur>
                      <DécisionsStratégiques
                        chantierId={chantier.id}
                        décisionStratégique={décisionStratégique}
                        modeÉcriture={territoireSélectionné?.accèsSaisiePublication}
                      />
                    </section>
                  </div>
                }
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  <section
                    className="fr-col-12 rubrique"
                    id="commentaires"
                  >
                    <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                      <Titre
                        baliseHtml='h2'
                        className='fr-h4'
                        estInline
                      >
                        Commentaires du chantier
                      </Titre>
                      <Infobulle idHtml="infobulle-chantier-décisionsStratégiques">
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
                      modeÉcriture={territoireSélectionné!.accèsSaisiePublication}
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
