import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import AvancementsProps from './Avancements.interface';

export default function Avancements({ avancements }: AvancementsProps) {
  return (
    <div className='fr-container fr-grid-row fr-grid-row--gutters'>
      <div className="fr-col-12 fr-col-lg-6">
        <JaugeDeProgression
          couleur='bleu'
          libellé="Taux d'avancement global"
          pourcentage={avancements.moyenne}
          taille='grande'
        />
      </div>
      <div className="fr-col-12 fr-col-lg-6">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
          <div className="fr-col-4">
            <JaugeDeProgression
              couleur='orange'
              libellé="Minimum"
              pourcentage={avancements.minimum}
              taille='petite'
            />
          </div>
          <div className="fr-col-4">
            <JaugeDeProgression
              couleur='violet'
              libellé="Médiane"
              pourcentage={avancements.médiane}
              taille='petite'
            />
          </div>
          <div className="fr-col-4">
            <JaugeDeProgression
              couleur='vert'
              libellé="Maximum"
              pourcentage={avancements.maximum}
              taille='petite'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
