import { FunctionComponent } from 'react';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import AvancementsStyled from '@/components/_commons/Avancements/Avancements.styled';
import api from '@/server/infrastructure/api/trpc/api';
import { getDateBasculeAffichageValeursAnneePrecedente } from '@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import AvancementsProps from './Avancements.interface';

const Avancements: FunctionComponent<AvancementsProps> = ({ avancements }) => {
  const { data: dateBasculeTauxAnnuelAnneeCouranteString } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE' });
  const anneeCourante = (new Date).getFullYear();
  const anneeJalon = getDateBasculeAffichageValeursAnneePrecedente(dateBasculeTauxAnnuelAnneeCouranteString as string).dateBasculeDepassee ? anneeCourante : anneeCourante - 1;

  return (
    <AvancementsStyled>
      <JaugeDeProgression
        couleur='bleu'
        libellé="Taux d'avancement global"
        pourcentage={!!avancements ? avancements.global.moyenne : null}
        taille='lg'
      />
      <div>
        <div className='jauges-statistiques'>
          <JaugeDeProgression
            couleur='orange'
            libellé='Minimum'
            pourcentage={!!avancements ? avancements.global.minimum : null}
            taille='sm'
          />
          <div>
            <JaugeDeProgression
              couleur='violet'
              libellé='Médiane'
              pourcentage={!!avancements ? avancements.global.médiane : null}
              taille='sm'
            />
          </div>
          <JaugeDeProgression
            couleur='vert'
            libellé='Maximum'
            pourcentage={!!avancements ? avancements.global.maximum : null}
            taille='sm'
          />
        </div>
        <div className='fr-mt-2w'>
          <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
            { `${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements?.annuel.moyenne?.toFixed(0) : null) ?? '- '}%` }
          </p>
          <BarreDeProgression
            afficherTexte={false}
            bordure={null}
            fond='gris-clair'
            positionTexte='dessus'
            taille='xxs'
            valeur={!!avancements && process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.annuel.moyenne : null}
            variante='secondaire'
          />
          <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
            {`Moyenne de l'année ${anneeJalon}`}
          </p>
        </div>
      </div>
    </AvancementsStyled>
  );
};

export default Avancements;
