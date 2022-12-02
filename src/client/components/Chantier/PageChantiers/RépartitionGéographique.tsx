import Titre from 'client/components/_commons/Titre/Titre';
import styles from './PageChantiers.module.scss';

export default function RépartitionGéographique() {
  return (
    <div className={styles.bordure + ' fr-p-1w ' + styles.répartitionGéographique}>
      <Titre
        apparence='fr-h6'
        baliseHtml='h2'
      >
        Répartition géographique
      </Titre>
    </div>
  );
}
