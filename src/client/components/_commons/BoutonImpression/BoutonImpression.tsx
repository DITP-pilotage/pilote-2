import BoutonImpressionStyled from './BoutonImpression.styled';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';

export default function BoutonImpression() {
  return (
    <BoutonImpressionStyled
      className='fr-btn fr-btn--secondary fr-icon-printer-line fr-btn--icon-left'
      onClick={() => window.print()}
      type='button'
    >
      Imprimer
    </BoutonImpressionStyled>
  );
}
