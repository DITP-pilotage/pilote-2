import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
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

const listeRubriques: Rubrique[] = [
  { nom: 'Avancement', ancre: 'avancement' },
  { nom: 'Synthèse des résultats', ancre: 'synthèse' },
  { nom: 'Responsables', ancre: 'responsables' },
  { nom: 'Cartes', ancre: 'cartes' },
  { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
  { nom: 'Commentaires', ancre: 'commentaires' },
];

export default function PageChantier({ chantier }: PageChantierProps) {
  return (
    <PageChantierStyled>
      <PageChantierEnTête chantier={chantier} />
      <div className='fr-grid-row'>
        <div className='fr-col-xl-2 fr-col-lg-3'>
          <Sommaire rubriques={listeRubriques} />
        </div>
        <div className='fr-col-xl-10 fr-col-lg-9 fr-col-12 fr-px-3w fr-pt-5w'>
          <AvancementChantier chantier={chantier} />
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-5w">
            <div className="fr-col-12 fr-col-xl-6">
              <SynthèseRésultats />
            </div>
            <div className="fr-col-12 fr-col-xl-6">
              <Responsables />
            </div>
          </div>
          <Cartes />
          <Indicateurs
            indicateurs={chantier.indicateurs}
          />
          <Commentaires />
        </div>
      </div>
    </PageChantierStyled>
  );
}
