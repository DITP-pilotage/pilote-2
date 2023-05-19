import { useState } from 'react';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import Sommaire from '@/components/_commons/Sommaire/Sommaire';
import { Rubrique } from '@/components/_commons/Sommaire/Sommaire.interface';
import Bloc from '@/client/components/_commons/Bloc/Bloc';
import Titre from '@/client/components/_commons/Titre/Titre';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import PageProjetStructurantProps from './PageProjetStructurant.interface';
import PageProjetStructurantEnTête from './EnTête/EnTête';
import PageProjetStructurantStyled from './PageProjetStructurant.styled';
import AvancementPageProjetStructurant from './Avancement/Avancement';
import ObjectifsPageProjetStructurant from './Objectifs/Objectifs';

export default function PageProjetStructurant({ projetStructurant }: PageProjetStructurantProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);  

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
        <PageProjetStructurantEnTête projetStructurant={projetStructurant} />
        <div className='fr-p-4w'>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-my-0 fr-pb-1w">
            <div className='fr-col'>
              <AvancementPageProjetStructurant
                avancement={projetStructurant.avancement}
                territoireNom={projetStructurant.territoireNomÀAfficher}
              />
            </div>
            <div className='fr-col'>
              <section id='responsables'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w'
                >
                  Responsables
                </Titre>
                <Bloc titre={projetStructurant.territoireNomÀAfficher}>
                  placeholder
                </Bloc>
              </section>
              {/* <Responsables chantier={chantier} /> */}
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
              <ObjectifsPageProjetStructurant nomTerritoire={projetStructurant.territoireNomÀAfficher}  />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Commentaires
                codeInsee={projetStructurant.codeInsee}
                commentaires={[]}
                maille={projetStructurant.maille}
                modeÉcriture={false}
                réformeId={projetStructurant.id}
              />
            </div>
          </div>
        </div>
      </main>
    </PageProjetStructurantStyled>
  );
}
