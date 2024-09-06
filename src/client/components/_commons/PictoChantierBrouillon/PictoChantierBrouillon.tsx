import { FunctionComponent } from 'react';
import PictoChantierBrouillonStyled from './PictoChantierBrouillon.styled';

const PictoChantierBrouillon: FunctionComponent<{}> = () => {
  return (
    <>
      <PictoChantierBrouillonStyled
        className='fr-icon-error-line'
      />
      <span className='fr-sr-only'>
        chantier brouillon
      </span>
    </>
  );
};

export default PictoChantierBrouillon;
