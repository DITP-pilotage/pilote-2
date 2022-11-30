import Title from 'client/components/_commons/Title/Title';
import ListeChantiers from '../ListeChantiers/ListeChantiers';
import PageChantiersProps from './PageChantiers.interface';
import styles from './PageChantiers.module.scss';

export default function PageChantiers({ chantiers }: PageChantiersProps) {
  return (
    <div className='fr-container'>
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
        <div className="fr-grid-row">
          <div className={styles.conteneur + ' fr-col-12 fr-col-lg-6 fr-p-1w'}>
            <Title
              as='h3'
              look='fr-h6'
            >
              Répartition géographique
            </Title>
          </div>
          <div className={styles.conteneur + ' fr-col-12 fr-col-lg-6'}>
            <div className="fr-grid-row fr-p-1w">
              <Title
                as='h3'
                look='fr-h6'
              >
                Taux d’avancement moyen de la sélection
              </Title>
              <div className="fr-col-12 fr-col-xl-6">
                barre annuel
              </div>      
              <div className="fr-col fr-col-xl-6">
                barre global
              </div>
            </div>
            <div className="fr-grid-row fr-p-1w">
              <Title
                as='h3'
                look='fr-h6'
              >
                Répartition des taux d’avancement de la sélection
              </Title>
              <div>
                bloques
              </div>
            </div>
            <div className="fr-grid-row fr-p-1w">
              <Title
                as='h3'
                look='fr-h6'
              >
                Répartition des météos de la sélection
              </Title>
              <div>
                Bloques
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col">
          <ListeChantiers chantiers={chantiers} />
        </div>
      </div>
    </div>
  );
}