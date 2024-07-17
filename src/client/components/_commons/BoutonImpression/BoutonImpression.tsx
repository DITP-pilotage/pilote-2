import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import { FunctionComponent } from 'react';
import BoutonImpressionStyled from './BoutonImpression.styled';

const BoutonImpression: FunctionComponent = () => {
  return (
    <BoutonImpressionStyled>
      <button
        className='fr-btn fr-btn--secondary fr-icon-printer-line fr-btn--icon-left no-wrap bouton-format-mobile'
        onClick={() => window.print()}
        title='Imprimer'
        type='button'
      >
        Imprimer
      </button>
    </BoutonImpressionStyled>
  );
};

export default BoutonImpression;
