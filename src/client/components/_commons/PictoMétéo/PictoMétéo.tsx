import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoCouvert from '/public/img/météo/couvert.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import Image from 'next/image';
import PictoMétéoProps from './PictoMétéo.interface';
import Météo, { libellésMétéos } from '@/server/domain/chantier/Météo.interface';

export const pictosMétéos = {
  'ORAGE': pictoOrage,
  'NUAGE': pictoNuage,
  'COUVERT': pictoCouvert,
  'SOLEIL': pictoSoleil,
  'NON_RENSEIGNEE': null,
  'NON_NECESSAIRE': null,
};

export function getLibelléMétéo(météo: Météo) {
  return libellésMétéos[météo];
}

export function PictoMétéo({ valeur }: PictoMétéoProps) {
  return pictosMétéos[valeur] !== null ? (
    <Image
      alt={getLibelléMétéo(valeur)}
      src={pictosMétéos[valeur]}
    />
  ) : null;
}
