import IndicateurÉvolution
  from '@/components/PageChantier/Indicateurs/CarteIndicateur/IndicateurÉvolution/IndicateurÉvolution';
import IndicateurDétailsProps from './IndicateurDétails.interface';

export default function IndicateurDétails({ indicateur }: IndicateurDétailsProps) {
  return (
    <div className="fr-accordion">
      <div className="fr-accordion__title">
        <button
          aria-controls={`détails-${indicateur.id}`}
          aria-expanded="false"
          className="fr-accordion__btn"
          type="button"
        >
          Détails
        </button>
      </div>
      <div
        className="fr-collapse fr-ml-3w"
        id={`détails-${indicateur.id}`}
      >
        <IndicateurÉvolution indicateur={indicateur} />
      </div>
    </div>
  );
}
