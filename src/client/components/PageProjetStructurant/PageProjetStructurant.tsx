import { useState } from 'react';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import Sommaire from '@/components/_commons/Sommaire/Sommaire';
import { Rubrique } from '@/components/_commons/Sommaire/Sommaire.interface';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import Objectifs from '@/client/components/_commons/Objectifs/Objectifs';
import { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import ResponsablesPageProjetStructurant from './Responsables/Responsables';
import PageProjetStructurantProps from './PageProjetStructurant.interface';
import PageProjetStructurantEnTête from './EnTête/EnTête';
import PageProjetStructurantStyled from './PageProjetStructurant.styled';
import AvancementPageProjetStructurant from './Avancement/Avancement';
import usePageProjetStructurant from './usePageProjetStructurant';

export default function PageProjetStructurant({ projetStructurant }: PageProjetStructurantProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);  
  const { objectif, commentaires } = usePageProjetStructurant(projetStructurant.id, projetStructurant.codeTerritoire);  

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
            <div className='fr-col'>
              <AvancementPageProjetStructurant
                avancement={projetStructurant.avancement}
                territoireNom={projetStructurant.territoireNomÀAfficher}
              />
            </div>
            <div className='fr-col'>
              <ResponsablesPageProjetStructurant 
                nomTerritoire={projetStructurant.territoireNomÀAfficher}
                responsables={projetStructurant.responsables}
              />
            </div>
            <div className='fr-col-12'>
              <SynthèseDesRésultats
                modeÉcriture={false}
                nomTerritoire={projetStructurant.territoireNomÀAfficher}
                rechargerRéforme={() => {}}
                réformeId={projetStructurant.id}
                synthèseDesRésultatsInitiale={null}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Objectifs
                estInteractif={false}
                maille={projetStructurant.maille}
                nomTerritoire={projetStructurant.territoireNomÀAfficher}
                objectifs={[objectif]}
                réformeId={projetStructurant.id}
                typesObjectif={[typeObjectifProjetStructurant]}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Commentaires
                commentaires={commentaires}
                estInteractif={false}
                maille={projetStructurant.maille}
                nomTerritoire={projetStructurant.territoireNomÀAfficher}
                réformeId={projetStructurant.id}
                typesCommentaire={typesCommentaireProjetStructurant}
              />
            </div>
          </div>
        </div>
      </main>
    </PageProjetStructurantStyled>
  );
}
