import { FunctionComponent } from 'react';
import PictoTerritorialiséstyled from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé.styled';

const PictoTerritorialisé: FunctionComponent<{}> = () => {
  return (
    <>
      <PictoTerritorialiséstyled
        className='fr-icon-map-pin-2-line'
      />
      <span className='fr-sr-only'>
        chantier territorialisé
      </span>
    </>
  );
};

export default PictoTerritorialisé;
