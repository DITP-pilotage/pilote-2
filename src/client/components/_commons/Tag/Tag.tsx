import '@gouvfr/dsfr/dist/component/tag/tag.min.css';
import TagProps from '@/components/_commons/Tag/Tag.interface';
import styles from './Tag.module.scss';

export default function Tag({ libellé, fermetureCallback } : TagProps) {
  return (
    <span
      className={`${styles.tag} fr-tag fr-mr-1w fr-mb-1w`}
    >
      {libellé}
      <button
        aria-label={`Retirer le tag ${libellé}`}
        className="fr-icon--sm fr-icon-close-line fr-ml-1v"
        onClick={fermetureCallback}
        type='button'
      />
    </span>
  );
}
