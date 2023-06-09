import { useState } from 'react';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import Sommaire from '@/components/_commons/Sommaire/Sommaire';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import Objectifs from '@/client/components/_commons/Objectifs/Objectifs';
import { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import Titre from '@/client/components/_commons/Titre/Titre';
import { listeRubriquesIndicateursProjetStructurant, listeRubriquesProjetStructurant } from '@/client/utils/rubriques';
import Indicateurs from '@/client/components/_commons/Indicateurs/Indicateurs';
import TitreInfobulleConteneur from '@/client/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import Infobulle from '@/client/components/_commons/Infobulle/Infobulle';
import ResponsablesPageProjetStructurant from './Responsables/Responsables';
import PageProjetStructurantProps from './PageProjetStructurant.interface';
import PageProjetStructurantEnTête from './EnTête/EnTête';
import PageProjetStructurantStyled from './PageProjetStructurant.styled';
import AvancementPageProjetStructurant from './Avancement/Avancement';
import usePageProjetStructurant from './usePageProjetStructurant';

export default function PageProjetStructurant({ projetStructurant, indicateurs, détailsIndicateurs }: PageProjetStructurantProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);  
  const { synthèseDesRésultats, objectif, commentaires } = usePageProjetStructurant(projetStructurant.id, projetStructurant.territoire.code);

  return (
    <PageProjetStructurantStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <Sommaire rubriques={listeRubriquesProjetStructurant(indicateurs.map(i => i.type))} />
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
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-my-0 fr-pb-4w">
            <section
              className='fr-col-12 fr-col-md-6 fr-py-0 rubrique'
              id='avancement'
            >
              <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4'
                  estInline
                >
                  Avancement du projet
                </Titre>
                <Infobulle idHtml="infobulle-projetStructurant-avancement">
                  { INFOBULLE_CONTENUS.projetStructurant.avancements }
                </Infobulle>
              </TitreInfobulleConteneur>
              <AvancementPageProjetStructurant
                avancement={projetStructurant.avancement}
                territoireNom={projetStructurant.territoire.nomAffiché}
              />
            </section>
            <section
              className='fr-col-12 fr-col-md-6 fr-py-0 rubrique'
              id="responsables"
            >
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0 fr-py-1v'
              >
                Responsables
              </Titre>
              <ResponsablesPageProjetStructurant 
                nomTerritoire={projetStructurant.territoire.nomAffiché}
                responsables={projetStructurant.responsables}
              />
            </section>
          </div>
          <section
            className='rubrique fr-pb-4w'
            id='synthèse'
          >
            <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
              <Titre
                baliseHtml='h2'
                className='fr-h4'
                estInline
              >
                Météo et synthèse des résultats
              </Titre>
              <Infobulle idHtml="infobulle-projetStructurant-météoEtSynthèse">
                {INFOBULLE_CONTENUS.projetStructurant.météoEtSynthèseDesRésultats}
              </Infobulle>
            </TitreInfobulleConteneur>
            <SynthèseDesRésultats
              estInteractif={false}
              nomTerritoire={projetStructurant.territoire.nomAffiché}
              rechargerRéforme={() => {}}
              réformeId={projetStructurant.id}
              synthèseDesRésultatsInitiale={synthèseDesRésultats}
            />
          </section>
          <section
            className="rubrique fr-pb-4w"
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
              <Infobulle idHtml="infobulle-projetStructurant-objectifs">
                {INFOBULLE_CONTENUS.projetStructurant.objectifs}
              </Infobulle>
            </TitreInfobulleConteneur>
            <Objectifs
              estInteractif={false}
              maille={projetStructurant.territoire.maille}
              nomTerritoire={projetStructurant.territoire.nomAffiché}
              objectifs={[objectif]}
              réformeId={projetStructurant.id}
              typesObjectif={[typeObjectifProjetStructurant]}
            />
          </section>
          {
            !!détailsIndicateurs && indicateurs.length > 0 &&
              <section
                className="rubrique fr-pb-4w"
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
                  listeRubriquesIndicateurs={listeRubriquesIndicateursProjetStructurant}
                  territoireProjetStructurant={projetStructurant.territoire}
                  typeDeRéforme='projet structurant'
                />
              </section>
          }
          <section
            className="rubrique fr-pb-4w"
            id="commentaires"
          >
            <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
              <Titre
                baliseHtml='h2'
                className='fr-h4'
                estInline
              >
                Commentaires du projet structurant
              </Titre>
              <Infobulle idHtml="infobulle-projetStructurant-commentaires">
                {INFOBULLE_CONTENUS.projetStructurant.commentaires}
              </Infobulle>
            </TitreInfobulleConteneur>
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
      </main>
    </PageProjetStructurantStyled>
  );
}
