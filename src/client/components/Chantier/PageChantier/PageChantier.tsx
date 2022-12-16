import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import styles from './PageChantier.module.scss';
import Responsables from './Responsables/Responsables';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';
import Sommaire from './Sommaire/Sommaire';

const listeIndicateurs = [
  { nom: 'Indicateurs de contexte', ancre: 'contexte' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement' },
  { nom: 'Indicateurs d\'impact', ancre: 'impact' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi' },
];

const listeÉlémentsPage = [
  { nom: 'Avancement', ancre: 'avancement' },
  { nom: 'Synthèse des résultats', ancre: 'synthèse' },
  { nom: 'Responsables', ancre: 'responsables' },
  { nom: 'Cartes', ancre: 'cartes' },
  { nom: 'Indicateurs', ancre: 'indicateurs', sousÉlément: listeIndicateurs },
  { nom: 'Commentaires', ancre: 'commentaires' },
];

export default function PageChantier({ chantier }: PageChantierProps) {
  return (
    <div className={styles.conteneur}>
      <PageChantierEnTête chantier={chantier} />
      <div className='fr-grid-row'>
        <div className='fr-col-xl-2 fr-col-lg-3'>
          <Sommaire éléments={listeÉlémentsPage} />
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
          <Indicateurs indicateurs={listeIndicateurs} />
          <Commentaires />
        </div>
      </div>
    </div>
  );
}
