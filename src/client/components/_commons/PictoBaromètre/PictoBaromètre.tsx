import { FunctionComponent } from 'react';
import PictoBaromètreStyled from '@/components/_commons/PictoBaromètre/PictoBaromètre.styled';

const PictoBaromètre: FunctionComponent<{}> = () => {
  return (
    <>
      <PictoBaromètreStyled
        className='fr-icon-dashboard-3-line'
      />
      <span className='fr-sr-only'>
        élément du baromètre
      </span>
    </>
  );
};

export default PictoBaromètre;
