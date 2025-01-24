import '@gouvfr/dsfr/dist/component/tag/tag.min.css';
import { FunctionComponent } from 'react';
import TagStyled from './Tag.styled';

interface TagProps {
  libellé: string,
  suppressionCallback: () => void,
}

const Tag: FunctionComponent<TagProps> = ({ libellé, suppressionCallback }) => {
  return (
    <TagStyled className='fr-tag fr-mr-1w fr-mb-1w'>
      {libellé}
      <button
        aria-label={`Retirer le tag ${libellé}`}
        className='fr-icon--sm fr-icon-close-line fr-ml-1v'
        onClick={suppressionCallback}
        title='Supprimer filtre'
        type='button'
      />
    </TagStyled>
  );
};

export default Tag;
