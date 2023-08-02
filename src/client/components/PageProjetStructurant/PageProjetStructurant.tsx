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
import BoutonSousLigné from '@/client/components/_commons/BoutonSousLigné/BoutonSousLigné';
import ResponsablesPageProjetStructurant from './Responsables/Responsables';
import PageProjetStructurantProps from './PageProjetStructurant.interface';
import PageProjetStructurantEnTête from './EnTête/EnTête';
import PageProjetStructurantStyled from './PageProjetStructurant.styled';
import AvancementPageProjetStructurant from './Avancement/Avancement';
import usePageProjetStructurant from './usePageProjetStructurant';

export default function PageProjetStructurant({ projetStructurant, indicateurs, détailsIndicateurs }: PageProjetStructurantProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);  
  const { synthèseDesRésultats, objectif, commentaires, modeÉcriture } = usePageProjetStructurant(projetStructurant.id, projetStructurant.territoire.code);

  return (
    <PageProjetStructurantStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <Sommaire
          auClic={() => setEstOuverteBarreLatérale(false)}
          rubriques={listeRubriquesProjetStructurant(indicateurs.map(i => i.type))}
        />
      </BarreLatérale>
      <main className='fr-pb-5w'>
        <BoutonSousLigné
          classNameSupplémentaires="fr-link--icon-left fr-fi-arrow-right-line fr-hidden-xl fr-m-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          type="button"
        >
          Sommaire
        </BoutonSousLigné>
        <PageProjetStructurantEnTête nomProjetStructurant={projetStructurant.nom} />
        <div className='fr-container--fluid fr-py-2w fr-px-md-4w'>
          <div className="grid-template fr-pb-4w">
            <section
              className='rubrique'
              id='avancement'
            >
              <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-py-1v'
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
              className='rubrique'
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
                className='fr-h4 fr-mb-0 fr-py-1v'
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
                className='fr-h4 fr-mb-0 fr-py-1v'
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
            <div>
              <TitreInfobulleConteneur className='fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-0 fr-py-1v'
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
                maille={projetStructurant.territoire.maille}
                modeÉcriture={modeÉcriture}
                nomTerritoire={projetStructurant.territoire.nomAffiché}
                réformeId={projetStructurant.id}
                typesCommentaire={typesCommentaireProjetStructurant}
              />
            </div>
          </section>
        </div>
      </main>
    </PageProjetStructurantStyled>
  );
}
