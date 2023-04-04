import { useId } from 'react';
import JaugeDeProgressionSVGProps from '@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG.interface';
import { JaugeDeProgressionTaille } from './JaugeDeProgression.interface';

const TRACÉS = {
  sm: {
    tracéSVG: 'M.672.934C.68.949.699.96.715.949A.496.496 0 0 0 .938.742C.992.641 1.012.523.992.41A.53.53 0 0 0 .824.117a.503.503 0 0 0-.77.613c.051.094.126.168.22.215.015.008.035 0 .042-.015L.367.805C.375.789.367.77.352.762A.302.302 0 0 1 .234.637a.293.293 0 0 1-.027-.2.306.306 0 0 1 .106-.171.308.308 0 0 1 .19-.067C.575.2.642.227.696.27a.35.35 0 0 1 .102.176c.012.067 0 .14-.035.2a.301.301 0 0 1-.121.12C.625.774.617.794.625.81Zm0 0',
    angleDépart: 23,
    amplitudeAngulaire: 316,
  },
  lg: {
    tracéSVG: 'M.68.953C.684.961.69.961.695.961A.505.505 0 0 0 .992.402.505.505 0 0 0 .508 0a.5.5 0 0 0-.215.953C.297.957.305.953.309.95l.03-.078C.345.863.34.86.337.855a.388.388 0 0 1-.082-.66.395.395 0 0 1 .422-.047.395.395 0 0 1-.02.711C.648.863.648.867.648.875Zm0 0',
    angleDépart: 23,
    amplitudeAngulaire: 316,
  },
};

const CENTRE_VIEWBOX = {
  x: 0.5,
  y: 0.5,
};
const TAILLE_VIEWBOX = 1;

function polaireVersCartésien(rayon: number, angleEnDegrés: number) {
  const angleEnRadians = angleEnDegrés * 2 * Math.PI / 360;
  const phase = Math.PI / 2; // fait commencer la jauge en bas, dans le sens des aiguilles d'une montre
  return {
    x: CENTRE_VIEWBOX.x + (rayon * Math.cos(angleEnRadians + phase)),
    y: CENTRE_VIEWBOX.y + (rayon * Math.sin(angleEnRadians + phase)),
  };
}

function tracerValeurJauge(pourcentage: number, taille: JaugeDeProgressionTaille) {
  const rayon = TAILLE_VIEWBOX / 2;
  const amplitudeAngulaire = TRACÉS[taille].amplitudeAngulaire;
  const angleDépart = 0;
  const angleArrivée = pourcentage / 100 * amplitudeAngulaire;
  const pointDépart = polaireVersCartésien(rayon, angleArrivée);
  const pointArrivée = polaireVersCartésien(rayon, angleDépart);
  const svgLargeArcFlag = angleArrivée - angleDépart <= 180 ? '0' : '1';

  return [
    'M', CENTRE_VIEWBOX.x, CENTRE_VIEWBOX.y,
    'L', pointDépart.x, pointDépart.y,
    'A', rayon, rayon, 0, svgLargeArcFlag, 0, pointArrivée.x, pointArrivée.y,
  ].join(' ');
}

function JaugeDeProgressionSVG({ pourcentage, taille }: JaugeDeProgressionSVGProps) {
  const id = useId();
  return (
    <svg
      viewBox={`0 0 ${TAILLE_VIEWBOX} ${TAILLE_VIEWBOX}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        clipPath={`url(#masque-${id})`}
      >
        <rect
          className="jauge-barre-fond"
          height={TAILLE_VIEWBOX}
          width={TAILLE_VIEWBOX}
        />
        {
        pourcentage
          ?
            <path
              className="jauge-barre-valeur"
              d={tracerValeurJauge(pourcentage!, taille)}
              transform={`rotate(${TRACÉS[taille].angleDépart} ${CENTRE_VIEWBOX.x} ${CENTRE_VIEWBOX.y})`}
            />
          : null
      }
      </g>
      <defs>
        <clipPath id={`masque-${id}`}>
          <path
            d={TRACÉS[taille].tracéSVG}
          />
        </clipPath>
      </defs>
    </svg>
  );
}

export default JaugeDeProgressionSVG;
