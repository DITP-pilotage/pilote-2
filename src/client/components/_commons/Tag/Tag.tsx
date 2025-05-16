import '@gouvfr/dsfr/dist/component/tag/tag.min.css';
import { FunctionComponent } from 'react';
import TagStyled from './Tag.styled';

interface TagProps {
  libelle: string,
  suppressionCallback: () => void,
  color?: 'blue-france' | 'warning' | 'yellow-moutarde',
  size?: 'sm' | 'md',
  doitAvoirUneTailleFixe?: boolean,
}

export const Tag: FunctionComponent<TagProps> = ({ libelle, suppressionCallback, color = 'blue-france', size = 'md', doitAvoirUneTailleFixe = false }) => {
  return (
    <TagStyled className={`fr-tag${size === 'sm' ? ' fr-tag--sm' : ''} fr-mr-1-5v fr-mb-1-5v ${color} ${doitAvoirUneTailleFixe ? 'fr-tag--fixed-width' : ''}`}>
      <span>
        {libelle}
      </span>
      <button
        aria-label={`Retirer le tag ${libelle}`}
        className='fr-icon--sm fr-icon-close-line fr-ml-1v'
        onClick={suppressionCallback}
        title='Supprimer filtre'
        type='button'
      />
    </TagStyled>
  );
};

export default Tag;
