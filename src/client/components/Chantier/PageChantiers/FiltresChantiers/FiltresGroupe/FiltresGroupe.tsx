import FiltreGroupeProps from './FiltresGroupe.interface';

export default function FiltreGroupe({ titre, children }: FiltreGroupeProps) {
  return (
    <div className="fr-p-3w">
      <p className="fr-h6 fr-mb-0 fr-pb-2w">
        { titre }
      </p>
      { children }
    </div>
  );
}
