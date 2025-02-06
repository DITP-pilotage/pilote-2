import { FunctionComponent } from 'react';
import {
  JaugeDeProgressionSmallCouleur,
} from '@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall.interface';
import JaugeDeProgressionSVG from '@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSVGSmall';
import JaugeDeProgressionSmallStyled from './JaugeDeProgressionSmall.styled';

interface JaugeDeProgressionSmallProps {
  couleur: JaugeDeProgressionSmallCouleur,
  libellé: string,
  pourcentage: number | null | undefined,
}

export const JaugeDeProgressionSmall: FunctionComponent<JaugeDeProgressionSmallProps> = ({
  couleur,
  libellé,
  pourcentage,
}) => {
  return (
    <JaugeDeProgressionSmallStyled>
      <div className='flex fr-mb-2w'>
        <div className='flex jauge-tracé jauge-tracé--sm fr-mr-1w'>
          <JaugeDeProgressionSVG
            couleur={couleur}
            pourcentage={pourcentage !== undefined ? pourcentage : null}
          />
        </div>
        <div className='flex flex-column justify-center'>
          <p
            className={`jauge-valeur jauge-valeur--${couleur} text-center jauge-valeur-dessous fr-h5 fr-mb-0`}
          >
            {`${pourcentage?.toFixed(0) ?? '- '}%`}
          </p>
          <p
            className='fr-text--xs fr-mb-0 text-center'
          >
            {libellé}
          </p>
        </div>
      </div>
    </JaugeDeProgressionSmallStyled>
  );
};
