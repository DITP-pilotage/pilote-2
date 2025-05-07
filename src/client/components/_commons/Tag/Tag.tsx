import '@gouvfr/dsfr/dist/component/tag/tag.min.css';
import { FunctionComponent } from 'react';
import TagStyled from './Tag.styled';

interface TagProps {
  libelle: string,
  suppressionCallback: () => void,
  color?: 'blue-france' | 'warning' | 'yellow-moutarde',
}

export const Tag: FunctionComponent<TagProps> = ({ libelle, suppressionCallback, color = 'blue-france' }) => {
  return (
    <TagStyled className={`fr-tag fr-mr-1w fr-mb-1w ${color}`}>
      {libelle}
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
