import { useCallback } from 'react';
import SommaireBoutonDéplierProps from './SommaireBoutonDéplier.interface';
import SommaireBoutonDéplierStyled from './SommaireBoutonDéplier.styled';

export default function SommaireBoutonDéplier({ clicSurLeBoutonDéplierCallback, estDéplié }: SommaireBoutonDéplierProps) {
  const changementDeLÉtatDuBouton = useCallback(() => {
    clicSurLeBoutonDéplierCallback(); 
  }, [clicSurLeBoutonDéplierCallback]);

  return (
    <SommaireBoutonDéplierStyled
      className='fr-ml-n4w fr-px-1v'
      onClick={() => changementDeLÉtatDuBouton()}
      type='button'
    >
      <span
        aria-hidden="true"
        className={`${estDéplié ? 'ouvert' : 'fermé'} fr-icon-arrow-right-s-line`}
      />
    </SommaireBoutonDéplierStyled>
  );
}
