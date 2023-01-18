import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoCouvert from '/public/img/météo/couvert.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import Image from 'next/image';
import PictoMétéoProps from './PictoMétéo.interface';

export const pictosMétéos = {
  'ORAGE': { nom: 'Objectifs compromis', picto: pictoOrage },
  'NUAGE': { nom: 'Appuis nécessaires', picto: pictoNuage },
  'COUVERT': { nom: 'Objectifs atteignables', picto: pictoCouvert },
  'SOLEIL': { nom: 'Objectifs sécurisés', picto: pictoSoleil },
};

export function PictoMétéo({ valeur }: PictoMétéoProps) {
  if (valeur === 'NON_NECESSAIRE') {
    return (
      <span>
        Non nécessaire
      </span>
    );
  }
  if (valeur === 'NON_RENSEIGNEE') {
    return (
      <span>
        Non renseigné
      </span>
    );
  }
    
  return (
    <Image
      alt={pictosMétéos[valeur].nom}
      src={pictosMétéos[valeur].picto}
    />
  );
}
