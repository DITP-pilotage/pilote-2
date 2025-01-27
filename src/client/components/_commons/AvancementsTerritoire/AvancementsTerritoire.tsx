import { FunctionComponent } from 'react';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression, { BarreDeProgressionVariante } from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import api from '@/server/infrastructure/api/trpc/api';
import { getDateBasculeAffichageValeursAnneePrecedente } from '@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { JaugeDeProgressionCouleur } from '@/client/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';

interface AvancementsTerritoireProps {
  territoireNom: string
  avancementGlobal: number | null 
  avancementAnnuel: number | null
  couleurBarreDeProgression: BarreDeProgressionVariante
  couleurJaugeDeProgression: JaugeDeProgressionCouleur
}

const AvancementsTerritoire: FunctionComponent<AvancementsTerritoireProps> = ({ territoireNom, avancementGlobal, avancementAnnuel, couleurBarreDeProgression, couleurJaugeDeProgression }) => {
  const { data: dateBasculeTauxAnnuelAnneeCouranteString } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE' });
  const anneeCourante = (new Date).getFullYear();
  const anneeJalon = getDateBasculeAffichageValeursAnneePrecedente(dateBasculeTauxAnnuelAnneeCouranteString as string).dateBasculeDepassee ? anneeCourante : anneeCourante - 1;

  return (
    <>
      <JaugeDeProgression
        couleur={couleurJaugeDeProgression}
        libellé={territoireNom}
        pourcentage={avancementGlobal}
        taille='lg'
      />
      {
        process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' &&
          <div className='fr-mt-2w'>
            <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
              { `${avancementAnnuel?.toFixed(0) ?? '- '}%` }
            </p>
            <BarreDeProgression
              afficherTexte={false}
              bordure={null}
              fond='gris-clair'
              positionTexte='dessus'
              taille='xxs'
              valeur={avancementAnnuel}
              variante={couleurBarreDeProgression}
            />
            <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
              {`Avancement à échéance ${anneeJalon}`}
            </p>
          </div>
      }

    </>
  );
};

export default AvancementsTerritoire;
