import PictoSousIndicateurStyled from './PictoSousIndicateur.styled';
import '@gouvfr/dsfr/dist/utility/icons/icons-development/icons-development.min.css';

export default function PictoSousIndicateur() {
  return (
    <>
      <PictoSousIndicateurStyled
        className='fr-icon-git-merge-fill'
      />
      <span className='fr-sr-only'>
        Sous indicateur
      </span>
    </>
  );
}
