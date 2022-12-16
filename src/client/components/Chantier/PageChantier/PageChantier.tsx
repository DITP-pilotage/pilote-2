import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import styles from './PageChantier.module.scss';
import Responsables from './Responsables/Responsables';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';

const listeIndicateurs = [
  { nom: 'Indicateurs de contexte', ancre: 'contexte' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement' },
  { nom: 'Indicateurs d\'impact', ancre: 'impact' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi' },
];


export default function PageChantier({ chantier }: PageChantierProps) {
  return (
    <div className={styles.conteneur}>
      <PageChantierEnTête chantier={chantier} />
      <div className='fr-grid-row fr-pt-4w'>
        <div className='fr-col-2 fr-unhidden-lg fr-hidden'>
          Sommaire
        </div>
        <div className='fr-col-lg-10 fr-col-12 fr-px-3w'>
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
