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
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import ResponsablesPageProjetStructurant from './Responsables/Responsables';
import PageProjetStructurantProps from './PageProjetStructurant.interface';
import PageProjetStructurantEnTête from './EnTête/EnTête';
import PageProjetStructurantStyled from './PageProjetStructurant.styled';
import AvancementPageProjetStructurant from './Avancement/Avancement';
import usePageProjetStructurant from './usePageProjetStructurant';

export default function PageProjetStructurant({ projetStructurant, indicateurs }: PageProjetStructurantProps) {
  const détailsIndicateurs: DétailsIndicateurs = { 
    'IND-001': {
      [projetStructurant.territoire.codeInsee]: {
        codeInsee: projetStructurant.territoire.codeInsee,
        valeurInitiale: 10,
        dateValeurInitiale: new Date().toISOString(),
        valeurs: [34],
        dateValeurs: [new Date().toISOString()],
        valeurCible: 90,
        dateValeurCible: new Date().toISOString(),
        avancement: { global: 45, annuel: null },
      },
    },
    'IND-002': {
      [projetStructurant.territoire.codeInsee]: {
        codeInsee: projetStructurant.territoire.codeInsee,
        valeurInitiale: null,
        dateValeurInitiale: null,
        valeurs: [54],
        dateValeurs: [new Date().toISOString()],
        valeurCible: 96,
        dateValeurCible: new Date().toISOString(),
        avancement: { global: 56, annuel: null },
      },
    },
  };

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);  
  const { synthèseDesRésultats, objectif, commentaires } = usePageProjetStructurant(projetStructurant.id, projetStructurant.territoire.code);

  return (
    <PageProjetStructurantStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <Sommaire rubriques={listeRubriquesProjetStructurant} />
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
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Avancement du projet
              </Titre>
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
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Météo et synthèse des résultats
              </Titre>
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
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Objectifs
              </Titre>
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
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <section
              className="fr-col-12 rubrique"
              id="commentaires"
            >
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Commentaires du projet structurant
              </Titre>
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
