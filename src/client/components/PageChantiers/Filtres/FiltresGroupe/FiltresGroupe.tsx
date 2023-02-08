import FiltresGroupeProps from './FiltresGroupe.interface';

export default function FiltresGroupeDeCatégories({ libellé, children }: FiltresGroupeProps) {
  return (
    <div className="fr-px-3w">
      {
        !!libellé && (
          <p className="fr-text--lg fr-mb-0 fr-mt-2w fr-mb-1w bold">
            { libellé }
          </p>
        )
      }
      { children }
    </div>
  );
}
