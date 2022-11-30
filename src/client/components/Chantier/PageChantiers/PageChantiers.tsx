import Title from 'client/components/_commons/Title/Title';
import ListeChantiers from '../ListeChantiers/ListeChantiers';
import PageChantiersProps from './PageChantiers.interface';
import styles from './PageChantiers.module.scss';
import RépartitionGéographique from './RépartitionGéographique';
import TauxAvancementMoyen from './TauxAvancementMoyen';
import RépartitionTauxAvancement from './RépartitionTauxAvancement';
import RépartitionDesMétéos from './RépartitionDesMétéos';

export default function PageChantiers({ chantiers }: PageChantiersProps) {
  return (
    <div className='fr-container fr-mt-4w'>
      <div className={styles.bloc}>
        <Title
          as='h1'
          look="fr-hidden"
        >
          Page des chantiers
        </Title>
        <Title as='h2'> 
          62 chantiers dans les résultats
        </Title>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className={styles.bordure + ' fr-col-12 fr-col-lg-6 fr-p-1w'}>
            <RépartitionGéographique />
          </div>
          <div className={styles.conteneur + ' fr-col-12 fr-col-lg-6'}>
            <TauxAvancementMoyen />
            <div className="fr-grid-row fr-p-1w">
              <RépartitionTauxAvancement />
            </div>
            <div className="fr-grid-row fr-p-1w">
              <RépartitionDesMétéos />
            </div>
          </div>
        </div>
      </div>
      <div className="fr-grid-row fr-mt-3w">
        <div className="fr-col">
          <ListeChantiers chantiers={chantiers} />
        </div>
      </div>
    </div>
  );
}