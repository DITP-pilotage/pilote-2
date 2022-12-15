import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import styles from './PageChantier.module.scss';
import Responsables from './Responsables/Responsables';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';

export default function PageChantier({ chantier }: PageChantierProps) {
  return (
    <div className={styles.conteneur}>
      <PageChantierEnTête chantier={chantier} />
      <div className='flex'>
        <div className={`${styles.contenuPrincipal} fr-pt-4w fr-px-3w`}>
          <AvancementChantier chantier={chantier} />
          <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w fr-pb-10w">
            <div className="fr-col-12 fr-col-lg-6">
              <SynthèseRésultats />
            </div>
            <div className="fr-col-12 fr-col-lg-6">
              <Responsables />
            </div>
          </div>
          <Cartes />
          <Indicateurs />
          <Commentaires />
        </div>
      </div>
    </div>
  );
}
