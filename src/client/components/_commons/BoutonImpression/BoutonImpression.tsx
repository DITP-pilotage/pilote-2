import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';

export default function BoutonImpression() {
  return (
    <button
      className='fr-btn fr-btn--secondary fr-icon-printer-line fr-btn--icon-left no-wrap'
      onClick={() => window.print()}
      title='Imprimer'
      type='button'
    >
      Imprimer
    </button>
  );
}
