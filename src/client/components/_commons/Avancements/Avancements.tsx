import AvancementsProps from './Avancements.interface';
import JaugeDeProgression from '../JaugeDeProgression/JaugeDeProgression';

export default function Avancements({ moyenne, minimum, médiane, maximum }: AvancementsProps) {
  return (
    <div className='fr-container fr-grid-row fr-grid-row--gutters'>
      <div className="fr-col-12 fr-col-lg-6">
        <JaugeDeProgression
          couleur='bleu'
          libellé="Taux d'avancement global"
          pourcentage={moyenne}
          taille='grande'
        />
      </div>
      <div className="fr-col-12 fr-col-lg-6">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
          <div className="fr-col-4">
            <JaugeDeProgression
              couleur='orange'
              libellé="Minimum"
              pourcentage={minimum}
              taille='petite'
            />
          </div>
          <div className="fr-col-4">
            <JaugeDeProgression
              couleur='violet'
              libellé="Médiane"
              pourcentage={médiane}
              taille='petite'
            />
          </div>
          <div className="fr-col-4">
            <JaugeDeProgression
              couleur='vert'
              libellé="Maximum"
              pourcentage={maximum}
              taille='petite'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
