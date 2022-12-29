import { Rubrique } from '@/components/Chantier/PageChantier/Sommaire/Sommaire.interface';
import TypeIndicateur from '@/server/domain/indicateur/Type.interface';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import Responsables from './Responsables/Responsables';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';
import Sommaire from './Sommaire/Sommaire';
import PageChantierStyled from './PageChantier.styled';

const listeRubriquesIndicateurs  = [
  { nom: 'Indicateurs de contexte', ancre: 'contexte', typeIndicateur: 'CONTEXTE' as TypeIndicateur },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement', typeIndicateur: 'DÉPLOIEMENT' as TypeIndicateur },
  { nom: 'Indicateurs d\'impact', ancre: 'impact', typeIndicateur: 'IMPACT' as TypeIndicateur },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception', typeIndicateur: 'QUALITÉ_DE_SERVICE' as TypeIndicateur },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi', typeIndicateur: 'SUIVI_EXTERNALITÉS_ET_EFFET_REBOND' as TypeIndicateur },
];

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
            listeRubriquesIndicateurs={listeRubriquesIndicateurs}
          />
          <Commentaires />
        </div>
      </div>
    </PageChantierStyled>
  );
}
