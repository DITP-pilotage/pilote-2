import Title from 'client/components/_commons/Title/Title';
import styles from './PageChantiers.module.scss';

export default function RépartitionGéographique() {
  return (
    <div className={styles.bordure + ' fr-p-1w ' + styles.répartitionGéographique}>
      <Title
        as='h2'
        look='fr-h6'
      >
        Répartition géographique
      </Title>
    </div>
  );
}