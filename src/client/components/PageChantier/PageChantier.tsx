import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs, { listeRubriquesIndicateurs } from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import Responsables from './Responsables/Responsables';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';
import Sommaire from './Sommaire/Sommaire';
import PageChantierStyled from './PageChantier.styled';
import usePageChantier from './usePageChantier';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

const listeRubriques: Rubrique[] = [
  { nom: 'Avancement du chantier', ancre: 'avancement' },
  { nom: 'Responsables', ancre: 'responsables' },
  { nom: 'Synthèse des résultats', ancre: 'synthèse' },
  { nom: 'Répartition géographique', ancre: 'cartes' },
  { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
  { nom: 'Commentaires', ancre: 'commentaires' },
];

export default function PageChantier({ chantier, indicateurs, synthèseDesRésultats }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { avancements } = usePageChantier(chantier);
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore()

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
      <div className='contenu-principal'>
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
            <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-6' : 'fr-col-xl-12'} fr-col-12`}>
              <Responsables chantier={chantier} />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <SynthèseRésultats
                chantier={chantier}
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
              <Indicateurs indicateurs={indicateurs} />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Commentaires />
            </div>
          </div>
        </div>
      </div>
    </PageChantierStyled>
  );
}
