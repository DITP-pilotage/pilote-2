import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoCouvert from '/public/img/météo/couvert.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import Image from 'next/image';
import MétéoPictoProps from './MétéoPicto.interface';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';

export const météosPictos: Record<Météo, any> = {
  'ORAGE': pictoOrage,
  'NUAGE': pictoNuage,
  'COUVERT': pictoCouvert,
  'SOLEIL': pictoSoleil,
  'NON_RENSEIGNEE': null,
  'NON_NECESSAIRE': null,
};

export default function MétéoPicto({ météo, estVisibleParLecteurDÉcran = false }: MétéoPictoProps) {
  return météosPictos[météo] !== null ? (
    <Image
      alt={estVisibleParLecteurDÉcran ? libellésMétéos[météo] : ''}
      aria-hidden={estVisibleParLecteurDÉcran ? undefined : 'true'}
      className='météo-picto'
      src={météosPictos[météo]}
    />
  ) : null;
}
