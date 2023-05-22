import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import AvancementsStyled from '@/components/_commons/Avancements/Avancements.styled';
import AvancementsProps from './Avancements.interface';

export default function Avancements({ avancements }: AvancementsProps) {  
  return (
    <AvancementsStyled>
      <JaugeDeProgression
        couleur='bleu'
        libellé="Taux d'avancement global"
        pourcentage={!!avancements ? avancements.global.moyenne : null}
        taille='lg'
      />
      <div>
        <div className="jauges-statistiques">
          <JaugeDeProgression
            couleur='orange'
            libellé="Minimum"
            pourcentage={!!avancements ? avancements.global.minimum : null}
            taille='sm'
          />
          <div>
            <JaugeDeProgression
              couleur='violet'
              libellé="Médiane"
              pourcentage={!!avancements ? avancements.global.médiane : null}
              taille='sm'
            />
          </div>
          <JaugeDeProgression
            couleur='vert'
            libellé="Maximum"
            pourcentage={!!avancements ? avancements.global.maximum : null}
            taille='sm'
          />
        </div>
        <div className='fr-mt-2w'>
          <p className="fr-text--xl fr-text--bold fr-mb-0 texte-gris">
            { `${avancements?.annuel.moyenne?.toFixed(0) ?? '- '}%` }
          </p>
          <BarreDeProgression
            afficherTexte={false}
            bordure={null}
            fond='grisClair'
            positionTexte='dessus'
            taille='xxs'
            valeur={!!avancements ? avancements.annuel.moyenne : null}
            variante="secondaire"
          />
          <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
            Année en cours
          </p>
        </div>
      </div>
    </AvancementsStyled>
  );
}
