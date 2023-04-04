import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Commentaires from '@/components/PageChantier/Commentaires/Commentaires';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs, { listeRubriquesIndicateurs } from './Indicateurs/Indicateurs';
import PageChantierProps from './PageChantier.interface';
import Responsables from './Responsables/Responsables';
import SynthèseDesRésultats from './SynthèseDesRésultats/SynthèseDesRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';
import Sommaire from './Sommaire/Sommaire';
import PageChantierStyled from './PageChantier.styled';
import usePageChantier from './usePageChantier';
import Objectif from './Objectif/Objectif';

const listeRubriques: Rubrique[] = [
  { nom: 'Avancement du chantier', ancre: 'avancement' },
  { nom: 'Responsables', ancre: 'responsables' },
  { nom: 'Synthèse des résultats', ancre: 'synthèse' },
  { nom: 'Répartition géographique', ancre: 'cartes' },
  { nom: 'Objectifs', ancre: 'objectifs' },
  { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
  { nom: 'Commentaires', ancre: 'commentaires' },
];

export default function PageChantier({ chantier, indicateurs, objectif }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { avancements, détailsIndicateurs, commentaires, météo, synthèseDesRésultats } = usePageChantier(chantier);
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  
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
      <div className='contenu-principal fr-pb-5w'>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir le menu latéral"
          type="button"
        >
          Menu latéral
        </button>
        <PageChantierEnTête chantier={chantier} />
        <div className='fr-p-4w'>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-6' : 'fr-col-xl-12'} fr-col-12`}>
              <AvancementChantier avancements={avancements} />
            </div>
            <div className='fr-col-xl-6 fr-col-12'>
              <Responsables chantier={chantier} />
            </div>
            <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-6'} fr-col-12`}>
              <SynthèseDesRésultats
                météo={météo}
                synthèseDesRésultats={synthèseDesRésultats}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Cartes chantier={chantier} />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Objectif objectif={objectif} />
            </div>
          </div>
          {
            détailsIndicateurs !== null && (
              <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                <div className="fr-col-12">
                  <Indicateurs
                    détailsIndicateurs={détailsIndicateurs}
                    indicateurs={indicateurs}
                  />
                </div>
              </div>
            )
          }
          {
            commentaires !== null && (
              <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                <div className="fr-col-12">
                  <Commentaires commentaires={commentaires} />
                </div>
              </div>
            )
          }
        </div>
      </div>
    </PageChantierStyled>
  );
}
