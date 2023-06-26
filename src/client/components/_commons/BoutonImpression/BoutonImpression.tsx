import BoutonImpressionStyled from './BoutonImpression.styled';

export default function BoutonImpression() {
  return (
    <BoutonImpressionStyled
      className='fr-btn fr-btn--secondary fr-mt-3w'
      onClick={() => window.print()}
      type='button'
    >
      <span
        aria-hidden="true"
        className="fr-icon-download-line"
      />
      {' '}
      Imprimer
    </BoutonImpressionStyled>
  );
}
