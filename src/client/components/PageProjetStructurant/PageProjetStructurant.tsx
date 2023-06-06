import { useState } from 'react';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import Sommaire from '@/components/_commons/Sommaire/Sommaire';
import { Rubrique } from '@/components/_commons/Sommaire/Sommaire.interface';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import Objectifs from '@/client/components/_commons/Objectifs/Objectifs';
import { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import Titre from '@/client/components/_commons/Titre/Titre';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import ResponsablesPageProjetStructurant from './Responsables/Responsables';
import PageProjetStructurantProps from './PageProjetStructurant.interface';
import PageProjetStructurantEnTête from './EnTête/EnTête';
import PageProjetStructurantStyled from './PageProjetStructurant.styled';
import AvancementPageProjetStructurant from './Avancement/Avancement';
import usePageProjetStructurant from './usePageProjetStructurant';

export default function PageProjetStructurant({ projetStructurant }: PageProjetStructurantProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);  
  const { synthèseDesRésultats, objectif, commentaires } = usePageProjetStructurant(projetStructurant.id, projetStructurant.territoire.code);

  const listeRubriques: Rubrique[] =
    [
      { nom: 'Avancement du projet', ancre: 'avancement' },
      { nom: 'Responsables', ancre: 'responsables' },
      { nom: 'Météo et synthèse des résultats', ancre: 'synthèse' },
      { nom: 'Objectifs', ancre: 'objectifs' },
      { nom: 'Décisions stratégiques', ancre: 'décisions-stratégiques' },
      { nom: 'Indicateurs', ancre: 'indicateurs' },
      { nom: 'Commentaires', ancre: 'commentaires' },
    ];

  return (
    <PageProjetStructurantStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <Sommaire rubriques={listeRubriques} />
      </BarreLatérale>
      <main className='fr-pb-5w'>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir le menu latéral"
          type="button"
        >
          Menu latéral
        </button>
        <PageProjetStructurantEnTête nomProjetStructurant={projetStructurant.nom} />
        <div className='fr-p-4w'>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-my-0 fr-pb-1w">
            <section
              className='fr-col rubrique'
              id='avancement'
            >
              <div>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    estInlineBlock
                  >
                    Avancement du projet
                  </Titre>
                  <Infobulle>
                    { INFOBULLE_CONTENUS.projetStructurant.avancements }
                  </Infobulle>
                </TitreInfobulleConteneur>
              </div>
              <AvancementPageProjetStructurant
                avancement={projetStructurant.avancement}
                territoireNom={projetStructurant.territoire.nomAffiché}
              />
            </section>
            <section
              className='fr-col rubrique'
              id="responsables"
            >
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Responsables
              </Titre>
              <ResponsablesPageProjetStructurant 
                nomTerritoire={projetStructurant.territoire.nomAffiché}
                responsables={projetStructurant.responsables}
              />
            </section>
            <section
              className='fr-col-12 rubrique'
              id='synthèse'
            >
              <div>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    estInlineBlock
                  >
                    Météo et synthèse des résultats
                  </Titre>
                  <Infobulle>
                    { INFOBULLE_CONTENUS.projetStructurant.météoEtSynthèseDesRésultats }
                  </Infobulle>
                </TitreInfobulleConteneur>
              </div>
              <SynthèseDesRésultats
                estInteractif={false}
                nomTerritoire={projetStructurant.territoire.nomAffiché}
                rechargerRéforme={() => {}}
                réformeId={projetStructurant.id}
                synthèseDesRésultatsInitiale={synthèseDesRésultats}
              />
            </section>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <section
              className="fr-col-12 rubrique"
              id="objectifs"
            >
              <div>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    estInlineBlock
                  >
                    Objectifs
                  </Titre>
                  <Infobulle>
                    { INFOBULLE_CONTENUS.projetStructurant.objectifs }
                  </Infobulle>
                </TitreInfobulleConteneur>
              </div>
              <Objectifs
                estInteractif={false}
                maille={projetStructurant.territoire.maille}
                nomTerritoire={projetStructurant.territoire.nomAffiché}
                objectifs={[objectif]}
                réformeId={projetStructurant.id}
                typesObjectif={[typeObjectifProjetStructurant]}
              />
            </section>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <section
              className="fr-col-12 rubrique"
              id="commentaires"
            >
              <div>
                <TitreInfobulleConteneur>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                    estInlineBlock
                  >
                    Commentaires du projet structurant
                  </Titre>
                  <Infobulle>
                    { INFOBULLE_CONTENUS.projetStructurant.commentaires }
                  </Infobulle>
                </TitreInfobulleConteneur>
              </div>
              <Commentaires
                commentaires={commentaires}
                estInteractif={false}
                maille={projetStructurant.territoire.maille}
                nomTerritoire={projetStructurant.territoire.nomAffiché}
                réformeId={projetStructurant.id}
                typesCommentaire={typesCommentaireProjetStructurant}
              />
            </section>
          </div>
        </div>
      </main>
    </PageProjetStructurantStyled>
  );
}
