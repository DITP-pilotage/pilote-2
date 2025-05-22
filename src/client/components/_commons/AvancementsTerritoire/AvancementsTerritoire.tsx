import { FunctionComponent } from 'react';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression, {
  BarreDeProgressionVariante,
} from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import {
  JaugeDeProgressionCouleur,
} from '@/client/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';

interface AvancementsTerritoireProps {
  territoireNom: string
  avancementGlobal: number | null
  avancementAnnuel: number | null
  jalon: number
  couleurBarreDeProgression: BarreDeProgressionVariante
  couleurJaugeDeProgression: JaugeDeProgressionCouleur
  titreTauxAvancement: string
}

const AvancementsTerritoire: FunctionComponent<AvancementsTerritoireProps> = ({
  territoireNom,
  avancementGlobal,
  avancementAnnuel,
  couleurBarreDeProgression,
  couleurJaugeDeProgression,
  jalon,
  titreTauxAvancement,
}) => {
  return (
    <>
      <div className='flex flex-direction-column flex-wrap justify-center align-center'>
        <strong className='fr-text--sm fr-mb-0 text-center'>
          {titreTauxAvancement}
        </strong>
        <span className='fr-text--sm fr-ml-1v'>
          2026
        </span>   
      </div>
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
            {`${avancementAnnuel?.toFixed(0) ?? '- '}%`}
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
          <div className='flex align-center justify-center fr-text--xs  w-full relative'>
            <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
              Avancement à échéance
              {' '}
              {jalon}
            </p>
          </div>
        </div>
      }
    </>
  );
};

export default AvancementsTerritoire;
