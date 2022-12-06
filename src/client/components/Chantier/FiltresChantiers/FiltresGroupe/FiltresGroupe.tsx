import FiltreGroupeProps from './FiltresGroupe.interface';

export default function FiltreGroupe({ titre, children }: FiltreGroupeProps) {
  return (
    <div className="fr-p-3w">
      <p className="fr-h6 bold fr-mb-0 fr-pb-1w">
        { titre }
      </p>
      { children }
    </div>
  );
}
