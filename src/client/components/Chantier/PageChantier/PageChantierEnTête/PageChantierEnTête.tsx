import Titre from '@/components/_commons/Titre/Titre';
import PageChantierEnTêteProps from './PageChantierEnTête.interface';
import styles from './PageChantierEnTête.module.scss';
import FilAriane from '../../../_commons/FilAriane/FilAriane';
import '@gouvfr/dsfr/dist/component/tag/tag.min.css';

export default function PageChantierEnTête({ chantier }: PageChantierEnTêteProps) {

  return (
    <header className={`${styles.conteneur} fr-px-15w fr-py-1w`}>
      <FilAriane pageCourante={chantier.nom} />
      <div className='fr-grid-row'>
        <div className='fr-col-12 fr-col-lg-6'>
          <Titre baliseHtml='h1'>
            {chantier.nom}
          </Titre>
        </div>
        <div className='fr-col-12 fr-col-lg-6 fr-pl-10w'>
          <p className={`${styles.texte} fr-mb-1w fr-text--xs`}>
            <strong>
              Axe :
            </strong>
            {' '}
            Non renseigné
          </p>
          <p className={`${styles.texte} fr-mb-1w fr-text--xs`}>
            <strong>
              Politique Prioritaire du Gouvernement :
            </strong>
            {' '}
            Non renseigné
          </p>
        </div>
      </div>
    </header>
  );
}
