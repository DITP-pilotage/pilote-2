import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useMemo, useState } from 'react';
import { Rubrique } from '@/components/_commons/Sommaire/Sommaire.interface';
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
import { typesObjectifChantier } from '@/server/domain/chantier/objectif/Objectif.interface';
import { typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs, { listeRubriquesIndicateurs } from './Indicateurs/Indicateurs';
import PageChantierProps from './PageChantier.interface';
import ResponsablesPageProjetStructurant from './Responsables/Responsables';
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

  const listeRubriques: Rubrique[] = useMemo(() => {
    const rubriquesIndicateursNonVides = listeRubriquesIndicateurs.filter(
      (rubriqueIndicateur) => (
        indicateurs.some(indicateur => indicateur.type === rubriqueIndicateur.typeIndicateur)
      ),
    );
    let rubriques = [];

    rubriques = territoireSélectionné!.maille === 'nationale' ? [
      { nom: 'Avancement du chantier', ancre: 'avancement' },
      { nom: 'Responsables', ancre: 'responsables' },
      { nom: 'Météo et synthèse des résultats', ancre: 'synthèse' },
      { nom: 'Répartition géographique', ancre: 'cartes' },
      { nom: 'Objectifs', ancre: 'objectifs' },
      { nom: 'Décisions stratégiques', ancre: 'décisions-stratégiques' },
      { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
      { nom: 'Commentaires', ancre: 'commentaires' },
    ] : [
      { nom: 'Avancement du chantier', ancre: 'avancement' },
      { nom: 'Responsables', ancre: 'responsables' },
      { nom: 'Météo et synthèse des résultats', ancre: 'synthèse' },
      { nom: 'Répartition géographique', ancre: 'cartes' },
      { nom: 'Objectifs', ancre: 'objectifs' },
      { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
      { nom: 'Commentaires', ancre: 'commentaires' },
    ];

    if (rubriquesIndicateursNonVides.length === 0)
      rubriques = rubriques.filter(rubrique => rubrique.nom != 'Indicateurs');

    return rubriques;
  }, [indicateurs, territoireSélectionné]);

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
          Pilote - Chantiers prioritaires / Extraction de la page chantier générée le
          {' '}
          {new Date().toLocaleString('FR-fr')}
        </div>
        <BoutonSousLigné
          classNameSupplémentaires="fr-link--icon-left fr-fi-arrow-right-line fr-sr-only-xl fr-m-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          type="button"
        >
          Filtres
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
                        <ResponsablesPageProjetStructurant responsables={chantier.responsables} />
                      </section>
                    </>
                  }
                  <section
                    className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-7'} fr-col-12 rubrique`}
                    id="synthèse"
                  >
                    <Titre
                      baliseHtml='h2'
                      className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    >
                      Météo et synthèse des résultats
                    </Titre>
                    <SynthèseDesRésultats
                      modeÉcriture={territoireSélectionné?.accèsSaisiePublication}
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
                    <Titre
                      baliseHtml='h2'
                      className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    >
                      Objectifs
                    </Titre>
                    <Objectifs
                      maille='nationale'
                      modeÉcriture={modeÉcritureObjectifs}
                      nomTerritoire='National'
                      objectifs={objectifs}
                      réformeId={chantier.id}
                      typesObjectif={typesObjectifChantier}
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
                      <Titre
                        baliseHtml="h2"
                        className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                      >
                        Décisions stratégiques
                      </Titre>
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
                    <Titre
                      baliseHtml='h2'
                      className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    >
                      Commentaires du chantier
                    </Titre>
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
