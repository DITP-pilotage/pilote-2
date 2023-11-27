import FiltresGroupeProps from './FiltresGroupe.interface';

export default function FiltresGroupe({ libellé, children }: FiltresGroupeProps) {
  return (
    <section className='fr-px-3w'>
      {
        !!libellé && (
          <h2 className='fr-text--lg fr-mb-0 fr-mt-2w fr-mb-1w bold'>
            { libellé }
          </h2>
        )
      }
      { children }
    </section>
  );
}
