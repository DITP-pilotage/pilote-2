import '@gouvfr/dsfr/dist/component/tag/tag.min.css';
import TagProps from '@/components/_commons/Tag/Tag.interface';
import TagStyled from './Tag.styled';

export default function Tag({ libellé, suppressionCallback } : TagProps) {
  return (
    <TagStyled className='fr-tag fr-mr-1w fr-mb-1w'>
      {libellé}
      <button
        aria-label={`Retirer le tag ${libellé}`}
        className='fr-icon--sm fr-icon-close-line fr-ml-1v'
        onClick={suppressionCallback}
        type='button'
      />
    </TagStyled>
  );
}
