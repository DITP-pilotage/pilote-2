import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import AvancementsProps from './Avancements.interface';

export default function Avancements({ avancements }: AvancementsProps) {
  return (
    <div className='fr-container'>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-n4w">
        <div className="fr-col-12 fr-col-lg-6 fr-mx-auto fr-pb-0">
          <JaugeDeProgression
            couleur='bleu'
            libellé="Taux d'avancement global"
            pourcentage={avancements.global.moyenne}
            taille='lg'
          />
        </div>
        <div className="fr-col-12 fr-col-lg-6 fr-pb-0">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <JaugeDeProgression
                couleur='orange'
                libellé="Minimum"
                pourcentage={avancements.global.minimum}
                taille='sm'
              />
            </div>
            <div className="fr-col-4">
              <JaugeDeProgression
                couleur='violet'
                libellé="Médiane"
                pourcentage={avancements.global.médiane}
                taille='sm'
              />
            </div>
            <div className="fr-col-4">
              <JaugeDeProgression
                couleur='vert'
                libellé="Maximum"
                pourcentage={avancements.global.maximum}
                taille='sm'
              />
            </div>
          </div>
          <div className='fr-mt-3w'>
            <BarreDeProgression
              bordure={null}
              fond='grisClair'
              positionTexte='dessus'
              taille='xxs'
              valeur={avancements.annuel.moyenne}
              variante="secondaire"
            />
            <p className='fr-text--xs'>
              Année en cours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
